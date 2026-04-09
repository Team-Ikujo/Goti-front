import { TicketX } from 'lucide-react';

import { useBookingEntryFlow } from '@/shared/lib/use-booking-entry-flow';
import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';
import { TAB_TODAY, TEAM_IDS, statusColor, teamLogos } from './constants';
import type { DaySchedule, GameRow } from './types';
import { getEffectiveSaleStatuses, getGameResultTexts } from './utils';

const VENUE_REGION_LABELS: Record<string, string> = {
   '기아 챔피언스필드': '광주',
   '광주 기아 챔피언스 필드': '광주',
   '대구 삼성 라이온즈 파크': '대구',
   '대구 삼성라이온즈파크': '대구',
   '잠실 야구장': '잠실',
   '사직 야구장': '사직',
   '창원 NC파크': '창원',
   '고척 스카이돔': '고척',
   '수원 KT위즈파크': '수원',
   '대전 한화생명 볼파크': '대전',
   '인천 SSG 랜더스필드': '인천',
};

const toVenueRegionLabel = (venue: string) => {
   return VENUE_REGION_LABELS[venue] ?? venue;
};

function ScoreDisplay({ game }: { game: GameRow }) {
   const scoreText = game.score ?? 'VS';

   if (game.status === '종료' && game.score) {
      const [awayScore, homeScore] = game.score.split(':').map(Number);
      const awayLost = awayScore < homeScore;

      return (
         <span className="text-[24px] font-bold text-center leading-[1.5] whitespace-nowrap text-[#ef4444]">
            <span className={awayLost ? 'text-[#acb4bb]' : ''}>{awayScore}:</span>
            <span className={!awayLost ? 'text-[#acb4bb]' : ''}>{homeScore}</span>
         </span>
      );
   }

   return (
      <span className="text-[24px] font-bold text-(--text-primary) text-center leading-[1.5] whitespace-nowrap">
         {scoreText}
      </span>
   );
}

function MobileScoreDisplay({ game }: { game: GameRow }) {
   const scoreText = game.score ?? 'VS';

   if (game.status === '종료' && game.score) {
      const [awayScore, homeScore] = game.score.split(':').map(Number);
      const awayLost = awayScore < homeScore;

      return (
         <span className="text-[20px] font-bold text-center leading-[1.5] whitespace-nowrap text-[#ef4444]">
            <span className={awayLost ? 'text-[#acb4bb]' : ''}>{awayScore}:</span>
            <span className={!awayLost ? 'text-[#acb4bb]' : ''}>{homeScore}</span>
         </span>
      );
   }

   return (
      <span className="text-[20px] font-bold text-(--text-primary) text-center leading-[1.5] whitespace-nowrap">
         {scoreText}
      </span>
   );
}

function EmptyState() {
   return (
      <div className="bg-[#f7f8f9] flex h-[400px] items-center justify-center overflow-hidden px-5 py-[100px] rounded-[10px] w-full">
         <div className="flex flex-col gap-[10px] items-center justify-center">
            <TicketX className="size-[75px] text-[#acb4bb]" strokeWidth={1.2} />
            <p className="text-[22px] font-semibold text-[#646f7c] text-center leading-[1.55]">
               현재 예매 가능한 경기가 없습니다.
            </p>
         </div>
      </div>
   );
}

function TeamName({
   name,
   isEnded,
   result,
   textDisabled,
}: {
   name: string;
   isEnded: boolean;
   result: string;
   textDisabled: string;
}) {
   if (isEnded) {
      return (
         <div className="flex flex-col items-center shrink-0">
            <span className={cn('text-[20px] font-semibold text-center leading-[1.5] whitespace-nowrap', textDisabled)}>
               {name}
            </span>
            <span className="text-[12px] font-medium text-(--text-tertiary) leading-[1.5]">{result}</span>
         </div>
      );
   }

   return (
      <div className="flex h-full items-center justify-center shrink-0">
         <span className="text-[20px] font-semibold text-center leading-[1.5] whitespace-nowrap text-(--text-primary)">
            {name}
         </span>
      </div>
   );
}

