import * as React from 'react';
import { CircleCheck } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/shared/lib/utils';

const alertVariants = cva('flex items-center gap-2 rounded-lg py-3 px-3.5 shadow-[0_6px_12px_0_rgba(0,0,0,0.16)]', {
   variants: {
      variant: {
         success: 'bg-(--neutral-900)',
      },
   },
   defaultVariants: {
      variant: 'success',
   },
});

const iconMap = {
   success: <CircleCheck className="size-4 fill-primary [&_circle]:stroke-none [&_path]:fill-none [&_path]:stroke-white" />,
} as const;

type AlertProps = React.ComponentProps<'div'> & VariantProps<typeof alertVariants>;

function Alert({ className, variant = 'success', children, ...props }: AlertProps) {
   return (
      <div data-slot="alert" role="alert" className={cn(alertVariants({ variant }), className)} {...props}>
         <div className="flex size-5 shrink-0 items-center justify-center">{iconMap[variant ?? 'success']}</div>
         <span className="text-body-2-semibold text-white">{children}</span>
      </div>
   );
}

export { Alert, alertVariants };
