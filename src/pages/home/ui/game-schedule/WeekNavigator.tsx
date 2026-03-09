import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';

import { WEEK_OPTIONS } from './constants';
import YearMonthPicker from './YearMonthPicker';

type WeekNavigatorProps = {
  weekYear: number;
  weekMonth: number;
  selectedWeek: number;
  showWeekPicker: boolean;
  onReset: () => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onOpenPicker: () => void;
  onClosePicker: () => void;
  onConfirmPicker: (year: number, month: number) => void;
  onSelectWeek: (week: number) => void;
};

function WeekNavigator({
  weekYear,
  weekMonth,
  selectedWeek,
  showWeekPicker,
  onReset,
  onPrevMonth,
  onNextMonth,
  onOpenPicker,
  onClosePicker,
  onConfirmPicker,
  onSelectWeek,
}: WeekNavigatorProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="relative flex items-center gap-3.5 justify-center">
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
          <button
            onClick={onOpenPicker}
            className="text-[18px] font-bold text-(--text-primary) leading-[1.5] min-w-[110px] text-center"
          >
            {weekYear}-{String(weekMonth).padStart(2, '0')}
          </button>
          <button
            onClick={onNextMonth}
            className="flex items-center justify-center size-8 rounded-full hover:bg-gray-100 text-(--text-tertiary)"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>

        <div className="w-[56px]" />

        {showWeekPicker && (
          <YearMonthPicker
            year={weekYear}
            month={weekMonth}
            onConfirm={onConfirmPicker}
            onClose={onClosePicker}
          />
        )}
      </div>

      <div className="flex gap-[30px] justify-center">
        {WEEK_OPTIONS.map((week) => (
          <Button
            key={week}
            onClick={() => onSelectWeek(week)}
            variant={week === selectedWeek ? 'primaryline' : 'outline'}
            className={cn(
              'px-[22px] py-[9px] rounded-[10px] text-[length:var(--typo---heading\/h4,20px)] font-semibold leading-[1.5]',
              week !== selectedWeek && 'shadow-[inset_0_0_0_1px_#161d24] text-[#161d24]',
            )}
          >
            {week}주차
          </Button>
        ))}
      </div>
    </div>
  );
}

export default WeekNavigator;
