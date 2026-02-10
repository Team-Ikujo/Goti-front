import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import { cn } from '@/shared/lib/utils';

const buttonVariants = cva(
   'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg transition-colors disabled:cursor-not-allowed',
   {
      variants: {
         variant: {
            primary: 'bg-[var(--primary-normal)] hover:bg-[var(--primary-strong)] disabled:bg-[var(--neutral-100)]',
            outline: 'border border-[var(--border-normal)] bg-transparent hover:bg-[var(--neutral-50)]',
         },
         typography: {
            label1Bold: 'text-label-1-bold',
            label1Medium: 'text-label-1-medium',
         },
         size: {
            md: 'px-6 py-3',
            sm: 'px-4 py-2',
         },
      },
      compoundVariants: [
         {
            variant: 'primary',
            className: '[color:var(--static-white)] disabled:[color:var(--text-disabled)]',
         },
         {
            variant: 'outline',
            className:
               '[color:var(--text-secondary)] disabled:[color:var(--text-disabled)] disabled:hover:bg-transparent',
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
