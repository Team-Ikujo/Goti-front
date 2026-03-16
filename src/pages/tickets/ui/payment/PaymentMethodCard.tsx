// src/pages/tickets/ui/payment/PaymentMethodCard.tsx

import { type ReactNode } from 'react';
import { CreditCard } from 'lucide-react';

import { cn } from '@/shared/lib/utils';

import { type PaymentMethod } from './types';
import { PaymentCard } from './PaymentCard';

interface PayMethodOptionProps {
   selected: boolean;
   onSelect: () => void;
   icon: ReactNode;
   label: string;
   description: string;
}

function PayMethodOption({ selected, onSelect, icon, label, description }: PayMethodOptionProps) {
   return (
      <button
         type="button"
         onClick={onSelect}
         className={cn(
            'flex items-center gap-3 w-full px-[17px] py-[9px] rounded-[10px] border transition-colors text-left',
            selected ? 'border-primary' : 'border-border',
         )}
      >
         <div
            className={cn(
               'size-4 rounded-full shrink-0 flex items-center justify-center',
               selected ? 'bg-primary' : 'border-[1.5px] border-border',
            )}
         >
            {selected && <span className="size-[7px] rounded-full bg-white block" />}
         </div>
         <span className="w-[30px] shrink-0 flex items-center justify-center">{icon}</span>
         <div className="flex flex-col gap-0.5">
            <span className="text-[16px] font-bold leading-[1.5] text-foreground">{label}</span>
            <span className="text-[16px] font-medium leading-[1.5] text-(--text-secondary)">{description}</span>
         </div>
      </button>
   );
}

const PAYMENT_OPTIONS: { id: PaymentMethod; icon: ReactNode; label: string; description: string }[] = [
   { id: 'card', icon: <CreditCard className="size-5" />, label: '신용/체크카드', description: '모든 카드사 사용 가능' },
   {
      id: 'kakao',
      icon: <img src="/images/카카오.png" alt="카카오페이" className="h-[18px] w-[30px] object-contain rounded-sm" />,
      label: '카카오페이',
      description: '간편 결제',
   },
   {
      id: 'naver',
      icon: <img src="/images/네이버.png" alt="네이버페이" className="h-[18px] w-[30px] object-contain rounded-sm" />,
      label: '네이버페이',
      description: '간편 결제',
   },
   {
      id: 'toss',
      icon: (
         <img
            src="/images/토스.png"
            alt="토스페이"
            className="h-[18px] w-[30px] object-contain rounded-sm border border-border"
         />
      ),
      label: '토스페이',
      description: '간편 결제',
   },
   { id: 'bank', icon: <img src="/Icon/Line/Building.svg" alt="무통장 입금" className="size-5" />, label: '무통장 입금', description: '가상계좌 발급' },
];

interface PaymentMethodCardProps {
   selected: PaymentMethod;
   onSelect: (method: PaymentMethod) => void;
}

export function PaymentMethodCard({ selected, onSelect }: PaymentMethodCardProps) {
   return (
      <PaymentCard>
         <h3 className="text-[20px] font-bold leading-[1.5] text-foreground mb-5">결제 방법</h3>
         <div className="flex flex-col gap-3">
            {PAYMENT_OPTIONS.map(opt => (
               <PayMethodOption
                  key={opt.id}
                  selected={selected === opt.id}
                  onSelect={() => onSelect(opt.id)}
                  icon={opt.icon}
                  label={opt.label}
                  description={opt.description}
               />
            ))}
         </div>
      </PaymentCard>
   );
}
