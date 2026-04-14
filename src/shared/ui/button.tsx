// src/shared/ui/button.tsx
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import { cn } from '@/shared/lib/utils';

const buttonVariants = cva(
   'inline-flex cursor-pointer select-none items-center justify-center gap-2 whitespace-nowrap rounded-lg transition-colors disabled:cursor-not-allowed disabled:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0',
   {
      variants: {
         variant: {
            none: '',
            primary:
               'bg-[var(--primary-normal)] text-[var(--static-white)] hover:bg-[var(--primary-strong)] disabled:bg-[var(--primary-disabled)] disabled:text-[var(--text-disabled)]',
            secondary:
               'border border-[var(--primary-normal)] bg-transparent text-[var(--primary-normal)] hover:bg-[var(--primary-light)] disabled:border-[var(--border-normal)] disabled:text-[var(--text-disabled)] disabled:hover:bg-transparent',
            tertiary:
               'border border-[var(--border-normal)] bg-transparent text-[var(--text-secondary)] hover:bg-[var(--fill-hover)] disabled:text-[var(--text-disabled)] disabled:hover:bg-transparent',
         },
         size: {
            xl: 'h-[66px] px-6 py-2 text-[16px] font-medium leading-[1.5]',
            lg: 'px-6 py-3 text-[16px] font-bold leading-[1.5]',
            md: 'px-6 py-[10px] text-[14px] font-medium leading-[1.5]',
            sm: 'px-[14px] py-[6px] text-[14px] font-medium leading-[1.5]',
            xs: 'px-3 py-1 text-[14px] font-medium leading-[1.45]',
         },
      },
      defaultVariants: {
         variant: 'primary',
         size: 'lg',
      },
   },
);

function Button({
   className,
   variant,
   size,
   asChild = false,
   ...props
}: React.ComponentProps<'button'> &
   VariantProps<typeof buttonVariants> & {
      asChild?: boolean;
   }) {
   const Comp = asChild ? Slot.Root : 'button';

   return <Comp data-slot="button" className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { Button, buttonVariants };
