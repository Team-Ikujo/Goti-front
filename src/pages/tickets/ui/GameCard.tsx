// src/pages/tickets/ui/GameCard.tsx

import { CalendarDays, MapPin, Ticket } from 'lucide-react';

import { cn } from '@/shared/lib/utils';

import type { GameItem, TabType } from './types';

function StatusBadge({ status }: { status: string }) {
   if (status === '예매 가능') {
      return (
         <span className="bg-[#dcfce7] text-success text-caption-1-bold px-2 py-1 rounded-full whitespace-nowrap shrink-0">
            {status}
         </span>
      );
   }
   if (status === '오픈 예정' || status === '리셀 예정') {
      return (
         <span className="bg-fill-hoveraccent text-primary text-caption-1-bold px-2 py-1 rounded-full whitespace-nowrap shrink-0">
            {status}
         </span>
      );
   }
   // 매진
   return (
      <span className="bg-fill-disabled text-muted-foreground text-caption-1-bold px-2 py-1 rounded-full whitespace-nowrap shrink-0">
         {status}
      </span>
   );
}

interface GameCardProps {
   game: GameItem;
   activeTab: TabType;
}

export function GameCard({ game, activeTab }: GameCardProps) {
   const status = activeTab === '예매' ? game.bookingStatus : game.resellStatus;
   const isActive = status === '예매 가능';
   const buttonLabel = activeTab === '예매' ? '예매하기' : '리셀예매';
   const showPrice = game.minPrice > 0;

   const formatPrice = (price: number) => price.toLocaleString('ko-KR') + '원';

   return (
      <div className="bg-background border border-border rounded-[14px] p-[25px] flex items-center justify-between w-full">
         {/* Left: game info */}
         <div className="flex flex-col justify-between h-[104px]">
            {/* Team matchup + status badge */}
            <div className="flex items-center gap-3 h-7">
               <div className="flex items-center gap-1 text-heading-3-bold text-foreground whitespace-nowrap">
                  <span>{game.awayTeam}</span>
                  <span>vs</span>
                  <span>{game.homeTeam}</span>
               </div>
               <StatusBadge status={status} />
            </div>

            {/* Date & Venue */}
            <div className="flex items-center gap-5">
               <div className="flex items-center gap-2 h-5 w-[200px]">
                  <CalendarDays className="size-4 text-muted-foreground shrink-0" />
                  <span className="text-body-2-regular text-muted-foreground whitespace-nowrap">
                     {game.dateTime}
                  </span>
               </div>
               <div className="flex items-center gap-2 h-5">
                  <MapPin className="size-4 text-muted-foreground shrink-0" />
                  <span className="text-body-2-regular text-muted-foreground whitespace-nowrap">{game.venue}</span>
               </div>
            </div>

            {/* Remaining seats */}
            <div className="flex items-center gap-2 h-5">
               <Ticket className="size-5 text-primary shrink-0" />
               <span className="text-body-2-bold text-primary whitespace-nowrap">
                  잔여 {game.remainingSeats.toLocaleString('ko-KR')}석
               </span>
            </div>
         </div>

         {/* Right: price + button */}
         <div className="flex flex-col items-end justify-between h-[104px]">
            {/* Price */}
            {showPrice ? (
               <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2 text-destructive whitespace-nowrap">
                     {activeTab === '리셀' && <span className="text-body-2-regular">최저가</span>}
                     <span className="text-heading-1-bold">{formatPrice(game.minPrice)}</span>
                  </div>
                  <span className="text-body-1-medium text-muted-foreground whitespace-nowrap">
                     ~ {formatPrice(game.maxPrice)}
                  </span>
               </div>
            ) : (
               <div />
            )}

            {/* Action button */}
            <button
               disabled={!isActive}
               className={cn(
                  'px-[14px] py-[6px] rounded-[8px] text-body-2-medium whitespace-nowrap transition-colors',
                  isActive
                     ? 'bg-primary text-white hover:bg-primary-strong'
                     : 'bg-primary-disabled text-disabled-foreground cursor-not-allowed',
               )}
            >
               {buttonLabel}
            </button>
         </div>
      </div>
   );
}
