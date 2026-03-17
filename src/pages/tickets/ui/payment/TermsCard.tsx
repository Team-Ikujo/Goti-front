// src/pages/tickets/ui/payment/TermsCard.tsx

import { Checkbox } from '@/shared/ui/checkbox';

import { PaymentCard } from './PaymentCard';

interface TermsCardProps {
   agreedPrivacy: boolean;
   agreedPolicy: boolean;
   agreedResell: boolean;
   onChangePrivacy: (v: boolean) => void;
   onChangePolicy: (v: boolean) => void;
   onChangeResell: (v: boolean) => void;
}

export function TermsCard({
   agreedPrivacy,
   agreedPolicy,
   agreedResell,
   onChangePrivacy,
   onChangePolicy,
   onChangeResell,
}: TermsCardProps) {
   return (
      <PaymentCard>
         <h3 className="text-[20px] font-bold leading-[1.5] text-foreground mb-5">약관 동의</h3>
         <div className="flex flex-col gap-4">
            <label className="flex items-center gap-3 cursor-pointer">
               <Checkbox checked={agreedPrivacy} onCheckedChange={v => onChangePrivacy(!!v)} />
               <div className="flex items-center gap-[6px]">
                  <span className="text-[14px] font-semibold leading-[1.5] text-foreground">[필수]</span>
                  <div className="border-b border-foreground">
                     <span className="text-[14px] font-medium leading-[1.5] text-foreground">
                        개인정보 수집 및 이용 동의
                     </span>
                  </div>
               </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
               <Checkbox checked={agreedPolicy} onCheckedChange={v => onChangePolicy(!!v)} />
               <div className="flex items-center gap-[6px]">
                  <span className="text-[14px] font-semibold leading-[1.5] text-foreground">[필수]</span>
                  <div className="border-b border-foreground">
                     <span className="text-[14px] font-medium leading-[1.5] text-foreground">취소/환불 정책 동의</span>
                  </div>
               </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
               <Checkbox checked={agreedResell} onCheckedChange={v => onChangeResell(!!v)} />
               <div className="flex items-center gap-[6px]">
                  <span className="text-[14px] font-semibold leading-[1.5] text-foreground">[필수]</span>
                  <div className="border-b border-foreground">
                     <span className="text-[14px] font-medium leading-[1.5] text-foreground">리셀 정책 동의</span>
                  </div>
               </div>
            </label>
         </div>
      </PaymentCard>
   );
}
