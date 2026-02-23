import * as React from 'react';
import { cn } from '@/shared/lib/utils';

type InputProps = Omit<React.ComponentProps<'input'>, 'size'> & {
   label?: string;
   required?: boolean;
   helpText?: string;
   error?: boolean;
};

function Input({ className, label, required, helpText, error, disabled, type, ...props }: InputProps) {
   return (
      <div className={cn('flex flex-col gap-1', className)}>
         {label && (
            <label className={cn('text-label-2-medium', 'text-[14px]', 'text-muted-foreground')}>
               {label}
               {required && <span className="text-primary">*</span>}
            </label>
         )}

         <input
            type={type}
            disabled={disabled}
            aria-invalid={error || undefined}
            className={cn(
               'h-12 w-full rounded-lg border px-4 py-3 outline-none transition-colors antialiased',
               'text-foreground',
               'placeholder:text-disabled-foreground',
               'focus:border-(--border-heavy)',
               error && 'border-destructive focus:border-destructive',
               disabled && 'cursor-not-allowed bg-(--fill-disabled) text-disabled-foreground',
            )}
            {...props}
         />

         {helpText && (
            <p
               className={cn(
                  'text-(--label-3-regular) text-xs antialiased',
                  error ? 'text-destructive' : 'text-(--text-tertiary)',
               )}
            >
               {helpText}
            </p>
         )}
      </div>
   );
}

export { Input };
