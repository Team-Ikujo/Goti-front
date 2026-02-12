import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/shared/lib/utils';

const tooltipVariants = cva('relative w-fit rounded-md bg-(--neutral-900) px-3 py-1.5 text-xs text-[#FAFAFA]', {
   variants: {
      arrow: {
         top: '',
         bottom: '',
         left: '',
         right: '',
      },
   },
   defaultVariants: {
      arrow: 'bottom',
   },
});

const arrowPositionMap = {
   top: 'top-0 left-1/2 -translate-x-1/2 -translate-y-[calc(50%-1px)] rotate-45',
   bottom: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-[calc(50%-1px)] rotate-45',
   left: 'left-0 top-1/2 -translate-y-1/2 -translate-x-[calc(50%-1px)] rotate-45',
   right: 'right-0 top-1/2 -translate-y-1/2 translate-x-[calc(50%-1px)] rotate-45',
} as const;

type TooltipProps = React.ComponentProps<'div'> & VariantProps<typeof tooltipVariants>;

function Tooltip({ className, arrow = 'bottom', children, ...props }: TooltipProps) {
   return (
      <div data-slot="tooltip" className={cn(tooltipVariants({ arrow }), className)} {...props}>
         {children}
         <span className={cn('absolute size-1.75 rounded-[0.8px] bg-(--neutral-900)', arrowPositionMap[arrow ?? 'bottom'])} />
      </div>
   );
}

export { Tooltip, tooltipVariants };
