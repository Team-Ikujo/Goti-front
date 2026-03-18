// src/pages/tickets/ui/payment/ResellTermsCard.tsx

import { useState } from 'react';
import { Checkbox } from '@/shared/ui/checkbox';

import { PaymentCard } from './PaymentCard';
import { PrivacyDialog, ResellPolicyDialog } from './TermsCard';

interface ResellTermsCardProps {
   agreedPrivacy: boolean;
   agreedResell: boolean;
   onChangePrivacy: (v: boolean) => void;
   onChangeResell: (v: boolean) => void;
}

export function ResellTermsCard({ agreedPrivacy, agreedResell, onChangePrivacy, onChangeResell }: ResellTermsCardProps) {
   const [openModal, setOpenModal] = useState<'privacy' | 'resell' | null>(null);

   const terms = [
      {
         key: 'privacy' as const,
         label: '개인정보 수집 및 이용 동의',
         checked: agreedPrivacy,
         onChange: onChangePrivacy,
      },
      {
         key: 'resell' as const,
         label: '리셀 정책 동의',
         checked: agreedResell,
         onChange: onChangeResell,
      },
   ];

   return (
      <>
         <PaymentCard>
            <h3 className="text-[20px] font-bold leading-[1.5] text-foreground mb-5">약관 동의</h3>
            <div className="flex flex-col gap-4">
               {terms.map(term => (
                  <label key={term.key} className="flex items-center gap-3 cursor-pointer">
                     <Checkbox checked={term.checked} onCheckedChange={v => term.onChange(!!v)} />
                     <div className="flex items-center gap-[6px]">
                        <span className="text-[14px] font-semibold leading-[1.5] text-foreground">[필수]</span>
                        <button
                           type="button"
                           onClick={e => {
                              e.preventDefault();
                              setOpenModal(term.key);
                           }}
                           className="border-b border-foreground"
                        >
                           <span className="text-[14px] font-medium leading-[1.5] text-foreground">{term.label}</span>
                        </button>
                     </div>
                  </label>
               ))}
            </div>
         </PaymentCard>

         <PrivacyDialog open={openModal === 'privacy'} onClose={() => setOpenModal(null)} />
         <ResellPolicyDialog open={openModal === 'resell'} onClose={() => setOpenModal(null)} />
      </>
   );
}
