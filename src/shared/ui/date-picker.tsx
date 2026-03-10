// src/shared/ui/date-picker.tsx

import { useRef } from 'react';
import { CalendarDays } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface DatePickerProps {
   value: string;
   onChange: (value: string) => void;
   placeholder?: string;
   className?: string;
}

export function DatePicker({
   value,
   onChange,
   placeholder = '경기 일시 선택',
   className,
}: DatePickerProps) {
   const inputRef = useRef<HTMLInputElement>(null);

   const displayValue = value
      ? new Date(value).toLocaleDateString('ko-KR', {
           year: 'numeric',
           month: '2-digit',
           day: '2-digit',
        })
      : placeholder;

   return (
      <div
         className={cn(
            'bg-surface border border-border-light rounded-lg px-3 py-2',
            'flex items-center justify-between cursor-pointer w-full relative',
            className,
         )}
         onClick={() => inputRef.current?.showPicker?.()}
      >
         <span
            className={cn(
               'text-body-2-medium',
               value ? 'text-foreground' : 'text-muted-foreground',
            )}
         >
            {displayValue}
         </span>
         <CalendarDays className="size-4 text-muted-foreground shrink-0" />

         {/* 네이티브 date input — 보이지 않지만 picker를 열기 위해 사용 */}
         <input
            ref={inputRef}
            type="date"
            value={value}
            onChange={e => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 w-full cursor-pointer"
            tabIndex={-1}
         />
      </div>
   );
}
