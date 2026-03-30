// src/pages/tickets/ui/TicketsPage.tsx

import { useMemo, useState } from 'react';
import { RefreshCw, SlidersHorizontal } from 'lucide-react';

import { useGameSchedules } from '@/entities/game/model/schedule';
import { useBookingEntryFlow } from '@/shared/lib/use-booking-entry-flow';
import { Button } from '@/shared/ui/button';
import { FilterSidebar } from './FilterSidebar';
import { GameCard } from './GameCard';
import { MAX_PRICE } from './constants';
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
   const { openBookingEntry, openResellEntry, bookingGuideDialog } = useBookingEntryFlow();
   const scheduleQuery = useGameSchedules();
   const [activeTab, setActiveTab] = useState<TabType>('예매');
   const [isFilterOpen, setIsFilterOpen] = useState(false);
   /** 마지막 조회 시 적용된 검색어 (결과 없음 문구 분기용) */
   const [appliedSearchQuery, setAppliedSearchQuery] = useState('');
   /** 조회하기 버튼이 한 번이라도 눌렸는지 여부 */
   const [hasApplied, setHasApplied] = useState(false);

   const allGames = useMemo<GameItem[]>(() => {
      return (scheduleQuery.data ?? []).map(game => ({
         id: game.id,
         homeTeamId: game.homeTeamId ?? '',
         serverHomeTeamId: game.serverHomeTeamId,
         stadiumId: game.stadiumId,
         queueTokenJti: game.queueTokenJti,
         leagueType: game.leagueType,
         awayTeam: game.awayTeamFullName,
         homeTeam: game.homeTeamFullName,
         date: game.date,
         dateTime: `${game.date.replace(/-/g, '.')} ${game.time}`,
         venue: game.venue,
         remainingSeats: game.ticket === '매진' ? 0 : 999,
         minPrice: 0,
         maxPrice: 0,
         bookingStatus: game.ticket === '예매하기' ? '예매 가능' : game.ticket === '판매예정' ? '판매 예정' : '매진',
         resellStatus: game.resell === '리셀예매' ? '리셀 가능' : game.resell === '리셀예정' ? '리셀 예정' : '매진',
      }));
   }, [scheduleQuery.data]);

   const [displayedGames, setDisplayedGames] = useState<GameItem[]>([]);

   /** 필터 사이드바에서 조회하기 클릭 시 */
   const handleApply = (filters: FilterState) => {
      setHasApplied(true);
      setActiveTab(filters.tab);
      setAppliedSearchQuery(filters.searchQuery.trim());
      setDisplayedGames(applyFilters(allGames, filters, filters.tab));
      setIsFilterOpen(false);
   };

   const handleRefresh = () => {
      setHasApplied(false);
      setActiveTab('예매');
      setAppliedSearchQuery('');
      setDisplayedGames([]);
   };

   const handleGameActionClick = (game: GameItem) => {
      if (activeTab === '리셀') {
         openResellEntry({
            homeTeamId: game.homeTeamId,
            serverHomeTeamId: game.serverHomeTeamId,
            gameId: game.id,
            stadiumId: game.stadiumId,
            leagueType: game.leagueType,
            gameDate: game.date,
            queueTokenJti: game.queueTokenJti,
            matchTitle: `${game.awayTeam} vs ${game.homeTeam}`,
            venue: game.venue,
            dateTime: game.dateTime,
         });
         return;
      }

      openBookingEntry({
         homeTeamId: game.homeTeamId,
         serverHomeTeamId: game.serverHomeTeamId,
         gameId: game.id,
         stadiumId: game.stadiumId,
         leagueType: game.leagueType,
         gameDate: game.date,
         queueTokenJti: game.queueTokenJti,
         matchTitle: `${game.awayTeam} vs ${game.homeTeam}`,
         venue: game.venue,
         dateTime: game.dateTime,
      });
   };

   const gamesToRender = hasApplied ? displayedGames : allGames;

   return (
      <div className="w-full px-4 py-12.5 pb-30 flex justify-center bg-white min-h-screen">
         <div className="flex items-start justify-between max-w-300 w-full gap-5 h-200">
            {/* 데스크톱 필터 사이드바 */}
            <div className="hidden md:block">
               <FilterSidebar activeTab={activeTab} onApply={handleApply} />
            </div>

            {/* 경기 목록 */}
            <div className="flex flex-1 flex-col gap-5 max-w-210  h-full min-w-0">
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
                     <span className="text-body-2-regular text-muted-foreground">총 {gamesToRender.length}개</span>
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
                  {scheduleQuery.isError ? (
                     <div className="flex items-center justify-center py-20 bg-surface rounded-[14px] h-full text-body-1-medium text-muted-foreground">
                        경기 일정을 불러오지 못했습니다.
                     </div>
                  ) : gamesToRender.length > 0 ? (
                     gamesToRender.map(game => (
                        <GameCard
                           key={game.id}
                           game={game}
                           activeTab={activeTab}
                           onActionClick={handleGameActionClick}
                        />
                     ))
                  ) : (
                     <div className="flex items-center justify-center py-20 bg-surface rounded-[14px] h-full text-body-1-medium text-muted-foreground">
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
