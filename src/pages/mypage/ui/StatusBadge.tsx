// src/pages/mypage/ui/StatusBadge.tsx

export type BadgeVariant = 'success' | 'warning' | 'disabled';

const VARIANT_STYLES: Record<BadgeVariant, { bg: string; text: string }> = {
   success: { bg: 'bg-[#f4f7fe]', text: 'text-primary' },
   warning: { bg: 'bg-[#fff3eb]', text: 'text-[#e24d04]' },
   disabled: { bg: 'bg-[#e9ebee]', text: 'text-muted-foreground' },
};

interface StatusBadgeProps {
   label: string;
   variant?: BadgeVariant;
   className?: string;
}

export default function StatusBadge({ label, variant = 'success', className = '' }: StatusBadgeProps) {
   const { bg, text } = VARIANT_STYLES[variant];
   return (
      <div className={`inline-flex self-start px-5 py-3 rounded-full ${bg} ${className}`}>
         <span className={`text-[18px] font-bold leading-[1.55] ${text}`}>{label}</span>
      </div>
   );
}
