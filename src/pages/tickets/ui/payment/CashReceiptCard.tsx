// src/pages/tickets/ui/payment/CashReceiptCard.tsx

import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import { Checkbox } from '@/shared/ui/checkbox';

import { type CashReceiptNumType, type CashReceiptType } from './types';
import { PaymentCard } from './PaymentCard';

const CASH_NUM_OPTIONS: { value: CashReceiptNumType; label: string }[] = [
   { value: 'phone', label: '휴대폰 번호' },
   { value: 'card', label: '현금영수증 카드번호' },
];

/** 현금영수증 번호 유형 커스텀 드롭다운 */
function NumTypeSelect({ value, onChange }: { value: CashReceiptNumType; onChange: (v: CashReceiptNumType) => void }) {
   const [open, setOpen] = useState(false);
   const ref = useRef<HTMLDivElement>(null);
   const selected = CASH_NUM_OPTIONS.find(o => o.value === value) ?? CASH_NUM_OPTIONS[0];

   // 외부 클릭 시 닫기
   useEffect(() => {
      const handleClick = (e: MouseEvent) => {
         if (ref.current && !ref.current.contains(e.target as Node)) {
            setOpen(false);
         }
      };
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
   }, []);

   return (
      <div ref={ref} className="relative w-62.5">
         {/* 트리거 */}
         <button
            type="button"
            onClick={() => setOpen(prev => !prev)}
            className="w-62.5 h-9 px-[13px] py-px flex items-center justify-between border border-border-light rounded-lg bg-background"
         >
            <span className="text-[14px] font-medium leading-[1.5] text-foreground">{selected.label}</span>
            <ChevronDown className={cn('size-5 text-foreground transition-transform', open && 'rotate-180')} />
         </button>

         {/* 드롭다운 목록 */}
         {open && (
            <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-10 bg-background border border-border-light rounded-lg p-[5px] w-full">
               {CASH_NUM_OPTIONS.map(opt => (
                  <button
                     key={opt.value}
                     type="button"
                     onClick={() => {
                        onChange(opt.value);
                        setOpen(false);
                     }}
                     className={cn(
                        'w-full flex items-center px-[6px] py-[6px] rounded-[6px] text-[14px] leading-[1.5]',
                        opt.value === value
                           ? 'bg-(--fill-hover) font-medium text-(--text-secondary)'
                           : 'font-normal text-(--text-tertiary)',
                     )}
                  >
                     {opt.label}
                  </button>
               ))}
            </div>
         )}
      </div>
   );
}

/** 작은 인라인 라디오 (카드형이 아닌 텍스트 옆 버튼) */
function InlineRadio({ selected }: { selected: boolean }) {
   return (
      <div
         className={cn(
            'size-[18px] rounded-full shrink-0 flex items-center justify-center',
            selected ? 'bg-primary' : 'border-[1.5px] border-border',
         )}
      >
         {selected && <span className="size-[7px] rounded-full bg-white block" />}
      </div>
   );
}

interface CashReceiptCardProps {
   receiptType: CashReceiptType;
   onChangeReceiptType: (v: CashReceiptType) => void;
   numType: CashReceiptNumType;
   onChangeNumType: (v: CashReceiptNumType) => void;
   num: string;
   onChangeNum: (v: string) => void;
   saveInfo: boolean;
   onChangeSaveInfo: (v: boolean) => void;
}

export function CashReceiptCard({
   receiptType,
   onChangeReceiptType,
   numType,
   onChangeNumType,
   num,
   onChangeNum,
   saveInfo,
   onChangeSaveInfo,
}: CashReceiptCardProps) {
   return (
      <PaymentCard>
         <h3 className="text-heading-3-bold leading-normal text-foreground mb-10">현금영수증</h3>
         <div className="flex flex-col gap-4.5">
            {/* 소득공제용 / 지출증빙용 / 미발행 */}
            <div className="flex items-center gap-5">
               {(
                  [
                     { value: 'income', label: '소득공제용' },
                     { value: 'expense', label: '지출증빙용' },
                     { value: 'none', label: '미발행' },
                  ] as { value: CashReceiptType; label: string }[]
               ).map(opt => (
                  <button
                     key={opt.value}
                     type="button"
                     onClick={() => onChangeReceiptType(opt.value)}
                     className="flex items-center gap-1"
                  >
                     <InlineRadio selected={receiptType === opt.value} />
                     <span className="text-body-1-medium leading-normal text-muted-foreground">{opt.label}</span>
                  </button>
               ))}
            </div>

            {/* 번호 유형 선택 + 번호 입력 (미발행 시 숨김) */}
            {receiptType !== 'none' && (
               <div className="flex gap-2">
                  <NumTypeSelect value={numType} onChange={onChangeNumType} />
                  <input
                     type="text"
                     inputMode="numeric"
                     value={num}
                     onChange={e => onChangeNum(e.target.value.replace(/\D/g, '').slice(0, 13))}
                     placeholder="숫자만 입력해 주세요."
                     maxLength={13}
                     className="w-full h-9 px-3 border border-border-light rounded-lg text-body-2-medium leading-normal text-foreground flex-1 placeholder:text-disabled-foreground bg-background outline-none"
                  />
               </div>
            )}

            {/* 정보 저장 체크박스 */}
            {receiptType !== 'none' && (
               <label className="flex items-center gap-1 cursor-pointer">
                  <Checkbox checked={saveInfo} onCheckedChange={v => onChangeSaveInfo(!!v)} />
                  <span className="text-body-1-medium leading-normal text-muted-foreground">현금영수증 정보 저장</span>
               </label>
            )}
         </div>
      </PaymentCard>
   );
}
