import { Calendar, MapPin } from 'lucide-react';
import { getPopularMatches, useGameSchedules } from '@/entities/game/model/schedule';

const PopularGames = () => {
   const { data } = useGameSchedules();
   const matches = getPopularMatches(data ?? [], 5);

   if (!data) {
      return null;
   }

   return (
      <section className="flex flex-col gap-5 w-full">
         {/* 헤더 */}
         <div className="flex items-center justify-between">
            <h2 className="text-heading-1-bold text-foreground leading-normal">인기 경기</h2>
         </div>

         {/* 카드 리스트 (가로 스크롤) */}
         <div className="flex gap-6 overflow-x-auto pb-1 scrollbar-hide">
            {matches.map((match, i) => (
               <div
                  key={match.id}
                  className="shrink-0 w-75 border border-border rounded-[14px] overflow-hidden bg-background"
               >
                  {/* 이미지 영역 */}
                  <div className="relative h-50 border-b border-border overflow-hidden bg-white">
                     {/* 경기 배경 이미지 */}
                     <img
                        src={`/images/${i + 1}번 인기경기.png`}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                        draggable={false}
                     />
                     {/* 이미지 오버레이 */}
                     <div className="absolute inset-0 bg-[#000000]/20" />
                     {/* 순위 번호 */}
                     <span className="absolute left-2.75 bottom-0 text-display-1-bold leading-[1.33] tracking-[-0.05px] text-white">
                        {i + 1}
                     </span>
                  </div>

                  {/* 정보 영역 */}
                  <div className="flex flex-col gap-4 p-6">
                     {/* 팀 매치업 */}
                     <div className="flex items-center justify-between h-7">
                        <span className="w-17.5 text-[18px] font-bold leading-[1.55] text-foreground">
                           {match.awayTeamName}
                        </span>
                        <span className="text-[14px] font-bold text-(--text-tertiary)">vs</span>
                        <span className="w-17.5 text-[18px] font-bold leading-[1.55] text-foreground text-right">
                           {match.homeTeamName}
                        </span>
                     </div>

                     {/* 날짜/시간 + 장소 */}
                     <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 h-5">
                           <Calendar className="size-4 text-(--text-tertiary) shrink-0" />
                           <div className="flex items-center gap-2.5 text-label-2-medium text-(--text-tertiary)">
                              <span>{match.date.replace(/-/g, '.')}</span>
                              <span className="w-px h-3 bg-border" />
                              <span>{match.time}</span>
                           </div>
                        </div>
                        <div className="flex items-center gap-2 h-5">
                           <MapPin className="size-4 text-(--text-tertiary) shrink-0" />
                           <span className="text-label-2-medium text-(--text-tertiary)">{match.venue}</span>
                        </div>
                     </div>
                  </div>
               </div>
            ))}
         </div>
      </section>
   );
};

export default PopularGames;
