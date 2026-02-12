import * as React from 'react';
import { CheckIcon, MinusIcon } from 'lucide-react';
import { Checkbox as CheckboxPrimitive } from 'radix-ui';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/shared/lib/utils';

const checkboxVariants = cva(
   'peer flex items-center justify-center shrink-0 rounded border transition-colors outline-none disabled:cursor-not-allowed',
   {
      variants: {
         size: {
            lg: 'size-6',
            md: 'size-[18px]',
         },
      },
      defaultVariants: {
         size: 'lg',
      },
   },
);

const labelVariants = cva('cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:text-disabled-foreground', {
   variants: {
      typography: {
         body1Medium: 'text-[14px] text-body-1-medium text-[var(--text-primary)]',
         body2Regular: 'text-[14px] text-body-2-regular text-[var(--text-secondary)]',
         body2Medium: 'text-[14px] text-body-2-medium text-[var(--text-primary)]',
         body3Regular: 'text-[13px] text-body-3-regular text-[var(--text-secondary)]',
      },
   },
   defaultVariants: {
      typography: 'body1Medium',
   },
});

const iconSizeMap = {
   lg: 'size-4',
   md: 'size-3.5',
} as const;

type CheckboxProps = React.ComponentProps<typeof CheckboxPrimitive.Root> &
   VariantProps<typeof checkboxVariants> &
   VariantProps<typeof labelVariants> & {
      label?: string;
   };

function Checkbox({ className, size = 'md', typography, label, ...props }: CheckboxProps) {
   const iconSize = iconSizeMap[size ?? 'md'];

   const checkboxElement = (
      <CheckboxPrimitive.Root
         data-slot="checkbox"
         className={cn(
            checkboxVariants({ size }),
            'border-border border-[1.5px] bg-base',
            'data-[state=checked]:bg-primary data-[state=checked]:border-primary',
            'data-[state=indeterminate]:bg-primary data-[state=indeterminate]:border-primary',
            'hover:border-primary',
            'focus-visible:ring-2 focus-visible:ring-border',
            'disabled:bg-(--fill-disabled) disabled:border-border',
            className,
         )}
         {...props}
      >
         <CheckboxPrimitive.Indicator
            data-slot="checkbox-indicator"
            className="grid place-content-center text-white data-disabled:text-(--icon-disabled)"
         >
            {props.checked === 'indeterminate' ? (
               <MinusIcon className={iconSize} strokeWidth={3} />
            ) : (
               <CheckIcon className={iconSize} strokeWidth={3} />
            )}
         </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
   );

   if (!label) {
      return checkboxElement;
   }

   return (
      <label className="inline-flex items-center gap-2 cursor-pointer has-disabled:cursor-not-allowed">
         {checkboxElement}
         <span className={cn(labelVariants({ typography }))}>{label}</span>
      </label>
   );
}

export { Checkbox, checkboxVariants, labelVariants };
