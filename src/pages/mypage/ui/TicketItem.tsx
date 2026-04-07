// src/pages/mypage/ui/TicketItem.tsx

export type TicketItemStatus = '예매완료' | '취소완료' | '판매중' | '판매취소' | '판매완료' | '취소대기';

const STATUS_STYLE: Record<TicketItemStatus, { statusColor: string; infoColor: string }> = {
   예매완료: { statusColor: 'text-primary', infoColor: 'text-muted-foreground' },
   취소완료: { statusColor: 'text-destructive', infoColor: 'text-disabled-foreground' },
   판매중: { statusColor: 'text-primary', infoColor: 'text-muted-foreground' },
   판매취소: { statusColor: 'text-destructive', infoColor: 'text-disabled-foreground' },
   판매완료: { statusColor: 'text-muted-foreground', infoColor: 'text-disabled-foreground' },
   취소대기: { statusColor: 'text-muted-foreground', infoColor: 'text-disabled-foreground' },
};

interface TicketItemProps {
   orderId: string;
   section: string;
   seatDetail: string;
   status: TicketItemStatus;
   price: number;
}

export default function TicketItem({ orderId, section, seatDetail, status, price }: TicketItemProps) {
   const { statusColor, infoColor } = STATUS_STYLE[status];
   return (
      <div className="flex w-full items-center justify-between gap-6">
        {/* 좌석 정보 */}
         <div className={`flex min-w-0 flex-1 flex-col gap-2 ${infoColor}`}>
            <p className="text-body-3-regular whitespace-nowrap">{orderId}</p>
            <div className="flex flex-col gap-1">
               <p className="text-heading-4-bold">{section}</p>
               <p className="text-body-1-regular">{seatDetail}</p>
            </div>
         </div>
         {/* 상태 */}
         <p className={`text-body-1-medium shrink-0 ${statusColor}`}>{status}</p>
         {/* 가격 */}
         <p className={`text-body-1-bold shrink-0 ${infoColor}`}>{price.toLocaleString()}원</p>
      </div>
   );
}
