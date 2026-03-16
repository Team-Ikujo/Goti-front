// src/pages/tickets/ui/payment/DiscountCard.tsx

import { ChevronDown } from 'lucide-react';

export function DiscountCard() {
   return (
      <div className="bg-background border border-border rounded-[14px] p-[25px] flex items-center justify-between">
         <span className="text-[20px] font-bold leading-[1.5] text-foreground">할인 선택</span>
         <ChevronDown className="size-6 text-foreground" />
      </div>
   );
}
