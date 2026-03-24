import { formatPrice } from '@/pages/books/model/zoneData';
import type { ZoneItem } from '@/pages/books/model/types';

type BookingZoneListProps = {
   zones: ZoneItem[];
   selectedZoneId: string;
   onSelectZone: (zoneId: string) => void;
   variant?: 'panel' | 'drawer';
};

function BookingZoneList({ zones, selectedZoneId, onSelectZone, variant = 'panel' }: BookingZoneListProps) {
   const isDrawer = variant === 'drawer';

   return (
      <aside
         className={[
            'w-full bg-background',
            isDrawer ? 'rounded-t-[16px]' : 'border-t border-border-light lg:w-[420px] lg:border-l lg:border-t-0',
         ].join(' ')}
         aria-label="좌석 등급 및 잔여석"
      >
         <div className={isDrawer ? 'px-5 py-4' : 'border-b border-border-light px-5 py-5'}>
            <h2 className="text-heading-3-bold text-foreground">좌석 등급/잔여석</h2>
         </div>
         <ul className={isDrawer ? 'px-5 pb-6' : 'px-5 py-0'}>
            {zones.map((zone) => {
               const hasRemaining = zone.remaining > 0;
               const isSelected = zone.id === selectedZoneId;

               return (
                  <li key={zone.id} className={isDrawer ? '' : 'border-b border-[#f1f2f4] last:border-b-0'}>
                     <button
                        type="button"
                        onClick={() => onSelectZone(zone.id)}
                        className={[
                           'flex min-h-12 w-full items-center gap-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
                           isDrawer ? 'rounded-[12px] px-2 py-3' : 'px-0',
                           isSelected ? 'bg-fill-hoveraccent' : 'hover:bg-fill-hover',
                        ].join(' ')}
                        aria-pressed={isSelected}
                     >
                        <div className={isDrawer ? 'ml-1 flex h-full w-4 shrink-0 items-center' : 'ml-1 h-12 w-3 shrink-0'} aria-hidden="true">
                           <div
                              className={isDrawer ? 'h-4 w-4 rounded-[4px]' : 'mt-[18px] h-3 w-3 rounded-[3px]'}
                              style={{ backgroundColor: zone.color }}
                           />
                        </div>
                        <div className="flex min-w-0 flex-1 items-center gap-2 text-body-2-regular text-muted-foreground">
                           <span className="truncate text-body-1-medium text-foreground">{zone.name}</span>
                           <span className="shrink-0">{formatPrice(zone.price)}</span>
                        </div>
                        <span
                           className={[
                              'min-w-[34px] text-right text-body-1-bold',
                              isDrawer ? '' : 'pr-1',
                              hasRemaining ? 'text-primary' : 'text-disabled-foreground',
                           ].join(' ')}
                        >
                           {zone.remaining}석
                        </span>
                     </button>
                  </li>
               );
            })}
         </ul>
      </aside>
   );
}

export default BookingZoneList;
