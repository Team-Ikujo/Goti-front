// src/pages/tickets/ui/payment/ResellInfoCard.tsx

import { AlertCircle } from 'lucide-react';

export function ResellInfoCard() {
   return (
      <div className="bg-(--fill-hoveraccent) border border-(--border-accent) rounded-[14px] p-[25px]">
         <div className="flex gap-3 items-start">
            <AlertCircle className="size-5 text-primary mt-[3px] shrink-0" />
            <div className="flex flex-col gap-2">
               <span className="text-[18px] font-bold leading-[1.55] text-[#0054d1]">티켓 리셀 안내</span>
               <div className="flex flex-col gap-1 text-[16px] font-medium leading-[1.5] text-[#0054d1]">
                  <p>• 안전한 거래를 위해 모바일 티켓만 리셀 등록이 가능합니다.</p>
                  <p>• 구매하신 티켓은 경기 전날까지 리셀 마켓에 등록하실 수 있습니다.</p>
                  <p>• 리셀 시 취소 수수료 없이 판매 가격의 95%를 받으실 수 있습니다.</p>
               </div>
            </div>
         </div>
      </div>
   );
}
