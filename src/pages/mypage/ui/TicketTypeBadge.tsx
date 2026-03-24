// src/pages/mypage/ui/TicketTypeBadge.tsx

import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/lib/utils';

export type TicketType = '티켓' | '리셀';

interface TicketTypeBadgeProps {
   type: TicketType;
   className?: string;
}

/**
 * 구매/판매 내역 카드에서 사용하는 티켓 종류 뱃지
 * - 티켓: 파란색 배경
 * - 리셀: 보라색 배경
 */
export default function TicketTypeBadge({ type, className }: TicketTypeBadgeProps) {
   const isTicket = type === '티켓';

   return (
      <Badge
         className={cn(
            'text-[12px] font-bold leading-[1.5] px-2 py-1 rounded-full border-0',
            isTicket
               ? 'bg-fill-hoveraccent text-primary'
               : 'bg-[#faf5ff] text-[#9810fa]',
            className,
         )}
      >
         {type}
      </Badge>
   );
}
