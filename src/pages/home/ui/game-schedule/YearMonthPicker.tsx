import { cn } from '@/shared/lib/utils';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { AVAILABLE_YEARS } from './constants';

type YearMonthPickerProps = {
   year: number;
   month: number;
   onConfirm: (year: number, month: number) => void;
   onClose: () => void;
};

const MONTHS = Array.from({ length: 12 }, (_, index) => index + 1);

function YearMonthPicker({ year, month, onConfirm, onClose }: YearMonthPickerProps) {
   const [localYear, setLocalYear] = useState(year);
   const [localMonth, setLocalMonth] = useState(month);
   const pickerRef = useRef<HTMLDivElement>(null);

   useEffect(() => {
      function handleClickOutside(e: MouseEvent) {
         if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
            onClose();
         }
      }

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
   }, [onClose]);

   const yearIdx = AVAILABLE_YEARS.indexOf(localYear);
   const canPrevYear = yearIdx > 0;
   const canNextYear = yearIdx < AVAILABLE_YEARS.length - 1;

   return (
      <div
         ref={pickerRef}
         className="absolute top-10 left-1/2 -translate-x-1/2 z-50 bg-white rounded-[12px] shadow-xl border border-(--border-normal) overflow-hidden"
      >
         <div className="flex">
            <div className="flex flex-col items-center w-[100px] border-r border-(--border-normal)">
               <button
                  onClick={() => canPrevYear && setLocalYear(AVAILABLE_YEARS[yearIdx - 1])}
                  disabled={!canPrevYear}
                  className="flex items-center justify-center w-full py-[10px] text-[#646f7c] hover:bg-gray-50 disabled:opacity-30"
               >
                  <ChevronUp className="size-5" />
               </button>
               <div className="flex flex-col items-center w-full py-[6px]">
                  {AVAILABLE_YEARS.map(candidateYear => (
                     <button
                        key={candidateYear}
                        onClick={() => setLocalYear(candidateYear)}
                        className={cn(
                           'w-full py-[8px] text-center text-[16px] leading-[1.5] transition-colors',
                           candidateYear === localYear
                              ? 'font-bold text-(--text-primary)'
                              : 'font-medium text-[#acb4bb] hover:text-(--text-primary)',
                        )}
                     >
                        {candidateYear}
                     </button>
                  ))}
               </div>
               <button
                  onClick={() => canNextYear && setLocalYear(AVAILABLE_YEARS[yearIdx + 1])}
                  disabled={!canNextYear}
                  className="flex items-center justify-center w-full py-[10px] text-[#646f7c] hover:bg-gray-50 disabled:opacity-30"
               >
                  <ChevronDown className="size-5" />
               </button>
            </div>

            <div className="flex flex-col items-center w-[80px]">
               <button
                  onClick={() => setLocalMonth(currentMonth => (currentMonth === 1 ? 12 : currentMonth - 1))}
                  className="flex items-center justify-center w-full py-[10px] text-[#646f7c] hover:bg-gray-50"
               >
                  <ChevronUp className="size-5" />
               </button>
               <div className="flex flex-col items-center w-full py-[6px]">
                  {MONTHS.map(candidateMonth => (
                     <button
                        key={candidateMonth}
                        onClick={() => setLocalMonth(candidateMonth)}
                        className={cn(
                           'w-full py-[8px] text-center text-[16px] leading-[1.5] transition-colors',
                           candidateMonth === localMonth
                              ? 'font-bold text-(--text-primary)'
                              : 'font-medium text-[#acb4bb] hover:text-(--text-primary)',
                        )}
                     >
                        {String(candidateMonth).padStart(2, '0')}
                     </button>
                  ))}
               </div>
               <button
                  onClick={() => setLocalMonth(currentMonth => (currentMonth === 12 ? 1 : currentMonth + 1))}
                  className="flex items-center justify-center w-full py-[10px] text-[#646f7c] hover:bg-gray-50"
               >
                  <ChevronDown className="size-5" />
               </button>
            </div>
         </div>

         <div className="flex border-t border-(--border-normal)">
            <button
               onClick={onClose}
               className="flex-1 py-[12px] text-[14px] font-medium text-[#646f7c] hover:bg-gray-50"
            >
               취소
            </button>
            <button
               onClick={() => onConfirm(localYear, localMonth)}
               className="flex-1 py-[12px] text-[14px] font-semibold text-primary border-l border-(--border-normal) hover:bg-blue-50"
            >
               확인
            </button>
         </div>
      </div>
   );
}

export default YearMonthPicker;
