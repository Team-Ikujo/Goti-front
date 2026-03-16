// src/pages/tickets/ui/payment/PaymentAmountCard.tsx

import { PaymentCard } from './PaymentCard';

interface Discount {
   label: string;
   amount: number;
}

interface PaymentAmountCardProps {
   ticketPrice: number;
   shippingFee: number;
   discounts: Discount[];
   fee: number;
}

function formatKRW(n: number) {
   return `${n.toLocaleString('ko-KR')}원`;
}

export function PaymentAmountCard({ ticketPrice, shippingFee, discounts, fee }: PaymentAmountCardProps) {
   const totalOrder = ticketPrice + shippingFee;
   const totalDiscount = discounts.reduce((acc, d) => acc + d.amount, 0);
   const totalPayment = totalOrder - totalDiscount + fee;

   return (
      <PaymentCard>
         <h3 className="text-heading-3-bold leading-normal text-foreground mb-10">결제 금액</h3>
         <div className="flex flex-col gap-4.5">
            {/* 총 주문 금액 */}
            <div className="flex flex-col gap-2">
               <div className="flex justify-between items-start text-heading-4-bold leading-[1.55] text-foreground">
                  <span>총 주문 금액</span>
                  <span>{formatKRW(totalOrder)}</span>
               </div>
               <div className="flex justify-between items-start text-body-1-medium leading-normal text-muted-foreground">
                  <span>ㄴ 티켓 금액</span>
                  <span>{formatKRW(ticketPrice)}</span>
               </div>
               <div className="flex justify-between items-start text-[16px] font-medium leading-normal text-muted-foreground">
                  <span>ㄴ 배송비</span>
                  <span>{formatKRW(shippingFee)}</span>
               </div>
            </div>
            {/* 총 할인 금액 */}
            <div className="flex flex-col gap-2">
               <div className="flex justify-between items-start text-[18px] font-bold leading-[1.55]">
                  <span className="text-foreground">총 할인 금액</span>
                  <span className="text-destructive">-{formatKRW(totalDiscount)}</span>
               </div>
               {discounts.map((d, i) => (
                  <div
                     key={i}
                     className="flex justify-between items-start text-body-1-medium leading-normal text-muted-foreground"
                  >
                     <span>ㄴ {d.label}</span>
                     <span>-{formatKRW(d.amount)}</span>
                  </div>
               ))}
            </div>
            {/* 수수료 */}
            <div className="flex justify-between items-start text-[18px] font-bold leading-[1.55] text-foreground">
               <span>수수료</span>
               <span>{formatKRW(fee)}</span>
            </div>
            {/* 총 결제 금액 */}
            <div className="border-t border-border pt-[19px] flex justify-between items-end">
               <span className="text-[18px] font-bold leading-[1.55] text-foreground">총 결제 금액</span>
               <span className="text-[24px] font-bold leading-[1.5] text-destructive">{formatKRW(totalPayment)}</span>
            </div>
         </div>
      </PaymentCard>
   );
}
