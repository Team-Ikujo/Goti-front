// src/shared/ui/select.tsx

import { ChevronDown } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface SelectOption {
   value: string;
   label: string;
}

interface SelectProps {
   value: string;
   onChange: (value: string) => void;
   options: SelectOption[];
   placeholder?: string;
   className?: string;
}

export function Select({
   value,
   onChange,
   options,
   placeholder = '선택',
   className,
}: SelectProps) {
   const selectedLabel = options.find(o => o.value === value)?.label;

   return (
      <div className={cn('relative w-full', className)}>
         {/* 커스텀 보기 레이어 */}
         <div className="bg-surface border border-border-light rounded-lg px-[13px] h-9 flex items-center justify-between pointer-events-none">
            <span className="text-body-2-medium text-muted-foreground">
               {selectedLabel ?? placeholder}
            </span>
            <ChevronDown className="size-4 text-muted-foreground shrink-0" />
         </div>

         {/* 실제 select — 위에 투명하게 올려서 클릭/접근성 처리 */}
         <select
            value={value}
            onChange={e => onChange(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label={placeholder}
         >
            <option value="">{placeholder}</option>
            {options.map(opt => (
               <option key={opt.value} value={opt.value}>
                  {opt.label}
               </option>
            ))}
         </select>
      </div>
   );
}
