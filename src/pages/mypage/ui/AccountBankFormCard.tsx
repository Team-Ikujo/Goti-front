import type { RefObject } from 'react';
import { Check, ChevronRight } from 'lucide-react';
import { Checkbox } from '@/shared/ui/checkbox';
import { Input } from '@/shared/ui/input';
import type { TermsType } from './AccountTermsDialogs';

interface AccountAgreementItem {
   label: string;
   checked: boolean;
   onChange: (value: boolean) => void;
   termsKey: TermsType;
}

interface AccountBankFormCardProps {
   banks: string[];
   bank: string;
   accountNumber: string;
   depositor: string;
   bankDropdownOpen: boolean;
   bankDropdownRef: RefObject<HTMLDivElement | null>;
   bankButtonRef: RefObject<HTMLButtonElement | null>;
   accountCardRef: RefObject<HTMLDivElement | null>;
   agreeAll: boolean;
   agreementItems: AccountAgreementItem[];
   isAccountSaveEnabled: boolean;
   isSavingAccount: boolean;
   onToggleBankDropdown: () => void;
   onSelectBank: (bank: string) => void;
   onChangeAccountNumber: (value: string) => void;
   onChangeDepositor: (value: string) => void;
   onToggleAgreeAll: (checked: boolean) => void;
   onOpenTerms: (terms: TermsType) => void;
   onSave: () => void;
}

export function AccountBankFormCard({
   banks,
   bank,
   accountNumber,
   depositor,
   bankDropdownOpen,
   bankDropdownRef,
   bankButtonRef,
   accountCardRef,
   agreeAll,
   agreementItems,
   isAccountSaveEnabled,
   isSavingAccount,
   onToggleBankDropdown,
   onSelectBank,
   onChangeAccountNumber,
   onChangeDepositor,
   onToggleAgreeAll,
   onOpenTerms,
   onSave,
}: AccountBankFormCardProps) {
   return (
      <div
         ref={accountCardRef}
         className="bg-background border border-border-light rounded-2xl p-6 flex flex-col gap-7.5"
      >
         <p className="text-heading-3-bold text-foreground">계좌 정보</p>
         <div className="flex flex-col gap-6">
            <p className="text-caption-1-regular text-(--text-tertiary)">
               계좌 미등록 시 리셀 및 취소/환불 기능이 제한됩니다.
            </p>
            <p className="text-caption-1-regular text-muted-foreground">
               계좌 조회 API가 없어 현재 세션에서 저장에 성공한 계좌만 화면에 반영됩니다.
            </p>

            <div className="flex gap-6">
               <div className="flex flex-col gap-1 w-52.5">
                  <label className="text-body-2-medium text-muted-foreground">
                     은행<span className="text-primary">*</span>
                  </label>
                  <div className="relative" ref={bankDropdownRef}>
                     <button
                        ref={bankButtonRef}
                        type="button"
                        onClick={onToggleBankDropdown}
                        className={`w-full border rounded-lg h-12 flex items-center justify-between px-4 gap-2 text-body-1-regular text-left transition-colors ${bankDropdownOpen ? 'border-primary' : 'border-border hover:border-primary'}`}
                     >
                        <span className={bank ? 'text-foreground' : 'text-(--text-disabled)'}>{bank || '선택'}</span>
                        <ChevronRight
                           size={20}
                           className={`shrink-0 text-(--text-tertiary) transition-transform ${bankDropdownOpen ? '-rotate-90' : 'rotate-90'}`}
                        />
                     </button>
                     {bankDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-20 w-full p-0.75 flex flex-col gap-0.5 max-h-64 overflow-y-auto">
                           {banks.map((bankOption) => (
                              <button
                                 key={bankOption}
                                 type="button"
                                 onClick={() => onSelectBank(bankOption)}
                                 className={`w-full flex items-center justify-between px-3 py-2 rounded-sm text-body-2-regular text-foreground hover:bg-[#f1f2f4] ${bank === bankOption ? 'bg-fill-disabled' : ''}`}
                              >
                                 <span>{bankOption}</span>
                                 {bank === bankOption && <Check size={16} className="shrink-0 text-primary" />}
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
                  onChange={(e) => onChangeAccountNumber(e.target.value)}
               />
            </div>

            <Input
               label="예금주"
               required
               placeholder="예금주를 입력하세요"
               value={depositor}
               onChange={(e) => onChangeDepositor(e.target.value)}
            />

            <div className="flex flex-col gap-1">
               <div className="bg-surface rounded-lg h-12 flex items-center px-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                     <Checkbox checked={agreeAll} onCheckedChange={(value) => onToggleAgreeAll(value === true)} />
                     <span className="text-body-1-medium text-foreground">전체동의</span>
                  </label>
               </div>
               <div className="flex flex-col">
                  {agreementItems.map((item) => (
                     <div key={item.label} className="flex items-center justify-between h-11 px-4">
                        <label className="flex items-center gap-2 cursor-pointer flex-1">
                           <Checkbox checked={item.checked} onCheckedChange={(value) => item.onChange(value === true)} />
                           <span className="text-body-2-regular text-muted-foreground">
                              <span>(필수) </span>
                              <span className="font-bold">{item.label}</span>
                           </span>
                        </label>
                        <button
                           type="button"
                           onClick={() => onOpenTerms(item.termsKey)}
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
               type="button"
               disabled={!isAccountSaveEnabled || isSavingAccount}
               onClick={onSave}
               className={`border border-border rounded-lg py-3 text-body-1-bold w-full transition-colors ${
                  isAccountSaveEnabled && !isSavingAccount
                     ? 'text-muted-foreground hover:bg-surface'
                     : 'text-(--text-disabled) cursor-not-allowed'
               }`}
            >
               {isSavingAccount ? '저장 중...' : '저장'}
            </button>
         </div>
      </div>
   );
}
