// src/pages/tickets/ui/TicketsPage.tsx

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';

import { FilterSidebar } from './FilterSidebar';
import { GameCard } from './GameCard';
import { MOCK_GAMES } from './constants';
import type { FilterState, GameItem, TabType } from './types';

function applyFilters(games: GameItem[], filters: FilterState, activeTab: TabType): GameItem[] {
   return games.filter(game => {
      const status = activeTab === '예매' ? game.bookingStatus : game.resellStatus;

      if (!filters.showUpcoming && (status === '오픈 예정' || status === '리셀 예정')) return false;
      if (!filters.showSoldOut && status === '매진') return false;
      if (filters.venue && game.venue !== filters.venue) return false;
      if (filters.minPrice > 0 && game.minPrice < filters.minPrice) return false;
      if (filters.maxPrice < 1_000_000 && game.maxPrice > filters.maxPrice) return false;

      if (filters.searchQuery) {
         const q = filters.searchQuery.toLowerCase();
         const matches = game.awayTeam.toLowerCase().includes(q) || game.homeTeam.toLowerCase().includes(q);
         if (!matches) return false;
      }

      return true;
   });
}

const TicketsPage = () => {
   const [activeTab, setActiveTab] = useState<TabType>('예매');
   const [displayedGames, setDisplayedGames] = useState<GameItem[]>(MOCK_GAMES);

   const handleApply = (filters: FilterState) => {
      setDisplayedGames(applyFilters(MOCK_GAMES, filters, activeTab));
   };

   const handleRefresh = () => {
      setDisplayedGames(MOCK_GAMES);
   };

   return (
      <div className="w-full px-4 py-12.5 pb-30 flex justify-center bg-white">
         <div className="flex items-start justify-between max-w-300 w-full">
            {/* 필터 사이드바 */}
            <FilterSidebar activeTab={activeTab} onTabChange={setActiveTab} onApply={handleApply} />

            {/* 경기 목록 */}
            <div className="flex flex-1 flex-col gap-4 max-w-210 min-w-0">
               {/* 헤더 */}
               <div className="flex items-center justify-between h-8">
                  <h2 className="text-heading-1-bold text-foreground">경기일정</h2>
                  <div className="flex items-center gap-4">
                     <span className="text-body-2-regular text-muted-foreground">총 {displayedGames.length}개</span>
                     <button
                        onClick={handleRefresh}
                        className="flex items-center gap-2 bg-background border border-[rgba(0,0,0,0.1)] rounded-lg px-2.5 py-1.5 text-body-2-medium text-foreground h-8 hover:bg-surface transition-colors"
                     >
                        <RefreshCw className="size-4" />
                        새로고침
                     </button>
                  </div>
               </div>

               {/* 게임 카드 목록 */}
               <div className="flex flex-col gap-4">
                  {displayedGames.length > 0 ? (
                     displayedGames.map(game => <GameCard key={game.id} game={game} activeTab={activeTab} />)
                  ) : (
                     <div className="flex items-center justify-center h-40 bg-surface rounded-[14px] text-body-1-medium text-muted-foreground">
                        조건에 맞는 경기가 없습니다.
                     </div>
                  )}
               </div>
            </div>
         </div>
      </div>
   );
};

export default TicketsPage;
