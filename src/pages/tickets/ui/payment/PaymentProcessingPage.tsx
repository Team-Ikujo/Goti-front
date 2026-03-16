// src/pages/tickets/ui/payment/PaymentProcessingPage.tsx

import { PaymentHeader } from './_shared';

// TODO: 예매 단계 완성 후 라우터 state/params로 교체
const MOCK_GAME = {
   matchTitle: '기아 vs LG',
   venue: '기아 챔피언스필드',
   dateTime: '3.21 (토) 오후 18:30',
};

export default function PaymentProcessingPage() {
   return (
      <div className="min-h-screen flex flex-col bg-background">
         <PaymentHeader {...MOCK_GAME} />

         <main className="flex-1 bg-white flex flex-col items-center justify-center gap-[50px]">
            {/* 원형 점 스피너 */}
            <div className="relative size-20">
               {Array.from({ length: 10 }).map((_, i) => {
                  const angle = (i / 10) * 360;
                  const rad = (angle * Math.PI) / 180;
                  const x = 50 + 36 * Math.sin(rad);
                  const y = 50 - 36 * Math.cos(rad);
                  return (
                     <span
                        key={i}
                        className="absolute size-[9px] rounded-full bg-[#374553] animate-pulse"
                        style={{
                           left: `${x}%`,
                           top: `${y}%`,
                           transform: 'translate(-50%, -50%)',
                           opacity: 0.2 + (i / 10) * 0.8,
                           animationDelay: `${i * 0.1}s`,
                        }}
                     />
                  );
               })}
            </div>

            <div className="text-[24px] font-semibold leading-[1.5] text-(--text-secondary) text-center">
               <p>결제가 진행 중입니다.</p>
               <p>잠시만 기다려 주십시오.</p>
            </div>
         </main>
      </div>
   );
}
