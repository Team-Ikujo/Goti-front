import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/entities/auth/model/authStore';
import { ChevronLeft } from 'lucide-react';
import {
   createMemberAccount,
   createMemberAddress,
   withdrawMember,
   type MemberAccount,
   type MemberAddress,
} from '@/entities/user/api/memberApi';
import { logout } from '@/features/auth/api/authApi';
import { getErrorMessage } from '@/shared/lib/error/getErrorMessage';
import { AccountModals } from './AccountModals';
import type { ModalType } from './AccountModals';
import { AccountTermsDialogs } from './AccountTermsDialogs';
import type { TermsType } from './AccountTermsDialogs';
import { AccountSummaryCard } from './AccountSummaryCard';
import { AccountSocialConnectionsCard } from './AccountSocialConnectionsCard';
import { AccountBankFormCard, type AccountAgreementItem } from './AccountBankFormCard';
import { AccountAddressFormCard } from './AccountAddressFormCard';
import { AccountManagementCard } from './AccountManagementCard';
import {
   useMyProfileData,
   useMyOrdersData,
   useMyResaleListData,
   useMyResaleUnsettledAmountData,
} from '../model/useMypageData';
import { ACCOUNT_PAGE_QUERY_KEYS, BANKS } from '../model/accountPageConstants';
import { openDaumPostcode } from '../model/useDaumPostcode';
import { decodeJwtPayload } from '@/shared/lib/jwt';

const ACCOUNT_STORAGE_KEY_PREFIX = 'mypage-account-info';

const readStringClaim = (payload: Record<string, unknown> | null, keys: string[]) => {
   for (const key of keys) {
      const value = payload?.[key];

      if (typeof value === 'string' && value.trim().length > 0) {
         return value.trim();
      }
   }

   return undefined;
};

const readProviderClaim = (payload: Record<string, unknown> | null) => {
   const provider = readStringClaim(payload, ['provider', 'oauthProvider', 'oAuthProvider', 'registrationId']);
   return toOAuthProvider(provider);
};

const toOAuthProvider = (provider?: string | null) => {
   if (!provider) {
      return undefined;
   }

   switch (provider.toUpperCase()) {
      case 'GOOGLE':
         return 'GOOGLE' as const;
      case 'KAKAO':
         return 'KAKAO' as const;
      case 'NAVER':
         return 'NAVER' as const;
      default:
         return undefined;
   }
};

