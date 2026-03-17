// src/pages/tickets/ui/payment/PaymentHeader.tsx

import BooksHeader from '@/shared/widgets/layout/books/BooksHeader';

const PAYMENT_STEPS = ['구역 선택', '좌석 선택', '결제'];

interface PaymentHeaderProps {
   matchTitle: string;
   venue: string;
   dateTime: string;
}

export function PaymentHeader({ matchTitle, venue, dateTime }: PaymentHeaderProps) {
   return (
      <BooksHeader
         matchTitle={matchTitle}
         venue={venue}
         dateTime={dateTime}
         steps={PAYMENT_STEPS}
         currentStepIndex={2}
         showBackButton
         backAriaLabel="이전 화면으로 이동"
      />
   );
}
