// src/pages/tickets/ui/TabToggle.tsx

import { cn } from '@/shared/lib/utils';
import type { TabType } from './types';

interface TabToggleProps {
   value: TabType;
   onChange: (tab: TabType) => void;
   className?: string;
}

/**
 * 예매/리셀 선택 토글
 * Figma: Traffic-Master > node 3008:15707
 * — 컨테이너: bg-surface(#f7f8f9), border-border-light, rounded-[8px], p-1
 * — 활성 탭: bg-background(white), rounded-[6px], text-secondary
 * — 비활성 탭: 배경 없음, text-muted-foreground
 */
export function TabToggle({ value, onChange, className }: TabToggleProps) {
   return (
      <div
         role="radiogroup"
         aria-label="예매/리셀 선택"
         className={cn(
            'flex gap-1 items-center bg-surface border border-border-light rounded-[8px] p-1 w-full',
            className,
         )}
      >
         {(['예매', '리셀'] as TabType[]).map(tab => (
            <button
               key={tab}
               type="button"
               role="radio"
               aria-checked={value === tab}
               onClick={() => onChange(tab)}
               className={cn(
                  'flex-1 flex items-center justify-center px-[10px] py-[6px] rounded-[6px] text-[13px] text-body-3-semibold leading-[1.5] transition-colors',
                  value === tab ? 'bg-background text---text-foreground)' : 'text-disabled-foreground',
               )}
            >
               {tab}
            </button>
         ))}
      </div>
   );
}
