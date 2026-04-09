import { useEffect, useState } from 'react';
import { ChevronLeft, HelpCircle, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getBookingTeamConfig, getBookingTeamId } from '@/pages/books/model/zoneData';
import { useSeatSelectionStore } from '@/entities/seat-selection/model/useSeatSelectionStore';
import { fetchBaseballTeamDetails, fetchGameDetail } from '@/entities/game/api/scheduleApi';
import { formatBookingHeaderDateTime } from '@/shared/lib/bookingDateTime';
import { mergeBookingEntryState, useBookingEntryStore, type BookingEntryState } from '@/shared/lib/useBookingEntryStore';
import { DEFAULT_BOOKING_TIMER_SECONDS, useBookingFlowTimerStore } from '@/shared/lib/useBookingFlowTimerStore';
import { teams } from '@/entities/team/model/teams';
import { releaseQueueSession } from '@/pages/queue/api/queueApi';

import BooksExitDialog from './BooksExitDialog';
import BooksTimeoutDialog from './BooksTimeoutDialog';

const DEFAULT_STEPS = ['구역 선택', '좌석 선택', '배송/주문자 확인', '결제'];
const EXIT_DESTINATIONS = {
   home: '/',
   mypage: '/mypage',
} as const;
const DEFAULT_MATCH_INFO = {
   matchTitle: '기아 vs LG',
   venue: '기아 챔피언스필드',
   dateTime: '3.21 (토) 오후 18:30',
} as const;

type ExitDestinationKey = keyof typeof EXIT_DESTINATIONS;

const VENUE_FALLBACK_TOKENS_BY_TEAM = {
   kia: ['kia', 'kia타이거즈', '기아', '기아타이거즈', '광주'],
   samsung: ['ss', '삼성', '삼성라이온즈', '대구'],
} as const;

const normalizeVenueValue = (value: string) => value.trim().toLowerCase().replace(/\s+/g, '');
const teamNameByServerId = new Map(
   teams
      .filter((team) => team.serverTeamId)
      .map((team) => [team.serverTeamId as string, team.name]),
);

type BookingHeaderGameFallback = {
   matchTitle?: string;
   venue?: string;
   dateTime?: string;
};

const resolveHeaderVenue = ({
   venue,
   fallbackVenue,
   teamId,
   teamDisplayName,
}: {
   venue?: string;
   fallbackVenue?: string;
   teamId?: string;
   teamDisplayName: string;
}) => {
   if (!venue) {
      return fallbackVenue;
   }

   if (!fallbackVenue) {
      return venue;
   }

   const normalizedVenue = normalizeVenueValue(venue);

   if (!normalizedVenue) {
      return fallbackVenue;
   }

   if (normalizedVenue === normalizeVenueValue(fallbackVenue)) {
      return fallbackVenue;
   }

   const bookingTeamId = getBookingTeamId(teamId);
   const fallbackTokens = new Set([
      ...VENUE_FALLBACK_TOKENS_BY_TEAM[bookingTeamId],
      normalizeVenueValue(teamDisplayName),
   ]);

   return fallbackTokens.has(normalizedVenue) ? fallbackVenue : venue;
};

export interface BooksHeaderProps {
   matchTitle?: string;
   venue?: string;
   dateTime?: string;
   steps?: string[];
   currentStepIndex?: number;
   showBackButton?: boolean;
   backAriaLabel?: string;
   onBack?: () => void;
   showTimer?: boolean;
   timerInitialSeconds?: number;
   confirmBeforeExit?: boolean;
}

/**
 * 예매 플로우 전반에서 사용하는 공용 헤더입니다.
 * 단계 표시, 경기 정보, 카운트다운, 이탈 확인 동작을 화면별로 조정할 수 있습니다.
 */
