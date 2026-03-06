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
               'shadow-[inset_0_0_0_1px_var(--primary-normal)] bg-transparent text-[var(--primary-normal)] hover:bg-[var(--primary-light)] disabled:shadow-[inset_0_0_0_1px_var(--border-normal)]',
            outline:
               'shadow-[inset_0_0_0_1px_var(--border-normal)] bg-transparent hover:bg-[var(--fill-hover)]',
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
            className: '[color:var(--static-white)] disabled:[color:var(--text-disabled)]',
         },
         {
            variant: 'primaryline',
            className:
               '[color:var(--primary-normal)] disabled:[color:var(--text-disabled)] disabled:hover:bg-transparent',
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
