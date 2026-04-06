import { forwardRef, type RefObject } from 'react';
import { Check, ChevronRight } from 'lucide-react';
import { Checkbox } from '@/shared/ui/checkbox';
import { Input } from '@/shared/ui/input';
import type { MemberAccount, MemberAddress, MemberProfile } from '@/entities/user/api/memberApi';
import type { TermsType } from './AccountTermsDialogs';

type ToggleProps = {
   checked: boolean;
   onChange: () => void;
   disabled?: boolean;
};

export function Toggle({ checked, onChange, disabled = false }: ToggleProps) {
   return (
      <button
         type="button"
         role="switch"
         aria-checked={checked}
         aria-disabled={disabled}
         onClick={onChange}
         disabled={disabled}
         className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-border'} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
      >
         <span
            className={`absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`}
         />
      </button>
   );
}

type AccountInfoCardProps = {
   profile: MemberProfile;
   savedAccount: MemberAccount | null;
   onOpenIdentityModal: () => void;
   onAccountChange: () => void;
};

export function AccountInfoCard({
   profile,
   savedAccount,
   onOpenIdentityModal,
   onAccountChange,
}: AccountInfoCardProps) {
   return (
      <div className="bg-background flex flex-col gap-7.5 rounded-[14px] border border-[rgba(0,0,0,0.1)] p-6.25">
         <p className="text-heading-3-bold text-foreground">계정 정보</p>
         <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
               <p className="text-body-1-bold text-(--text-tertiary)">아이디</p>
               <div className="flex items-center gap-2">
                  <p className="text-body-1-regular text-foreground">{profile.email || '아이디 정보 없음'}</p>
                  <div className="rounded-full border border-border-light p-0.5">
                     <img src="/Icon/Logo/Google.svg" alt="Google" className="size-6" />
                  </div>
               </div>
            </div>
            <div className="flex items-center justify-between">
               <p className="text-body-1-bold text-(--text-tertiary)">이메일</p>
               <p className="text-body-1-regular text-foreground">{profile.email || '이메일 정보 없음'}</p>
            </div>
            <div className="flex items-center justify-between">
               <p className="text-body-1-bold text-(--text-tertiary)">이름</p>
               <div className="flex items-center gap-2">
                  <p className="text-body-1-regular text-foreground">{profile.name || '로딩 중...'}</p>
                  <button
                     type="button"
                     onClick={onOpenIdentityModal}
                     className="border-b border-muted-foreground text-body-2-regular text-(--text-tertiary)"
                  >
                     변경
                  </button>
               </div>
            </div>
            <div className="flex items-center justify-between">
               <p className="text-body-1-bold text-(--text-tertiary)">휴대폰 번호</p>
               <div className="flex items-center gap-2">
                  <p className="text-body-1-regular text-foreground">{profile.mobile || '전화번호 정보 없음'}</p>
                  <button
                     type="button"
                     onClick={onOpenIdentityModal}
                     className="border-b border-muted-foreground text-body-2-regular text-(--text-tertiary)"
                  >
                     변경
                  </button>
               </div>
            </div>
            <div className="flex items-center justify-between">
               <p className="text-body-1-bold text-(--text-tertiary)">계좌 정보</p>
               <div className="flex items-center gap-2">
                  <p className="text-body-1-regular text-foreground">{savedAccount?.bankName ?? '미등록'}</p>
                  <p className="text-body-1-regular text-foreground">{savedAccount?.accountNumber ?? '-'}</p>
                  <button
                     type="button"
                     onClick={onAccountChange}
                     className="border-b border-muted-foreground text-body-2-regular text-(--text-tertiary)"
                  >
                     변경
                  </button>
               </div>
            </div>
         </div>
      </div>
   );
}

type SocialConnectionItem = {
   key: string;
   label: string;
   iconSrc: string;
   iconAlt: string;
   iconWrapperClassName: string;
   textClassName?: string;
   showSignupBadge?: boolean;
};

type SocialConnectionsCardProps = {
   items: SocialConnectionItem[];
   apiAvailable: boolean;
};

export function SocialConnectionsCard({ items, apiAvailable }: SocialConnectionsCardProps) {
   return (
      <div className="bg-background flex flex-col gap-7.5 rounded-[14px] border border-[rgba(0,0,0,0.1)] p-6.25">
         <p className="text-heading-3-bold text-foreground">간편 로그인 연결</p>
         <p className="text-body-2-regular text-muted-foreground">
            현재 문서 기준으로 연결 계정 조회/변경 API가 정의되지 않아 상태 표시는 제공하지 않습니다.
         </p>
         <div className="flex flex-col gap-4">
            {items.map((item, index) => (
               <div
                  key={item.key}
                  className={`flex items-center justify-between px-1 ${index === 0 ? '' : 'border-t border-border pt-4'}`}
               >
                  <div className="flex items-center gap-5">
                     <div className="flex items-center gap-2.5">
                        <div className={item.iconWrapperClassName}>
                           <img src={item.iconSrc} alt={item.iconAlt} className="size-5" />
                        </div>
                        <p className={`text-body-2-medium ${item.textClassName ?? 'text-foreground'}`}>{item.label}</p>
                     </div>
                     {item.showSignupBadge && (
                        <span className="rounded bg-[#f1f2f4] px-1 py-0.5 text-caption-1-regular text-muted-foreground">
                           회원가입 계정
                        </span>
                     )}
                  </div>
                  <Toggle checked={false} onChange={() => {}} disabled={!apiAvailable} />
               </div>
            ))}
         </div>
      </div>
   );
}

