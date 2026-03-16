// src/pages/teams/ui/TeamScheduleTab.tsx
import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Check } from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import ScheduleList from '@/pages/home/ui/game-schedule/ScheduleList';
import {
   AVAILABLE_YEARS,
   CURRENT_MONTH,
   CURRENT_WEEK,
   CURRENT_YEAR,
   WEEK_OPTIONS,
   TAB_WEEK,
   scheduleData,
} from '@/pages/home/ui/game-schedule/constants';
import { filterScheduleData } from '@/pages/home/ui/game-schedule/utils';
import { BookingGuide } from './BookingGuide';

// date-picker.tsx NavDropdown과 동일한 방식: 최신 순(내림차순)
const YEAR_LIST = [...AVAILABLE_YEARS].reverse();
const MONTH_LIST = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
const VISIBLE_COUNT = 6;

interface Props {
   teamName: string | undefined;
}

export function TeamScheduleTab({ teamName }: Props) {
   const [weekYear, setWeekYear] = useState(CURRENT_YEAR);
   const [weekMonth, setWeekMonth] = useState(CURRENT_MONTH);
   const [selectedWeek, setSelectedWeek] = useState(CURRENT_WEEK);
   const [showYearPicker, setShowYearPicker] = useState(false);
   const [showMonthPicker, setShowMonthPicker] = useState(false);

   // date-picker.tsx NavDropdown 스크롤 오프셋
   const [yearOffset, setYearOffset] = useState(() =>
      Math.max(0, Math.min(YEAR_LIST.indexOf(weekYear), YEAR_LIST.length - VISIBLE_COUNT)),
   );
   const [monthOffset, setMonthOffset] = useState(() =>
      Math.max(0, Math.min(MONTH_LIST.indexOf(weekMonth), MONTH_LIST.length - VISIBLE_COUNT)),
   );

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

   const toggleYearPicker = () => {
      setShowYearPicker(v => !v);
      setShowMonthPicker(false);
   };

   const toggleMonthPicker = () => {
      setShowMonthPicker(v => !v);
      setShowYearPicker(false);
   };

   const visibleYears = YEAR_LIST.slice(yearOffset, yearOffset + VISIBLE_COUNT);
   const visibleMonths = MONTH_LIST.slice(monthOffset, monthOffset + VISIBLE_COUNT);

   return (
      <>
         {/* 월/주차 네비게이터 */}
         <div className="flex flex-col gap-1 items-center w-full">
            {/* 년월 선택 */}
            <div className="flex flex-col items-center w-full gap-2">
               <div className="flex items-center justify-center gap-2.5 px-5.5 py-2.25 w-full">
                  <button
                     onClick={prevMonth}
                     className="flex items-center justify-center size-8 rounded-full hover:bg-gray-100 text-(--text-tertiary)"
                  >
                     <ChevronLeft className="size-5 md:size-6" />
                  </button>

                  {/* 연도 / 월 드롭다운 트리거 — date-picker.tsx 헤더와 동일한 구조 */}
                  <div className="flex items-center gap-1.5">
                     {/* 연도 버튼 */}
                     <button
                        onClick={toggleYearPicker}
                        className="bg-background border border-(--neutral-200) h-8 rounded-lg shadow-[0px_1px_2px_rgba(0,0,0,0.1)] flex items-center gap-1 pl-2 pr-1"
                     >
                        <span className="text-body-2-medium text-foreground">{weekYear}</span>
                        <ChevronDown className="size-3 text-foreground" />
                     </button>

                     {/* 월 버튼 */}
                     <button
                        onClick={toggleMonthPicker}
                        className="bg-background border border-(--neutral-200) h-8 rounded-lg shadow-[0px_1px_2px_rgba(0,0,0,0.1)] flex items-center gap-1 pl-2 pr-1 w-13.25"
                     >
                        <span className="text-body-2-medium text-foreground">
                           {String(weekMonth).padStart(2, '0')}
                        </span>
                        <ChevronDown className="size-3 text-foreground" />
                     </button>
                  </div>

                  <button
                     onClick={nextMonth}
                     className="flex items-center justify-center size-8 rounded-full hover:bg-gray-100 text-(--text-tertiary)"
                  >
                     <ChevronRight className="size-5 md:size-6" />
                  </button>
               </div>

               {/* 인라인 드롭다운 — absolute 없이 버튼 바로 아래에 배치 (normal flow) */}
               {(showYearPicker || showMonthPicker) && (
                  <div className="flex gap-2 justify-center">
                     {showYearPicker && (
                        <div
                           role="listbox"
                           className="bg-background border border-[var(--neutral-200)] rounded-lg shadow-[0px_4px_6px_rgba(0,0,0,0.1),0px_2px_4px_rgba(0,0,0,0.1)] p-1 w-16.5"
                        >
                           {yearOffset > 0 && (
                              <button
                                 type="button"
                                 onClick={() => setYearOffset(o => o - 1)}
                                 className="w-full flex items-center justify-center py-0.5 rounded hover:bg-surface transition-colors"
                              >
                                 <ChevronUp className="size-3 text-[var(--neutral-600)]" />
                              </button>
                           )}
                           {visibleYears.map(y => (
                              <button
                                 key={y}
                                 type="button"
                                 role="option"
                                 aria-selected={y === weekYear}
                                 onClick={() => {
                                    setWeekYear(y);
                                    setSelectedWeek(1);
                                    setShowYearPicker(false);
                                 }}
                                 className={cn(
                                    'w-full flex items-center justify-between px-1 py-1.5 rounded-sm text-body-2-regular transition-colors',
                                    y === weekYear
                                       ? 'bg-surface text-muted-foreground font-medium'
                                       : 'text-[var(--neutral-600)] hover:bg-surface',
                                 )}
                              >
                                 <span>{y}</span>
                                 {y === weekYear && <Check className="size-2.5 shrink-0 text-muted-foreground" />}
                              </button>
                           ))}
                           {yearOffset + VISIBLE_COUNT < YEAR_LIST.length && (
                              <button
                                 type="button"
                                 onClick={() => setYearOffset(o => o + 1)}
                                 className="w-full flex items-center justify-center py-0.5 rounded hover:bg-surface transition-colors"
                              >
                                 <ChevronDown className="size-3 text-[var(--neutral-600)]" />
                              </button>
                           )}
                        </div>
                     )}

                     {showMonthPicker && (
                        <div
                           role="listbox"
                           className="bg-background border border-[var(--neutral-200)] rounded-lg shadow-[0px_4px_6px_rgba(0,0,0,0.1),0px_2px_4px_rgba(0,0,0,0.1)] p-1 w-14"
                        >
                           {monthOffset > 0 && (
                              <button
                                 type="button"
                                 onClick={() => setMonthOffset(o => o - 1)}
                                 className="w-full flex items-center justify-center py-0.5 rounded hover:bg-surface transition-colors"
                              >
                                 <ChevronUp className="size-3 text-[var(--neutral-600)]" />
                              </button>
                           )}
                           {visibleMonths.map(m => (
                              <button
                                 key={m}
                                 type="button"
                                 role="option"
                                 aria-selected={m === weekMonth}
                                 onClick={() => {
                                    setWeekMonth(m);
                                    setSelectedWeek(1);
                                    setShowMonthPicker(false);
                                 }}
                                 className={cn(
                                    'w-full flex items-center justify-between px-1 py-1.5 rounded-sm text-body-2-regular transition-colors',
                                    m === weekMonth
                                       ? 'bg-surface text-muted-foreground font-medium'
                                       : 'text-[var(--neutral-600)] hover:bg-surface',
                                 )}
                              >
                                 <span>{String(m).padStart(2, '0')}</span>
                                 {m === weekMonth && <Check className="size-2.5 shrink-0 text-muted-foreground" />}
                              </button>
                           ))}
                           {monthOffset + VISIBLE_COUNT < MONTH_LIST.length && (
                              <button
                                 type="button"
                                 onClick={() => setMonthOffset(o => o + 1)}
                                 className="w-full flex items-center justify-center py-0.5 rounded hover:bg-surface transition-colors"
                              >
                                 <ChevronDown className="size-3 text-[var(--neutral-600)]" />
                              </button>
                           )}
                        </div>
                     )}
                  </div>
               )}
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
