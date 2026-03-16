// src/pages/tickets/ui/payment/PaymentCard.tsx

import { type ReactNode } from 'react';

import { cn } from '@/shared/lib/utils';

export function PaymentCard({ className, children }: { className?: string; children: ReactNode }) {
   return <div className={cn('bg-background border border-border rounded-[14px] p-[25px]', className)}>{children}</div>;
}
