import { useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';

import {
   submitResaleOrder,
   submitTicketOrder,
   type ResaleCheckoutRequest,
   type TicketCheckoutRequest,
} from '@/pages/tickets/api/paymentApi';
import { ApiError } from '@/shared/api/client';

import { PaymentHeader } from './_shared';

// TODO: 예매 단계 완성 후 라우터 state/params로 교체
const MOCK_GAME = {
   matchTitle: '기아 vs LG',
   venue: '기아 챔피언스필드',
   dateTime: '3.21 (토) 오후 18:30',
};

export default function PaymentProcessingPage() {
   const navigate = useNavigate();
   const { state } = useLocation();
   const locationState = state as { request: TicketCheckoutRequest | ResaleCheckoutRequest; amount: number } | null;
   const hasStartedRef = useRef(false);
   const { mutateAsync } = useMutation({
      mutationFn: async (request: TicketCheckoutRequest | ResaleCheckoutRequest) => {
         if ('gameId' in request && 'selectedSeats' in request) {
            return submitTicketOrder(request);
         }

         return submitResaleOrder(request);
      },
   });

   useEffect(() => {
      let isActive = true;

      if (!locationState?.request) {
         navigate('/tickets/payment', { replace: true });
         return;
      }

      if (hasStartedRef.current) {
         return;
      }

      hasStartedRef.current = true;

      const { request: paymentRequest, amount: clientAmount } = locationState;
      const isStillOnProcessingPage = () => window.location.pathname === '/tickets/payment/processing';

      const process = async () => {
         try {
            const [result] = await Promise.all([
               mutateAsync(paymentRequest),
               new Promise(resolve => setTimeout(resolve, 1000)),
            ]);
            if (isActive && isStillOnProcessingPage()) {
               navigate(
                  `/tickets/payment/complete?delivery=${paymentRequest.deliveryMethod}`,
                  { state: { ...result, amount: clientAmount }, replace: true },
               );
            }
         } catch (error) {
            if (isStillOnProcessingPage()) {
               const message =
                  error instanceof ApiError
                     ? error.message
                     : '결제 요청 처리 중 오류가 발생했습니다. 입력값을 다시 확인해 주세요.';
               window.alert(message);
               navigate('listingId' in paymentRequest ? '/tickets/resell-payment' : '/tickets/payment', { replace: true });
            }
         }
      };

      process();

      return () => {
         isActive = false;
      };
   }, [locationState, mutateAsync, navigate]);

   const headerRequest = locationState?.request;
   const headerProps =
      headerRequest && 'matchTitle' in headerRequest
         ? {
              matchTitle: headerRequest.matchTitle,
              venue: headerRequest.gameVenue,
              dateTime: headerRequest.gameDate,
           }
         : MOCK_GAME;

   return (
      <div className="min-h-screen flex flex-col bg-background">
         <PaymentHeader {...headerProps} />

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
