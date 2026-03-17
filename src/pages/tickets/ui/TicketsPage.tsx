// src/pages/tickets/ui/TicketsPage.tsx

import { useState } from 'react';
import { RefreshCw, SlidersHorizontal } from 'lucide-react';

import { useBookingEntryFlow } from '@/shared/lib/use-booking-entry-flow';
import { Button } from '@/shared/ui/button';
import { FilterSidebar } from './FilterSidebar';
import { GameCard } from './GameCard';
import { MOCK_GAMES, MAX_PRICE } from './constants';
import type { FilterState, GameItem, TabType } from './types';

function applyFilters(games: GameItem[], filters: FilterState, activeTab: TabType): GameItem[] {
   return games.filter(game => {
      const status = activeTab === '예매' ? game.bookingStatus : game.resellStatus;

      if (!filters.showUpcoming && (status === '판매 예정' || status === '리셀 예정')) return false;
      if (!filters.showSoldOut && status === '매진') return false;
      if (filters.dateTime && game.date !== filters.dateTime) return false;
      if (filters.venue && game.venue !== filters.venue) return false;
      if (filters.minPrice > 0 && game.minPrice < filters.minPrice) return false;
      if (filters.maxPrice < MAX_PRICE && game.maxPrice > filters.maxPrice) return false;

      // 공백 제거 후 2자 이상일 때만 검색 적용
      const trimmedQuery = filters.searchQuery.trim();
      if (trimmedQuery.length >= 2) {
         const q = trimmedQuery.toLowerCase();
         const matches = game.awayTeam.toLowerCase().includes(q) || game.homeTeam.toLowerCase().includes(q);
         if (!matches) return false;
      }

      return true;
   });
}

const TicketsPage = () => {
   const { openBookingEntry, bookingGuideDialog } = useBookingEntryFlow();
   const [activeTab, setActiveTab] = useState<TabType>('예매');
   const [displayedGames, setDisplayedGames] = useState<GameItem[]>(MOCK_GAMES);
   const [isFilterOpen, setIsFilterOpen] = useState(false);
   /** 마지막 조회 시 적용된 검색어 (결과 없음 문구 분기용) */
   const [appliedSearchQuery, setAppliedSearchQuery] = useState('');

   /** 필터 사이드바에서 조회하기 클릭 시 */
   const handleApply = (filters: FilterState) => {
      setActiveTab(filters.tab);
      setAppliedSearchQuery(filters.searchQuery.trim());
      setDisplayedGames(applyFilters(MOCK_GAMES, filters, filters.tab));
      setIsFilterOpen(false);
   };

   const handleRefresh = () => {
      setActiveTab('예매');
      setAppliedSearchQuery('');
      setDisplayedGames(MOCK_GAMES);
   };

   return (
      <div className="w-full px-4 py-12.5 pb-30 flex justify-center bg-white h-full">
         <div className="flex items-start justify-between max-w-300 w-full gap-5 ">
            {/* 데스크톱 필터 사이드바 */}
            <div className="hidden md:block">
               <FilterSidebar activeTab={activeTab} onApply={handleApply} />
            </div>

            {/* 경기 목록 */}
            <div className="flex flex-1 flex-col gap-5 max-w-210 min-w-0 h-full">
               {/* 모바일 전용: 예매/리셀 토글 + 필터 버튼 */}
               <div className="md:hidden flex flex-col gap-3">
                  <Button
                     variant="tertiary"
                     size="sm"
                     onClick={() => setIsFilterOpen(true)}
                     className="w-full gap-2 px-6 py-3"
                  >
                     <SlidersHorizontal className="size-5" />
                     필터
                  </Button>
               </div>

               {/* 헤더 */}
               <div className="flex items-center justify-between h-8 ">
                  <h2 className="text-heading-1-bold text-foreground">경기일정</h2>
                  <div className="flex items-center gap-4">
                     <span className="text-body-2-regular text-muted-foreground">총 {displayedGames.length}개</span>
                     <button
                        onClick={handleRefresh}
                        className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-1 text-body-2-medium text-foreground h-8 hover:bg-surface transition-colors"
                     >
                        <RefreshCw className="size-4" />
                        새로고침
                     </button>
                  </div>
               </div>

               {/* 게임 카드 목록 */}
               <div className="flex flex-col gap-4 h-full">
                  {displayedGames.length > 0 ? (
                     displayedGames.map(game => (
                        <GameCard key={game.id} game={game} activeTab={activeTab} onBookingClick={openBookingEntry} />
                     ))
                  ) : (
                     <div className="flex items-center justify-center h-full bg-surface rounded-[14px] text-body-1-medium text-muted-foreground">
                        {appliedSearchQuery.length >= 2 ? '해당 데이터가 없습니다' : '조건에 맞는 경기가 없습니다.'}
                     </div>
                  )}
               </div>
            </div>
         </div>
         {bookingGuideDialog}

         {/* 모바일 필터 바텀시트 */}
         {isFilterOpen && (
            <div className="md:hidden fixed inset-0 z-50 w-full">
               <div className="absolute inset-0 bg-black/50 w-full" onClick={() => setIsFilterOpen(false)} />
               <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[14px] p-6 max-h-[90vh] overflow-y-auto w-full">
                  <FilterSidebar
                     activeTab={activeTab}
                     onApply={handleApply}
                     className="border-0 rounded-none p-0 self-auto w-full"
                     sheetMode
                  />
               </div>
            </div>
         )}
      </div>
   );
};

export default TicketsPage;
