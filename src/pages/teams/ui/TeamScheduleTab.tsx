// src/pages/teams/ui/TeamScheduleTab.tsx
import { useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import ScheduleList from '@/pages/home/ui/game-schedule/ScheduleList';
import {
   CURRENT_MONTH,
   CURRENT_WEEK,
   CURRENT_YEAR,
   WEEK_OPTIONS,
   TAB_WEEK,
   scheduleData,
} from '@/pages/home/ui/game-schedule/constants';
import { YearMonthPicker } from '@/pages/home/ui/game-schedule/YearMonthPicker';
import { filterScheduleData } from '@/pages/home/ui/game-schedule/utils';
import { BookingGuide } from './BookingGuide';

interface Props {
   teamName: string | undefined;
}

export function TeamScheduleTab({ teamName }: Props) {
   const [weekYear, setWeekYear] = useState(CURRENT_YEAR);
   const [weekMonth, setWeekMonth] = useState(CURRENT_MONTH);
   const [selectedWeek, setSelectedWeek] = useState(CURRENT_WEEK);
   const [showPicker, setShowPicker] = useState(false);
   const pickerContainerRef = useRef<HTMLDivElement>(null);

   const filteredData = useMemo(() => {
      const byWeek = filterScheduleData(scheduleData, {
         activeTab: TAB_WEEK,
         weekMonth,
         selectedWeek,
         allMonth: weekMonth,
         weekYear,
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

   const handleConfirm = (year: number, month: number) => {
      setWeekYear(year);
      setWeekMonth(month);
      setSelectedWeek(1);
   };

   return (
      <>
         {/* 월/주차 네비게이터 */}
         <div className="flex flex-col gap-3 items-center w-full">
            {/* 년월 선택 — Figma: < 2025-07 > */}
            <div className="flex items-center gap-2 justify-center">
               <button
                  onClick={prevMonth}
                  className="flex items-center justify-center size-8 rounded-full hover:bg-gray-100 text-(--text-tertiary)"
               >
                  <ChevronLeft className="size-6" />
               </button>

               {/* 트리거 버튼 + picker를 같은 relative 컨테이너로 묶어 정확한 위치 기준 설정 */}
               <div ref={pickerContainerRef} className="relative">
                  <button
                     onClick={() => setShowPicker(v => !v)}
                     className="text-[24px] font-bold text-(--text-primary) leading-[1.5] min-w-[130px] text-center"
                  >
                     {weekYear}-{String(weekMonth).padStart(2, '0')}
                  </button>
                  {showPicker && (
                     <YearMonthPicker
                        year={weekYear}
                        month={weekMonth}
                        containerRef={pickerContainerRef}
                        onConfirm={handleConfirm}
                        onClose={() => setShowPicker(false)}
                     />
                  )}
               </div>

               <button
                  onClick={nextMonth}
                  className="flex items-center justify-center size-8 rounded-full hover:bg-gray-100 text-(--text-tertiary)"
               >
                  <ChevronRight className="size-6" />
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
               <ScheduleList activeTab={TAB_WEEK} filteredData={filteredData} />
            </div>

            {/* 예매 안내 */}
            <BookingGuide />
         </div>
      </>
   );
}
