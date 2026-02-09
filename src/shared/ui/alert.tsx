import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/shared/lib/utils';

const alertVariants = cva('flex items-center gap-2 rounded-lg py-3 px-3.5 shadow-[0_6px_12px_0_rgba(0,0,0,0.16)]', {
   variants: {
      variant: {
         default: 'bg-(--neutral-900)',
         success: 'bg-(--neutral-900)',
         fail: 'bg-(--neutral-900)',
      },
   },
   defaultVariants: {
      variant: 'default',
   },
});

const iconMap: Record<string, React.ReactNode> = {
   default: null,
   success: <img src="/success.svg" alt="success" className="size-4" />,
   fail: <img src="/fail.svg" alt="fail" className="size-4" />,
};

type AlertProps = React.ComponentProps<'div'> & VariantProps<typeof alertVariants>;

function Alert({ className, variant = 'default', children, ...props }: AlertProps) {
   const icon = iconMap[variant ?? 'default'];

   return (
      <div data-slot="alert" role="alert" className={cn(alertVariants({ variant }), className)} {...props}>
         {icon && <div className="flex size-5 shrink-0 items-center justify-center">{icon}</div>}
         <span className="text-body-2-semibold text-white">{children}</span>
      </div>
   );
}

export { Alert, alertVariants };
