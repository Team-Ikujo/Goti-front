// src/shared/ui/select.tsx

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
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

export function Select({ value, onChange, options, placeholder = '선택', className }: SelectProps) {
   const [isOpen, setIsOpen] = useState(false);
   const containerRef = useRef<HTMLDivElement>(null);

   const selectedLabel = options.find(o => o.value === value)?.label;

   /** 외부 클릭 시 닫기 */
   useEffect(() => {
      if (!isOpen) return;
      const handler = (e: MouseEvent) => {
         if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
            setIsOpen(false);
         }
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
   }, [isOpen]);

   const handleSelect = (optValue: string) => {
      onChange(optValue);
      setIsOpen(false);
   };

   return (
      <div ref={containerRef} className={cn('relative w-full', className)}>
         {/* 트리거 */}
         <button
            type="button"
            onClick={() => setIsOpen(prev => !prev)}
            className="bg-surface border border-border-light rounded-lg px-[13px] h-9 flex items-center justify-between w-full"
            aria-haspopup="listbox"
            aria-expanded={isOpen}
         >
            <span className={cn('text-body-2-medium', value ? 'text-foreground' : 'text-neutral-600')}>
               {selectedLabel ?? placeholder}
            </span>
            <ChevronDown
               className={cn('size-4 text-neutral-500 shrink-0 transition-transform', isOpen && 'rotate-180')}
            />
         </button>

         {/* 드롭다운 */}
         {isOpen && (
            <div
               role="listbox"
               className="absolute z-50 top-[calc(100%+4px)] left-0 right-0 bg-white border border-[#e9ebee] rounded-[8px] p-[5px] shadow-[0px_4px_12px_rgba(0,0,0,0.08)]"
            >
               {/* 선택 해제 옵션 */}
               <button
                  type="button"
                  role="option"
                  aria-selected={value === ''}
                  onClick={() => handleSelect('')}
                  className={cn(
                     'w-full flex items-center justify-between rounded-[6px] px-3 py-[6px] text-body-2-regular transition-colors',
                     value === ''
                        ? 'bg-surface text-foreground font-medium'
                        : 'text-[#646f7c] hover:bg-surface',
                  )}
               >
                  <span>{placeholder}</span>
                  {value === '' && <ChevronRight className="size-4 text-foreground shrink-0" />}
               </button>

               {options.map(opt => (
                  <button
                     key={opt.value}
                     type="button"
                     role="option"
                     aria-selected={value === opt.value}
                     onClick={() => handleSelect(opt.value)}
                     className={cn(
                        'w-full flex items-center justify-between rounded-[6px] px-3 py-[6px] text-body-2-regular transition-colors',
                        value === opt.value
                           ? 'bg-surface text-foreground font-medium'
                           : 'text-[#646f7c] hover:bg-surface',
                     )}
                  >
                     <span>{opt.label}</span>
                     {value === opt.value && <ChevronRight className="size-4 text-foreground shrink-0" />}
                  </button>
               ))}
            </div>
         )}
      </div>
   );
}
