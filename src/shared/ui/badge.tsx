import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/shared/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border border-transparent px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 [&>img]:size-3 gap-1 [&>svg]:pointer-events-none [&>img]:pointer-events-none [&>img]:shrink-0 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        ghost: "[a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        link: "text-primary underline-offset-4 [a&]:hover:underline",
        chip: "h-7 rounded-full border-[var(--border-accent)] bg-[var(--primary-light)] px-3 py-1 text-[length:var(--label-3-size)] leading-[var(--label-3-lineheight)] font-[var(--label-3-medium)] tracking-[var(--label-3-letterspacing)] text-[var(--primary-strong)] [a&]:hover:bg-[var(--fill-hoveraccent)]",
        chipDestructive:
          "h-6 rounded-[20px] border-2 border-destructive bg-[var(--background-base)] px-3 text-[length:var(--body-1-size)] leading-[var(--body-1-lineheight)] font-[var(--body-1-medium)] tracking-[var(--body-1-letterspacing)] text-destructive [a&]:hover:bg-[var(--background-base)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

/**
 * Badge/Chip 표현에 사용하는 공용 라벨 컴포넌트.
 * `variant=\"chip\" | \"chipDestructive\"`으로 디자인 시스템 Chip 스타일을 사용할 수 있습니다.
 */
function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
