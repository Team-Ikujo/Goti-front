// src/pages/home/ui/game-schedule/WeekNavigator.tsx
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState } from 'react';

import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';

import { WEEK_OPTIONS } from './constants';
import { MonthPicker, YearPicker } from './YearMonthPicker';

type WeekNavigatorProps = {
   weekYear: number;
   weekMonth: number;
   selectedWeek: number;
   onReset: () => void;
   onPrevMonth: () => void;
   onNextMonth: () => void;
   onSelectYear: (year: number) => void;
   onSelectMonth: (month: number) => void;
   onSelectWeek: (week: number) => void;
};

function WeekNavigator({
   weekYear,
   weekMonth,
   selectedWeek,
   onReset,
   onPrevMonth,
   onNextMonth,
   onSelectYear,
   onSelectMonth,
   onSelectWeek,
}: WeekNavigatorProps) {
   const [showYearPicker, setShowYearPicker] = useState(false);
   const [showMonthPicker, setShowMonthPicker] = useState(false);

   const yearContainerRef = useRef<HTMLDivElement>(null);
   const monthContainerRef = useRef<HTMLDivElement>(null);

   return (
      <div className="flex flex-col gap-3">
         <div className="flex items-center gap-3.5 justify-center">
            <Badge asChild variant="chipDestructive" className="opacity-50">
               <button onClick={onReset}>최근</button>
            </Badge>

            <div className="flex items-center gap-2">
               <button
                  onClick={onPrevMonth}
                  className="flex items-center justify-center size-8 rounded-full hover:bg-gray-100 text-(--text-tertiary)"
               >
                  <ChevronLeft className="size-5 text-icon-primary" />
               </button>

               <div className="flex items-center text-heading-1-semibold text-foreground leading-normal">
                  {/* 연도 버튼 */}
                  <div ref={yearContainerRef} className="relative">
                     <button
                        onClick={() => {
                           setShowYearPicker(v => !v);
                           setShowMonthPicker(false);
                        }}
                        className="hover:text-primary transition-colors"
                     >
                        {weekYear}
                     </button>
                     {showYearPicker && (
                        <YearPicker
                           year={weekYear}
                           containerRef={yearContainerRef}
                           onSelect={onSelectYear}
                           onClose={() => setShowYearPicker(false)}
                        />
                     )}
                  </div>

                  <span className="mx-0.5">-</span>

                  {/* 월 버튼 */}
                  <div ref={monthContainerRef} className="relative">
                     <button
                        onClick={() => {
                           setShowMonthPicker(v => !v);
                           setShowYearPicker(false);
                        }}
                        className="hover:text-primary transition-colors"
                     >
                        {String(weekMonth).padStart(2, '0')}
                     </button>
                     {showMonthPicker && (
                        <MonthPicker
                           month={weekMonth}
                           containerRef={monthContainerRef}
                           onSelect={onSelectMonth}
                           onClose={() => setShowMonthPicker(false)}
                        />
                     )}
                  </div>
               </div>

               <button
                  onClick={onNextMonth}
                  className="flex items-center justify-center size-8 rounded-full hover:bg-gray-100 text-(--text-tertiary)"
               >
                  <ChevronRight className="size-5 text-icon-primary" />
               </button>
            </div>

            <div className="w-14" />
         </div>

         <div className="flex gap-7.5 justify-center">
            {WEEK_OPTIONS.map(week => {
               const isSelected = week === selectedWeek;
               return (
                  <Button
                     key={week}
                     onClick={() => onSelectWeek(week)}
                     variant={isSelected ? 'secondary' : 'tertiary'}
                     className={cn(
                        'px-5.5 py-2.25 rounded-[10px] text-heading-3-semibold leading-normal',
                        !isSelected && 'border-[#161d24] text-[#161d24]',
                     )}
                  >
                     {week}주차
                  </Button>
               );
            })}
         </div>
      </div>
   );
}

export default WeekNavigator;
