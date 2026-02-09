import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/shared/lib/utils';

const optionVariants = cva(
   'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border transition-colors disabled:cursor-not-allowed',
   {
      variants: {
         variant: {
            normal: 'bg-transparent border-border px-4 py-3 hover:bg-(--neutral-50)',
         },
         active: {
            true: 'bg-(--primary-light) border-(--border-accent) text-primary',
            false: 'text-(--text-tertiary)',
         },
      },
      defaultVariants: {
         variant: 'normal',
         active: false,
      },
   },
);

export interface OptionProps
   extends React.ButtonHTMLAttributes<HTMLButtonElement>,
      VariantProps<typeof optionVariants> {
   asChild?: boolean;
}

const Option = React.forwardRef<HTMLButtonElement, OptionProps>(
   ({ className, variant, active, asChild = false, children, ...props }, ref) => {
      const Comp = asChild ? Slot : 'button';

      // 1. 단순 텍스트인지 확인 (레이아웃 흔들림 방지 로직 적용 대상)
      const isSimpleText = typeof children === 'string' || typeof children === 'number';

      return (
         <Comp
            ref={ref}
            data-slot="option"
            data-state={active ? 'active' : 'inactive'}
            // CVA에서는 색상과 레이아웃만 처리하고, 폰트 사이즈/두께는 아래 span에서 처리
            className={cn(optionVariants({ variant, active, className }))}
            {...props}
         >
            {asChild ? (
               children
            ) : isSimpleText ? (
               <span className="relative flex items-center justify-center">
                  {/* [Ghost Text] 
                      항상 가장 넓은 너비인 'label-1-semibold'로 공간을 확보합니다. 
                      화면에는 보이지 않지만 버튼의 너비를 고정하는 역할을 합니다. 
                  */}
                  <span className="invisible text-label-1-semibold opacity-0" aria-hidden="true">
                     {children}
                  </span>

                  {/* [Visible Text] 
                      실제 사용자에게 보이는 텍스트입니다. absolute로 띄워서 Ghost Text 위에 겹칩니다.
                      active 상태에 따라 medium / semibold 클래스를 스위칭합니다.
                  */}
                  <span
                     className={cn(
                        'absolute inset-0 flex items-center justify-center',
                        active ? 'text-label-1-semibold' : 'text-label-1-medium',
                     )}
                  >
                     {children}
                  </span>
               </span>
            ) : (
               // 텍스트가 아닌 컴포넌트나 아이콘이 들어올 경우 그대로 렌더링
               children
            )}
         </Comp>
      );
   },
);

Option.displayName = 'Option';

export { Option, optionVariants };