const BooksHeader = ({
   matchTitle,
   venue,
   dateTime,
   steps = DEFAULT_STEPS,
   currentStepIndex,
   showBackButton,
   backAriaLabel = '이전 화면으로 이동',
   onBack,
   showTimer = true,
   timerInitialSeconds = DEFAULT_BOOKING_TIMER_SECONDS,
   confirmBeforeExit = true,
}: BooksHeaderProps = {}) => {
   const navigate = useNavigate();
   const { pathname, state } = useLocation();
   const routeBookingEntryState = state as BookingEntryState | null;
   const storedBookingEntryState = useBookingEntryStore((store) => store.entry);
   const bookingEntryState = mergeBookingEntryState(routeBookingEntryState, storedBookingEntryState);
   const clearBookingEntry = useBookingEntryStore((store) => store.clearEntry);
   const bookingTeamConfig = getBookingTeamConfig(bookingEntryState?.homeTeamId);
   const [bookingEntryGameFallback, setBookingEntryGameFallback] = useState<BookingHeaderGameFallback | null>(null);
   const resolvedCurrentStepIndex = currentStepIndex ?? (pathname.includes('/books/seats/') ? 1 : 0);
   const shouldShowBackButton = showBackButton ?? resolvedCurrentStepIndex > 0;
   const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);
   const [isTimeoutDialogOpen, setIsTimeoutDialogOpen] = useState(false);
   const [exitDestination, setExitDestination] = useState<ExitDestinationKey>('home');
   const [now, setNow] = useState(Date.now());
   const expiresAt = useBookingFlowTimerStore(state => state.expiresAt);
   const ensureTimerStarted = useBookingFlowTimerStore(state => state.ensureTimerStarted);
   const clearTimer = useBookingFlowTimerStore(state => state.clearTimer);
   const clearAllSelections = useSeatSelectionStore(state => state.clearAllSelections);

   useEffect(() => {
      let cancelled = false;

      const loadBookingGameFallback = async () => {
         const gameId = bookingEntryState?.gameId?.trim();

         if (!gameId) {
            setBookingEntryGameFallback(null);
            return;
         }

         if (bookingEntryState?.matchTitle && bookingEntryState?.dateTime) {
            setBookingEntryGameFallback(null);
            return;
         }

         try {
            const game = await fetchGameDetail(gameId);
            const teamDetails = await fetchBaseballTeamDetails([game.homeTeamId, game.awayTeamId]);
            const homeTeamName =
               teamNameByServerId.get(game.homeTeamId) ?? teamDetails.get(game.homeTeamId)?.teamName;
            const awayTeamName =
               teamNameByServerId.get(game.awayTeamId) ?? teamDetails.get(game.awayTeamId)?.teamName;
            const homeTeam = teams.find((team) => team.serverTeamId === game.homeTeamId);

            if (cancelled) {
               return;
            }

            setBookingEntryGameFallback({
               matchTitle: awayTeamName && homeTeamName ? `${awayTeamName} vs ${homeTeamName}` : undefined,
               venue: bookingEntryState?.venue ?? homeTeam?.stadiumName,
               dateTime: game.startAt,
            });
         } catch {
            if (!cancelled) {
               setBookingEntryGameFallback(null);
            }
         }
      };

      void loadBookingGameFallback();

      return () => {
         cancelled = true;
      };
   }, [bookingEntryState?.dateTime, bookingEntryState?.gameId, bookingEntryState?.matchTitle, bookingEntryState?.venue]);

   useEffect(() => {
      if (!showTimer) {
         return;
      }

      ensureTimerStarted(timerInitialSeconds);
   }, [ensureTimerStarted, showTimer, timerInitialSeconds]);

   useEffect(() => {
      if (!showTimer || expiresAt === null) {
         return;
      }

      const intervalId = window.setInterval(() => {
         setNow(Date.now());
      }, 1000);

      return () => {
         window.clearInterval(intervalId);
      };
   }, [expiresAt, showTimer]);

   const remainingSeconds =
      showTimer && expiresAt !== null ? Math.max(0, Math.ceil((expiresAt - now) / 1000)) : timerInitialSeconds;
   const mm = String(Math.floor(remainingSeconds / 60)).padStart(2, '0');
   const ss = String(remainingSeconds % 60).padStart(2, '0');
   const timeStr = `${mm}:${ss}`;
   const currentStepLabel = steps[resolvedCurrentStepIndex] ?? '';
   const resolvedMatchTitle =
      matchTitle ??
      bookingEntryState?.matchTitle ??
      bookingEntryGameFallback?.matchTitle ??
      `${bookingTeamConfig.displayName} 홈경기`;
   const resolvedVenue = resolveHeaderVenue({
      venue: venue ?? bookingEntryState?.venue ?? bookingEntryGameFallback?.venue,
      fallbackVenue: bookingTeamConfig.stadiumName,
      teamId: bookingEntryState?.homeTeamId,
      teamDisplayName: bookingTeamConfig.displayName,
   });
   const resolvedDateTime = formatBookingHeaderDateTime(
      dateTime ?? bookingEntryState?.dateTime ?? bookingEntryGameFallback?.dateTime ?? DEFAULT_MATCH_INFO.dateTime,
   );

   useEffect(() => {
      if (!showTimer || expiresAt === null || remainingSeconds > 0) {
         return;
      }

      clearAllSelections();
      setIsTimeoutDialogOpen(true);
   }, [clearAllSelections, expiresAt, remainingSeconds, showTimer]);

   const openExitDialog = (destination: ExitDestinationKey) => {
      if (isTimeoutDialogOpen) {
         return;
      }

      if (!confirmBeforeExit) {
         void (async () => {
            clearTimer();
            await releaseQueueSession(bookingEntryState?.gameId);
            clearBookingEntry();
            navigate(EXIT_DESTINATIONS[destination]);
         })();
         return;
      }

      setExitDestination(destination);
      setIsExitDialogOpen(true);
   };

   return (
      <>
         <BooksExitDialog
            open={isExitDialogOpen}
            onOpenChange={setIsExitDialogOpen}
            onConfirm={() => {
               setIsExitDialogOpen(false);
               void (async () => {
                  clearTimer();
                  await releaseQueueSession(bookingEntryState?.gameId);
                  clearBookingEntry();
                  navigate(EXIT_DESTINATIONS[exitDestination]);
               })();
            }}
         />
         <BooksTimeoutDialog
            open={isTimeoutDialogOpen}
            onConfirm={() => {
               setIsTimeoutDialogOpen(false);
               void (async () => {
                  clearTimer();
                  await releaseQueueSession(bookingEntryState?.gameId);
                  clearBookingEntry();
                  navigate('/');
               })();
            }}
         />

         <header className="border-b border-border-light bg-background">
            <div className="lg:hidden">
               <div className="relative flex items-center justify-between px-3 py-2">
                  <div className="flex w-10 justify-start">
                     {shouldShowBackButton ? (
                        <button
                           type="button"
                           aria-label={backAriaLabel}
                           onClick={() => {
                              if (onBack) {
                                 onBack();
                                 return;
                              }

                              navigate(-1);
                           }}
                           className="inline-flex h-8 w-8 items-center justify-center rounded-md text-icon-secondary"
                        >
                           <ChevronLeft className="h-6 w-6" aria-hidden="true" />
                        </button>
                     ) : null}
                  </div>
                  <h1 className="absolute left-1/2 -translate-x-1/2 text-heading-4-bold text-foreground">
                     {currentStepLabel}
                  </h1>
                  <div className="flex w-10 justify-end">
                     {showTimer ? <span className="text-body-1-bold text-primary">{timeStr}</span> : null}
                  </div>
               </div>

               <div className="border-b border-border-light px-5 py-[9px]">
                  <p className="text-body-1-bold text-foreground">{resolvedMatchTitle}</p>
                  <div className="flex flex-wrap items-center gap-1 text-caption-1-medium text-secondary">
                     <span>{resolvedVenue}</span>
                     <span aria-hidden="true">∙</span>
                     <span>{resolvedDateTime}</span>
                  </div>
               </div>
            </div>

            <div className="hidden h-16 items-center justify-between px-4 lg:flex lg:h-[68px] lg:px-8">
               <button
                  type="button"
                  className="inline-flex items-center"
                  onClick={() => openExitDialog('home')}
                  aria-label="GO-TI 홈으로 이동"
               >
                  <img src="/Logo/logo.svg" alt="GO-TI" className="h-6 w-auto" />
               </button>
               <div className="flex items-center gap-5">
                  {showTimer ? (
                     <div className="group relative flex items-center gap-1 text-heading-4-medium text-muted-foreground">
                        <span>예매 시간</span>
                        <span className="text-heading-4-bold text-primary">{timeStr}</span>
                        <button
                           type="button"
                           className="inline-flex h-4 w-4 items-center justify-center text-icon-secondary"
                           aria-label="예매 시간 안내"
                        >
                           <HelpCircle className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <div className="absolute right-0 top-7 z-10 hidden w-[230px] rounded-lg bg-fill-inverse p-3 text-caption-1-medium text-white shadow-lg group-hover:block group-focus-within:block">
                           시간이 종료되면 해당 화면에서 나가게 되며, 처음부터 다시 진행해야 합니다.
                        </div>
                     </div>
                  ) : null}
                  <button
                     type="button"
                     aria-label="마이페이지"
                     onClick={() => openExitDialog('mypage')}
                     className="inline-flex h-8 w-8 items-center justify-center rounded-md text-icon-secondary"
                  >
                     <User className="h-5 w-5" aria-hidden="true" />
                  </button>
               </div>
            </div>

            <div className="hidden flex-col gap-4 border-t border-border-light px-4 py-4 lg:flex lg:h-[72px] lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:px-8 lg:py-0">
               <div className="flex flex-wrap items-center gap-2 text-body-1-medium text-muted-foreground">
                  {shouldShowBackButton ? (
                     <button
                        type="button"
                        aria-label={backAriaLabel}
                        onClick={() => {
                           if (onBack) {
                              onBack();
                              return;
                           }

                           navigate(-1);
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-icon-secondary transition-colors hover:bg-fill-hover"
                     >
                        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                     </button>
                  ) : null}
                  <h1 className="mr-2 text-heading-2-bold text-foreground">{resolvedMatchTitle}</h1>
                  <span>{resolvedVenue}</span>
                  <span aria-hidden="true">∙</span>
                  <span>{resolvedDateTime}</span>
               </div>
               <ol className="flex flex-wrap items-center gap-1 lg:gap-2" aria-label="예매 진행 단계">
                  {steps.map((step, index) => {
                     const isCurrent = index === resolvedCurrentStepIndex;

                     return (
                        <li key={step} className="flex items-center gap-1 lg:gap-2">
                           <span
                              className={[
                                 'rounded-full px-3 py-1 text-label-2-medium',
                                 isCurrent ? 'text-label-2-semibold text-muted-foreground' : 'text-disabled-foreground',
                              ].join(' ')}
                              aria-current={isCurrent ? 'step' : undefined}
                           >
                              {step}
                           </span>
                           {index < steps.length - 1 ? (
                              <span className="text-body-1-bold text-border" aria-hidden="true">
                                 ›
                              </span>
                           ) : null}
                        </li>
                     );
                  })}
               </ol>
            </div>
         </header>
      </>
   );
};

export default BooksHeader;