function MobileTeam({
   name,
   isEnded,
   result,
   isHome,
}: {
   name: string;
   isEnded: boolean;
   result: string;
   isHome: boolean;
}) {
   const textClass = isEnded ? 'text-[#acb4bb]' : 'text-(--text-primary)';

   if (isHome) {
      return (
         <div className="flex items-center gap-[8px] shrink-0">
            {isEnded && <span className="text-[12px] font-normal text-[#acb4bb] leading-[1.5]">{result}</span>}
            <span className={cn('text-[16px] font-semibold text-center leading-[1.5] whitespace-nowrap', textClass)}>
               {name}
            </span>
            <div className="relative size-[48px] shrink-0">
               <img
                  src={teamLogos[name]}
                  alt={name}
                  className={cn('size-full object-contain', isEnded && 'opacity-50')}
               />
               <div className="absolute bg-[#acb4bb] bottom-0 -right-1 h-[15px] rounded-[4px] w-[17px] flex items-center justify-center">
                  <span className="text-white text-[10px] leading-[1.5]">홈</span>
               </div>
            </div>
         </div>
      );
   }

   return (
      <div className="flex items-center gap-[8px] shrink-0">
         <img
            src={teamLogos[name]}
            alt={name}
            className={cn('size-[48px] object-contain shrink-0', isEnded && 'opacity-50')}
         />
         <span className={cn('text-[16px] font-semibold text-center leading-[1.5] whitespace-nowrap', textClass)}>
            {name}
         </span>
         {isEnded && <span className="text-[12px] font-normal text-[#acb4bb] leading-[1.5]">{result}</span>}
      </div>
   );
}

