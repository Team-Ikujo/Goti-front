// src/pages/home/ui/FavoriteTeamMatchCard.tsx

import { Calendar, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

import { teams } from '@/entities/team/model/teams';
import type { Team } from '@/entities/team/model/types';
import { getClosestMatch, getDDay, useGameSchedules } from '@/entities/game/model/schedule';
import { useResaleGameCounts } from '@/entities/resale/model/useResaleGameCounts';
import { useResaleGameStatuses } from '@/entities/resale/model/useResaleGameStatuses';
import { Button } from '@/shared/ui/button';
import { useBookingEntryFlow } from '@/shared/lib/use-booking-entry-flow';

const FavoriteTeamMatchCard = ({ team }: { team: Team }) => {
   const { openBookingEntry, openResellEntry, bookingGuideDialog } = useBookingEntryFlow();
   const { data, isPending } = useGameSchedules();
   const resaleGameIds = (data ?? []).map(game => game.id);
   const resaleCountsQuery = useResaleGameCounts(resaleGameIds);
   const resaleStatusesQuery = useResaleGameStatuses(resaleGameIds);
   const match = getClosestMatch(data ?? [], team.id);

   /** 헤더 — 경기 없을 때도 공통 사용 */
   const Header = (
      <div className="bg-fill-hoveraccent border-b border-[#e9ebee] flex items-center justify-between px-6 py-2.5">
         <div className="flex items-center gap-2">
            <span className="text-label-2-medium text-(--text-tertiary) leading-[1.45]">내 응원팀</span>
            <span className="text-label-2-medium text-muted-foreground leading-[1.45]">·</span>
            <div className="flex items-center gap-1.5">
               <img
                  src="/Icon/Line/Baseball.svg"
                  alt=""
                  className="size-3.25 filter-[invert(29%)_sepia(89%)_saturate(1651%)_hue-rotate(213deg)_brightness(97%)_contrast(96%)]"
               />
               <span className="text-label-2-bold text-primary leading-[1.45] whitespace-nowrap">{team.name}</span>
            </div>
         </div>
         <Button
            asChild
            variant="tertiary"
            className="px-3 py-1.25 h-auto text-label-2-medium text-muted-foreground rounded-lg bg-background"
         >
            <Link to="/tickets">모든 경기 보기</Link>
         </Button>
      </div>
   );

   if (isPending) {
      return (
         <div className="bg-white border border-[#e9ebee] rounded-2xl overflow-hidden shadow-[0px_20px_50px_-12px_rgba(0,0,0,0.25)]">
            {Header}
            <div className="flex items-center justify-center h-20 text-[14px] text-(--text-tertiary)">
               경기 일정을 불러오는 중입니다.
            </div>
         </div>
      );
   }

   if (!match) {
      return (
         <div className="bg-white border border-[#e9ebee] rounded-2xl overflow-hidden shadow-[0px_20px_50px_-12px_rgba(0,0,0,0.25)]">
            {Header}
            <div className="flex items-center justify-center h-20 text-[14px] text-(--text-tertiary)">
               예정된 경기가 없습니다.
            </div>
         </div>
      );
   }

   const isHome = match.homeTeamId === team.id;
   const opponentId = isHome ? match.awayTeamId : match.homeTeamId;
   const opponent = teams.find(t => t.id === opponentId) ?? {
      id: opponentId ?? 'unknown',
      name: isHome ? match.awayTeamFullName : match.homeTeamFullName,
      logoSrc: '/Icon/Line/Baseball.svg',
      logoAspectClassName: 'aspect-square',
      isEnabled: false,
   };
   // 응원팀은 항상 좌측(HOME) 위치에 표시
   const homeTeam = team;
   const awayTeam = opponent;
   const dDay = getDDay(match.date);
   const formattedDate = `${match.date.replace(/-/g, '.')} ${match.time}`;
   const awayTeamName = match.awayTeamFullName;
   const homeTeamName = match.homeTeamFullName;
   const resaleCount = resaleCountsQuery.data?.get(match.id);
   const resaleStatus = resaleStatusesQuery.data?.get(match.id);
   const canResellBook = resaleStatus === 'AVAILABLE' && typeof resaleCount === 'number' && resaleCount > 0;
   const resellButtonLabel =
      resaleStatus === 'SCHEDULED'
         ? '리셀예정'
         : resaleStatus === 'UNAVAILABLE'
           ? '리셀매진'
           : canResellBook
             ? '리셀예매'
             : match.resell === '리셀예정'
               ? '리셀예정'
               : '리셀매진';

   const handleBookingClick = () => {
      openBookingEntry({
         homeTeamId: match.homeTeamId,
         serverHomeTeamId: match.serverHomeTeamId,
         gameId: match.id,
         stadiumId: match.stadiumId,
         leagueType: match.leagueType,
         gameDate: match.date,
         queueTokenJti: match.queueTokenJti,
         matchTitle: `${awayTeamName} vs ${homeTeamName}`,
         venue: match.venue,
         dateTime: formattedDate,
      });
   };

   const handleResellClick = () => {
      if (!canResellBook) {
         return;
      }

      openResellEntry({
         homeTeamId: match.homeTeamId,
         serverHomeTeamId: match.serverHomeTeamId,
         gameId: match.id,
         stadiumId: match.stadiumId,
         leagueType: match.leagueType,
         gameDate: match.date,
         queueTokenJti: match.queueTokenJti,
         matchTitle: `${awayTeamName} vs ${homeTeamName}`,
         venue: match.venue,
         dateTime: formattedDate,
      });
   };

   return (
      <div className="bg-white border border-[#e9ebee] rounded-2xl overflow-hidden shadow-[0px_20px_50px_-12px_rgba(0,0,0,0.25)]">
         {Header}

         {/* ── 모바일 바디 (lg 미만) ── */}
         <div className="flex flex-col gap-4 p-[10px] lg:hidden">
            {/* 1행: D-DAY + 날짜·장소 */}
            <div className="flex items-start justify-between">
               <span className="text-[24px] font-bold text-primary leading-[32px] tracking-[-0.5px] px-5">{dDay}</span>
               <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1">
                     <Calendar className="size-3.5 text-[#646f7c] shrink-0" />
                     <span className="text-[12px] text-[#646f7c] leading-[16px]">{formattedDate}</span>
                  </div>
                  <div className="flex items-center gap-1">
                     <MapPin className="size-3.5 text-[#646f7c] shrink-0" />
                     <span className="text-[12px] text-[#646f7c] leading-[16px]">{match.venue}</span>
                  </div>
               </div>
            </div>

            {/* 2행: 팀 로고 */}
            <div className="flex items-center justify-between max-w-[600px] mx-auto w-full h-[140px]">
               {/* 홈팀 */}
               <div className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-[14px] font-semibold text-[#374553] leading-[20px] tracking-[-0.15px] text-center">
                     {homeTeam.name}
                  </span>
                  <div className="w-20 h-20 flex items-center justify-center">
                     <img src={homeTeam.logoSrc} alt={homeTeam.name} className="w-full h-full object-contain" />
                  </div>
                  <span className="bg-[#f1f2f4] rounded-sm px-2 py-1 text-[12px] font-bold text-[#646f7c] leading-4">
                     HOME
                  </span>
               </div>

               {/* VS */}
               <span className="text-[24px] font-bold text-[#161d24] leading-8 tracking-[0.07px] shrink-0">VS</span>

               {/* 원정팀 */}
               <div className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-[14px] font-semibold text-[#374553] leading-[20px] tracking-[-0.15px] text-center">
                     {awayTeam.name}
                  </span>
                  <div className="w-20 h-20 flex items-center justify-center">
                     <img src={awayTeam.logoSrc} alt={awayTeam.name} className="w-full h-full object-contain" />
                  </div>
                  <span className="bg-[#f1f2f4] rounded-sm px-2 py-1 text-[12px] font-bold text-[#646f7c] leading-4">
                     AWAY
                  </span>
               </div>
            </div>

            {/* 3행: 버튼 (가로 배치) */}
            <div className="flex gap-3 justify-center">
               <Button
                  variant="primary"
                  className="flex-1 max-w-[300px] h-[46px] text-[14px] font-bold rounded-[10px] tracking-[-0.15px]"
                  onClick={handleBookingClick}
               >
                  예매하기
               </Button>
               <Button
                  variant="secondary"
                  className="flex-1 max-w-[300px] h-[46px] text-[14px] font-bold rounded-[10px] tracking-[-0.15px]"
                  disabled={!canResellBook}
                  onClick={handleResellClick}
               >
                  {resellButtonLabel}
               </Button>
            </div>
         </div>

         {/* ── 데스크탑 바디 (lg 이상) ── */}
         <div className="hidden lg:flex h-53 w-full">
            {/* 좌측: D-DAY + 팀 디스플레이 */}
            <div className="flex-1 flex gap-20 items-start px-8 py-5 min-w-0">
               <span className="text-title-1-bold text-primary leading-[1.45] tracking-[-0.032px] w-27.5 shrink-0">
                  {dDay}
               </span>

               <div className="flex items-center gap-20 shrink-0 h-full">
                  {/* 홈팀 */}
                  <div className="flex flex-col items-center">
                     <span className="text-label-1-semibold text-[#374553] leading-normal text-center w-[130px]">
                        {homeTeam.name}
                     </span>
                     <div className="flex items-center justify-center size-[120px] p-2.5 overflow-hidden">
                        <img
                           src={homeTeam.logoSrc}
                           alt={homeTeam.name}
                           className={`w-full object-contain ${homeTeam.logoAspectClassName}`}
                        />
                     </div>
                     <span className="text-label-2-bold text-[#646f7c] leading-[1.45] text-center">HOME</span>
                  </div>

                  <span className="text-[32px] font-bold text-[#161d24] leading-[1.45] tracking-[-0.032px]">VS</span>

                  {/* 원정팀 */}
                  <div className="flex flex-col items-center">
                     <span className="text-label-1-semibold text-[#374553] leading-normal text-center w-[130px]">
                        {awayTeam.name}
                     </span>
                     <div className="flex items-center justify-center size-[120px] p-2.5 overflow-hidden">
                        <img
                           src={awayTeam.logoSrc}
                           alt={awayTeam.name}
                           className={`w-full object-contain ${awayTeam.logoAspectClassName}`}
                        />
                     </div>
                     <span className="text-label-2-bold text-[#646f7c] leading-[1.45] text-center">AWAY</span>
                  </div>
               </div>
            </div>

            {/* 우측: 경기 상세 + 버튼 */}
            <div className="w-[400px] shrink-0 flex flex-col gap-5 items-center justify-center px-7.5 py-5">
               <div className="flex flex-col gap-2 w-full">
                  <div className="flex items-center gap-2">
                     <MapPin className="size-4 text-[#646f7c] shrink-0" />
                     <span className="text-label-2-medium text-[#646f7c] leading-[1.45]">{match.venue}</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <Calendar className="size-4 text-[#646f7c] shrink-0" />
                     <span className="text-label-2-medium text-[#646f7c] leading-[1.45]">{formattedDate}</span>
                  </div>
               </div>

               <div className="flex flex-col gap-2 w-full">
                  <Button
                     variant="primary"
                     className="h-12 text-[16px] font-bold rounded-lg"
                     onClick={handleBookingClick}
                  >
                     예매하기
                  </Button>
                  <Button
                     variant="secondary"
                     className="h-12 text-[16px] font-bold rounded-lg"
                     disabled={!canResellBook}
                     onClick={handleResellClick}
                  >
                     {resellButtonLabel}
                  </Button>
               </div>
            </div>
         </div>

         {bookingGuideDialog}
      </div>
   );
};

export default FavoriteTeamMatchCard;
