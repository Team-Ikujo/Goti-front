import type { ZoneItem } from '@/pages/books/model/types';

type ZoneSubsectionPreviewProps = {
   zone: ZoneItem;
};

function ZoneSubsectionPreview({ zone }: ZoneSubsectionPreviewProps) {
   const seatRows = ['A', 'B', 'C', 'D'];
   const baseSeats = zone.remaining > 0 ? 8 : 6;

   return (
      <div className="w-[240px] rounded-xl border border-border-light bg-background p-3 shadow-lg">
         <p className="text-label-2-semibold text-foreground">{zone.name} 하위 도면</p>
         <p className="mt-1 text-caption-1-regular text-muted-foreground">섹션 코드: {zone.sectionCode}</p>
         <div className="mt-3 space-y-1.5">
            {seatRows.map((row, rowIndex) => (
               <div key={row} className="flex items-center gap-1">
                  <span className="w-4 text-caption-1-medium text-muted-foreground">{row}</span>
                  <div className="flex gap-1">
                     {Array.from({ length: baseSeats }).map((_, seatIndex) => {
                        const isBlocked = zone.remaining === 0 && seatIndex % 3 === 0;
                        const isFocus = rowIndex === 1 && seatIndex >= 2 && seatIndex <= 4;

                        return (
                           <span
                              key={`${row}-${seatIndex}`}
                              className="h-2.5 w-2.5 rounded-[2px]"
                              style={{
                                 backgroundColor: isBlocked ? '#d0d6db' : isFocus ? zone.color : '#e9ebee',
                              }}
                              aria-hidden="true"
                           />
                        );
                     })}
                  </div>
               </div>
            ))}
         </div>
      </div>
   );
}

export default ZoneSubsectionPreview;
