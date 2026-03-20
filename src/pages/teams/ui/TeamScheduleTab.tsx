// src/pages/teams/ui/TeamScheduleTab.tsx
import { useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import ScheduleList from '@/pages/home/ui/game-schedule/ScheduleList';
import { YearMonthPicker } from '@/pages/home/ui/game-schedule/YearMonthPicker';
import { WEEK_OPTIONS, TAB_WEEK } from '@/pages/home/ui/game-schedule/constants';
import { filterScheduleData } from '@/pages/home/ui/game-schedule/utils';
import { useGameSchedules } from '../api/useGameSchedules';
import { BookingGuide } from './BookingGuide';

function getCurrentWeek(): number {
   return Math.ceil(new Date().getDate() / 7);
}

interface Props {
   serverTeamId: string | undefined;
}

export function TeamScheduleTab({ serverTeamId }: Props) {
   const now = new Date();
   const [weekYear, setWeekYear] = useState(now.getFullYear());
   const [weekMonth, setWeekMonth] = useState(now.getMonth() + 1);
   const [selectedWeek, setSelectedWeek] = useState(getCurrentWeek());
   const [showPicker, setShowPicker] = useState(false);
   const pickerContainerRef = useRef<HTMLDivElement>(null);
   const { schedules, loading, error } = useGameSchedules({
      serverTeamId,
      year: weekYear,
      month: weekMonth,
      week: selectedWeek,
   });

   const filteredData = useMemo(() => {
      return filterScheduleData(schedules, {
         activeTab: TAB_WEEK,
         weekYear,
         weekMonth,
         selectedWeek,
         allYear: weekYear,
         allMonth: weekMonth,
      });
   }, [schedules, weekMonth, selectedWeek, weekYear]);

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

   return (
      <>
         {/* 월/주차 네비게이터 */}
         <div className="flex flex-col gap-3 items-center w-full">
            {/* 년월 선택 */}
            <div className="flex items-center gap-2">
               <button
                  onClick={prevMonth}
                  className="flex items-center justify-center size-8 rounded-full hover:bg-gray-100 text-icon-primary"
               >
                  <ChevronLeft className="size-5 md:size-6" />
               </button>

               {/* 트리거 + 피커 컨테이너 */}
               <div ref={pickerContainerRef} className="relative">
                  <button
                     onClick={() => setShowPicker(prev => !prev)}
                     className="text-heading-1-bold text-foreground leading-normal min-w-27.5 text-center"
                  >
                     {weekYear}-{String(weekMonth).padStart(2, '0')}
                  </button>

                  {showPicker && (
                     <YearMonthPicker
                        year={weekYear}
                        month={weekMonth}
                        containerRef={pickerContainerRef}
                        onSelectYear={y => {
                           setWeekYear(y);
                           setSelectedWeek(1);
                        }}
                        onSelectMonth={m => {
                           setWeekMonth(m);
                           setSelectedWeek(1);
                        }}
                        onClose={() => setShowPicker(false)}
                     />
                  )}
               </div>

               <button
                  onClick={nextMonth}
                  className="flex items-center justify-center size-8 rounded-full hover:bg-gray-100 text-icon-primary"
               >
                  <ChevronRight className="size-5 md:size-6" />
               </button>
            </div>

            {/* 주차 선택 */}
            <div className="flex gap-3.75 md:gap-7.5 items-start justify-center w-full flex-wrap">
               {WEEK_OPTIONS.map(week => (
                  <Button
                     key={week}
                     onClick={() => setSelectedWeek(week)}
                     variant={week === selectedWeek ? 'secondary' : 'tertiary'}
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

         <div className="flex flex-col gap-30 items-start w-full">
            {/* 경기 일정 리스트 */}
            <div className="flex flex-col gap-6.25 items-start w-full">
               {loading ? (
                  <div className="flex h-100 items-center justify-center rounded-[10px] border-border bg-surface w-full">
                     <p className="text-[18px] text-[#acb4bb]">일정을 불러오는 중...</p>
                  </div>
               ) : error ? (
                  <div className="rounded-[10px] border border-border bg-surface px-5 py-10 text-center text-body-1-medium text-muted-foreground w-full">
                     경기 일정을 불러오지 못했습니다.
                  </div>
               ) : (
                  <ScheduleList activeTab={TAB_WEEK} filteredData={filteredData} />
               )}
            </div>

            {/* 예매 안내 */}
            <BookingGuide />
         </div>
      </>
   );
}
