// src/pages/home/ui/game-schedule/YearMonthPicker.tsx
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useEffect, useState } from 'react';

import { cn } from '@/shared/lib/utils';
import { AVAILABLE_YEARS } from './constants';

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

// containerRef 기준으로 외부 클릭 감지 → 피커 닫기
function useClickOutside(containerRef: React.RefObject<HTMLDivElement | null>, onClose: () => void) {
   useEffect(() => {
      function handleMouseDown(e: MouseEvent) {
         if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
            onClose();
         }
      }
      document.addEventListener('mousedown', handleMouseDown);
      return () => document.removeEventListener('mousedown', handleMouseDown);
   }, [containerRef, onClose]);
}

// ─── 연도 피커 ─────────────────────────────────────────────
export type YearPickerProps = {
   year: number;
   containerRef: React.RefObject<HTMLDivElement | null>;
   onSelect: (year: number) => void;
   onClose: () => void;
};

export function YearPicker({ year, containerRef, onSelect, onClose }: YearPickerProps) {
   useClickOutside(containerRef, onClose);
   // 화살표: 피커 내부 하이라이트만 이동 (부모 상태 즉시 변경 X)
   // 항목 클릭: onSelect 호출 후 닫힘 → 그때 부모 상태 적용
   const [localYear, setLocalYear] = useState(year);
   const yearIdx = AVAILABLE_YEARS.indexOf(localYear);

   return (
      <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 bg-white rounded-lg shadow-[0px_4px_6px_0px_rgba(0,0,0,0.1),0px_2px_4px_0px_rgba(0,0,0,0.1)] border border-border p-1.5 flex flex-col items-start w-20">
         <button
            onClick={() => yearIdx > 0 && setLocalYear(AVAILABLE_YEARS[yearIdx - 1])}
            disabled={yearIdx === 0}
            className="flex items-center justify-center w-full py-1 hover:bg-gray-50 disabled:opacity-30 rounded-sm"
         >
            <ChevronUp className="size-5 text-icon-primary" />
         </button>
         {AVAILABLE_YEARS.map(y => (
            <button
               key={y}
               onClick={() => {
                  onSelect(y);
                  onClose();
               }}
               className={cn(
                  'w-full px-1 py-1.5 text-center leading-normal rounded-sm transition-colors',
                  y === localYear
                     ? 'bg-[#f5f5f5] text-heading-1-semibold text-[#171717]'
                     : 'text-heading-1-regular text-foreground hover:bg-gray-50',
               )}
            >
               {y}
            </button>
         ))}
         <button
            onClick={() => yearIdx < AVAILABLE_YEARS.length - 1 && setLocalYear(AVAILABLE_YEARS[yearIdx + 1])}
            disabled={yearIdx === AVAILABLE_YEARS.length - 1}
            className="flex items-center justify-center w-full py-1 hover:bg-gray-50 disabled:opacity-30 rounded-sm"
         >
            <ChevronDown className="size-5 text-icon-primary" />
         </button>
      </div>
   );
}

// ─── 월 피커 ───────────────────────────────────────────────
export type MonthPickerProps = {
   month: number;
   containerRef: React.RefObject<HTMLDivElement | null>;
   onSelect: (month: number) => void;
   onClose: () => void;
};

const VISIBLE_MONTH_COUNT = 6;

export function MonthPicker({ month, containerRef, onSelect, onClose }: MonthPickerProps) {
   useClickOutside(containerRef, onClose);
   // 항목 클릭: onSelect 호출 후 닫힘 → 그때 부모 상태 적용
   const [localMonth, setLocalMonth] = useState(month);
   // 화살표: 6개 단위 슬라이딩 윈도우의 시작 인덱스 (0 or 6)
   const [visibleStart, setVisibleStart] = useState(month > 6 ? 6 : 0);

   const visibleMonths = MONTHS.slice(visibleStart, visibleStart + VISIBLE_MONTH_COUNT);
   const canScrollUp = visibleStart > 0;
   const canScrollDown = visibleStart + VISIBLE_MONTH_COUNT < MONTHS.length;

   return (
      <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 bg-white rounded-lg shadow-[0px_4px_6px_0px_rgba(0,0,0,0.1),0px_2px_4px_0px_rgba(0,0,0,0.1)] border border-border p-1.5 flex flex-col items-center w-14">
         <button
            onClick={() => canScrollUp && setVisibleStart(v => v - 1)}
            disabled={!canScrollUp}
            className="flex items-center justify-center w-full py-1 hover:bg-gray-50 disabled:opacity-30 rounded-sm"
         >
            <ChevronUp className="size-5 text-icon-primary" />
         </button>
         {visibleMonths.map(m => (
            <button
               key={m}
               onClick={() => {
                  setLocalMonth(m);
                  onSelect(m);
                  onClose();
               }}
               className={cn(
                  'w-full px-1 py-1.5 text-center text-[24px] leading-normal rounded-sm transition-colors',
                  m === localMonth
                     ? 'bg-[#f5f5f5] font-semibold text-[#171717]'
                     : 'font-normal text-foreground hover:bg-gray-50',
               )}
            >
               {String(m).padStart(2, '0')}
            </button>
         ))}
         <button
            onClick={() => canScrollDown && setVisibleStart(v => v + 1)}
            disabled={!canScrollDown}
            className="flex items-center justify-center w-full py-1 hover:bg-gray-50 disabled:opacity-30 rounded-sm"
         >
            <ChevronDown className="size-5 text-icon-primary" />
         </button>
      </div>
   );
}
