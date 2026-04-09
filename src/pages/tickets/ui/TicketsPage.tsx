import { useEffect, useMemo, useRef, useState } from 'react';
import { RefreshCw, SlidersHorizontal } from 'lucide-react';

import { useGameSchedules } from '@/entities/game/model/schedule';
import type { ResaleGameStatus } from '@/entities/resale/api/resaleApi';
import { useResaleGameCounts } from '@/entities/resale/model/useResaleGameCounts';
import { useResaleGameStatuses } from '@/entities/resale/model/useResaleGameStatuses';
import { useResaleListingMarket } from '@/entities/resale/model/useResaleListingMarket';
import { useBookingEntryFlow } from '@/shared/lib/use-booking-entry-flow';
import { Button } from '@/shared/ui/button';
import { FilterSidebar } from './FilterSidebar';
import { GameCard } from './GameCard';
import { MAX_PRICE } from './constants';
import type { FilterState, GameItem, ResellStatus, TabType } from './types';

const DEFAULT_FILTERS: FilterState = {
   tab: '예매',
   showUpcoming: true,
   showSoldOut: true,
   dateTime: '',
   minPrice: 0,
   maxPrice: MAX_PRICE,
   venue: '',
   searchQuery: '',
};

const PAGE_SIZE = 8;

function applyFilters(games: GameItem[], filters: FilterState, activeTab: TabType): GameItem[] {
   return games.filter((game) => {
      const status = activeTab === '예매' ? game.bookingStatus : game.resellStatus;

      if (!filters.showUpcoming && (status === '판매 예정' || status === '리셀 예정')) return false;
      if (!filters.showSoldOut && status === '매진') return false;
      if (filters.dateTime && game.date !== filters.dateTime) return false;
      if (filters.venue && game.venue !== filters.venue) return false;
      if (filters.minPrice > 0 && game.minPrice > 0 && game.minPrice < filters.minPrice) return false;
      if (filters.maxPrice < MAX_PRICE && game.maxPrice > 0 && game.maxPrice > filters.maxPrice) return false;

      const trimmedQuery = filters.searchQuery.trim();
      if (trimmedQuery.length >= 2) {
         const q = trimmedQuery.toLowerCase();
         const matches = game.awayTeam.toLowerCase().includes(q) || game.homeTeam.toLowerCase().includes(q);
         if (!matches) return false;
      }

      return true;
   });
}

function getResellStatus(
   resaleStatus: ResaleGameStatus | undefined,
   resaleCount: number | undefined,
   fallbackStatus: ResellStatus,
): ResellStatus {
   switch (resaleStatus) {
      case 'SCHEDULED':
         return '리셀 예정';
      case 'AVAILABLE':
         return typeof resaleCount === 'number' && resaleCount > 0 ? '리셀 가능' : '매진';
      case 'UNAVAILABLE':
         return '매진';
      default:
         if (typeof resaleCount === 'number') {
            return resaleCount > 0 ? '리셀 가능' : '매진';
         }

         return fallbackStatus;
   }
}

