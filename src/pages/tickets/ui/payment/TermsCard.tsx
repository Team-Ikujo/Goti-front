// src/pages/tickets/ui/payment/TermsCard.tsx

import { Checkbox } from '@/shared/ui/checkbox';

import { PaymentCard } from './PaymentCard';

interface TermsCardProps {
   agreedPrivacy: boolean;
   agreedPolicy: boolean;
   onChangePrivacy: (v: boolean) => void;
   onChangePolicy: (v: boolean) => void;
}

export function TermsCard({ agreedPrivacy, agreedPolicy, onChangePrivacy, onChangePolicy }: TermsCardProps) {
   return (
      <PaymentCard>
         <h3 className="text-[20px] font-bold leading-[1.5] text-foreground mb-5">약관 동의</h3>
         <div className="flex flex-col gap-4">
            <label className="flex items-center gap-3 cursor-pointer">
               <Checkbox checked={agreedPrivacy} onCheckedChange={v => onChangePrivacy(!!v)} />
               <span className="text-[14px] font-semibold text-foreground">[필수]</span>
               <span className="text-[14px] font-medium text-foreground underline">개인정보 수집 및 이용 동의</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
               <Checkbox checked={agreedPolicy} onCheckedChange={v => onChangePolicy(!!v)} />
               <span className="text-[14px] font-semibold text-foreground">[필수]</span>
               <span className="text-[14px] font-medium text-foreground underline">취소/환불 및 리셀 정책 동의</span>
            </label>
         </div>
      </PaymentCard>
   );
}
