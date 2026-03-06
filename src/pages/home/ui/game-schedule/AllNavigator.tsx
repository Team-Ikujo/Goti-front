import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';

import { DISABLED_MONTHS, SEASON_MONTHS } from './constants';
import YearMonthPicker from './YearMonthPicker';

type AllNavigatorProps = {
  allYear: number;
  allMonth: number;
  showAllPicker: boolean;
  onReset: () => void;
  onPrevYear: () => void;
  onNextYear: () => void;
  onOpenPicker: () => void;
  onClosePicker: () => void;
  onConfirmPicker: (year: number, month: number) => void;
  onSelectMonth: (month: number) => void;
};

function AllNavigator({
  allYear,
  allMonth,
  showAllPicker,
  onReset,
  onPrevYear,
  onNextYear,
  onOpenPicker,
  onClosePicker,
  onConfirmPicker,
  onSelectMonth,
}: AllNavigatorProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="relative flex items-center gap-3.5 justify-center">
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
          <button
            onClick={onOpenPicker}
            className="text-[18px] font-bold text-(--text-primary) leading-[1.5] min-w-[60px] text-center"
          >
            {allYear}
          </button>
          <button
            onClick={onNextYear}
            className="flex items-center justify-center size-8 rounded-full hover:bg-gray-100 text-(--text-tertiary)"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>

        <div className="w-[56px]" />

        {showAllPicker && (
          <YearMonthPicker
            year={allYear}
            month={allMonth}
            onConfirm={onConfirmPicker}
            onClose={onClosePicker}
          />
        )}
      </div>

      <div className="flex w-full">
        {SEASON_MONTHS.map((month) => {
          const isDisabled = DISABLED_MONTHS.includes(month);
          const isSelected = month === allMonth;

          return (
            <Button
              key={month}
              onClick={() => !isDisabled && onSelectMonth(month)}
              disabled={isDisabled}
              variant={isSelected ? 'primaryline' : 'outline'}
              className={cn(
                'flex-1 h-[48px] px-[22px] py-[9px] rounded-tl-[10px] rounded-tr-[10px] rounded-bl-none rounded-br-none',
                !isSelected && !isDisabled && 'shadow-[inset_0_0_0_1px_#161d24] text-[#161d24]',
                isDisabled && 'shadow-[inset_0_0_0_1px_#acb4bb] text-[#acb4bb]',
              )}
            >
              <span className="flex items-end">
                <span className="text-[length:var(--typo---heading\/h3,24px)] font-bold leading-[1.5]">{month}</span>
                <span className="text-[length:var(--typo---paragraph\/p1,14px)] font-medium leading-[1.5]">월</span>
              </span>
            </Button>
          );
        })}
        <Button
          disabled
          variant="outline"
          className="h-[48px] px-[22px] py-[9px] rounded-tl-[10px] rounded-tr-[10px] rounded-bl-none rounded-br-none w-[120px] shrink-0 shadow-[inset_0_0_0_1px_#acb4bb] text-[#acb4bb] text-[length:var(--typo---heading\/h4,20px)] font-semibold leading-[1.5]"
        >
          포스트 시즌
        </Button>
      </div>
    </div>
  );
}

export default AllNavigator;
