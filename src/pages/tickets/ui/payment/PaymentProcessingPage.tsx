import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import {
   releaseResaleHold,
   releaseResaleHoldKeepalive,
   submitResaleOrder,
   submitTicketOrder,
   type PaymentResponse,
   type ResaleCheckoutRequest,
   type TicketCheckoutRequest,
} from '@/pages/tickets/api/paymentApi';
import { releaseSeatReservation, releaseSeatReservationKeepalive } from '@/entities/seat-hold/api/seatHoldApi';
import { useSeatHoldStore } from '@/entities/seat-hold/model/useSeatHoldStore';
import { useSeatSelectionStore } from '@/entities/seat-selection/model/useSeatSelectionStore';
import { ApiError } from '@/shared/api/client';
import { getErrorMessage } from '@/shared/lib/error/getErrorMessage';
import BooksPurchaseLimitDialog from '@/shared/widgets/layout/books/BooksPurchaseLimitDialog';

import { PaymentHeader } from './_shared';

const MOCK_GAME = {
   matchTitle: '기아 vs LG',
   venue: '기아 챔피언스필드',
   dateTime: '3.21 (토) 오후 18:30',
};

const PAYMENT_COMPLETE_STORAGE_KEY = 'ticket-payment-complete';
const TICKET_PURCHASE_LIMIT_ERROR_PATTERNS = [
   /티켓\s*보유\s*수량\s*초과/i,
   /보유\s*수량\s*초과/i,
   /최대\s*4\s*매/i,
   /4\s*매\s*제한/i,
   /매수\s*제한/i,
   /purchase\s*limit/i,
   /ticket\s*(count|quantity)\s*limit/i,
   /already\s*(purchased|bought|owned)/i,
   /owned\s*ticket\s*count/i,
];

const isTicketPurchaseLimitError = (error: unknown) => {
   if (!(error instanceof ApiError)) {
      return false;
   }

   if (error.status !== 400 && error.status !== 409) {
      return false;
   }

   return TICKET_PURCHASE_LIMIT_ERROR_PATTERNS.some((pattern) => pattern.test(error.message));
};

const savePaymentCompleteState = (order: PaymentResponse) => {
   if (typeof window === 'undefined' || !order.orderId) {
      return;
   }

   window.sessionStorage.setItem(
      `${PAYMENT_COMPLETE_STORAGE_KEY}:${order.orderId}`,
      JSON.stringify(order),
   );
};

const releasePendingTicketSeatHolds = async () => {
   const seatHolds = Object.values(useSeatHoldStore.getState().holdsBySeatId);

   if (seatHolds.length === 0) {
      return;
   }

   const releaseResults = await Promise.allSettled(
      seatHolds.map((seatHold) => releaseSeatReservation(seatHold.holdId)),
   );
   const failedReleaseCount = releaseResults.filter((result) => result.status === 'rejected').length;

   if (failedReleaseCount > 0) {
      console.error('[PaymentProcessingPage] failed to release ticket seat holds', {
         failedReleaseCount,
         totalReleaseCount: seatHolds.length,
      });
   }

   useSeatHoldStore.getState().clearSeatHolds();
   useSeatSelectionStore.getState().clearAllSelections();
};

const releasePendingTicketSeatHoldsKeepalive = () => {
   const seatHolds = Object.values(useSeatHoldStore.getState().holdsBySeatId);

   if (seatHolds.length === 0) {
      return;
   }

   seatHolds.forEach((seatHold) => {
      releaseSeatReservationKeepalive(seatHold.holdId);
   });

   useSeatHoldStore.getState().clearSeatHolds();
   useSeatSelectionStore.getState().clearAllSelections();
};

