// src/pages/tickets/ui/GameCard.tsx

import { CalendarDays, MapPin, Ticket } from 'lucide-react';

import { formatBookingCardDateTime } from '@/shared/lib/bookingDateTime';
import { cn } from '@/shared/lib/utils';

import type { GameItem, TabType } from './types';

function StatusBadge({ status }: { status: string }) {
   if (status === '예매 가능' || status === '리셀 가능') {
      return (
         <span className="bg-[#dcfce7] text-success text-caption-1-bold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
            {status}
         </span>
      );
   }
   if (status === '판매 예정' || status === '리셀 예정') {
      return (
         <span className="bg-fill-hoveraccent text-primary text-caption-1-bold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
            {status}
         </span>
      );
   }
   // 매진
   return (
      <span className="bg-fill-disabled text-muted-foreground text-caption-1-bold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
         {status}
      </span>
   );
}

interface GameCardProps {
   game: GameItem;
   activeTab: TabType;
   onActionClick: (game: GameItem) => void;
}

/** 탭과 현재 상태에 따라 버튼 텍스트와 활성 여부 결정 */
function getButtonConfig(status: string, activeTab: TabType): { label: string; isActive: boolean } {
   if (activeTab === '예매') {
      if (status === '예매 가능') return { label: '예매하기', isActive: true };
      if (status === '판매 예정') return { label: '판매예정', isActive: false };
      return { label: '매진', isActive: false };
   } else {
      if (status === '리셀 가능') return { label: '리셀하기', isActive: true };
      if (status === '리셀 예정') return { label: '리셀예정', isActive: false };
      return { label: '리셀매진', isActive: false };
   }
}

export function GameCard({ game, activeTab, onActionClick }: GameCardProps) {
   const effectiveBookingStatus = game.bookingStatus;
   const effectiveResellStatus = game.resellStatus;

   const status = activeTab === '예매' ? effectiveBookingStatus : effectiveResellStatus;
   const { label: buttonLabel, isActive } = getButtonConfig(status, activeTab);
   const showPrice = game.minPrice > 0;
   const formattedDateTime = formatBookingCardDateTime(game.dateTime);
   const remainingSeats = activeTab === '리셀' ? (game.resellRemainingSeats ?? 0) : game.remainingSeats;

   const [, gameMonth, gameDay] = game.date.split('-').map(Number);

   const formatPrice = (price: number) => price.toLocaleString('ko-KR') + '원';

   return (
      <div className="bg-background border border-border rounded-[14px] px-[25px] py-[17px] flex flex-col w-full md:flex-row md:items-center md:justify-between md:py-[25px]">
         {/* 경기 정보 */}
         <div className="flex flex-col gap-3 md:justify-between md:h-[104px]">
            {/* 팀 매치업 + 상태 뱃지 */}
            <div className="flex items-center gap-3 h-7">
               <div className="flex items-center gap-1 text-heading-3-bold text-foreground whitespace-nowrap">
                  <span>{game.awayTeam}</span>
                  <span>vs</span>
                  <span>{game.homeTeam}</span>
               </div>
               <StatusBadge status={status} />
            </div>

            {/* 날짜 & 구장 */}
            <div className="flex items-center gap-4 flex-wrap">
               <div className="flex items-center gap-2 h-5">
                  <CalendarDays className="size-4 text-muted-foreground shrink-0" />
                  <span className="text-body-2-regular text-muted-foreground whitespace-nowrap">
                     {formattedDateTime}
                  </span>
               </div>
               <div className="flex items-center gap-2 h-5">
                  <MapPin className="size-4 text-muted-foreground shrink-0" />
                  <span className="text-body-2-regular text-muted-foreground whitespace-nowrap">{game.venue}</span>
               </div>
            </div>

            {/* 잔여 좌석 */}
            <div className="flex items-center gap-2 h-5">
               <Ticket className="size-5 text-primary shrink-0" />
               <span className="text-body-2-bold text-primary whitespace-nowrap">
                  잔여 {remainingSeats.toLocaleString('ko-KR')}석
               </span>
            </div>
         </div>

         {/* 가격 + 버튼 — 모바일: border-t 구분선 + 가로 배치, 데스크톱: 세로 배치 */}
         <div className="border-t border-border mt-4 pt-[7px] flex items-center justify-between md:border-0 md:mt-0 md:pt-0 md:flex-col md:items-end md:justify-between md:h-[104px]">
            {showPrice ? (
               <div className="flex flex-col md:items-end">
                  <div className="flex items-center gap-2 text-destructive whitespace-nowrap">
                     <span className="text-body-2-regular">최저가</span>
                     <span className="text-heading-1-bold">{formatPrice(game.minPrice)}</span>
                  </div>
                  <span className="text-body-1-medium text-muted-foreground whitespace-nowrap">
                     ~ {formatPrice(game.maxPrice)}
                  </span>
               </div>
            ) : (
               <div />
            )}

            {/* 액션 버튼 */}
            {status === '판매 예정' ? (
               <div className="w-[88px] bg-[#e9ebee] rounded-lg px-4 py-2 flex flex-col items-center justify-center gap-0.5">
                  <p className="text-[16px] font-medium text-[#acb4bb] leading-[1.5] whitespace-nowrap">판매예정</p>
                  <div className="text-[11px] text-[#acb4bb] text-center leading-[1.2]">
                     <p className="whitespace-nowrap">
                        {gameMonth}월 {gameDay}일
                     </p>
                     <p className="whitespace-nowrap">오전 11시 오픈</p>
                  </div>
               </div>
            ) : status === '리셀 예정' ? (
               <div className="w-[88px] border border-[#d0d6db] rounded-lg px-4 py-2 flex flex-col items-center justify-center gap-0.5">
                  <p className="text-[16px] font-medium text-[#acb4bb] leading-[1.5] whitespace-nowrap">리셀예정</p>
                  <div className="text-[11px] text-[#acb4bb] text-center leading-[1.2]">
                     <p className="whitespace-nowrap">정식 예매 오픈</p>
                     <p className="whitespace-nowrap">2시간 후</p>
                  </div>
               </div>
            ) : (
               <button
                  disabled={!isActive}
                  onClick={isActive ? () => onActionClick(game) : undefined}
                  className={cn(
                     'px-[14px] py-[6px] rounded-[8px] text-body-2-medium whitespace-nowrap transition-colors w-[77px]',
                     isActive
                        ? 'bg-primary text-white hover:bg-primary-strong'
                        : 'bg-primary-disabled text-disabled-foreground cursor-not-allowed',
                  )}
               >
                  {buttonLabel}
               </button>
            )}
         </div>
      </div>
   );
}
