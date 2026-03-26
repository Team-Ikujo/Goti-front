// src/pages/mypage/ui/TicketItem.tsx

export type TicketItemStatus = '예매완료' | '취소완료' | '판매중' | '판매취소' | '판매완료' | '취소대기';

const STATUS_STYLE: Record<TicketItemStatus, { statusColor: string; infoColor: string }> = {
   예매완료: { statusColor: 'text-primary', infoColor: 'text-[#374553]' },
   취소완료: { statusColor: 'text-destructive', infoColor: 'text-(--text-disabled)' },
   판매중: { statusColor: 'text-primary', infoColor: 'text-[#374553]' },
   판매취소: { statusColor: 'text-destructive', infoColor: 'text-(--text-disabled)' },
   판매완료: { statusColor: 'text-muted-foreground', infoColor: 'text-(--text-disabled)' },
   취소대기: { statusColor: 'text-muted-foreground', infoColor: 'text-(--text-disabled)' },
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
      <div className="flex flex-wrap gap-x-[60px] gap-y-3 items-center w-full">
         {/* 좌석 정보 */}
         <div className={`flex flex-1 flex-col gap-2 min-w-[200px] ${infoColor}`}>
            <p className="text-[13px] leading-[1.5] tracking-[-0.13px]">{orderId}</p>
            <div className="flex flex-col gap-1">
               <p className="text-[18px] font-bold leading-[1.55]">{section}</p>
               <p className="text-body-1-regular leading-[1.5]">{seatDetail}</p>
            </div>
         </div>
         {/* 상태 + 가격 — 모바일에서 줄바꿈 시 전체 너비 사용 */}
         <div className="flex flex-1 items-center justify-between min-w-[186px]">
            <p className={`text-body-1-medium ${statusColor}`}>{status}</p>
            <p className={`text-body-1-bold ${infoColor}`}>{price.toLocaleString()}원</p>
         </div>
      </div>
   );
}
