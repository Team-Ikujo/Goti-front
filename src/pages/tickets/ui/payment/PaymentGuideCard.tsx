// src/pages/tickets/ui/payment/PaymentGuideCard.tsx

export function PaymentGuideCard() {
   return (
      <div className="bg-(--fill-hover) border border-border rounded-[14px] p-[25px] flex flex-col gap-2">
         <h4 className="text-[18px] font-bold leading-[1.55] text-foreground">결제 안내</h4>
         <div className="flex flex-col gap-1 text-[16px] font-medium leading-[1.5] text-foreground">
            <p>• 결제 후 즉시 예매가 완료됩니다</p>
            <p>• 모바일 티켓은 결제 후 바로 발급됩니다</p>
            <p>• 결제 실패 시 자동으로 주문이 취소됩니다</p>
         </div>
      </div>
   );
}
