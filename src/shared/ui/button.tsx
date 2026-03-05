import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import { cn } from '@/shared/lib/utils';

const buttonVariants = cva(
   'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg transition-colors disabled:cursor-not-allowed [&_svg]:size-5 [&_svg]:shrink-0',
   {
      variants: {
         variant: {
            primary:
               'bg-[var(--primary-normal)] hover:bg-[var(--primary-strong)] disabled:bg-[var(--primary-disabled)]',
            primaryline:
               'border border-[var(--primary-normal)] bg-transparent text-[var(--primary-normal)] hover:bg-[var(--primary-light)] disabled:border-[var(--border-normal)]',
            outline:
               'border border-[var(--border-normal)] bg-transparent hover:bg-[var(--fill-hover)] disabled:border-[var(--border-normal)]',
         },
         typography: {
            label1Bold: 'text-label-1-bold',
         },
         size: {
            md: 'px-6 py-3',
            sm: 'px-4 py-2',
         },
      },
      compoundVariants: [
         {
            variant: 'primary',
            className: 'text-white disabled:text-(--text-disabled)',
         },
         {
            variant: 'primaryline',
            className: 'text-(--primary-normal) disabled:text-(--text-disabled) disabled:hover:bg-transparent',
         },
         {
            variant: 'outline',
            className: 'text-(--text-secondary) disabled:text-(--text-disabled) disabled:hover:bg-transparent',
         },
      ],
      defaultVariants: {
         variant: 'primary',
         typography: 'label1Bold',
         size: 'md',
      },
   },
);

function Button({
   className,
   variant,
   typography,
   size,
   asChild = false,
   ...props
}: React.ComponentProps<'button'> &
   VariantProps<typeof buttonVariants> & {
      asChild?: boolean;
   }) {
   const Comp = asChild ? Slot.Root : 'button';

   return (
      <Comp data-slot="button" className={cn(buttonVariants({ variant, size, typography }), className)} {...props} />
   );
}

export { Button, buttonVariants };
