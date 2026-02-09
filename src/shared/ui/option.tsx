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

      // children이 단순 텍스트인 경우 레이아웃 흔들림 방지(Ghost Text) 적용
      // 아이콘과 텍스트가 섞여 있다면 사용자가 직접 구조를 잡아야 할 수 있으므로, 텍스트일 때만 자동 처리
      const isSimpleText = typeof children === 'string' || typeof children === 'number';

      return (
         <Comp
            ref={ref}
            data-slot="option"
            data-state={active ? 'active' : 'inactive'}
            className={cn(optionVariants({ variant, active, className }))}
            {...props}
         >
            {asChild ? (
               children
            ) : isSimpleText ? (
               <span className="relative flex items-center justify-center">
                  {/* 1. 공간 확보용 (보이지 않는 Bold 텍스트) */}
                  {/* 이 녀석이 버튼의 너비를 항상 Bold 기준으로 잡아줍니다 */}
                  <span className="invisible font-bold opacity-0" aria-hidden="true">
                     {children}
                  </span>

                  {/* 2. 실제 보여지는 텍스트 (absolute로 위 1번 영역 위에 겹침) */}
                  <span
                     className={cn(
                        'absolute inset-0 flex items-center justify-center',
                        // 선택 시 Bold, 미선택 시 Medium 적용
                        active ? 'font-bold' : 'font-medium',
                     )}
                  >
                     {children}
                  </span>
               </span>
            ) : (
               // 텍스트가 아닌 복잡한 노드(아이콘 등)가 들어올 경우 그대로 렌더링
               // 이 경우 레이아웃 흔들림을 막으려면 버튼에 고정 width를 주어야 합니다.
               children
            )}
         </Comp>
      );
   },
);

Option.displayName = 'Option';

export { Option, optionVariants };
