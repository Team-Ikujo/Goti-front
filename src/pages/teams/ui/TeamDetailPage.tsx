import { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';

import { teams } from '@/entities/team/model/teams';
import { cn } from '@/shared/lib/utils';
import { TeamScheduleTab } from './TeamScheduleTab';
import { SeatMapTab } from './SeatMapTab';
import { StadiumGuideTab } from './StadiumGuideTab';

const BOOKING_TABS = ['예매하기', '좌석도', '구장안내'];

const TeamDetailPage = () => {
   const { teamId } = useParams<{ teamId: string }>();
   const team = teams.find(t => t.id === teamId);

   const [activeBookingTab, setActiveBookingTab] = useState(0);

   if (!team) {
      return <Navigate to="/teams" replace />;
   }

   return (
      <section className="bg-background w-full">
         <div className="mx-auto flex w-full max-w-300 flex-col items-center gap-12.5 md:gap-30 px-4 pt-12.5 pb-30">
            {/* 팀 로고 */}
            <div className="flex max-w-300 items-center justify-center w-full overflow-hidden px-px">
               <div className="flex flex-col items-center justify-center overflow-hidden px-3.75 py-2.5 size-35 md:size-50">
                  <img
                     src={team.logoSrc}
                     alt={team.name}
                     className={cn('w-full h-full object-contain', team.logoAspectClassName)}
                  />
               </div>
            </div>

            <div className="flex flex-col gap-12.5 items-center w-full">
               {/* 탭 네비게이션 */}
               <div className="flex items-center w-full">
                  {BOOKING_TABS.map((tab, index) => {
                     const isActive = index === activeBookingTab;
                     return (
                        <button
                           key={tab}
                           onClick={() => setActiveBookingTab(index)}
                           className={cn(
                              'flex flex-1 flex-col items-center justify-center h-[60px] px-3 py-[7px] border-b-2',
                              isActive
                                 ? 'border-primary rounded-tl-[10px] rounded-tr-[10px]'
                                 : 'border-border',
                           )}
                        >
                           <span
                              className={cn(
                                 'text-[18px] font-bold leading-[1.55] whitespace-nowrap',
                                 isActive ? 'text-primary' : 'text-(--text-tertiary)',
                              )}
                           >
                              {tab}
                           </span>
                        </button>
                     );
                  })}
               </div>

               {/* 탭 컨텐츠 */}
               <div className="flex flex-col gap-6.25 items-start w-full">
                  {activeBookingTab === 0 && <TeamScheduleTab serverTeamId={team.serverTeamId} />}

                  {activeBookingTab === 1 && <SeatMapTab serverStadiumId={team.serverStadiumId} />}

                  {activeBookingTab === 2 && <StadiumGuideTab team={team} />}
               </div>
            </div>
         </div>
      </section>
   );
};

export default TeamDetailPage;