export default function PaymentProcessingPage() {
   const navigate = useNavigate();
   const queryClient = useQueryClient();
   const { state } = useLocation();
   const locationState = state as { request: TicketCheckoutRequest | ResaleCheckoutRequest; amount: number } | null;
   const [isPurchaseLimitDialogOpen, setIsPurchaseLimitDialogOpen] = useState(false);
   const hasStartedRef = useRef(false);
   const isMountedRef = useRef(false);
   const hasCompletedRef = useRef(false);
   const hasSuccessfulTicketPaymentRef = useRef(false);
   const resaleHoldIdRef = useRef<string | null>(null);

   useEffect(() => {
      isMountedRef.current = true;
      hasCompletedRef.current = false;
      hasSuccessfulTicketPaymentRef.current = false;

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
      const isResaleRequest = 'listingId' in paymentRequest;

      const completePayment = (result: PaymentResponse) => {
         if (!isMountedRef.current || !isStillOnProcessingPage()) {
            return;
         }

         hasCompletedRef.current = true;
         resaleHoldIdRef.current = null;

         try {
            savePaymentCompleteState({ ...result, amount: clientAmount });
         } catch {
            // sessionStorage 저장 실패가 완료 페이지 이동을 막지 않게 한다.
         }

         if (isResaleRequest) {
            void queryClient.invalidateQueries({ queryKey: ['resell-zone-remaining'] });
            void queryClient.invalidateQueries({ queryKey: ['resell-zone-insights'] });
            void queryClient.invalidateQueries({ queryKey: ['resales', 'game-counts'] });
            void queryClient.invalidateQueries({ queryKey: ['resales', 'listing-market'] });
            void queryClient.invalidateQueries({ queryKey: ['myResales'] });
         }

         useSeatHoldStore.getState().clearSeatHolds();
         useSeatSelectionStore.getState().clearAllSelections();
         navigate(
            `/tickets/payment/complete?delivery=${paymentRequest.deliveryMethod}&orderId=${encodeURIComponent(result.orderId ?? '')}`,
            { state: { ...result, amount: clientAmount }, replace: true },
         );
      };

      const releasePendingHolds = async () => {
         if (hasSuccessfulTicketPaymentRef.current) {
            return;
         }

         if (isResaleRequest) {
            const resaleHoldId = resaleHoldIdRef.current;

            if (!resaleHoldId) {
               return;
            }

            resaleHoldIdRef.current = null;
            await releaseResaleHold(resaleHoldId);
            return;
         }

         await releasePendingTicketSeatHolds();
      };

      const process = async () => {
         try {
            const submitOrder =
               'gameId' in paymentRequest && 'selectedSeats' in paymentRequest
                  ? () => submitTicketOrder(paymentRequest)
                  : () =>
                       submitResaleOrder(paymentRequest, {
                          onHoldCreated: (holdId) => {
                             resaleHoldIdRef.current = holdId;
                          },
                          onHoldReleased: () => {
                             resaleHoldIdRef.current = null;
                          },
                       });

            const [result] = await Promise.all([
               submitOrder(),
               new Promise(resolve => setTimeout(resolve, 1000)),
            ]);

            if (!isResaleRequest && result.paymentStatus === 'SUCCESS') {
               hasSuccessfulTicketPaymentRef.current = true;
            }

            completePayment(result);
         } catch (error) {
            if (isMountedRef.current && isStillOnProcessingPage()) {
               if (!isResaleRequest) {
                  await releasePendingHolds();
               } else {
                  resaleHoldIdRef.current = null;
               }

               if (isTicketPurchaseLimitError(error)) {
                  setIsPurchaseLimitDialogOpen(true);
                  return;
               }

               const message = getErrorMessage(
                  error,
                  '결제 요청 처리 중 오류가 발생했습니다. 입력값을 다시 확인해 주세요.',
               );
               window.alert(message);
               navigate('listingId' in paymentRequest ? '/tickets/resell-payment' : '/tickets/payment', { replace: true });
            }
         }
      };

      void process();

      const handlePageHide = () => {
         if (hasCompletedRef.current || hasSuccessfulTicketPaymentRef.current) {
            return;
         }

         if (isResaleRequest) {
            const resaleHoldId = resaleHoldIdRef.current;

            if (!resaleHoldId) {
               return;
            }

            releaseResaleHoldKeepalive(resaleHoldId);
            resaleHoldIdRef.current = null;
            return;
         }

         releasePendingTicketSeatHoldsKeepalive();
      };

      window.addEventListener('pagehide', handlePageHide);

      return () => {
         window.removeEventListener('pagehide', handlePageHide);
         isMountedRef.current = false;
      };
   }, [locationState, navigate, queryClient]);

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
         <BooksPurchaseLimitDialog
            open={isPurchaseLimitDialogOpen}
            onConfirm={() => {
               setIsPurchaseLimitDialogOpen(false);
               navigate('/tickets/payment', { replace: true });
            }}
         />
         <PaymentHeader {...headerProps} />

         <main className="flex-1 bg-white flex flex-col items-center justify-center gap-[50px]">
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
