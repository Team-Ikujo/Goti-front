import { useMemo, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { teams } from '@/entities/team/model/teams';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import ScheduleList from '@/pages/home/ui/game-schedule/ScheduleList';
import YearMonthPicker from '@/pages/home/ui/game-schedule/YearMonthPicker';
import {
   CURRENT_MONTH,
   CURRENT_WEEK,
   CURRENT_YEAR,
   TEAM_IDS,
   WEEK_OPTIONS,
   TAB_WEEK,
   scheduleData,
} from '@/pages/home/ui/game-schedule/constants';
import { filterScheduleData } from '@/pages/home/ui/game-schedule/utils';
import { BookingGuide } from './BookingGuide';
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

   const [weekYear, setWeekYear] = useState(CURRENT_YEAR);
   const [weekMonth, setWeekMonth] = useState(CURRENT_MONTH);
   const [selectedWeek, setSelectedWeek] = useState(CURRENT_WEEK);
   const [showPicker, setShowPicker] = useState(false);

   const teamName = teamId ? TEAM_NAME_BY_ID[teamId] : undefined;

   const filteredData = useMemo(() => {
      const byWeek = filterScheduleData(scheduleData, {
         activeTab: TAB_WEEK,
         weekMonth,
         selectedWeek,
         allMonth: weekMonth,
      });

      if (!teamName) return byWeek;

      return byWeek
         .map(day => ({
            ...day,
            games: day.games.filter(g => g.away === teamName || g.home === teamName),
         }))
         .filter(day => day.games.length > 0);
   }, [weekMonth, selectedWeek, teamName]);

   const prevMonth = () => {
      if (weekMonth === 1) {
         setWeekMonth(12);
         setWeekYear(y => y - 1);
      } else {
         setWeekMonth(m => m - 1);
      }
      setSelectedWeek(1);
   };

   const nextMonth = () => {
      if (weekMonth === 12) {
         setWeekMonth(1);
         setWeekYear(y => y + 1);
      } else {
         setWeekMonth(m => m + 1);
      }
      setSelectedWeek(1);
   };

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

            <div className="flex flex-col gap-12.5 items-center max-w-300 w-full">
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
                  {activeBookingTab === 0 && (
                     <>
                        {/* 월/주차 네비게이터 */}
                        <div className="flex flex-col gap-1 items-start w-full">
                           {/* 년월 선택 */}
                           <div className="relative flex items-center justify-center overflow-hidden px-5.5 py-2.25 rounded-[30px] w-full">
                              <div className="flex items-center gap-2.5">
                                 <button
                                    onClick={prevMonth}
                                    className="flex items-center justify-center size-8 rounded-full hover:bg-gray-100 text-(--text-tertiary)"
                                 >
                                    <ChevronLeft className="size-5 md:size-6" />
                                 </button>
                                 <button
                                    onClick={() => setShowPicker(true)}
                                    className="text-[20px] md:text-[24px] font-bold text-foreground leading-normal min-w-27.5 text-center whitespace-nowrap"
                                 >
                                    {weekYear}-{String(weekMonth).padStart(2, '0')}
                                 </button>
                                 <button
                                    onClick={nextMonth}
                                    className="flex items-center justify-center size-8 rounded-full hover:bg-gray-100 text-(--text-tertiary)"
                                 >
                                    <ChevronRight className="size-5 md:size-6" />
                                 </button>
                              </div>

                              {showPicker && (
                                 <YearMonthPicker
                                    year={weekYear}
                                    month={weekMonth}
                                    onConfirm={(year, month) => {
                                       setWeekYear(year);
                                       setWeekMonth(month);
                                       setSelectedWeek(1);
                                       setShowPicker(false);
                                    }}
                                    onClose={() => setShowPicker(false)}
                                 />
                              )}
                           </div>

                           {/* 주차 선택 */}
                           <div className="flex gap-3.75 md:gap-7.5 items-start justify-center w-full flex-wrap">
                              {WEEK_OPTIONS.map(week => (
                                 <Button
                                    key={week}
                                    onClick={() => setSelectedWeek(week)}
                                    variant={week === selectedWeek ? 'primaryline' : 'outline'}
                                    className={cn(
                                       'px-4 md:px-5.5 py-2.25 rounded-[10px] text-[16px] md:text-[20px] font-semibold leading-normal',
                                       week !== selectedWeek && 'shadow-[inset_0_0_0_1px_#161d24] text-[#161d24]',
                                    )}
                                 >
                                    {week}주차
                                 </Button>
                              ))}
                           </div>
                        </div>
                        <div className="flex flex-col md:gap-30 gap-30 items-start w-full">
                           {/* 경기 일정 리스트 */}
                           <div className="flex flex-col gap-6.25 items-start w-full">
                              <ScheduleList activeTab={TAB_WEEK} filteredData={filteredData} />
                           </div>

                           {/* 예매 안내 */}
                           <BookingGuide />
                        </div>
                     </>
                  )}

                  {activeBookingTab === 1 && <SeatMapTab />}

                  {activeBookingTab === 2 && <StadiumGuideTab />}
               </div>
            </div>
         </div>
      </section>
   );
};

export default TeamDetailPage;
