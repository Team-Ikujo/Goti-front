import { X } from 'lucide-react';

import { formatPrice } from '@/pages/books/model/zoneData';
import type { SeatItem } from '@/pages/books/model/types';

type SelectedSeatSummaryListItemProps = {
   item: {
      seat: SeatItem;
      zoneId: string;
      zoneName: string;
      price: number;
   };
   priceLabel?: string;
   onRemove: (zoneId: string, seatId: string) => void;
};

function SelectedSeatSummaryListItem({
   item,
   priceLabel = '주말',
   onRemove,
}: SelectedSeatSummaryListItemProps) {
   return (
      <li className="flex items-center gap-2 rounded-[12px] bg-surface py-4 pl-5 pr-3">
         <div className="flex min-w-0 flex-1 items-center justify-between gap-5">
            <div className="min-w-0 flex-1">
               <p className="overflow-hidden text-body-1-bold text-secondary [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                  {item.zoneName}
               </p>
               <p className="mt-1 text-body-2-regular text-muted-foreground">
                  {item.seat.block}구역 {item.seat.rowLabel} {item.seat.seatNumber}번
               </p>
            </div>
            <div className="flex shrink-0 items-center justify-end gap-1 whitespace-nowrap">
               <span className="text-label-2-regular text-muted-foreground">{priceLabel}</span>
               <span className="text-body-1-bold text-secondary">{formatPrice(item.price)}</span>
            </div>
         </div>
         <button
            type="button"
            onClick={() => onRemove(item.zoneId, item.seat.id)}
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-icon-secondary transition-colors hover:bg-fill-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={`${item.zoneName} ${item.seat.block}구역 ${item.seat.rowLabel} ${item.seat.seatNumber}번 삭제`}
         >
            <X className="h-4 w-4" aria-hidden="true" />
         </button>
      </li>
   );
}

export default SelectedSeatSummaryListItem;
