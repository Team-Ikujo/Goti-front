import { cn } from '@/shared/lib/utils';

import type { SelectedSeatDetail } from '@/pages/books/model/selectedSeats';
import SelectedSeatSummaryListItem from './SelectedSeatSummaryListItem';

export type SelectedSeatSummaryItem = SelectedSeatDetail;

type SelectedSeatSummaryListProps = {
   items: SelectedSeatSummaryItem[];
   onRemove: (zoneId: string, seatId: string) => void;
   priceLabel?: string;
   className?: string;
   emptyClassName?: string;
};

function SelectedSeatSummaryList({
   items,
   onRemove,
   priceLabel = '주말',
   className,
   emptyClassName,
}: SelectedSeatSummaryListProps) {
   if (items.length === 0) {
      return (
         <div
            className={cn(
               'flex min-h-24 items-center justify-center rounded-2xl bg-surface text-body-1-regular text-muted-foreground',
               emptyClassName,
            )}
         >
            선택한 좌석이 없습니다.
         </div>
      );
   }

   return (
      <ul className={cn('space-y-4', className)}>
         {items.map((item) => (
            <SelectedSeatSummaryListItem
               key={`${item.zoneId}-${item.seat.id}`}
               item={item}
               priceLabel={priceLabel}
               onRemove={onRemove}
            />
         ))}
      </ul>
   );
}

export default SelectedSeatSummaryList;
