// src/pages/home/ui/game-schedule/AllNavigator.tsx
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState } from 'react';

import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';

import { DISABLED_MONTHS, SEASON_MONTHS } from './constants';
import { YearMonthPicker } from './YearMonthPicker';

type AllNavigatorProps = {
   allYear: number;
   allMonth: number;
   onReset: () => void;
   onPrevYear: () => void;
   onNextYear: () => void;
   onSelectYear: (year: number) => void;
   onSelectMonth: (month: number) => void;
};

function AllNavigator({
   allYear,
   allMonth,
   onReset,
   onPrevYear,
   onNextYear,
   onSelectYear,
   onSelectMonth,
}: AllNavigatorProps) {
  const pickerContainerRef = useRef<HTMLDivElement>(null);
  const [showAllPicker, setShowAllPicker] = useState(false);

  const onOpenPicker = () => setShowAllPicker(true);
  const onClosePicker = () => setShowAllPicker(false);
  const onConfirmPicker = (year: number, month: number) => {
    onSelectYear(year);
    onSelectMonth(month);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3.5 justify-center">
        <Badge asChild variant="chipDestructive" className="opacity-50">
          <button onClick={onReset}>최근</button>
        </Badge>

        <div className="flex items-center gap-2">
          <button
            onClick={onPrevYear}
            className="flex items-center justify-center size-8 rounded-full hover:bg-gray-100 text-(--text-tertiary)"
          >
            <ChevronLeft className="size-5" />
          </button>

          {/* 트리거 버튼 + picker를 같은 relative 컨테이너로 묶어 정확한 위치 기준 설정 */}
          <div ref={pickerContainerRef} className="relative">
            <button
              onClick={onOpenPicker}
              className="text-[18px] font-bold text-(--text-primary) leading-[1.5] min-w-[60px] text-center"
            >
              {allYear}
            </button>
            {showAllPicker && (
              <YearMonthPicker
                year={allYear}
                month={allMonth}
                containerRef={pickerContainerRef}
                onConfirm={onConfirmPicker}
                onClose={onClosePicker}
              />
            )}
          </div>

          <button
            onClick={onNextYear}
            className="flex items-center justify-center size-8 rounded-full hover:bg-gray-100 text-(--text-tertiary)"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>

        <div className="w-[56px]" />
      </div>

         <div className="flex w-full">
            {SEASON_MONTHS.map((month, index) => {
               const isDisabled = DISABLED_MONTHS.includes(month);
               const isSelected = month === allMonth;

               return (
                  <Button
                     key={month}
                     onClick={() => !isDisabled && onSelectMonth(month)}
                     disabled={isDisabled}
                     variant={isSelected ? 'secondary' : 'tertiary'}
                     className={cn(
                        'flex-1 h-12 px-5.5 py-2.25 rounded-tl-[10px] rounded-tr-[10px] rounded-bl-none rounded-br-none',
                        index > 0 && '-ml-px',
                        isSelected && 'border-b-0 z-10',
                        !isSelected && !isDisabled && 'border-[#161d24] text-[#161d24]',
                        isDisabled && 'border-[#acb4bb]',
                     )}
                  >
                     <span className="flex items-end">
                        <span className="text-heading-1-bold leading-normal">{month}</span>
                        <span className="text-body-2-medium leading-normal">월</span>
                     </span>
                  </Button>
               );
            })}
            <Button
               disabled
               variant="tertiary"
               className="-ml-px h-12 px-5.5 py-2.25 rounded-tl-[10px] rounded-tr-[10px] rounded-bl-none rounded-br-none w-30 shrink-0 border-[#acb4bb] text-disabled-foreground text-heading-3-semibold leading-normal"
            >
               포스트 시즌
            </Button>
         </div>
      </div>
   );
}

export default AllNavigator;
