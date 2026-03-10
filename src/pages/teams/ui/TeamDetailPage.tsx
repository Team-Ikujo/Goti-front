import { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';

import { teams } from '@/entities/team/model/teams';
import { cn } from '@/shared/lib/utils';
import { TEAM_IDS } from '@/pages/home/ui/game-schedule/constants';
import { TeamScheduleTab } from './TeamScheduleTab';
import { SeatMapTab } from './SeatMapTab';
import { StadiumGuideTab } from './StadiumGuideTab';

const TEAM_NAME_BY_ID: Record<string, string> = Object.fromEntries(
   Object.entries(TEAM_IDS).map(([name, id]) => [id, name]),
);

const BOOKING_TABS = ['예매하기', '좌석도', '구장안내'];

const TeamDetailPage = () => {
   const { teamId } = useParams<{ teamId: string }>();
   const team = teams.find(t => t.id === teamId);

   const [activeBookingTab, setActiveBookingTab] = useState(0);

   const teamName = teamId ? TEAM_NAME_BY_ID[teamId] : undefined;

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
               <div className="flex h-13 md:h-15 items-end justify-center w-full">
                  {BOOKING_TABS.map((tab, index) => {
                     const isActive = index === activeBookingTab;
                     const isLeft = index < activeBookingTab;
                     const isRight = index > activeBookingTab;
                     return (
                        <button
                           key={tab}
                           onClick={() => setActiveBookingTab(index)}
                           className={cn(
                              'flex-1 h-full rounded-tl-sm rounded-tr-sm bg-background border',
                              // Selected: 좌우 border만, 상단은 내부 div가 담당
                              isActive && 'border-l-2 border-r-2 border-t-0 border-b-0',
                              // Default-Left (선택탭 왼쪽): 우측 border 없음
                              isLeft && 'border-l-2 border-t-2 border-b-2 border-r-0',
                              // Default-Right (선택탭 오른쪽): 좌측 border 없음
                              isRight && 'border-r-2 border-t-2 border-b-2 border-l-0',
                           )}
                        >
                           {/* 활성 탭 상단 4px 파란 선 */}
                           <div
                              className={cn(
                                 'flex h-full w-full items-center justify-center p-2.5',
                                 isActive && 'border-t-4 border-t-primary rounded-[3px]',
                              )}
                           >
                              <span
                                 className={cn(
                                    'text-[16px] md:text-[20px] font-semibold leading-normal whitespace-nowrap',
                                    isActive ? 'text-foreground' : 'text-[#acb4bb]',
                                 )}
                              >
                                 {tab}
                              </span>
                           </div>
                        </button>
                     );
                  })}
               </div>

               {/* 탭 컨텐츠 */}
               <div className="flex flex-col gap-6.25 items-start w-full">
                  {activeBookingTab === 0 && <TeamScheduleTab teamName={teamName} />}

                  {activeBookingTab === 1 && <SeatMapTab />}

                  {activeBookingTab === 2 && <StadiumGuideTab />}
               </div>
            </div>
         </div>
      </section>
   );
};

export default TeamDetailPage;
