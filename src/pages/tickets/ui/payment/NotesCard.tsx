// src/pages/tickets/ui/payment/NotesCard.tsx

import { AlertCircle } from 'lucide-react';

export function NotesCard() {
   return (
      <div className="bg-fill-hover border border-border rounded-[14px] p-[25px] flex flex-col gap-[30px]">
         <div className="flex items-center gap-1">
            <AlertCircle className="size-5 text-foreground shrink-0" />
            <span className="text-[18px] font-semibold leading-[1.55] text-foreground">유의사항</span>
         </div>
         <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-[6px]">
               <span className="text-[16px] font-semibold leading-[1.5] text-foreground">결제 안내</span>
               <div className="flex flex-col text-[16px] font-medium leading-[1.5] text-foreground">
                  <p>• 결제 후 즉시 예매가 완료됩니다</p>
                  <p>• 모바일 티켓은 결제 후 바로 발급됩니다</p>
                  <p>• 결제 실패 시 자동으로 주문이 취소됩니다</p>
               </div>
            </div>
            <div className="flex flex-col gap-[6px]">
               <span className="text-[16px] font-semibold leading-[1.5] text-foreground">취소 수수료 안내</span>
               <div className="flex flex-col text-[16px] font-medium leading-[1.5] text-foreground">
                  <p>• 경기 7일 전까지: 무료 취소</p>
                  <p>• 경기 6~3일 전: 티켓금액의 10%</p>
                  <p>• 경기 2~1일 전: 티켓금액의 20%</p>
                  <p>• 경기 당일: 취소 불가</p>
               </div>
            </div>
            <div className="flex flex-col gap-[6px]">
               <span className="text-[16px] font-semibold leading-[1.5] text-foreground">티켓 리셀 안내</span>
               <div className="flex flex-col text-[16px] font-medium leading-[1.5] text-foreground">
                  <p>• 안전한 거래를 위해 모바일 티켓만 리셀 등록이 가능합니다.</p>
                  <p>• 구매하신 티켓은 경기 전날까지 리셀 마켓에 등록하실 수 있습니다.</p>
                  <p>• 리셀 시 별도의 취소 수수료는 없으며, 거래 완료 시 판매 금액의 5% 중개 수수료가 적용됩니다.</p>
               </div>
            </div>
         </div>
      </div>
   );
}
