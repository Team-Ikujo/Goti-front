// src/pages/home/ui/game-schedule/WeekNavigator.tsx

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState } from 'react';

import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';

import { WEEK_OPTIONS } from './constants';
import { YearMonthPicker } from './YearMonthPicker';

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
   const pickerContainerRef = useRef<HTMLDivElement>(null);
   const [showPicker, setShowPicker] = useState(false);

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
                  <ChevronLeft className="size-5" />
               </button>

               {/* 트리거 + 피커 컨테이너 */}
               <div ref={pickerContainerRef} className="relative">
                  <button
                     onClick={() => setShowPicker(prev => !prev)}
                     className="text-heading-3-semibold text-foreground leading-normal min-w-[110px] text-center"
                  >
                     {weekYear}-{String(weekMonth).padStart(2, '0')}
                  </button>

                  {showPicker && (
                     <YearMonthPicker
                        year={weekYear}
                        month={weekMonth}
                        containerRef={pickerContainerRef}
                        onSelectYear={onSelectYear}
                        onSelectMonth={onSelectMonth}
                        onClose={() => setShowPicker(false)}
                     />
                  )}
               </div>

               <button
                  onClick={onNextMonth}
                  className="flex items-center justify-center size-8 rounded-full hover:bg-gray-100 text-(--text-tertiary)"
               >
                  <ChevronRight className="size-5" />
               </button>
            </div>

            <div className="w-[56px]" />
         </div>

         {/* 주차 버튼
              justify-between이 갭을 자동 분배:
                컨테이너 560px(max-w-140): 버튼 88px × 5 + 갭 30px × 4 = 560px
                컨테이너 343px(min): 버튼 67px × 5 + 갭 2px × 4 = 343px
              버튼 너비 보간: clamp(67, 33.81px + 9.68%, 88) */}
         <div className="flex justify-between w-full max-w-140 mx-auto min-w-[343px]">
            {WEEK_OPTIONS.map(week => {
               const isSelected = week === selectedWeek;
               return (
                  <Button
                     key={week}
                     onClick={() => onSelectWeek(week)}
                     variant={isSelected ? 'secondary' : 'tertiary'}
                     className={cn(
                        'w-[clamp(67px,_calc(33.81px_+_9.68%),_88px)] shrink-0 px-5.5 py-2.25 rounded-[10px] text-heading-3-semibold leading-normal h-auto overflow-hidden',
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