function ActionButtons({
   game,
   isEnded,
   onOpenBookingFlow,
   onOpenResellFlow,
}: {
   game: GameRow;
   isEnded: boolean;
   onOpenBookingFlow: (game: GameRow) => void;
   onOpenResellFlow: (game: GameRow) => void;
}) {
   const { effectiveTicket, effectiveResell, ticketInfo, reselInfo } = getEffectiveSaleStatuses(game);
   const hasRemainingSeats = game.remainingSeatCount === undefined || game.remainingSeatCount > 0;

   const canBook = effectiveTicket === '예매하기' && hasRemainingSeats;
   const canResellBook = effectiveResell === '리셀예매';
   const isTicketScheduled = effectiveTicket === '판매예정';
   const isResellScheduled = effectiveResell === '리셀예정';

   // 서브텍스트 두 줄 분리
   const [ticketInfoLine1, ticketInfoLine2] = (ticketInfo ?? '').split('\n');
   const [reselInfoLine1, reselInfoLine2] = (reselInfo ?? '').split('\n');

   return (
      <>
         {!isEnded && (
            <div className="flex md:hidden gap-2 items-stretch w-full">
               {/* 예매 버튼 — 모바일 */}
               {isTicketScheduled ? (
                  <div className="flex-1 bg-[#e9ebee] rounded-lg px-4 py-2 flex flex-col items-center justify-center gap-0.5">
                     <p className="text-[14px] font-medium text-[#acb4bb] leading-[1.5] whitespace-nowrap">판매예정</p>
                     <div className="text-[11px] text-[#acb4bb] text-center leading-[1.2]">
                        <p className="whitespace-nowrap">{ticketInfoLine1}</p>
                        <p className="whitespace-nowrap">{ticketInfoLine2}</p>
                     </div>
                  </div>
               ) : (
                  <button
                     type="button"
                     disabled={!canBook}
                     onClick={() => onOpenBookingFlow(game)}
                     className={cn(
                        'h-[38px] flex-1 px-4 py-2 rounded-lg text-[14px] font-medium leading-[1.5] text-white',
                        canBook ? 'bg-primary' : 'bg-[#acb4bb] cursor-not-allowed',
                     )}
                  >
                     {effectiveTicket}
                  </button>
               )}
               {/* 리셀 버튼 — 모바일 */}
               {isResellScheduled ? (
                  <div className="flex-1 border border-[#d0d6db] rounded-lg px-4 py-2 flex flex-col items-center justify-center gap-0.5">
                     <p className="text-[14px] font-medium text-[#acb4bb] leading-[1.5] whitespace-nowrap">리셀예정</p>
                     <div className="text-[11px] text-[#acb4bb] text-center leading-[1.2]">
                        <p className="whitespace-nowrap">{reselInfoLine1}</p>
                        <p className="whitespace-nowrap">{reselInfoLine2}</p>
                     </div>
                  </div>
               ) : (
                  <button
                     type="button"
                     disabled={!canResellBook}
                     onClick={() => onOpenResellFlow(game)}
                     className={cn(
                        'h-[38px] flex-1 px-4 py-2 rounded-lg text-[14px] font-medium leading-[1.5] border',
                        canResellBook
                           ? 'bg-background border-primary text-primary'
                           : 'bg-background border-[#acb4bb] text-[#acb4bb] cursor-not-allowed',
                     )}
                  >
                     {effectiveResell}
                  </button>
               )}
            </div>
         )}

         <div className={cn('hidden md:flex gap-2.5 items-stretch shrink-0', isEnded && 'opacity-0')}>
            {/* 예매 버튼 — 데스크톱 */}
            {isTicketScheduled ? (
               <div className="w-[88px] bg-[#e9ebee] rounded-md px-4 py-2 flex flex-col items-center justify-center gap-0.5">
                  <p className="text-[16px] font-medium text-[#acb4bb] leading-[1.5] whitespace-nowrap">판매예정</p>
                  <div className="text-[11px] text-[#acb4bb] text-center leading-[1.2]">
                     <p className="whitespace-nowrap">{ticketInfoLine1}</p>
                     <p className="whitespace-nowrap">{ticketInfoLine2}</p>
                  </div>
               </div>
            ) : (
               <button
                  type="button"
                  disabled={!canBook}
                  onClick={() => onOpenBookingFlow(game)}
                  className={cn(
                     'h-[66px] px-4 py-2 rounded-md text-[16px] font-medium leading-[1.5] text-white',
                     canBook ? 'bg-primary' : 'bg-[#acb4bb] w-[88px] cursor-not-allowed',
                  )}
               >
                  {effectiveTicket}
               </button>
            )}
            {/* 리셀 버튼 — 데스크톱 */}
            {isResellScheduled ? (
               <div className="w-[88px] border border-[#d0d6db] rounded-md px-4 py-2 flex flex-col items-center justify-center gap-0.5">
                  <p className="text-[16px] font-medium text-[#acb4bb] leading-[1.5] whitespace-nowrap">리셀예정</p>
                  <div className="text-[11px] text-[#acb4bb] text-center leading-[1.2]">
                     <p className="whitespace-nowrap">{reselInfoLine1}</p>
                     <p className="whitespace-nowrap">{reselInfoLine2}</p>
                  </div>
               </div>
            ) : (
               <button
                  type="button"
                  disabled={!canResellBook}
                  onClick={() => onOpenResellFlow(game)}
                  className={cn(
                     'h-[66px] px-4 py-2 rounded-md text-[16px] font-medium leading-[1.5] border',
                     canResellBook
                        ? 'bg-background border-primary text-primary'
                        : 'bg-background border-[#acb4bb] text-[#acb4bb] w-[88px] whitespace-nowrap cursor-not-allowed',
                  )}
               >
                  {effectiveResell}
               </button>
            )}
         </div>
      </>
   );
}