type AgreementItem = {
   label: string;
   checked: boolean;
   onChange: (value: boolean) => void;
   termsKey: TermsType;
};

type AccountFormCardProps = {
   bankOptions: string[];
   bank: string;
   bankDropdownOpen: boolean;
   bankDropdownRef: RefObject<HTMLDivElement | null>;
   bankButtonRef: RefObject<HTMLButtonElement | null>;
   onToggleBankDropdown: () => void;
   onSelectBank: (bank: string) => void;
   accountNumber: string;
   depositor: string;
   onAccountNumberChange: (value: string) => void;
   onDepositorChange: (value: string) => void;
   agreeAll: boolean;
   onAgreeAllChange: (checked: boolean) => void;
   agreementItems: AgreementItem[];
   onOpenTermsDialog: (terms: TermsType) => void;
   isSaveEnabled: boolean;
   isSaving: boolean;
   onSave: () => void;
};

export const AccountFormCard = forwardRef<HTMLDivElement, AccountFormCardProps>(function AccountFormCard(
   {
      bankOptions,
      bank,
      bankDropdownOpen,
      bankDropdownRef,
      bankButtonRef,
      onToggleBankDropdown,
      onSelectBank,
      accountNumber,
      depositor,
      onAccountNumberChange,
      onDepositorChange,
      agreeAll,
      onAgreeAllChange,
      agreementItems,
      onOpenTermsDialog,
      isSaveEnabled,
      isSaving,
      onSave,
   },
   ref,
) {
   return (
      <div ref={ref} className="bg-background flex flex-col gap-7.5 rounded-2xl border border-border-light p-6">
         <p className="text-heading-3-bold text-foreground">계좌 정보</p>
         <div className="flex flex-col gap-6">
            <p className="text-caption-1-regular text-(--text-tertiary)">
               계좌 미등록 시 리셀 및 취소/환불 기능이 제한됩니다.
            </p>
            <p className="text-caption-1-regular text-muted-foreground">
               계좌 조회 API가 없어 현재 세션에서 저장에 성공한 계좌만 화면에 반영됩니다.
            </p>

            <div className="flex gap-6">
               <div className="flex w-52.5 flex-col gap-1">
                  <label className="text-body-2-medium text-muted-foreground">
                     은행<span className="text-primary">*</span>
                  </label>
                  <div className="relative" ref={bankDropdownRef}>
                     <button
                        ref={bankButtonRef}
                        type="button"
                        onClick={onToggleBankDropdown}
                        className={`h-12 w-full rounded-lg border px-4 text-left text-body-1-regular transition-colors ${bankDropdownOpen ? 'border-primary' : 'border-border hover:border-primary'} flex items-center justify-between gap-2`}
                     >
                        <span className={bank ? 'text-foreground' : 'text-(--text-disabled)'}>{bank || '선택'}</span>
                        <ChevronRight
                           size={20}
                           className={`shrink-0 text-(--text-tertiary) transition-transform ${bankDropdownOpen ? '-rotate-90' : 'rotate-90'}`}
                        />
                     </button>
                     {bankDropdownOpen && (
                        <div className="bg-background absolute left-0 top-full z-20 mt-1 flex max-h-64 w-full flex-col gap-0.5 overflow-y-auto rounded-lg border border-border p-0.75 shadow-lg">
                           {bankOptions.map((option) => (
                              <button
                                 key={option}
                                 type="button"
                                 onClick={() => onSelectBank(option)}
                                 className={`text-body-2-regular hover:bg-[#f1f2f4] flex w-full items-center justify-between rounded-sm px-3 py-2 text-foreground ${bank === option ? 'bg-fill-disabled' : ''}`}
                              >
                                 <span>{option}</span>
                                 {bank === option && <Check size={16} className="shrink-0 text-primary" />}
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
                  onChange={(event) => onAccountNumberChange(event.target.value)}
               />
            </div>

            <Input
               label="예금주"
               required
               placeholder="예금주를 입력하세요"
               value={depositor}
               onChange={(event) => onDepositorChange(event.target.value)}
            />

            <div className="flex flex-col gap-1">
               <div className="bg-surface flex h-12 items-center rounded-lg px-4">
                  <label className="flex cursor-pointer items-center gap-2">
                     <Checkbox checked={agreeAll} onCheckedChange={(value) => onAgreeAllChange(value === true)} />
                     <span className="text-body-1-medium text-foreground">전체동의</span>
                  </label>
               </div>
               <div className="flex flex-col">
                  {agreementItems.map((item) => (
                     <div key={item.label} className="flex h-11 items-center justify-between px-4">
                        <label className="flex flex-1 cursor-pointer items-center gap-2">
                           <Checkbox checked={item.checked} onCheckedChange={(value) => item.onChange(value === true)} />
                           <span className="text-body-2-regular text-muted-foreground">
                              <span>(필수) </span>
                              <span className="font-bold">{item.label}</span>
                           </span>
                        </label>
                        <button
                           type="button"
                           onClick={() => onOpenTermsDialog(item.termsKey)}
                           className="-mr-1 p-1"
                           aria-label={`${item.label} 보기`}
                        >
                           <ChevronRight size={16} className="text-muted-foreground" />
                        </button>
                     </div>
                  ))}
               </div>
            </div>

            <button
               type="button"
               disabled={!isSaveEnabled || isSaving}
               onClick={onSave}
               className={`w-full rounded-lg border border-border py-3 text-body-1-bold transition-colors ${
                  isSaveEnabled && !isSaving
                     ? 'text-muted-foreground hover:bg-surface'
                     : 'cursor-not-allowed text-(--text-disabled)'
               }`}
            >
               {isSaving ? '저장 중...' : '저장'}
            </button>
         </div>
      </div>
   );
});

type AddressFormCardProps = {
   savedAddress: MemberAddress | null;
   zipCode: string;
   address: string;
   addressDetail: string;
   onSearchPostcode: () => void;
   onAddressDetailChange: (value: string) => void;
   isSaveEnabled: boolean;
   isSaving: boolean;
   onSave: () => void;
};

export function AddressFormCard({
   savedAddress,
   zipCode,
   address,
   addressDetail,
   onSearchPostcode,
   onAddressDetailChange,
   isSaveEnabled,
   isSaving,
   onSave,
}: AddressFormCardProps) {
   return (
      <div className="bg-background flex flex-col gap-5 rounded-[14px] border border-border p-6.25">
         <p className="text-heading-3-bold text-foreground">주소 수정</p>
         <div className="flex gap-5">
            <p className="text-body-2-medium text-foreground whitespace-nowrap">주소정보</p>
            <div className="flex flex-1 flex-col gap-7.5">
               {savedAddress && (
                  <div className="bg-surface rounded-lg px-4 py-3 text-body-2-regular text-muted-foreground">
                     최근 저장 주소: ({savedAddress.zipCode}) {savedAddress.baseAddress} {savedAddress.detailAddress}
                  </div>
               )}
               <div className="flex flex-col gap-4">
                  <div className="flex items-end gap-2.5">
                     <Input className="flex-1" label="우편번호" required value={zipCode} disabled readOnly />
                     <button
                        type="button"
                        onClick={onSearchPostcode}
                        className="mb-px whitespace-nowrap rounded-lg border border-border px-6 py-3 text-body-1-bold text-muted-foreground transition-colors hover:bg-surface"
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
                     onChange={(event) => onAddressDetailChange(event.target.value)}
                  />
               </div>
               <button
                  type="button"
                  disabled={!isSaveEnabled || isSaving}
                  onClick={onSave}
                  className={`w-full rounded-lg border border-border py-3 text-body-1-bold transition-colors ${
                     isSaveEnabled && !isSaving
                        ? 'text-muted-foreground hover:bg-surface'
                        : 'cursor-not-allowed text-(--text-disabled)'
                  }`}
               >
                  {isSaving ? '저장 중...' : '저장'}
               </button>
            </div>
         </div>
      </div>
   );
}

type AccountManagementCardProps = {
   onLogout: () => void;
   onWithdraw: () => void;
};

export function AccountManagementCard({ onLogout, onWithdraw }: AccountManagementCardProps) {
   return (
      <div className="bg-background flex flex-col gap-7.5 rounded-[14px] border border-[rgba(0,0,0,0.1)] p-6.25">
         <p className="text-heading-3-bold text-foreground">계정 관리</p>
         <div className="flex flex-col gap-4">
            <button type="button" onClick={onLogout} className="flex items-center px-1 text-body-2-medium text-destructive">
               로그아웃
            </button>
            <div className="border-t border-border pt-4">
               <button type="button" onClick={onWithdraw} className="flex items-center px-1 text-body-2-medium text-muted-foreground">
                  회원 탈퇴
               </button>
            </div>
         </div>
      </div>
   );
}
