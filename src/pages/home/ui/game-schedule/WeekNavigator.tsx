// src/pages/home/ui/game-schedule/WeekNavigator.tsx
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef } from 'react';

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
  const pickerContainerRef = useRef<HTMLDivElement>(null);

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

          {/* 트리거 버튼 + picker를 같은 relative 컨테이너로 묶어 정확한 위치 기준 설정 */}
          <div ref={pickerContainerRef} className="relative">
            <button
              onClick={onOpenPicker}
              className="text-[18px] font-bold text-(--text-primary) leading-[1.5] min-w-[110px] text-center"
            >
              {weekYear}-{String(weekMonth).padStart(2, '0')}
            </button>
            {showWeekPicker && (
              <YearMonthPicker
                year={weekYear}
                month={weekMonth}
                containerRef={pickerContainerRef}
                onConfirm={onConfirmPicker}
                onClose={onClosePicker}
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