function MobileGameRow({
   day,
   game,
   index,
   onOpenBookingFlow,
   onOpenResellFlow,
}: {
   day: DaySchedule;
   game: GameRow;
   index: number;
   onOpenBookingFlow: (game: GameRow) => void;
   onOpenResellFlow: (game: GameRow) => void;
}) {
   const isLast = index === day.games.length - 1;
   const isEnded = game.status === '종료';
   const textDisabled = isEnded ? 'text-[#acb4bb]' : 'text-(--text-primary)';
   const resultText = getGameResultTexts(game.score, isEnded);
   const venueLabel = toVenueRegionLabel(game.venue);

   return (
      <div
         style={{ zIndex: day.games.length - index }}
         className={cn(
            'relative md:hidden border border-t-0 border-(--border-normal) px-[17px] pt-[16px] pb-[16px] flex flex-col gap-[12px]',
            isLast && 'rounded-bl-[16px] rounded-br-[16px]',
            isEnded ? 'bg-[#f7f8f9]' : 'bg-background',
         )}
      >
         <div className="flex items-center gap-[12px]">
            <span className={cn('text-[14px] font-semibold leading-[1.5] whitespace-nowrap', textDisabled)}>
               {game.time}
            </span>
            <span className="text-[14px] leading-[1.5] whitespace-nowrap text-[#acb4bb]">|</span>
            <span className={cn('text-[14px] font-semibold leading-[1.5] whitespace-nowrap', textDisabled)}>
               {venueLabel}
            </span>
         </div>

         <div className="flex items-center justify-between">
            <MobileTeam name={game.away} isEnded={isEnded} result={resultText.away} isHome={false} />

            <div className="flex flex-col items-center justify-center shrink-0">
               <MobileScoreDisplay game={game} />
               <span className={cn('text-[12px] font-medium text-center leading-[1.5]', statusColor[game.status])}>
                  {game.status}
               </span>
            </div>

            <MobileTeam name={game.home} isEnded={isEnded} result={resultText.home} isHome={true} />
         </div>

         <ActionButtons
            game={game}
            isEnded={isEnded}
            onOpenBookingFlow={onOpenBookingFlow}
            onOpenResellFlow={onOpenResellFlow}
         />
      </div>
   );
}

function DesktopGameRow({
   day,
   game,
   index,
   onOpenBookingFlow,
   onOpenResellFlow,
}: {
   day: DaySchedule;
   game: GameRow;
   index: number;
   onOpenBookingFlow: (game: GameRow) => void;
   onOpenResellFlow: (game: GameRow) => void;
}) {
   const isLast = index === day.games.length - 1;
   const isEnded = game.status === '종료';
   const textDisabled = isEnded ? 'text-[#acb4bb]' : 'text-(--text-primary)';
   const resultText = getGameResultTexts(game.score, isEnded);
   const venueLabel = toVenueRegionLabel(game.venue);

   return (
      <div
         style={{ zIndex: day.games.length - index }}
         className={cn(
            'relative hidden md:flex border border-t-0 border-(--border-normal) px-[20px] py-[6px] items-center justify-between',
            isLast && 'rounded-bl-[20px] rounded-br-[20px]',
            isEnded ? 'bg-[#f7f8f9]' : 'bg-background',
         )}
      >
         <div className="flex gap-[30px] items-center shrink-0">
            <div className="flex items-center justify-center w-[60px]">
               <span
                  className={cn('text-[20px] font-semibold text-center leading-[1.5] whitespace-nowrap', textDisabled)}
               >
                  {game.time}
               </span>
            </div>
            <div className="flex items-center justify-center w-[40px]">
               <span
                  className={cn('text-[20px] font-semibold text-center leading-[1.5] whitespace-nowrap', textDisabled)}
               >
                  {venueLabel}
               </span>
            </div>
         </div>

         <div className="flex gap-[50px] items-center shrink-0">
            <div className="flex items-center justify-center w-[150px]">
               <div className="flex h-[75px] items-center justify-end w-[70px] shrink-0">
                  <div className="w-[30px] h-[75px] shrink-0" />
                  <TeamName name={game.away} isEnded={isEnded} result={resultText.away} textDisabled={textDisabled} />
               </div>
               <div className="flex flex-col items-center justify-center overflow-hidden px-[15px] py-[10px] size-[75px] shrink-0">
                  <img src={teamLogos[game.away]} alt={game.away} className="w-full h-full object-contain" />
               </div>
            </div>

            <div className="flex flex-col items-center justify-center w-[40px] shrink-0">
               <ScoreDisplay game={game} />
               <span className={cn('text-[12px] font-medium text-center leading-[1.5]', statusColor[game.status])}>
                  {game.status}
               </span>
            </div>

            <div className="flex items-center justify-center w-[150px]">
               <div className="flex flex-col items-center justify-center overflow-hidden px-[15px] py-[10px] size-[75px] shrink-0">
                  <img src={teamLogos[game.home]} alt={game.home} className="w-full h-full object-contain" />
               </div>
               <div className="flex h-[75px] items-center justify-between w-[70px] shrink-0">
                  <TeamName name={game.home} isEnded={isEnded} result={resultText.home} textDisabled={textDisabled} />
                  <div className="flex h-[75px] items-center justify-end w-[30px] shrink-0">
                     <div className="bg-[#acb4bb] flex flex-col items-center justify-center px-[4px] rounded-[2px] w-[22px]">
                        <span className="text-white text-[16px] font-medium text-center leading-[1.5]">홈</span>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         <ActionButtons
            game={game}
            isEnded={isEnded}
            onOpenBookingFlow={onOpenBookingFlow}
            onOpenResellFlow={onOpenResellFlow}
         />
      </div>
   );
}

