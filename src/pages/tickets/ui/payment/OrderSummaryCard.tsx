// src/pages/tickets/ui/payment/OrderSummaryCard.tsx

import { type OrderInfo } from './types';
import { PaymentCard } from './PaymentCard';

export function OrderSummaryCard({ orderInfo }: { orderInfo: OrderInfo }) {
   return (
      <PaymentCard>
         <h3 className="text-[20px] font-bold leading-[1.5] text-foreground mb-10">주문 정보 확인</h3>
         <div className="flex flex-col gap-3">
            {/* 경기 */}
            <div className="flex justify-between">
               <span className="text-body-2-bold leading-normal text-(--text-tertiary)">경기</span>
               <div className="flex flex-col">
                  <span className="text-heading-3-bold leading-normal text-foreground text-right">
                     {orderInfo.matchTitle}
                  </span>
                  <span className="text-body-1-medium leading-[1.55] text-muted-foreground">{orderInfo.dateTime}</span>
               </div>
            </div>
            {/* 수량 */}
            <div className="border-t border-border pt-3.5 flex gap-0.5 justify-between">
               <span className="text-body-2-bold leading-normal text-(--text-tertiary)">수량</span>
               <span className="text-body-1-medium leading-[1.55] text-muted-foreground">{orderInfo.quantity}매</span>
            </div>
            {/* 좌석 */}
            <div className="pt-3.5 flex justify-between gap-0.5">
               <span className="text-body-2-bold leading-normal text-(--text-tertiary)">좌석</span>
               <div className="flex flex-col items-end">
                  {orderInfo.seats.map((seat, i) => (
                     <span key={i} className="text-body-1-medium leading-[1.55] text-muted-foreground text-right">
                        {seat}
                     </span>
                  ))}
               </div>
            </div>
            {/* 수령 방식 */}
            <div className="pt-3.5 flex justify-between gap-0.5">
               <span className="text-body-2-bold leading-normal text-(--text-tertiary)">수령 방식</span>
               <span className="text-body-1-medium leading-[1.55] text-muted-foreground">
                  {orderInfo.deliveryLabel}
               </span>
            </div>
            {/* 결제 방식 */}
            <div className="pt-3.5 flex justify-between gap-0.5">
               <span className="text-body-2-bold leading-normal text-(--text-tertiary)">결제 방식</span>
               <span className="text-body-1-medium leading-[1.55] text-muted-foreground">{orderInfo.paymentLabel}</span>
            </div>
         </div>
      </PaymentCard>
   );
}