export default function AccountPage() {
   const navigate = useNavigate();
   const location = useLocation();
   const queryClient = useQueryClient();
   const accessToken = useAuthStore(state => state.accessToken);
   const currentUserId = useAuthStore(state => state.currentUserId);
   const recentLoginProvider = useAuthStore(state => state.recentLoginProvider);
   const profileQuery = useMyProfileData();
   const ordersQuery = useMyOrdersData();
   const resaleListQuery = useMyResaleListData();
   const unsettledAmountQuery = useMyResaleUnsettledAmountData();
   const profile = profileQuery.data;
   const authPayload = useMemo(() => decodeJwtPayload(accessToken), [accessToken]);
   const effectiveProvider = useMemo(
      () => toOAuthProvider(profile?.oAuthProvider) ?? readProviderClaim(authPayload) ?? toOAuthProvider(recentLoginProvider),
      [authPayload, profile?.oAuthProvider, recentLoginProvider],
   );
   const resolvedProfile = useMemo(
      () => ({
         ...profile,
         email: profile?.email ?? readStringClaim(authPayload, ['email', 'preferred_username', 'loginId', 'login_id', 'username']),
         name: profile?.name ?? readStringClaim(authPayload, ['name', 'nickname']),
         mobile: profile?.mobile ?? readStringClaim(authPayload, ['mobile', 'phoneNumber', 'phone_number', 'phone']),
         oAuthProvider: effectiveProvider,
      }),
      [authPayload, effectiveProvider, profile],
   );
   const resolvedSocialConnection = useMemo(() => {
      const base = {
         isGoogleConnected: profile?.socialConnection?.isGoogleConnected ?? false,
         isKakaoConnected: profile?.socialConnection?.isKakaoConnected ?? false,
         isNaverConnected: profile?.socialConnection?.isNaverConnected ?? false,
      };

      if (effectiveProvider === 'GOOGLE') {
         base.isGoogleConnected = true;
      }

      if (effectiveProvider === 'KAKAO') {
         base.isKakaoConnected = true;
      }

      if (effectiveProvider === 'NAVER') {
         base.isNaverConnected = true;
      }

      return base;
   }, [effectiveProvider, profile?.socialConnection]);
   const [socialConnectionState, setSocialConnectionState] = useState(resolvedSocialConnection);
   const purchaseItems = ordersQuery.data ?? [];
   const saleItems = resaleListQuery.data ?? [];

   // 미정산 금액 존재 여부: 판매 완료 후 정산 대기 중인 항목
   const hasUnpaidAmount = (unsettledAmountQuery.data?.unsettledAmount ?? 0) > 0;
   // 예매 완료 또는 판매 중인 티켓 존재 여부
   const hasActiveTickets =
      purchaseItems.some(i => i.paymentStatus === '예매 완료') || saleItems.some(i => i.saleStatus === '판매 중');

   const [modal, setModal] = useState<ModalType>(null);
   const closeModal = () => setModal(null);

   const [termsDialog, setTermsDialog] = useState<TermsType>(null);

   const [bank, setBank] = useState('');
   const [bankDropdownOpen, setBankDropdownOpen] = useState(false);
   const bankDropdownRef = useRef<HTMLDivElement>(null);
   const bankButtonRef = useRef<HTMLButtonElement>(null);
   const accountCardRef = useRef<HTMLDivElement>(null);
   const [accountNumber, setAccountNumber] = useState('');
   const [depositor, setDepositor] = useState('');
   const [savedAccount, setSavedAccount] = useState<MemberAccount | null>(null);
   const [savedAddress, setSavedAddress] = useState<MemberAddress | null>(null);
   const storedAccountKey = useMemo(
      () => (currentUserId ? `${ACCOUNT_STORAGE_KEY_PREFIX}:${currentUserId}` : null),
      [currentUserId],
   );

   const readStoredAccount = useCallback((): MemberAccount | null => {
      if (typeof window === 'undefined' || !storedAccountKey) {
         return null;
      }

      try {
         const rawValue = window.localStorage.getItem(storedAccountKey);
         if (!rawValue) {
            return null;
         }

         return JSON.parse(rawValue) as MemberAccount;
      } catch {
         return null;
      }
   }, [storedAccountKey]);

   const writeStoredAccount = useCallback(
      (account: MemberAccount | null) => {
         if (typeof window === 'undefined' || !storedAccountKey) {
            return;
         }

         if (!account) {
            window.localStorage.removeItem(storedAccountKey);
            return;
         }

         window.localStorage.setItem(storedAccountKey, JSON.stringify(account));
      },
      [storedAccountKey],
   );

   useEffect(() => {
      setSocialConnectionState(resolvedSocialConnection);
   }, [resolvedSocialConnection]);

   useEffect(() => {
      const storedAccount = readStoredAccount();

      if (storedAccount) {
         setSavedAccount(storedAccount);
         setBank(storedAccount.bankName);
         setAccountNumber(storedAccount.accountNumber);
         setDepositor(storedAccount.accountHolder);
      }
   }, [readStoredAccount]);

   // GET /api/v1/members/me 응답의 bankAccount·address로 초기값 설정
   useEffect(() => {
      if (!profile) return;

      const ba = profile.bankAccount;
      if (ba) {
         const nextAccount = {
            accountId: '',
            accountNumber: ba.accountNumber,
            bankName: ba.bankName,
            accountHolder: ba.accountHolder,
         };

         setSavedAccount(nextAccount);
         setBank(nextAccount.bankName);
         setAccountNumber(nextAccount.accountNumber);
         setDepositor(nextAccount.accountHolder);
         writeStoredAccount(nextAccount);
      }

      const addr = profile.address;
      if (addr && !savedAddress) {
         setSavedAddress({
            addressId: '',
            zipCode: addr.zipCode,
            baseAddress: addr.baseAddress,
            detailAddress: addr.detailAddress,
         });
         setZipCode(addr.zipCode);
         setAddress(addr.baseAddress);
         setAddressDetail(addr.detailAddress);
      }
      // profile이 바뀔 때 한 번만 적용 (사용자 직접 수정 값은 유지)
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [profile, writeStoredAccount]);
   const [agreeAll, setAgreeAll] = useState(false);
   const [agreeOpen, setAgreeOpen] = useState(false);
   const [agreeThird, setAgreeThird] = useState(false);
   const [agreePersonal, setAgreePersonal] = useState(false);

   const [zipCode, setZipCode] = useState('');
   const [address, setAddress] = useState('');
   const [addressDetail, setAddressDetail] = useState('');

   // 은행 드롭다운 외부 클릭 닫기
   useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
         if (bankDropdownRef.current && !bankDropdownRef.current.contains(e.target as Node)) {
            setBankDropdownOpen(false);
         }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
   }, []);

   const handleAgreeAll = (checked: boolean) => {
      setAgreeAll(checked);
      setAgreeOpen(checked);
      setAgreeThird(checked);
      setAgreePersonal(checked);
   };

   const handleIndividualAgree = (setter: (v: boolean) => void, value: boolean, others: boolean[]) => {
      setter(value);
      setAgreeAll(value && others.every(Boolean));
   };

   const handlePostcodeSearch = () => {
      openDaumPostcode((zip, addr) => {
         setZipCode(zip);
         setAddress(addr);
      });
   };

   const isAccountSaveEnabled = !!(bank && accountNumber && depositor && agreeOpen && agreeThird && agreePersonal);
   const isAddressSaveEnabled = Boolean(zipCode && address && addressDetail.trim());
   const clearAuth = useAuthStore(state => state.clearAuth);
   const isPageLoading = profileQuery.isLoading || ordersQuery.isLoading || resaleListQuery.isLoading;

   const { mutate: saveAccount, isPending: isSavingAccount } = useMutation({
      mutationFn: () =>
         createMemberAccount({
            accountNumber,
            bankName: bank,
            accountHolder: depositor,
         }),
      onSuccess: registeredAccount => {
         setSavedAccount(registeredAccount);
         setBank(registeredAccount.bankName);
         setAccountNumber(registeredAccount.accountNumber);
         setDepositor(registeredAccount.accountHolder);
         writeStoredAccount(registeredAccount);
         alert('계좌 정보가 저장되었습니다.');
      },
      onError: error => {
         alert(getErrorMessage(error, '계좌 정보 저장에 실패했습니다. 다시 시도해주세요.'));
      },
   });

   const { mutate: saveAddress, isPending: isSavingAddress } = useMutation({
      mutationFn: () =>
         createMemberAddress({
            zipCode,
            baseAddress: address,
            detailAddress: addressDetail.trim(),
         }),
      onSuccess: registeredAddress => {
         setSavedAddress(registeredAddress);
         setZipCode(registeredAddress.zipCode);
         setAddress(registeredAddress.baseAddress);
         setAddressDetail(registeredAddress.detailAddress);
         alert('주소 정보가 저장되었습니다.');
      },
      onError: error => {
         alert(getErrorMessage(error, '주소 정보 저장에 실패했습니다. 다시 시도해주세요.'));
      },
   });

   /** 계좌 정보 변경 버튼: 계좌 정보 카드로 스크롤 후 은행 드롭다운 오픈 */
   const handleAccountChange = () => {
      accountCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // 스크롤 애니메이션 후 드롭다운 오픈
      setTimeout(() => {
         setBankDropdownOpen(true);
         bankButtonRef.current?.focus();
      }, 400);
   };

   // 계좌 미등록 팝업에서 "등록하기" 클릭 후 진입 시 계좌 섹션으로 자동 포커싱
   useEffect(() => {
      if (location.state?.focusAccount) {
         handleAccountChange();
         // state 소비 후 히스토리에서 제거 (뒤로가기 시 재실행 방지)
         window.history.replaceState({}, '');
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, []);

   /** 로그아웃 */
   const handleLogout = useCallback(async () => {
      try {
         await logout();
      } catch {
         // 서버 로그아웃 실패해도 클라이언트 인증 상태는 초기화
      }
      clearAuth('manual');
      navigate('/');
   }, [clearAuth, navigate]);

   /** 회원 탈퇴 버튼 클릭 */
   const handleWithdrawClick = () => {
      if (hasUnpaidAmount) {
         setModal('withdrawBlocked');
      } else if (hasActiveTickets) {
         setModal('withdrawHasActiveTickets');
      } else {
         setModal('withdraw');
      }
   };

   /** 회원 탈퇴 확정 */
   const handleWithdrawConfirm = useCallback(async () => {
      try {
         await withdrawMember();
      } catch {
         // 탈퇴 API 실패 시에도 로컬 인증 상태 초기화 후 이동
      }
      setModal(null);
      clearAuth('manual');
      navigate('/');
   }, [clearAuth, navigate]);

   const refetchAccountPageQueries = useCallback(() => {
      void queryClient.invalidateQueries({ queryKey: ACCOUNT_PAGE_QUERY_KEYS.profile });
      void queryClient.invalidateQueries({ queryKey: ACCOUNT_PAGE_QUERY_KEYS.orders });
      void queryClient.invalidateQueries({ queryKey: ACCOUNT_PAGE_QUERY_KEYS.resales });
      void queryClient.invalidateQueries({ queryKey: ACCOUNT_PAGE_QUERY_KEYS.resaleUnsettledAmount });
   }, [queryClient]);

   const handleToggleSocialConnection = useCallback(
      (targetProvider: 'GOOGLE' | 'KAKAO' | 'NAVER') => {
         const keyByProvider = {
            GOOGLE: 'isGoogleConnected',
            KAKAO: 'isKakaoConnected',
            NAVER: 'isNaverConnected',
         } as const;

         const targetKey = keyByProvider[targetProvider];

         setSocialConnectionState(prev => {
            const nextChecked = !prev[targetKey];

            if (!nextChecked && targetProvider === effectiveProvider) {
               setModal('cannotDisconnect');
               return prev;
            }

            return {
               ...prev,
               [targetKey]: nextChecked,
            };
         });
      },
      [effectiveProvider],
   );

   const accountAgreementItems: AccountAgreementItem[] = [
      {
         label: '오픈뱅킹공동업무 자동계좌이체 약관',
         checked: agreeOpen,
         onChange: (value: boolean) => handleIndividualAgree(setAgreeOpen, value, [agreeThird, agreePersonal]),
         termsKey: 'openBanking' as TermsType,
      },
      {
         label: '개인(신용)정보 제3자 제공 동의',
         checked: agreeThird,
         onChange: (value: boolean) => handleIndividualAgree(setAgreeThird, value, [agreeOpen, agreePersonal]),
         termsKey: 'thirdParty' as TermsType,
      },
      {
         label: '개인정보 수집‧이용 동의 [출금이체]',
         checked: agreePersonal,
         onChange: (value: boolean) => handleIndividualAgree(setAgreePersonal, value, [agreeOpen, agreeThird]),
         termsKey: 'personalInfo' as TermsType,
      },
   ];

   if (isPageLoading) {
      return (
         <div className="py-24 text-center text-body-1-regular text-muted-foreground">
            계정 정보를 불러오는 중입니다.
         </div>
      );
   }

   if (profileQuery.isError || ordersQuery.isError || resaleListQuery.isError) {
      return (
         <div className="flex flex-col items-center justify-center gap-4 py-24">
            <p className="text-body-1-regular text-muted-foreground">
               계정 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
            </p>
            <button
               type="button"
               onClick={refetchAccountPageQueries}
               className="rounded-lg border border-border px-6 py-3 text-body-1-bold text-muted-foreground hover:bg-surface transition-colors"
            >
               다시 시도
            </button>
         </div>
      );
   }

   return (
      <div className="flex-1 bg-background">
         <div className="mx-auto max-w-300 px-4 pt-7.5 lg:pt-12.5 pb-30 flex flex-col gap-7">
            <button
               onClick={() => navigate('/mypage')}
               className="flex items-center gap-2 text-muted-foreground text-body-1-medium w-fit"
            >
               <ChevronLeft size={20} />
               마이페이지로 돌아가기
            </button>

            <h1 className="text-[30px] font-bold text-foreground">계정 정보</h1>

            <div className="flex flex-col gap-6">
               <AccountSummaryCard
                  profile={resolvedProfile}
                  savedAccount={savedAccount}
                  onEditIdentity={() => setModal('identity')}
                  onEditAccount={handleAccountChange}
               />
               <AccountSocialConnectionsCard
                  socialConnection={socialConnectionState}
                  provider={effectiveProvider}
                  onToggleProvider={handleToggleSocialConnection}
               />
               <AccountBankFormCard
                  banks={[...BANKS]}
                  bank={bank}
                  accountNumber={accountNumber}
                  depositor={depositor}
                  bankDropdownOpen={bankDropdownOpen}
                  bankDropdownRef={bankDropdownRef}
                  bankButtonRef={bankButtonRef}
                  accountCardRef={accountCardRef}
                  agreeAll={agreeAll}
                  agreementItems={accountAgreementItems}
                  isAccountSaveEnabled={isAccountSaveEnabled}
                  isSavingAccount={isSavingAccount}
                  onToggleBankDropdown={() => setBankDropdownOpen(value => !value)}
                  onSelectBank={value => {
                     setBank(value);
                     setBankDropdownOpen(false);
                  }}
                  onChangeAccountNumber={value => setAccountNumber(value.replace(/[^0-9]/g, ''))}
                  onChangeDepositor={value => setDepositor(value.replace(/[^a-zA-Z가-힣ㄱ-ㅎㅏ-ㅣ\s]/g, ''))}
                  onToggleAgreeAll={handleAgreeAll}
                  onOpenTerms={setTermsDialog}
                  onSave={() => saveAccount()}
               />
               <AccountAddressFormCard
                  savedAddress={savedAddress}
                  zipCode={zipCode}
                  address={address}
                  addressDetail={addressDetail}
                  isAddressSaveEnabled={isAddressSaveEnabled}
                  isSavingAddress={isSavingAddress}
                  onSearchPostcode={handlePostcodeSearch}
                  onChangeAddressDetail={setAddressDetail}
                  onSave={() => saveAddress()}
               />
               <AccountManagementCard onLogout={handleLogout} onWithdraw={handleWithdrawClick} />
            </div>
         </div>

         <AccountModals
            modal={modal}
            onClose={closeModal}
            onWithdrawConfirm={handleWithdrawConfirm}
            onNavigateToVerification={() =>
               navigate('/auth/terms', {
                  state: {
                     mode: 'profile-edit',
                     profile: {
                        name: resolvedProfile?.name,
                        mobile: resolvedProfile?.mobile,
                        gender: resolvedProfile?.gender,
                        birthDate: resolvedProfile?.birthDate,
                     },
                  },
               })
            }
         />
         <AccountTermsDialogs termsDialog={termsDialog} onClose={() => setTermsDialog(null)} />
      </div>
   );
}
