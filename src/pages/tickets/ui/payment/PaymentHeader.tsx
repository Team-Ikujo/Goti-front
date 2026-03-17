// src/pages/tickets/ui/payment/PaymentHeader.tsx

import { useEffect, useRef, useState } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

function useBookingTimer(initialSeconds = 599) {
   const [remaining, setRemaining] = useState(initialSeconds);
   const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

   useEffect(() => {
      timerRef.current = setInterval(() => {
         setRemaining(prev => {
            if (prev <= 1) {
               clearInterval(timerRef.current!);
               return 0;
            }
            return prev - 1;
         });
      }, 1000);
      return () => {
         if (timerRef.current) clearInterval(timerRef.current);
      };
   }, []);

   const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
   const ss = String(remaining % 60).padStart(2, '0');
   return `${mm}:${ss}`;
}

interface PaymentHeaderProps {
   matchTitle: string;
   venue: string;
   dateTime: string;
}

export function PaymentHeader({ matchTitle, venue, dateTime }: PaymentHeaderProps) {
   const navigate = useNavigate();
   const timeStr = useBookingTimer();

   return (
      <header className="bg-background flex flex-col w-full">
         {/* ── 모바일 헤더 ── */}
         <div className="lg:hidden flex flex-col w-full">
            {/* 1행: 뒤로가기 | 제목(중앙) | 타이머 */}
            <div className="relative flex items-center justify-between pl-3 pr-5 py-2 bg-background">
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
            <div className="flex flex-col items-start justify-center px-5 py-[9px] border-b border-border-light bg-background">
               <span className="text-[16px] font-bold leading-[1.5] text-foreground">{matchTitle}</span>
               <div className="flex items-center gap-1 text-[12px] font-medium leading-[1.5] text-(--text-secondary)">
                  <span>{venue}</span>
                  <span>∙</span>
                  <span>{dateTime}</span>
               </div>
            </div>
         </div>

         {/* ── 데스크톱 헤더 ── */}
         <div className="hidden lg:flex flex-col w-full">
            {/* 1행: 로고 / 예매 시간 / 유저 아이콘 */}
            <div className="flex items-center justify-between px-8 py-4 border-b border-border-light">
               <Link to="/" className="text-[21px] font-bold tracking-[-0.5px] text-foreground">
                  GoTi
               </Link>
               <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 text-[18px] leading-[1.55]">
                     <span className="font-medium text-(--text-secondary)">예매 시간</span>
                     <span className="font-bold text-primary">{timeStr}</span>
                     <button type="button" className="size-6 flex items-center justify-center" aria-label="예매 시간 안내">
                        <AlertCircle className="size-5 text-(--text-tertiary)" />
                     </button>
                  </div>
                  <button type="button" className="size-6 flex items-center justify-center" aria-label="마이페이지">
                     <img src="/Icon/Line/Mypage.svg" alt="마이페이지" className="size-6" />
                  </button>
               </div>
            </div>

            {/* 2행: 뒤로가기 / 경기 정보 / 단계 표시 */}
            <div className="flex items-center h-[72px] pl-7 pr-8 gap-6 border-b border-border-light">
               <div className="flex flex-1 items-center gap-3 min-w-0">
                  <button
                     type="button"
                     onClick={() => navigate(-1)}
                     className="p-1 flex items-center justify-center shrink-0"
                     aria-label="뒤로가기"
                  >
                     <ChevronLeft className="size-6 text-foreground" />
                  </button>
                  <div className="flex items-center gap-4 min-w-0 overflow-hidden">
                     <span className="text-[22px] font-bold leading-[1.55] text-foreground whitespace-nowrap shrink-0">
                        {matchTitle}
                     </span>
                     <div className="flex items-center gap-2 text-[18px] font-medium leading-[1.55] text-(--text-secondary) min-w-0">
                        <span className="whitespace-nowrap">{venue}</span>
                        <span>∙</span>
                        <span className="whitespace-nowrap">{dateTime}</span>
                     </div>
                  </div>
               </div>
               {/* 단계 표시 */}
               <div className="flex items-center gap-4 shrink-0">
                  <span className="text-[14px] font-medium leading-[1.45] text-(--text-disabled)">구역 선택</span>
                  <ChevronRight className="size-4 text-(--text-disabled)" />
                  <span className="text-[14px] font-medium leading-[1.45] text-(--text-disabled)">좌석선택</span>
                  <ChevronRight className="size-4 text-(--text-disabled)" />
                  <span className="text-[14px] font-semibold leading-[1.45] text-(--text-secondary)">결제</span>
               </div>
            </div>
         </div>
      </header>
   );
}
