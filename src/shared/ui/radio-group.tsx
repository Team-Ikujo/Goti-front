import * as React from 'react';
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/shared/lib/utils';

function RadioGroup({ className, ...props }: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
   return <RadioGroupPrimitive.Root data-slot="radio-group" className={cn('grid gap-3', className)} {...props} />;
}

const radioItemVariants = cva(
   'peer aspect-square shrink-0 rounded-full border-[1.5px] transition-colors outline-none disabled:cursor-not-allowed',
   {
      variants: {
         size: {
            lg: 'size-5',
            md: 'size-4',
         },
      },
      defaultVariants: {
         size: 'lg',
      },
   },
);

const radioLabelVariants = cva(
   'cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:text-disabled-foreground',
   {
      variants: {
         typography: {
            body1Medium: 'text-[16px] text-body-1-medium text-foreground',
         },
      },
      defaultVariants: {
         typography: 'body1Medium',
      },
   },
);

const dotSizeMap = {
   lg: 'size-2',
   md: 'size-[7px]',
} as const;

type RadioGroupItemProps = React.ComponentProps<typeof RadioGroupPrimitive.Item> &
   VariantProps<typeof radioItemVariants> &
   VariantProps<typeof radioLabelVariants> & {
      label?: string;
   };

function RadioGroupItem({ className, size = 'lg', typography, label, ...props }: RadioGroupItemProps) {
   const dotSize = dotSizeMap[size ?? 'lg'];

   const radioElement = (
      <RadioGroupPrimitive.Item
         data-slot="radio-group-item"
         className={cn(
            radioItemVariants({ size }),
            'relative flex items-center justify-center border-border',
            'data-[state=unchecked]:bg-transparent',
            'data-[state=checked]:bg-primary data-[state=checked]:border-0',
            'disabled:bg-(--neutral-100) disabled:border-(--neutral-300)',
            className,
         )}
         {...props}
      >
         <RadioGroupPrimitive.Indicator
            data-slot="radio-group-indicator"
            className="absolute inset-0 flex items-center justify-center"
         >
            <span className={cn('rounded-full bg-surface', dotSize)} />
         </RadioGroupPrimitive.Indicator>
      </RadioGroupPrimitive.Item>
   );

   if (!label) {
      return radioElement;
   }

   return (
      <label className="inline-flex items-center gap-2 cursor-pointer has-disabled:cursor-not-allowed">
         {radioElement}
         <span className={cn(radioLabelVariants({ typography }))}>{label}</span>
      </label>
   );
}

export { RadioGroup, RadioGroupItem, radioItemVariants, radioLabelVariants };
