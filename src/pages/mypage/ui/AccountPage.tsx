// src/pages/mypage/ui/AccountPage.tsx

import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/entities/auth/model/authStore';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Checkbox } from '@/shared/ui/checkbox';
import { Input } from '@/shared/ui/input';
import { AccountModals } from './AccountModals';
import type { ModalType } from './AccountModals';
import { AccountTermsDialogs } from './AccountTermsDialogs';
import type { TermsType } from './AccountTermsDialogs';
import { useMyProfileData } from '../model/useMypageData';

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

const DAUM_POSTCODE_SCRIPT_URL = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
const DAUM_POSTCODE_SCRIPT_ID = 'daum-postcode-script';

function loadDaumPostcodeAndOpen(onComplete: (zipCode: string, address: string) => void) {
   const open = () => {
      const POPUP_W = 500;
      const POPUP_H = 600;
      const left = window.screenX + Math.round((window.outerWidth - POPUP_W) / 2);
      const top = window.screenY + Math.round((window.outerHeight - POPUP_H) / 2);
      new window.daum!.Postcode({
         oncomplete: data => {
            const selectedAddress = data.roadAddress || data.jibunAddress;
            onComplete(data.zonecode, selectedAddress);
         },
         width: POPUP_W,
         height: POPUP_H,
      }).open({ left, top });
   };
   if (window.daum?.Postcode) {
      open();
      return;
   }
   const existing = document.getElementById(DAUM_POSTCODE_SCRIPT_ID);
   if (existing) {
      existing.addEventListener('load', open, { once: true });
      return;
   }
   const script = document.createElement('script');
   script.id = DAUM_POSTCODE_SCRIPT_ID;
   script.src = DAUM_POSTCODE_SCRIPT_URL;
   script.onload = open;
   script.onerror = () => console.error('다음 우편번호 스크립트 로드에 실패했습니다.');
   document.head.appendChild(script);
}


/** 미정산 금액 존재 여부 (실제 연동 시 API로 대체) */
const HAS_UNPAID_AMOUNT = false;
/** 예약 또는 판매 중인 티켓 존재 여부 (실제 연동 시 API로 대체) */
const HAS_ACTIVE_TICKETS = true;

