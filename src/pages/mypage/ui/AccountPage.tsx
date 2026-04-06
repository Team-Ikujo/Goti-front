// src/pages/mypage/ui/AccountPage.tsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/entities/auth/model/authStore';
import { ChevronLeft } from 'lucide-react';
import { createMemberAccount, createMemberAddress, type MemberAccount, type MemberAddress } from '@/entities/user/api/memberApi';
import { getErrorMessage } from '@/shared/lib/error/getErrorMessage';
import { AccountModals } from './AccountModals';
import type { ModalType } from './AccountModals';
import { AccountTermsDialogs } from './AccountTermsDialogs';
import type { TermsType } from './AccountTermsDialogs';
import {
   useMyProfileData,
   useMyOrdersData,
   useMyResaleListData,
   useMyResaleUnsettledAmountData,
} from '../model/useMypageData';
import { openDaumPostcode } from '../model/useDaumPostcode';
import { AccountSummaryCard } from './AccountSummaryCard';
import { SocialConnectionsCard } from './SocialConnectionsCard';
import { AccountBankFormCard } from './AccountBankFormCard';
import { AccountAddressFormCard } from './AccountAddressFormCard';
import { AccountManagementCard } from './AccountManagementCard';

const BANKS = [
   '국민은행',
   '신한은행',
   '우리은행',
   '하나은행',
   'IBK기업은행',
   'NH농협은행',
   '카카오뱅크',
   '토스뱅크',
   '케이뱅크',
   '새마을금고',
   '신협',
   '수협은행',
   'SC제일은행',
   '씨티은행',
   '광주은행',
   '전북은행',
   '경남은행',
   '제주은행',
   '부산은행',
   '대구은행',
];

export default function AccountPage() {
   const navigate = useNavigate();
   const location = useLocation();
   const queryClient = useQueryClient();
   const profileQuery = useMyProfileData();
   const ordersQuery = useMyOrdersData();
   const resaleListQuery = useMyResaleListData();
   const unsettledAmountQuery = useMyResaleUnsettledAmountData();
   const profile = profileQuery.data;
   const purchaseItems = ordersQuery.data ?? [];
   const saleItems = resaleListQuery.data ?? [];

   // 미정산 금액 존재 여부: 판매 완료 후 정산 대기 중인 항목
   const hasUnpaidAmount = (unsettledAmountQuery.data?.unsettledAmount ?? 0) > 0;
   // 예매 완료 또는 판매 중인 티켓 존재 여부
   const hasActiveTickets =
      purchaseItems.some(i => i.paymentStatus === '예매 완료') ||
      saleItems.some(i => i.saleStatus === '판매 중');

   // ── 모달 ──
   const [modal, setModal] = useState<ModalType>(null);
   const closeModal = () => setModal(null);

   // ── 약관 다이얼로그 ──
   const [termsDialog, setTermsDialog] = useState<TermsType>(null);

   // ── 간편 로그인 연결 ──
   const socialConnectionApiAvailable = false;

   // ── 계좌 정보 ──
   const [bank, setBank] = useState('');
   const [bankDropdownOpen, setBankDropdownOpen] = useState(false);
   const bankDropdownRef = useRef<HTMLDivElement>(null);
   const bankButtonRef = useRef<HTMLButtonElement>(null);
   const accountCardRef = useRef<HTMLDivElement>(null);
   const [accountNumber, setAccountNumber] = useState('');
   const [depositor, setDepositor] = useState('');
   const [savedAccount, setSavedAccount] = useState<MemberAccount | null>(null);
   const [savedAddress, setSavedAddress] = useState<MemberAddress | null>(null);
   const [agreeAll, setAgreeAll] = useState(false);
   const [agreeOpen, setAgreeOpen] = useState(false);
   const [agreeThird, setAgreeThird] = useState(false);
   const [agreePersonal, setAgreePersonal] = useState(false);

   // ── 주소 수정 ──
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
   const isPageLoading =
      profileQuery.isLoading || ordersQuery.isLoading || resaleListQuery.isLoading || unsettledAmountQuery.isLoading;
   const isPageError =
      profileQuery.isError || ordersQuery.isError || resaleListQuery.isError || unsettledAmountQuery.isError;

   const { mutate: saveAccount, isPending: isSavingAccount } = useMutation({
      mutationFn: () =>
         createMemberAccount({
            accountNumber,
            bankName: bank,
            accountHolder: depositor,
         }),
      onSuccess: (registeredAccount) => {
         setSavedAccount(registeredAccount);
         alert('계좌 정보가 저장되었습니다.');
      },
      onError: (error) => {
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
      onSuccess: (registeredAddress) => {
         setSavedAddress(registeredAddress);
         setZipCode(registeredAddress.zipCode);
         setAddress(registeredAddress.baseAddress);
         setAddressDetail(registeredAddress.detailAddress);
         alert('주소 정보가 저장되었습니다.');
      },
      onError: (error) => {
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
   const handleLogout = () => {
      clearAuth('manual');
      navigate('/');
   };

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
   const handleWithdrawConfirm = () => {
      closeModal();
      navigate('/');
   };

   const accountAgreementItems = [
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
      return <div className="py-24 text-center text-body-1-regular text-muted-foreground">계정 정보를 불러오는 중입니다.</div>;
   }

   if (isPageError) {
      return (
         <div className="flex flex-col items-center justify-center gap-4 py-24">
            <p className="text-body-1-regular text-muted-foreground">
               계정 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
            </p>
            <button
               type="button"
               onClick={() => {
                  void queryClient.invalidateQueries({ queryKey: ['myProfile'] });
                  void queryClient.invalidateQueries({ queryKey: ['myOrders'] });
                  void queryClient.invalidateQueries({ queryKey: ['myResales'] });
                  void queryClient.invalidateQueries({ queryKey: ['myResaleUnsettledAmount'] });
               }}
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
            {/* 뒤로 가기 */}
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
                  profile={profile}
                  savedAccount={savedAccount}
                  onEditIdentity={() => setModal('identity')}
                  onEditAccount={handleAccountChange}
               />
               <SocialConnectionsCard socialConnectionApiAvailable={socialConnectionApiAvailable} />
               <AccountBankFormCard
                  banks={BANKS}
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
                  onToggleBankDropdown={() => setBankDropdownOpen((value) => !value)}
                  onSelectBank={(selectedBank) => {
                     setBank(selectedBank);
                     setBankDropdownOpen(false);
                  }}
                  onChangeAccountNumber={(value) => setAccountNumber(value.replace(/[^0-9]/g, ''))}
                  onChangeDepositor={(value) => setDepositor(value.replace(/[^a-zA-Z가-힣ㄱ-ㅎㅏ-ㅣ\s]/g, ''))}
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
            onNavigateToVerification={() => navigate('/auth/verification-flow')}
         />
         <AccountTermsDialogs
            termsDialog={termsDialog}
            onClose={() => setTermsDialog(null)}
         />
      </div>
   );
}
