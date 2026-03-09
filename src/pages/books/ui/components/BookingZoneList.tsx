import { formatPrice } from '@/pages/books/model/zoneData';
import type { ZoneItem } from '@/pages/books/model/types';

type BookingZoneListProps = {
   zones: ZoneItem[];
   selectedZoneId: string;
   onSelectZone: (zoneId: string) => void;
};

function BookingZoneList({ zones, selectedZoneId, onSelectZone }: BookingZoneListProps) {
   return (
      <aside className="w-full border-l border-border-light bg-background lg:w-[420px]" aria-label="좌석 등급 및 잔여석">
         <div className="border-b border-border-light px-6 py-5">
            <h2 className="text-heading-3-bold text-foreground">좌석 등급/잔여석</h2>
         </div>
         <ul className="space-y-2 px-6 py-3">
            {zones.map((zone) => {
               const hasRemaining = zone.remaining > 0;
               const isSelected = zone.id === selectedZoneId;

               return (
                  <li key={zone.id}>
                     <button
                        type="button"
                        onClick={() => onSelectZone(zone.id)}
                        className={[
                           'flex h-12 w-full items-center gap-3 rounded-md px-1 text-left transition-colors',
                           isSelected ? 'bg-fill-hoveraccent' : 'hover:bg-fill-hover',
                        ].join(' ')}
                        aria-pressed={isSelected}
                     >
                        <div className="h-5 w-5 rounded" style={{ backgroundColor: zone.color }} aria-hidden="true" />
                        <div className="flex min-w-0 flex-1 items-center gap-2 text-body-1-regular text-muted-foreground">
                           <span className="truncate text-body-1-bold text-muted-foreground">{zone.name}</span>
                           <span>{formatPrice(zone.price)}</span>
                        </div>
                        <span className={hasRemaining ? 'text-body-1-bold text-primary' : 'text-body-1-bold text-disabled-foreground'}>
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