const TicketsPage = () => {
   const { openBookingEntry, openResellEntry, bookingGuideDialog } = useBookingEntryFlow();
   const scheduleQuery = useGameSchedules();
   const [isFilterOpen, setIsFilterOpen] = useState(false);
   const [appliedFilters, setAppliedFilters] = useState<FilterState>(DEFAULT_FILTERS);
   const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
   const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);
   const activeTab: TabType = appliedFilters.tab;
   const isResellTab = activeTab === '리셀';

   const baseGames = useMemo<GameItem[]>(() => {
      return (scheduleQuery.data ?? [])
         .filter((game) => game.status === '예정')
         .map((game) => {
            const fallbackResellStatus =
               game.resell === '리셀예매' ? '리셀 가능' : game.resell === '리셀예정' ? '리셀 예정' : '매진';

            return {
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
               remainingSeats:
                  game.ticket === '판매예정'
                     ? 25000
                     : game.ticket === '매진'
                       ? 0
                       : game.remainingSeatCount,
               resellRemainingSeats: fallbackResellStatus === '리셀 가능' ? 999 : 0,
               minPrice: 0,
               maxPrice: 0,
               bookingStatus: game.ticket === '예매하기' ? '예매 가능' : game.ticket === '판매예정' ? '판매 예정' : '매진',
               resellStatus: fallbackResellStatus,
            };
         });
   }, [scheduleQuery.data]);

   const filteredGames = useMemo(
      () => applyFilters(baseGames, appliedFilters, activeTab),
      [activeTab, appliedFilters, baseGames],
   );
   const visibleGames = useMemo(() => filteredGames.slice(0, visibleCount), [filteredGames, visibleCount]);
   const hasMoreGames = visibleCount < filteredGames.length;
   const visibleGameIds = useMemo(() => visibleGames.map((game) => game.id), [visibleGames]);
   const resaleCountsQuery = useResaleGameCounts(visibleGameIds, isResellTab);
   const resaleStatusesQuery = useResaleGameStatuses(visibleGameIds, isResellTab);
   const resaleListingMarketQuery = useResaleListingMarket(visibleGameIds, isResellTab);
   const gamesToRender = useMemo(
      () =>
         visibleGames.map((game) => {
            const fallbackResellStatus =
               game.resellStatus === '리셀 가능' ? '리셀 가능' : game.resellStatus === '리셀 예정' ? '리셀 예정' : '매진';
            const resaleMarket = resaleListingMarketQuery.data?.get(game.id);
            const resaleCount = resaleCountsQuery.data?.get(game.id) ?? resaleMarket?.count;
            const resaleStatus = resaleStatusesQuery.data?.get(game.id);

            return {
               ...game,
               resellRemainingSeats: resaleCount ?? game.resellRemainingSeats,
               minPrice: resaleMarket?.minPrice ?? game.minPrice,
               maxPrice: resaleMarket?.maxPrice ?? game.maxPrice,
               resellStatus: getResellStatus(resaleStatus, resaleCount, fallbackResellStatus),
            };
         }),
      [resaleCountsQuery.data, resaleListingMarketQuery.data, resaleStatusesQuery.data, visibleGames],
   );
   const appliedSearchQuery = appliedFilters.searchQuery.trim();

   useEffect(() => {
      setVisibleCount(PAGE_SIZE);
   }, [appliedFilters]);

   useEffect(() => {
      const trigger = loadMoreTriggerRef.current;

      if (!trigger || !hasMoreGames) {
         return;
      }

      const observer = new IntersectionObserver(
         (entries) => {
            const [entry] = entries;

            if (!entry?.isIntersecting) {
               return;
            }

            setVisibleCount((current) => Math.min(current + PAGE_SIZE, filteredGames.length));
         },
         {
            rootMargin: '240px 0px',
         },
      );

      observer.observe(trigger);

      return () => {
         observer.disconnect();
      };
   }, [filteredGames.length, hasMoreGames]);

   const handleApply = (filters: FilterState) => {
      setAppliedFilters(filters);
      setIsFilterOpen(false);
   };

   const handleRefresh = () => {
      setAppliedFilters(DEFAULT_FILTERS);
      void scheduleQuery.refetch();
      void resaleCountsQuery.refetch();
      void resaleStatusesQuery.refetch();
      void resaleListingMarketQuery.refetch();
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

   return (
      <div className="w-full px-4 py-12.5 pb-30 flex justify-center bg-white flex-1">
         <div className="flex items-start justify-between max-w-300 w-full gap-5 ">
            <div className="hidden md:block">
               <FilterSidebar activeTab={activeTab} filters={appliedFilters} onApply={handleApply} />
            </div>

            <div className="flex flex-1 flex-col gap-5 max-w-210 min-w-0 h-full">
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

               <div className="flex items-center justify-between h-8 ">
                  <h2 className="text-heading-1-bold text-foreground">경기일정</h2>
                  <div className="flex items-center gap-4">
                     <span className="text-body-2-regular text-muted-foreground">총 {filteredGames.length}개</span>
                     <button
                        onClick={handleRefresh}
                        className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-1 text-body-2-medium text-foreground h-8 hover:bg-surface transition-colors"
                     >
                        <RefreshCw className="size-4" />
                        새로고침
                     </button>
                  </div>
               </div>

               <div className="flex flex-col gap-4 h-full">
                  {scheduleQuery.isError ? (
                     <div className="flex items-center justify-center py-20 bg-surface rounded-[14px] h-full text-body-1-medium text-muted-foreground">
                        경기 일정을 불러오지 못했습니다.
                     </div>
                  ) : gamesToRender.length > 0 ? (
                     <>
                        {gamesToRender.map((game) => (
                           <GameCard key={game.id} game={game} activeTab={activeTab} onActionClick={handleGameActionClick} />
                        ))}
                        {hasMoreGames ? <div ref={loadMoreTriggerRef} className="h-1 w-full" aria-hidden="true" /> : null}
                     </>
                  ) : (
                     <div className="flex items-center justify-center py-20 bg-surface rounded-[14px] h-full text-body-1-medium text-muted-foreground">
                        {appliedSearchQuery.length >= 2 ? '해당 데이터가 없습니다' : '조건에 맞는 경기가 없습니다.'}
                     </div>
                  )}
               </div>
            </div>
         </div>
         {bookingGuideDialog}

         {isFilterOpen && (
            <div className="md:hidden fixed inset-0 z-50 w-full">
               <div className="absolute inset-0 bg-black/50 w-full" onClick={() => setIsFilterOpen(false)} />
               <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[14px] p-6 max-h-[90vh] overflow-y-auto w-full">
                  <FilterSidebar
                     activeTab={activeTab}
                     filters={appliedFilters}
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