export default function AccountPage() {
   const navigate = useNavigate();
   const location = useLocation();
   const { data: profile } = useMyProfileData();

   // ── 모달 ──
   const [modal, setModal] = useState<ModalType>(null);
   const closeModal = () => setModal(null);

   // ── 약관 다이얼로그 ──
   const [termsDialog, setTermsDialog] = useState<TermsType>(null);

   // ── 간편 로그인 연결 ──
   const [googleConnected, setGoogleConnected] = useState(true);
   const [kakaoConnected, setKakaoConnected] = useState(true);
   const [naverConnected, setNaverConnected] = useState(false);

   const connectedCount = [googleConnected, kakaoConnected, naverConnected].filter(Boolean).length;

   /** 토글 클릭: 1개만 남은 경우 해지 불가 팝업 */
   const handleSocialToggle = (isConnected: boolean, setter: (v: boolean) => void) => {
      if (isConnected && connectedCount <= 1) {
         setModal('cannotDisconnect');
         return;
      }
      setter(!isConnected);
   };

   // ── 계좌 정보 ──
   const [bank, setBank] = useState('');
   const [bankDropdownOpen, setBankDropdownOpen] = useState(false);
   const bankDropdownRef = useRef<HTMLDivElement>(null);
   const bankButtonRef = useRef<HTMLButtonElement>(null);
   const accountCardRef = useRef<HTMLDivElement>(null);
   const [accountNumber, setAccountNumber] = useState('');
   const [depositor, setDepositor] = useState('');
   const [agreeAll, setAgreeAll] = useState(false);
   const [agreeOpen, setAgreeOpen] = useState(false);
   const [agreeThird, setAgreeThird] = useState(false);
   const [agreePersonal, setAgreePersonal] = useState(false);

   // ── 주소 수정 ──
   const [zipCode, setZipCode] = useState('12345');
   const [address, setAddress] = useState('서울특별시 강남구 테헤란로 123');
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
      loadDaumPostcodeAndOpen((zip, addr) => {
         setZipCode(zip);
         setAddress(addr);
      });
   };

   const isAccountSaveEnabled = !!(bank && accountNumber && depositor && agreeOpen && agreeThird && agreePersonal);
   const clearAuth = useAuthStore(state => state.clearAuth);

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
      if (HAS_UNPAID_AMOUNT) {
         setModal('withdrawBlocked');
      } else if (HAS_ACTIVE_TICKETS) {
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
               {/* ── 계정 정보 카드 ── */}
               <div className="bg-background border border-[rgba(0,0,0,0.1)] rounded-[14px] p-6.25 flex flex-col gap-7.5">
                  <p className="text-heading-3-bold text-foreground">계정 정보</p>
                  <div className="flex flex-col gap-5">
                     <div className="flex items-center justify-between">
                        <p className="text-body-1-bold text-(--text-tertiary)">아이디</p>
                        <div className="flex items-center gap-2">
                           <p className="text-body-1-regular text-foreground">{profile?.email || 'goti1234@google.com'}</p>
                           <div className="border border-border-light rounded-full p-0.5">
                              <img src="/Icon/Logo/Google.svg" alt="Google" className="size-6" />
                           </div>
                        </div>
                     </div>
                     <div className="flex items-center justify-between">
                        <p className="text-body-1-bold text-(--text-tertiary)">이메일</p>
                        <p className="text-body-1-regular text-foreground">{profile?.email || 'goti1234@google.com'}</p>
                     </div>
                     <div className="flex items-center justify-between">
                        <p className="text-body-1-bold text-(--text-tertiary)">이름</p>
                        <div className="flex items-center gap-2">
                           <p className="text-body-1-regular text-foreground">{profile?.name || '로딩 중...'}</p>
                           <button
                              onClick={() => setModal('identity')}
                              className="border-b border-muted-foreground text-body-2-regular text-(--text-tertiary)"
                           >
                              변경
                           </button>
                        </div>
                     </div>
                     <div className="flex items-center justify-between">
                        <p className="text-body-1-bold text-(--text-tertiary)">휴대폰 번호</p>
                        <div className="flex items-center gap-2">
                           <p className="text-body-1-regular text-foreground">{profile?.mobile || '010-0000-0000'}</p>
                           <button
                              onClick={() => setModal('identity')}
                              className="border-b border-muted-foreground text-body-2-regular text-(--text-tertiary)"
                           >
                              변경
                           </button>
                        </div>
                     </div>
                     <div className="flex items-center justify-between">
                        <p className="text-body-1-bold text-(--text-tertiary)">계좌 정보</p>
                        <div className="flex items-center gap-2">
                           <p className="text-body-1-regular text-foreground">카카오뱅크</p>
                           <p className="text-body-1-regular text-foreground">3333-67-8765445</p>
                           <button
                              type="button"
                              onClick={handleAccountChange}
                              className="border-b border-muted-foreground text-body-2-regular text-(--text-tertiary)"
                           >
                              변경
                           </button>
                        </div>
                     </div>
                  </div>
               </div>

               {/* ── 간편 로그인 연결 카드 ── */}
               <div className="bg-background border border-[rgba(0,0,0,0.1)] rounded-[14px] p-6.25 flex flex-col gap-7.5">
                  <p className="text-heading-3-bold text-foreground">간편 로그인 연결</p>
                  <div className="flex flex-col gap-4">
                     {/* Google */}
                     <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-5">
                           <div className="flex items-center gap-2.5">
                              <div className="border border-border-light rounded-full p-0.5">
                                 <img src="/Icon/Logo/Google.svg" alt="Google" className="size-6" />
                              </div>
                              <p className="text-body-2-medium text-foreground">Google 계정 연결</p>
                           </div>
                           <span className="bg-[#f1f2f4] text-muted-foreground text-caption-1-regular px-1 py-0.5 rounded">
                              회원가입 계정
                           </span>
                        </div>
                        <Toggle
                           checked={googleConnected}
                           onChange={() => handleSocialToggle(googleConnected, setGoogleConnected)}
                        />
                     </div>
                     {/* Kakao */}
                     <div className="border-t border-border pt-4 flex items-center justify-between px-1">
                        <div className="flex items-center gap-2.5">
                           <div className="size-7 bg-[#ffde00] rounded-full flex items-center justify-center overflow-hidden">
                              <img src="/Icon/Logo/Kakao.svg" alt="Kakao" className="size-5" />
                           </div>
                           <p className="text-body-2-medium text-muted-foreground">카카오 계정 연결</p>
                        </div>
                        <Toggle
                           checked={kakaoConnected}
                           onChange={() => handleSocialToggle(kakaoConnected, setKakaoConnected)}
                        />
                     </div>
                     {/* Naver */}
                     <div className="border-t border-border pt-4 flex items-center justify-between px-1">
                        <div className="flex items-center gap-2.5">
                           <div className="size-7 bg-[#00c73c] rounded-full flex items-center justify-center overflow-hidden p-0.5">
                              <img src="/Icon/Logo/Naver.svg" alt="Naver" className="size-5" />
                           </div>
                           <p className="text-body-2-medium text-muted-foreground">네이버 계정 연결</p>
                        </div>
                        <Toggle
                           checked={naverConnected}
                           onChange={() => handleSocialToggle(naverConnected, setNaverConnected)}
                        />
                     </div>
                  </div>
               </div>

               {/* ── 계좌 정보 카드 ── */}
               <div
                  ref={accountCardRef}
                  className="bg-background border border-border-light rounded-2xl p-6 flex flex-col gap-7.5"
               >
                  <p className="text-heading-3-bold text-foreground">계좌 정보</p>
                  <div className="flex flex-col gap-6">
                     <p className="text-caption-1-regular text-(--text-tertiary)">
                        계좌 미등록 시 리셀 및 취소/환불 기능이 제한됩니다.
                     </p>

                     {/* 은행 + 계좌번호 */}
                     <div className="flex gap-6">
                        <div className="flex flex-col gap-1 w-52.5">
                           <label className="text-body-2-medium text-muted-foreground">
                              은행<span className="text-primary">*</span>
                           </label>
                           <div className="relative" ref={bankDropdownRef}>
                              <button
                                 ref={bankButtonRef}
                                 type="button"
                                 onClick={() => setBankDropdownOpen(p => !p)}
                                 className={`w-full border rounded-lg h-12 flex items-center justify-between px-4 gap-2 text-body-1-regular text-left transition-colors ${bankDropdownOpen ? 'border-primary' : 'border-border hover:border-primary'}`}
                              >
                                 <span className={bank ? 'text-foreground' : 'text-(--text-disabled)'}>
                                    {bank || '선택'}
                                 </span>
                                 <ChevronRight
                                    size={20}
                                    className={`shrink-0 text-(--text-tertiary) transition-transform ${bankDropdownOpen ? '-rotate-90' : 'rotate-90'}`}
                                 />
                              </button>
                              {bankDropdownOpen && (
                                 <div className="absolute top-full left-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-20 w-full p-0.75 flex flex-col gap-0.5 max-h-64 overflow-y-auto">
                                    {BANKS.map(b => (
                                       <button
                                          key={b}
                                          type="button"
                                          onClick={() => {
                                             setBank(b);
                                             setBankDropdownOpen(false);
                                          }}
                                          className={`w-full flex items-center justify-between px-3 py-2 rounded-sm text-body-2-regular text-foreground hover:bg-[#f1f2f4] ${bank === b ? 'bg-fill-disabled' : ''}`}
                                       >
                                          <span>{b}</span>
                                          {bank === b && <Check size={16} className="shrink-0 text-primary" />}
                                       </button>
                                    ))}
                                 </div>
                              )}
                           </div>
                        </div>
                        <Input
                           className="flex-1"
                           label="계좌번호"
                           required
                           inputMode="numeric"
                           placeholder="계좌번호를 입력하세요"
                           value={accountNumber}
                           onChange={e => setAccountNumber(e.target.value.replace(/[^0-9]/g, ''))}
                        />
                     </div>

                     {/* 예금주 */}
                     <Input
                        label="예금주"
                        required
                        placeholder="예금주를 입력하세요"
                        value={depositor}
                        onChange={e => setDepositor(e.target.value.replace(/[^a-zA-Z가-힣ㄱ-ㅎㅏ-ㅣ\s]/g, ''))}
                     />

                     {/* 약관 동의 */}
                     <div className="flex flex-col gap-1">
                        <div className="bg-surface rounded-lg h-12 flex items-center px-4">
                           <label className="flex items-center gap-2 cursor-pointer">
                              <Checkbox checked={agreeAll} onCheckedChange={v => handleAgreeAll(v === true)} />
                              <span className="text-body-1-medium text-foreground">전체동의</span>
                           </label>
                        </div>
                        <div className="flex flex-col">
                           {(
                              [
                                 {
                                    label: '오픈뱅킹공동업무 자동계좌이체 약관',
                                    checked: agreeOpen,
                                    onChange: (v: boolean) =>
                                       handleIndividualAgree(setAgreeOpen, v, [agreeThird, agreePersonal]),
                                    termsKey: 'openBanking' as TermsType,
                                 },
                                 {
                                    label: '개인(신용)정보 제3자 제공 동의',
                                    checked: agreeThird,
                                    onChange: (v: boolean) =>
                                       handleIndividualAgree(setAgreeThird, v, [agreeOpen, agreePersonal]),
                                    termsKey: 'thirdParty' as TermsType,
                                 },
                                 {
                                    label: '개인정보 수집‧이용 동의 [출금이체]',
                                    checked: agreePersonal,
                                    onChange: (v: boolean) =>
                                       handleIndividualAgree(setAgreePersonal, v, [agreeOpen, agreeThird]),
                                    termsKey: 'personalInfo' as TermsType,
                                 },
                              ] as const
                           ).map(item => (
                              <div key={item.label} className="flex items-center justify-between h-11 px-4">
                                 <label className="flex items-center gap-2 cursor-pointer flex-1">
                                    <Checkbox checked={item.checked} onCheckedChange={v => item.onChange(v === true)} />
                                    <span className="text-body-2-regular text-muted-foreground">
                                       <span>(필수) </span>
                                       <span className="font-bold">{item.label}</span>
                                    </span>
                                 </label>
                                 <button
                                    type="button"
                                    onClick={() => setTermsDialog(item.termsKey)}
                                    className="p-1 -mr-1"
                                    aria-label={`${item.label} 보기`}
                                 >
                                    <ChevronRight size={16} className="text-muted-foreground" />
                                 </button>
                              </div>
                           ))}
                        </div>
                     </div>

                     <button
                        disabled={!isAccountSaveEnabled}
                        className={`border border-border rounded-lg py-3 text-body-1-bold w-full transition-colors ${
                           isAccountSaveEnabled
                              ? 'text-muted-foreground hover:bg-surface'
                              : 'text-(--text-disabled) cursor-not-allowed'
                        }`}
                     >
                        저장
                     </button>
                  </div>
               </div>

               {/* ── 주소 수정 카드 ── */}
               <div className="bg-background border border-border rounded-[14px] p-6.25 flex flex-col gap-5">
                  <p className="text-heading-3-bold text-foreground">주소 수정</p>
                  <div className="flex gap-5">
                     <p className="text-body-2-medium text-foreground whitespace-nowrap">주소정보</p>
                     <div className="flex flex-col gap-7.5 flex-1">
                        <div className="flex flex-col gap-4">
                           <div className="flex items-end gap-2.5">
                              <Input className="flex-1" label="우편번호" required value={zipCode} disabled readOnly />
                              <button
                                 type="button"
                                 onClick={handlePostcodeSearch}
                                 className="border border-border rounded-lg px-6 py-3 text-body-1-bold text-muted-foreground whitespace-nowrap hover:bg-surface transition-colors mb-px"
                              >
                                 우편번호 검색
                              </button>
                           </div>
                           <Input label="주소" required value={address} disabled readOnly />
                           <Input
                              label="상세 주소"
                              required
                              placeholder="상세 주소를 입력하세요"
                              value={addressDetail}
                              onChange={e => setAddressDetail(e.target.value)}
                           />
                        </div>
                        <button className="border border-border rounded-lg py-3 text-body-1-bold text-muted-foreground w-full hover:bg-surface transition-colors">
                           저장
                        </button>
                     </div>
                  </div>
               </div>

               {/* ── 계정 관리 카드 ── */}
               <div className="bg-background border border-[rgba(0,0,0,0.1)] rounded-[14px] p-6.25 flex flex-col gap-7.5">
                  <p className="text-heading-3-bold text-foreground">계정 관리</p>
                  <div className="flex flex-col gap-4">
                     <button
                        onClick={handleLogout}
                        className="flex items-center px-1 text-body-2-medium text-destructive"
                     >
                        로그아웃
                     </button>
                     <div className="border-t border-border pt-4">
                        <button
                           onClick={handleWithdrawClick}
                           className="flex items-center px-1 text-body-2-medium text-muted-foreground"
                        >
                           회원 탈퇴
                        </button>
                     </div>
                  </div>
               </div>
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

/* ── 토글 컴포넌트 ── */
interface ToggleProps {
   checked: boolean;
   onChange: () => void;
}
function Toggle({ checked, onChange }: ToggleProps) {
   return (
      <button
         role="switch"
         aria-checked={checked}
         onClick={onChange}
         className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${checked ? 'bg-primary' : 'bg-border'}`}
      >
         <span
            className={`absolute top-0.5 left-0.5 size-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`}
         />
      </button>
   );
}
