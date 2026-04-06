// src/pages/mypage/ui/AccountPage.tsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/entities/auth/model/authStore';
import { ChevronLeft } from 'lucide-react';
import { createMemberAccount, createMemberAddress, type MemberAccount, type MemberAddress } from '@/entities/user/api/memberApi';
import { MY_PROFILE_MOCK } from '@/entities/user/api/memberApi';
import { getErrorMessage } from '@/shared/lib/error/getErrorMessage';
import { AccountModals } from './AccountModals';
import type { ModalType } from './AccountModals';
import { AccountTermsDialogs } from './AccountTermsDialogs';
import type { TermsType } from './AccountTermsDialogs';
import {
   AccountFormCard,
   AccountInfoCard,
   AccountManagementCard,
   AddressFormCard,
   SocialConnectionsCard,
} from './AccountPageSections';
import {
   useMyProfileData,
   useMyOrdersData,
   useMyResaleListData,
   useMyResaleUnsettledAmountData,
} from '../model/useMypageData';
import { openDaumPostcode } from '../model/useDaumPostcode';
import { PURCHASE_ITEMS, SALE_ITEMS } from '../model/mockData';
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
   const profileQuery = useMyProfileData();
   const ordersQuery = useMyOrdersData();
   const resaleListQuery = useMyResaleListData();
   const unsettledAmountQuery = useMyResaleUnsettledAmountData();
   const profile = profileQuery.isError ? MY_PROFILE_MOCK : (profileQuery.data ?? MY_PROFILE_MOCK);
   const purchaseItems = ordersQuery.isError ? PURCHASE_ITEMS : (ordersQuery.data ?? []);
   const saleItems = resaleListQuery.isError ? SALE_ITEMS : (resaleListQuery.data ?? []);

   // 미정산 금액 존재 여부: 판매 완료 후 정산 대기 중인 항목
   const hasUnpaidAmount = (unsettledAmountQuery.data?.unsettledAmount ?? 0) > 0;
   // 예매 완료 또는 판매 중인 티켓 존재 여부
   const hasActiveTickets =
      purchaseItems.some(i => i.paymentStatus === '예매 완료') || saleItems.some(i => i.saleStatus === '판매 중');

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

   const socialConnectionItems = [
      {
         key: 'google',
         label: 'Google 계정 연결',
         iconSrc: '/Icon/Logo/Google.svg',
         iconAlt: 'Google',
         iconWrapperClassName: 'rounded-full border border-border-light p-0.5',
         showSignupBadge: true,
      },
      {
         key: 'kakao',
         label: '카카오 계정 연결',
         iconSrc: '/Icon/Logo/Kakao.svg',
         iconAlt: 'Kakao',
         iconWrapperClassName: 'flex size-7 items-center justify-center overflow-hidden rounded-full bg-[#ffde00]',
         textClassName: 'text-muted-foreground',
      },
      {
         key: 'naver',
         label: '네이버 계정 연결',
         iconSrc: '/Icon/Logo/Naver.svg',
         iconAlt: 'Naver',
         iconWrapperClassName:
            'flex size-7 items-center justify-center overflow-hidden rounded-full bg-[#00c73c] p-0.5',
         textClassName: 'text-muted-foreground',
      },
   ];

   if (isPageLoading) {
      return <div className="py-24 text-center text-body-1-regular text-muted-foreground">계정 정보를 불러오는 중입니다.</div>;
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
               <AccountInfoCard
                  profile={profile}
                  savedAccount={savedAccount}
                  onOpenIdentityModal={() => setModal('identity')}
                  onAccountChange={handleAccountChange}
               />
               <SocialConnectionsCard items={socialConnectionItems} apiAvailable={socialConnectionApiAvailable} />
               <AccountFormCard
                  ref={accountCardRef}
                  bankOptions={BANKS}
                  bank={bank}
                  bankDropdownOpen={bankDropdownOpen}
                  bankDropdownRef={bankDropdownRef}
                  bankButtonRef={bankButtonRef}
                  onToggleBankDropdown={() => setBankDropdownOpen((prev) => !prev)}
                  onSelectBank={(selectedBank) => {
                     setBank(selectedBank);
                     setBankDropdownOpen(false);
                  }}
                  accountNumber={accountNumber}
                  depositor={depositor}
                  onAccountNumberChange={(value) => setAccountNumber(value.replace(/[^0-9]/g, ''))}
                  onDepositorChange={(value) => setDepositor(value.replace(/[^a-zA-Z가-힣ㄱ-ㅎㅏ-ㅣ\s]/g, ''))}
                  agreeAll={agreeAll}
                  onAgreeAllChange={handleAgreeAll}
                  agreementItems={accountAgreementItems}
                  onOpenTermsDialog={setTermsDialog}
                  isSaveEnabled={isAccountSaveEnabled}
                  isSaving={isSavingAccount}
                  onSave={() => saveAccount()}
               />
               <AddressFormCard
                  savedAddress={savedAddress}
                  zipCode={zipCode}
                  address={address}
                  addressDetail={addressDetail}
                  onSearchPostcode={handlePostcodeSearch}
                  onAddressDetailChange={setAddressDetail}
                  isSaveEnabled={isAddressSaveEnabled}
                  isSaving={isSavingAddress}
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
         <AccountTermsDialogs termsDialog={termsDialog} onClose={() => setTermsDialog(null)} />
      </div>
   );
}
