// src/pages/tickets/ui/payment/RadioOptionCard.tsx

import { cn } from '@/shared/lib/utils';

interface RadioOptionCardProps {
   selected: boolean;
   onSelect: () => void;
   label: string;
   description: string;
   extra?: string;
   disabled?: boolean;
}

export function RadioOptionCard({ selected, onSelect, label, description, extra, disabled }: RadioOptionCardProps) {
   return (
      <button
         type="button"
         onClick={onSelect}
         disabled={disabled}
         className={cn(
            'flex items-center gap-4 w-full px-[17px] py-[11px] rounded-[10px] border transition-colors text-left',
            selected ? 'border-primary' : 'border-border',
            disabled && 'cursor-default',
         )}
      >
         <div
            className={cn(
               'size-4 rounded-full shrink-0 flex items-center justify-center',
               selected ? 'bg-primary' : 'border-[1.5px] border-border',
            )}
         >
            {selected && <span className="size-[7px] rounded-full bg-white block" />}
         </div>
         <div className="flex-1 flex flex-col gap-1">
            <span className="text-[16px] font-bold leading-[1.5] text-foreground">{label}</span>
            <span className="text-[16px] font-medium leading-[1.5] text-(--text-secondary)">{description}</span>
         </div>
         {extra && <span className="text-[16px] font-medium leading-[1.5] text-foreground shrink-0">{extra}</span>}
      </button>
   );
}
