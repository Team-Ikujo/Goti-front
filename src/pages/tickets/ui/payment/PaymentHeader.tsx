// src/pages/tickets/ui/payment/PaymentHeader.tsx

import { useEffect, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import BooksHeader from '@/shared/widgets/layout/books/BooksHeader';
import { useBookingFlowTimerStore } from '@/shared/lib/useBookingFlowTimerStore';

const PAYMENT_STEPS = ['구역 선택', '좌석 선택', '결제'];

interface PaymentHeaderProps {
   matchTitle: string;
   venue: string;
   dateTime: string;
}

/** 예매 플로우 타이머 store에서 남은 시간 문자열을 가져오는 훅 */
function useTimerStr() {
   const [now, setNow] = useState(Date.now());
   const expiresAt = useBookingFlowTimerStore(state => state.expiresAt);

   useEffect(() => {
      const id = window.setInterval(() => setNow(Date.now()), 1000);
      return () => window.clearInterval(id);
   }, []);

   const remaining = expiresAt !== null ? Math.max(0, Math.ceil((expiresAt - now) / 1000)) : 0;
   const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
   const ss = String(remaining % 60).padStart(2, '0');
   return `${mm}:${ss}`;
}

export function PaymentHeader({ matchTitle, venue, dateTime }: PaymentHeaderProps) {
   const navigate = useNavigate();
   const timeStr = useTimerStr();

   return (
      <>
         {/* ── 모바일 헤더 ── */}
         <header className="lg:hidden flex flex-col w-full bg-background">
            {/* 1행: 뒤로가기 | 제목(중앙) | 타이머 */}
            <div className="relative flex items-center justify-between pl-3 pr-5 py-2">
               <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="p-1 flex items-center justify-center shrink-0"
                  aria-label="뒤로가기"
               >
                  <ChevronLeft className="size-6 text-foreground" />
               </button>
               <span className="absolute left-1/2 -translate-x-1/2 text-[18px] font-bold leading-[1.55] text-foreground whitespace-nowrap">
                  결제
               </span>
               <span className="text-[16px] font-bold leading-[1.5] text-primary">{timeStr}</span>
            </div>

            {/* 2행: 경기 정보 */}
            <div className="flex flex-col items-start justify-center px-5 py-[9px] border-b border-border-light">
               <span className="text-[16px] font-bold leading-[1.5] text-foreground">{matchTitle}</span>
               <div className="flex items-center gap-1 text-[12px] font-medium leading-[1.5] text-muted-foreground">
                  <span>{venue}</span>
                  <span>∙</span>
                  <span>{dateTime}</span>
               </div>
            </div>
         </header>

         {/* ── 데스크톱 헤더 ── */}
         <div className="hidden lg:block">
            <BooksHeader
               matchTitle={matchTitle}
               venue={venue}
               dateTime={dateTime}
               steps={PAYMENT_STEPS}
               currentStepIndex={2}
               showBackButton
               backAriaLabel="이전 화면으로 이동"
            />
         </div>
      </>
   );
}
