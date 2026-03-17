// src/pages/home/ui/game-schedule/YearMonthPicker.tsx

import { ChevronDown, ChevronUp } from 'lucide-react';
import { useEffect, useState } from 'react';

import { cn } from '@/shared/lib/utils';

import { AVAILABLE_YEARS } from './constants';

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const WINDOW_SIZE = 6;

interface YearMonthPickerProps {
   year: number;
   month: number;
   /** 트리거 버튼을 포함하는 컨테이너 ref — 외부 클릭 감지 기준 */
   containerRef: React.RefObject<HTMLDivElement | null>;
   onSelectYear: (year: number) => void;
   onSelectMonth: (month: number) => void;
   onClose: () => void;
   /** true면 연도 박스만 표시 (전체일정용) */
   yearOnly?: boolean;
}

/** 연도 또는 월 하나를 스크롤 가능한 세로 목록으로 표시하는 공통 피커 박스 */
function PickerBox({
   items,
   selectedItem,
   windowStart,
   onScrollUp,
   onScrollDown,
   onSelect,
   formatItem,
   width,
}: {
   items: number[];
   selectedItem: number;
   windowStart: number;
   onScrollUp: () => void;
   onScrollDown: () => void;
   onSelect: (item: number) => void;
   formatItem: (item: number) => string;
   width: string;
}) {
   const visibleItems = items.slice(windowStart, windowStart + WINDOW_SIZE);

   return (
      <div
         className={cn(
            'flex flex-col items-center bg-white rounded-lg border border-[#e5e5e5] shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)] p-1.5',
            width,
         )}
      >
         {/* 위로 스크롤 */}
         <button
            onClick={onScrollUp}
            className="flex items-center justify-center w-full py-2 text-[#646f7c] hover:bg-gray-50 rounded-[4px]"
         >
            <ChevronUp className="size-5" />
         </button>

         {/* 항목 목록 */}
         {visibleItems.map(item => (
            <button
               key={item}
               onClick={() => onSelect(item)}
               className={cn(
                  'w-full px-[4px] py-[6px] rounded-[4px] text-[24px] leading-[1.5] text-center transition-colors',
                  item === selectedItem
                     ? 'bg-[#f5f5f5] font-semibold text-[#171717]'
                     : 'font-normal text-[#0a0a0a] hover:bg-gray-50',
               )}
            >
               {formatItem(item)}
            </button>
         ))}

         {/* 아래로 스크롤 */}
         <button
            onClick={onScrollDown}
            className="flex items-center justify-center w-full py-2 text-[#646f7c] hover:bg-gray-50 rounded-[4px]"
         >
            <ChevronDown className="size-5" />
         </button>
      </div>
   );
}

export function YearMonthPicker({
   year,
   month,
   containerRef,
   onSelectYear,
   onSelectMonth,
   onClose,
   yearOnly = false,
}: YearMonthPickerProps) {
   const yearIdx = AVAILABLE_YEARS.indexOf(year);

   // 현재 연도가 윈도우 중앙에 오도록 초기 위치 계산
   const [yearStart, setYearStart] = useState(() =>
      Math.max(0, Math.min(yearIdx - 2, AVAILABLE_YEARS.length - WINDOW_SIZE)),
   );

   // 현재 월이 윈도우 중앙에 오도록 초기 위치 계산 (0-indexed)
   const [monthStart, setMonthStart] = useState(() => Math.max(0, Math.min(month - 1 - 2, 12 - WINDOW_SIZE)));

   // 화살표 = 선택값 변경 + 윈도우가 선택 항목을 따라감
   // (AVAILABLE_YEARS.length === WINDOW_SIZE라 window만 이동하면 변화 없음)
   const scrollYearUp = () => {
      const idx = AVAILABLE_YEARS.indexOf(year);
      const newIdx = idx <= 0 ? AVAILABLE_YEARS.length - 1 : idx - 1;
      onSelectYear(AVAILABLE_YEARS[newIdx]);
      setYearStart(s => {
         if (newIdx < s) return newIdx;
         if (newIdx >= s + WINDOW_SIZE) return Math.max(0, newIdx - WINDOW_SIZE + 1);
         return s;
      });
   };
   const scrollYearDown = () => {
      const idx = AVAILABLE_YEARS.indexOf(year);
      const newIdx = idx >= AVAILABLE_YEARS.length - 1 ? 0 : idx + 1;
      onSelectYear(AVAILABLE_YEARS[newIdx]);
      setYearStart(s => {
         if (newIdx < s) return newIdx;
         if (newIdx >= s + WINDOW_SIZE) return Math.max(0, newIdx - WINDOW_SIZE + 1);
         return s;
      });
   };
   const scrollMonthUp = () => {
      const newMonth = month <= 1 ? 12 : month - 1;
      onSelectMonth(newMonth);
      const newIdx = newMonth - 1;
      setMonthStart(s => {
         if (newIdx < s) return newIdx;
         if (newIdx >= s + WINDOW_SIZE) return Math.max(0, newIdx - WINDOW_SIZE + 1);
         return s;
      });
   };
   const scrollMonthDown = () => {
      const newMonth = month >= 12 ? 1 : month + 1;
      onSelectMonth(newMonth);
      const newIdx = newMonth - 1;
      setMonthStart(s => {
         if (newIdx < s) return newIdx;
         if (newIdx >= s + WINDOW_SIZE) return Math.max(0, newIdx - WINDOW_SIZE + 1);
         return s;
      });
   };

   // containerRef 기준 외부 클릭 → 닫힘
   useEffect(() => {
      function handleClickOutside(e: MouseEvent) {
         if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
            onClose();
         }
      }
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
   }, [containerRef, onClose]);

   return (
      // 두 박스를 가로로 나란히 배치 — 각각 독립된 테두리/그림자 유지
      <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 flex">
         {/* 연도 피커 박스 */}
         <PickerBox
            items={AVAILABLE_YEARS}
            selectedItem={year}
            windowStart={yearStart}
            onScrollUp={scrollYearUp}
            onScrollDown={scrollYearDown}
            onSelect={onSelectYear}
            formatItem={y => String(y)}
            width="w-[76px]"
         />

         {/* 월 피커 박스 (전체일정에서는 숨김) */}
         {!yearOnly && (
            <PickerBox
               items={MONTHS}
               selectedItem={month}
               windowStart={monthStart}
               onScrollUp={scrollMonthUp}
               onScrollDown={scrollMonthDown}
               onSelect={onSelectMonth}
               formatItem={m => String(m).padStart(2, '0')}
               width="w-[54px]"
            />
         )}
      </div>
   );
}

export default YearMonthPicker;
