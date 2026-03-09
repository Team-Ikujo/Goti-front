import { Button } from '@/shared/ui/button';
import { teams } from '@/entities/team/model/teams';
import type { Team } from '@/entities/team/model/types';
import { getClosestMatch, getDDay } from '@/entities/team/model/schedule';
import { Calendar, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const FavoriteTeamMatchCard = ({ team }: { team: Team }) => {
   const match = getClosestMatch(team.id);

   if (!match) {
      return (
         <div className="bg-white border border-[#e9ebee] rounded-2xl overflow-hidden shadow-[0px_20px_50px_-12px_rgba(0,0,0,0.25)]">
            <div className="bg-fill-hoveraccent border-b border-[#e9ebee] flex items-center justify-between px-6 py-2.5">
               <div className="flex items-center gap-2">
                  <span className="text-[14px] font-medium text-(--text-tertiary) leading-[1.45]">내 응원팀</span>
                  <span className="text-[14px] font-medium text-(--text-secondary) leading-[1.45]">·</span>
                  <div className="flex items-center gap-1.5">
                     <img
                        src="/Icon/Line/Baseball.svg"
                        alt=""
                        className="size-3.25 filter-[invert(29%)_sepia(89%)_saturate(1651%)_hue-rotate(213deg)_brightness(97%)_contrast(96%)]"
                     />
                     <span className="text-[14px] font-bold text-primary leading-[1.45] whitespace-nowrap">
                        {team.name}
                     </span>
                  </div>
               </div>
            </div>
            <div className="flex items-center justify-center h-[80px] text-[14px] text-(--text-tertiary)">
               예정된 경기가 없습니다.
            </div>
         </div>
      );
   }

   const isHome = match.homeTeamId === team.id;
   const opponentId = isHome ? match.awayTeamId : match.homeTeamId;
   const opponent = teams.find(t => t.id === opponentId) ?? teams[0];
   // 응원팀은 항상 좌측(HOME) 위치에 표시
   const homeTeam = team;
   const awayTeam = opponent;
   const dDay = getDDay(match.date);
   const formattedDate = `${match.date.replace(/-/g, '.')} ${match.time}`;

   return (
      <div className="bg-white border border-[#e9ebee] rounded-2xl overflow-hidden shadow-[0px_20px_50px_-12px_rgba(0,0,0,0.25)]">
         {/* 헤더 */}
         <div className="bg-fill-hoveraccent border-b border-[#e9ebee] flex items-center justify-between px-6 py-2.5">
            <div className="flex items-center gap-2">
               <span className="text-[14px] font-medium text-(--text-tertiary) leading-[1.45]">내 응원팀</span>
               <span className="text-[14px] font-medium text-(--text-secondary) leading-[1.45]">·</span>
               <div className="flex items-center gap-1.5">
                  <img
                     src="/Icon/Line/Baseball.svg"
                     alt=""
                     className="size-3.25 filter-[invert(29%)_sepia(89%)_saturate(1651%)_hue-rotate(213deg)_brightness(97%)_contrast(96%)]"
                  />
                  <span className="text-[14px] font-bold text-primary leading-[1.45] whitespace-nowrap">
                     {team.name}
                  </span>
               </div>
            </div>
            <Button
               asChild
               variant="outline"
               className="px-3 py-1.25 h-auto text-[14px] font-medium text-(--text-secondary) rounded-lg"
            >
               <Link to="/tickets">모든 경기 보기</Link>
            </Button>
         </div>

         {/* 바디 */}
         <div className="flex h-[212px]">
            {/* 팀 디스플레이 */}
            <div className="flex-1 flex gap-20 items-start px-8 py-5 min-w-0">
               <span className="text-[32px] font-bold text-primary leading-[1.45] tracking-[-0.032px] w-[110px] shrink-0">
                  {dDay}
               </span>

               <div className="flex items-center gap-20 shrink-0 h-full">
                  {/* 홈팀 */}
                  <div className="flex flex-col items-center">
                     <span className="text-[16px] font-semibold text-[#374553] leading-[1.5] text-center whitespace-nowrap w-[130px]">
                        {homeTeam.name}
                     </span>
                     <div className="flex items-center justify-center size-[120px] p-2.5 overflow-hidden">
                        <img
                           src={homeTeam.logoSrc}
                           alt={homeTeam.name}
                           className={`w-full object-contain ${homeTeam.logoAspectClassName}`}
                        />
                     </div>
                     <span className="text-[14px] font-bold text-[#646f7c] leading-[1.45] text-center">HOME</span>
                  </div>

                  <span className="text-[32px] font-bold text-(--text-primary) leading-[1.45] tracking-[-0.032px]">
                     VS
                  </span>

                  {/* 원정팀 */}
                  <div className="flex flex-col items-center">
                     <span className="text-[16px] font-semibold text-[#374553] leading-[1.5] text-center whitespace-nowrap w-[130px]">
                        {awayTeam.name}
                     </span>
                     <div className="flex items-center justify-center size-[120px] p-2.5 overflow-hidden">
                        <img
                           src={awayTeam.logoSrc}
                           alt={awayTeam.name}
                           className={`w-full object-contain ${awayTeam.logoAspectClassName}`}
                        />
                     </div>
                     <span className="text-[14px] font-bold text-[#646f7c] leading-[1.45] text-center">AWAY</span>
                  </div>
               </div>
            </div>

            {/* 경기 상세 */}
            <div className="w-[400px] shrink-0 flex flex-col gap-5 items-center justify-center px-7.5 py-5">
               <div className="flex flex-col gap-2 w-full">
                  <div className="flex items-center gap-2">
                     <MapPin className="size-4 text-[#646f7c] shrink-0" />
                     <span className="text-[14px] font-medium text-[#646f7c] leading-[1.45]">{match.venue}</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <Calendar className="size-4 text-[#646f7c] shrink-0" />
                     <span className="text-[14px] font-medium text-[#646f7c] leading-[1.45]">{formattedDate}</span>
                  </div>
               </div>

               <div className="flex flex-col gap-2 w-full">
                  <Button variant="primary" className="w-full h-12 text-[16px] font-bold rounded-lg">
                     예매하기
                  </Button>
                  <Button variant="primaryline" className="w-full h-12 text-[16px] font-bold rounded-lg">
                     리셀예매
                  </Button>
               </div>
            </div>
         </div>
      </div>
   );
};

export default FavoriteTeamMatchCard;
