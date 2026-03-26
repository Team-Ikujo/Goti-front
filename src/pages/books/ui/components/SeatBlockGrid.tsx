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
   selectedSeatIdSet: Set<string>;
   onToggleSeat: (seat: SeatItem) => void;
};

type SeatVisualState = 'disabled' | 'enabled' | 'selected';

function getSeatVisualState(seat: SeatItem, isSelected: boolean): SeatVisualState {
   if (isSelected) {
      return 'selected';
   }

   switch (seat.status) {
      case 'disabled':
      case 'held':
         return 'disabled';
      case 'available':
      case 'selected':
         return 'enabled';
   }
}

function SeatBlockGrid({ block, blockIndex, seats, selectedSeatIdSet, onToggleSeat }: SeatBlockGridProps) {
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
               const isSelected = selectedSeatIdSet.has(seat.id);
               const visualState = getSeatVisualState(seat, isSelected);
               const isDisabled = visualState === 'disabled';

               return (
                  <button
                     key={seat.id}
                     type="button"
                     onClick={() => onToggleSeat(seat)}
                     className={[
                        'group absolute size-[18px] transition-[transform,box-shadow] duration-150 ease-out focus-visible:outline-none',
                        'focus-visible:ring-2 focus-visible:ring-[#7c68ed] focus-visible:ring-offset-2',
                        isDisabled
                           ? 'cursor-not-allowed'
                           : visualState === 'selected'
                             ? 'rounded-[6px] bg-[rgba(124,104,237,0.4)]'
                             : 'rounded-[4px] hover:scale-[1.03] focus-visible:scale-[1.03]',
                     ].join(' ')}
                     style={{
                        left: `${columnIndex * (SEAT_SIZE + SEAT_GAP)}px`,
                        top: `${rowIndex * (SEAT_SIZE + SEAT_GAP)}px`,
                     }}
                     disabled={isDisabled}
                     aria-label={`${seat.block}구역 ${seat.rowLabel} ${seat.seatNumber}번 좌석`}
                     aria-pressed={isSelected}
                     data-seat-state={visualState}
                  >
                     <span
                        aria-hidden="true"
                        className={[
                           'absolute inset-[11.11%] rounded-[4px]',
                           'transition-[background-color,border-color,box-shadow] duration-150 ease-out',
                           visualState === 'disabled'
                              ? 'bg-[#f1f2f4]'
                              : visualState === 'selected'
                                ? 'bg-[#7c68ed]'
                                : 'border border-[#867eed] bg-[rgba(124,104,237,0.12)] group-hover:border-[1.5px] group-hover:border-[#7c68ed] group-hover:bg-[#7c68ed] group-focus-visible:border-[1.5px] group-focus-visible:border-[#7c68ed] group-focus-visible:bg-[#7c68ed]',
                        ].join(' ')}
                     />
                     {visualState === 'selected' ? (
                        <Check
                           aria-hidden="true"
                           className="absolute inset-[30%] h-[40%] w-[40%] text-white"
                           strokeWidth={3}
                        />
                     ) : null}
                  </button>
               );
            })}
         </div>
      </div>
   );
}

export default SeatBlockGrid;
