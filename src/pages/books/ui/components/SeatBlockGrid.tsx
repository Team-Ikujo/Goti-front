import { Check } from 'lucide-react';

import type { SeatBlock, SeatItem } from '@/pages/books/model/types';

const SEAT_SIZE = 18;
const SEAT_GAP = 2;
const CARD_PADDING_X = 24;
const CARD_PADDING_TOP = 32;
const CARD_PADDING_BOTTOM = 32;
const LABEL_HEIGHT = 28;
const LABEL_GAP = 24;
const CARD_COLUMN_GAP = 48;

type SeatBlockGridProps = {
   block: SeatBlock;
   blockIndex: number;
   seats: SeatItem[];
   selectedSeatIds: string[];
   onToggleSeat: (seat: SeatItem) => void;
};

function SeatBlockGrid({ block, blockIndex, seats, selectedSeatIds, onToggleSeat }: SeatBlockGridProps) {
   const blockWidth = block.cols * (SEAT_SIZE + SEAT_GAP) - SEAT_GAP;
   const blockHeight = block.rows * (SEAT_SIZE + SEAT_GAP) - SEAT_GAP;
   const cardWidth = blockWidth + CARD_PADDING_X * 2;
   const cardHeight = CARD_PADDING_TOP + LABEL_HEIGHT + LABEL_GAP + blockHeight + CARD_PADDING_BOTTOM;

   return (
      <div
         className="absolute bg-white"
         style={{
            left: `${block.offsetX - CARD_PADDING_X + blockIndex * CARD_COLUMN_GAP}px`,
            top: `${block.offsetY - (CARD_PADDING_TOP + LABEL_HEIGHT + LABEL_GAP)}px`,
            width: `${cardWidth}px`,
            height: `${cardHeight}px`,
         }}
      >
         <div
            className="text-center text-[18px] leading-[1.55] font-bold text-[#646f7c]"
            style={{ paddingTop: `${CARD_PADDING_TOP}px`, marginBottom: `${LABEL_GAP}px`, height: `${CARD_PADDING_TOP + LABEL_HEIGHT}px` }}
         >
            {block.label}
         </div>
         <div
            className="relative"
            style={{
               width: `${blockWidth}px`,
               height: `${blockHeight}px`,
               marginLeft: `${CARD_PADDING_X}px`,
               marginRight: `${CARD_PADDING_X}px`,
            }}
         >
            {seats.map((seat) => {
               const columnIndex = Math.round((seat.x - block.offsetX) / (SEAT_SIZE + SEAT_GAP));
               const rowIndex = Math.round((seat.y - block.offsetY) / (SEAT_SIZE + SEAT_GAP));
               const isSelected = selectedSeatIds.includes(seat.id);

               return (
                  <button
                     key={seat.id}
                     type="button"
                     onClick={() => onToggleSeat(seat)}
                     className={[
                        'absolute transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                        seat.status === 'disabled'
                           ? 'rounded-[4px] border border-transparent bg-[#e5e7eb]'
                           : seat.status === 'held'
                             ? 'rounded-[4px] border border-[#c9c4ff] bg-[#eceaff]'
                           : isSelected
                             ? 'rounded-[6px] bg-[rgba(124,104,237,0.4)]'
                             : 'rounded-[4px] border border-[#6d63ff] bg-[#f4f3ff]',
                     ].join(' ')}
                     style={{
                        left: `${columnIndex * (SEAT_SIZE + SEAT_GAP)}px`,
                        top: `${rowIndex * (SEAT_SIZE + SEAT_GAP)}px`,
                        width: `${SEAT_SIZE}px`,
                        height: `${SEAT_SIZE}px`,
                     }}
                     disabled={seat.status === 'disabled' || seat.status === 'held'}
                     aria-label={`${seat.block}구역 ${seat.rowLabel} ${seat.seatNumber}번 좌석`}
                     aria-pressed={isSelected}
                  >
                     {isSelected ? (
                        <>
                           <span
                              aria-hidden="true"
                              className="absolute inset-[11.11%] rounded-[4px] bg-[#7c68ed]"
                           />
                           <Check
                              aria-hidden="true"
                              className="absolute inset-[30%] h-[40%] w-[40%] text-white"
                              strokeWidth={3}
                           />
                        </>
                     ) : null}
                  </button>
               );
            })}
         </div>
      </div>
   );
}

export default SeatBlockGrid;