type ScheduleListProps = {
   activeTab: number;
   filteredData: DaySchedule[];
};

function ScheduleList({ activeTab, filteredData }: ScheduleListProps) {
   const { openBookingEntry, openResellEntry, bookingGuideDialog } = useBookingEntryFlow();

   const openBookingFlow = (game: GameRow) => {
      const { effectiveTicket } = getEffectiveSaleStatuses(game);

      if (effectiveTicket !== '예매하기') {
         return;
      }

      const selectedDay = filteredData.find(day => day.games.some(dayGame => dayGame === game));
      const bookingDateTime = selectedDay ? `${selectedDay.date} ${game.time}` : game.time;

      openBookingEntry({
         homeTeamId: game.homeTeamId ?? TEAM_IDS[game.home],
         serverHomeTeamId: game.serverHomeTeamId,
         gameId: game.gameId,
         stadiumId: game.stadiumId,
         leagueType: game.leagueType,
         gameDate: game.rawDate,
         queueTokenJti: game.queueTokenJti,
         matchTitle: `${game.away} vs ${game.home}`,
         venue: game.venue,
         dateTime: bookingDateTime,
      });
   };

   const openResellFlow = (game: GameRow) => {
      const { effectiveResell } = getEffectiveSaleStatuses(game);

      if (effectiveResell !== '리셀예매') {
         return;
      }

      const selectedDay = filteredData.find(day => day.games.some(dayGame => dayGame === game));
      const resellDateTime = selectedDay ? `${selectedDay.date} ${game.time}` : game.time;

      openResellEntry({
         homeTeamId: game.homeTeamId ?? TEAM_IDS[game.home],
         serverHomeTeamId: game.serverHomeTeamId,
         gameId: game.gameId,
         stadiumId: game.stadiumId,
         leagueType: game.leagueType,
         gameDate: game.rawDate,
         queueTokenJti: game.queueTokenJti,
         matchTitle: `${game.away} vs ${game.home}`,
         venue: game.venue,
         dateTime: resellDateTime,
      });
   };

   if (filteredData.length === 0) {
      return <EmptyState />;
   }

   return (
      <div className={cn('flex flex-col w-full', activeTab !== TAB_TODAY && 'gap-[25px]')}>
         {filteredData.map(day => {
            const isToday = day.isToday === true;

            return (
               <div key={day.date}>
                  <div className="bg-[#f1f2f4] border border-(--border-normal) h-[46px] md:h-auto px-[25px] md:px-[30px] py-[10px] rounded-tl-[16px] rounded-tr-[16px] md:rounded-tl-[20px] md:rounded-tr-[20px] flex items-center justify-center md:justify-start gap-2">
                     <span className="text-[16px] md:text-[length:var(--typo---heading\/h4,20px)] font-semibold text-(--text-primary) leading-[1.5]">
                        {day.date}
                     </span>
                     {isToday && <Badge variant="chipDestructive">오늘</Badge>}
                  </div>

                  {day.games.map((game, index) => (
                     <div key={`${day.date}-${game.time}-${game.away}-${game.home}-${index}`}>
                        <MobileGameRow
                           day={day}
                           game={game}
                           index={index}
                           onOpenBookingFlow={openBookingFlow}
                           onOpenResellFlow={openResellFlow}
                        />
                        <DesktopGameRow
                           day={day}
                           game={game}
                           index={index}
                           onOpenBookingFlow={openBookingFlow}
                           onOpenResellFlow={openResellFlow}
                        />
                     </div>
                  ))}
               </div>
            );
         })}

         {bookingGuideDialog}
      </div>
   );
}

export default ScheduleList;
