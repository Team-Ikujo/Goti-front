// src/pages/tickets/ui/payment/PaymentCompletePage.tsx

import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { getOrderPayment, type PaymentResponse } from '@/pages/tickets/api/paymentApi';
import { Calendar, CheckCircle, ChevronLeft, MapPin } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import BooksHeader from '@/shared/widgets/layout/books/BooksHeader';
import { useSeatHoldStore } from '@/entities/seat-hold/model/useSeatHoldStore';
import { useSeatSelectionStore } from '@/entities/seat-selection/model/useSeatSelectionStore';
import { useBookingFlowTimerStore } from '@/shared/lib/useBookingFlowTimerStore';
import { ApiError } from '@/shared/api/client';

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

type DeliveryMethod = 'mobile' | 'onsite' | 'delivery';

const DELIVERY_LABELS: Record<DeliveryMethod, string> = {
   mobile: '모바일 티켓',
   onsite: '현장 수령',
   delivery: '배송 수령',
};

const PAYMENT_COMPLETE_STORAGE_KEY = 'ticket-payment-complete';

const readStoredPaymentCompleteState = (orderId: string | null) => {
   if (typeof window === 'undefined' || !orderId) {
      return null;
   }

   const storedValue = window.sessionStorage.getItem(`${PAYMENT_COMPLETE_STORAGE_KEY}:${orderId}`);

   if (!storedValue) {
      return null;
   }

   try {
      return JSON.parse(storedValue) as PaymentResponse;
   } catch {
      return null;
   }
};

const writeStoredPaymentCompleteState = (order: PaymentResponse) => {
   if (typeof window === 'undefined' || !order.orderId) {
      return;
   }

   window.sessionStorage.setItem(
      `${PAYMENT_COMPLETE_STORAGE_KEY}:${order.orderId}`,
      JSON.stringify(order),
   );
};

const isResalePaymentResponse = (order: PaymentResponse | null) => {
   if (!order) {
      return false;
   }

   if (order.orderType === 'resale') {
      return true;
   }

   return order.orderId?.toLowerCase().includes('resale') ?? false;
};

const ENTRANCE_GUIDES: Record<DeliveryMethod, string[]> = {
   mobile: [
      '경기 시작 2시간 전부터 입장 가능합니다',
      'QR코드는 마이페이지 > 결제내역 에서 확인하실 수 있습니다.',
      '모바일 티켓 QR코드를 게이트에서 제시해주세요',
      '신분증을 함께 지참해주세요',
   ],
   onsite: [
      '경기 시작 2시간 전부터 티켓 수령 및 입장이 가능합니다.',
      '티켓 수령 후 게이트에서 티켓을 제시하고 입장해주세요.',
      '티켓 수령처 위치는 구장 안내를 참고해주세요.',
      '현장 수령시 본인 확인을 위해 예매번호, 이름 및 전화번호 또는 신분증을 확인할 수 있습니다.',
      '경로ㆍ청소년ㆍ초등학생ㆍ군인ㆍ국가유공자ㆍ장애인ㆍ다자녀 등 본인 확인이 필요한 경우, 현장 매표소에 증빙 서류 제시 및 본인 확인 후 티켓 수령이 가능합니다.',
   ],
   delivery: [
      '경기 시작 2시간 전부터 입장 가능합니다',
      '배송된 실물 티켓을 지참하여 경기장에 방문해주세요.',
      '신분증을 함께 지참해주세요',
      '게이트에서 티켓을 제시하고 입장해주세요.',
      '티켓 분실 시 재발급이 어려울 수 있으니 보관에 유의해주세요.',
   ],
};

// TODO: 결제 완료 후 API 응답 데이터로 교체
const MOCK_ORDER = {
   matchTitle: '기아 vs LG',
   venue: '기아 챔피언스필드',
   dateTime: '3.21 (토) 오후 18:30',
   orderNumber: 'ORD1772784852770',
   gameTitle: '삼성 vs LG',
   gameDate: '2026.03.21 (토) 18:30',
   gameVenue: '삼성 라이온즈 파크',
   quantity: 2,
   seats: ['1E-2구역 0열 0번', '1E-2구역 0열 0번'],
   paymentMethod: '신용/체크카드',
   orderedAt: '2026.03.13 12:36 PM',
   amount: 0,
   recipientName: '홍길동',
   recipientPhone: '010-1234-5678',
   recipientAddress: '서울특별시 강남구 테헤란로 123',
};

export default function PaymentCompletePage() {
   const navigate = useNavigate();
   const [searchParams] = useSearchParams();
   const { state } = useLocation();
   const timeStr = useTimerStr();
   const deliveryMethod = (searchParams.get('delivery') as DeliveryMethod) ?? 'mobile';
   const orderId = searchParams.get('orderId');
   const locationOrder = state as PaymentResponse | null;
   const [order, setOrder] = useState<PaymentResponse>(() => {
      return locationOrder ?? readStoredPaymentCompleteState(orderId) ?? (MOCK_ORDER as PaymentResponse);
   });
   const [paymentReloadError, setPaymentReloadError] = useState<string | null>(null);

   useEffect(() => {
      useSeatHoldStore.getState().clearSeatHolds();
      useSeatSelectionStore.getState().clearAllSelections();
   }, []);

   useEffect(() => {
      if (locationOrder?.orderId) {
         writeStoredPaymentCompleteState(locationOrder);
      }
   }, [locationOrder]);

   useEffect(() => {
      let isCancelled = false;

      const fallbackOrder = locationOrder ?? readStoredPaymentCompleteState(orderId);

      if (!orderId || isResalePaymentResponse(fallbackOrder)) {
         return;
      }

      const restorePayment = async () => {
         try {
            const payment = await getOrderPayment(orderId);

            if (isCancelled) {
               return;
            }

            setPaymentReloadError(null);
            setOrder((currentOrder) => {
               const nextOrder: PaymentResponse = {
                  ...currentOrder,
                  orderId: payment.orderId,
                  paymentStatus: payment.paymentStatus,
                  paidAt: payment.paidAt ?? currentOrder.paidAt,
                  amount: payment.paymentAmount,
                  orderStatus: payment.paymentStatus === 'SUCCESS' ? 'CONFIRMED' : currentOrder.orderStatus,
               };

               writeStoredPaymentCompleteState(nextOrder);
               return nextOrder;
            });
         } catch (error) {
            if (isCancelled) {
               return;
            }

            const hasFallbackOrder =
               Boolean(locationOrder) || Boolean(readStoredPaymentCompleteState(orderId));

            // 완료 페이지는 결제 직전 state/sessionStorage에 이미 결과를 저장해두므로
            // 후속 조회가 RBAC 등 권한 문제로 실패해도 사용자 경험을 깨지 않게 기존 완료 데이터를 우선 유지한다.
            if (hasFallbackOrder) {
               setPaymentReloadError(null);
               return;
            }

            setPaymentReloadError(
               error instanceof ApiError ? error.message : '결제 정보를 다시 불러오지 못했습니다.',
            );
         }
      };

      void restorePayment();

      return () => {
         isCancelled = true;
      };
   }, [orderId]);

   const actionButton =
      deliveryMethod === 'delivery'
         ? { label: '예매내역 확인하기', onClick: () => navigate('/') }
         : { label: 'QR 코드 확인하기', onClick: () => navigate('/mypage', { state: { activeTab: 'purchase' } }) };

   return (
      <div className="min-h-screen flex flex-col bg-background">
         {/* 데스크톱 헤더 */}
         <div className="hidden lg:block">
            <BooksHeader
               confirmBeforeExit={false}
               showTimer={false}
               currentStepIndex={3}
            />
         </div>

         {/* 모바일 헤더 */}
         <div className="lg:hidden flex flex-col w-full bg-background">
            {/* 1행: 뒤로가기 | 제목(중앙) */}
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
                  예매 완료
               </span>
               <span className="text-[16px] font-bold leading-normal text-primary">{timeStr}</span>
            </div>
            {/* 2행: 경기 정보 */}
            <div className="flex flex-col items-start justify-center px-5 py-[9px] border-b border-border-light">
               <span className="text-[16px] font-bold leading-normal text-foreground">{order.gameTitle}</span>
               <div className="flex items-center gap-1 text-[12px] font-medium leading-normal text-muted-foreground">
                  <span>{order.gameVenue}</span>
                  <span>∙</span>
                  <span>{order.gameDate}</span>
               </div>
            </div>
         </div>

         <main className="flex-1 bg-white flex justify-center px-4">
            <div className="w-full max-w-[1200px] py-10 flex flex-col gap-[24px] items-center">
               {/* 완료 헤더 */}
               <div className="flex flex-col gap-3 items-center w-full">
                  <div className="size-24 rounded-full bg-fill-hoveraccent flex items-center justify-center">
                     <CheckCircle className="size-12 text-primary" strokeWidth={1.5} />
                  </div>
                  <p className="text-[32px] font-bold leading-[1.45] tracking-[-0.032px] text-[#101828] text-center">
                     예매 완료!
                  </p>
                  <p className="text-[20px] font-semibold leading-[1.5] text-[#4a5565] text-center">
                     티켓이 성공적으로 발급되었습니다
                  </p>
               </div>

               {paymentReloadError ? (
                  <div className="w-full rounded-[14px] border border-destructive/20 bg-destructive/5 px-5 py-4 text-[14px] text-destructive">
                     {paymentReloadError}
                  </div>
               ) : null}

               {/* 예매 정보 카드 */}
               <div className="w-full border-2 border-border-light rounded-[14px] p-[26px] flex flex-col gap-6 bg-background">
                  {/* 예매 번호 */}
                  <div className="flex flex-col gap-1">
                     <span className="text-[16px] font-bold leading-normal text-disabled-foreground">예매 번호</span>
                     <span className="text-[18px] font-bold leading-[1.55] text-foreground">{order.orderNumber}</span>
                  </div>

                  {/* 경기 정보 */}
                  <div className="border-t border-border pt-6 flex flex-col gap-2">
                     <span className="text-[16px] font-bold leading-normal text-disabled-foreground">경기 정보</span>
                     <span className="text-[24px] font-bold leading-normal text-[#101828]">{order.gameTitle}</span>
                     <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                           <Calendar className="size-5 text-foreground shrink-0" />
                           <span className="text-[16px] font-medium leading-normal text-foreground">
                              {order.gameDate}
                           </span>
                        </div>
                        <div className="flex items-center gap-2">
                           <MapPin className="size-5 text-foreground shrink-0" />
                           <span className="text-[16px] font-medium leading-normal text-foreground">
                              {order.gameVenue}
                           </span>
                        </div>
                     </div>
                  </div>

                  {/* 수량 + 좌석 정보 — 모바일: 2컬럼 / 데스크톱: 2컬럼 */}
                  <div className="border-t border-border pt-6 flex gap-5 items-start">
                     <div className="flex-1 flex flex-col gap-1">
                        <span className="text-[16px] font-bold leading-normal text-disabled-foreground">수량</span>
                        <span className="text-[16px] font-medium leading-normal text-foreground">
                           {order.quantity}매
                        </span>
                     </div>
                     {/* 수직 구분선 */}
                     <div className="w-px self-stretch bg-border" />
                     <div className="flex-1 flex flex-col gap-1">
                        <span className="text-[16px] font-bold leading-normal text-disabled-foreground">좌석 정보</span>
                        {order.seats.map((seat, i) => (
                           <span key={i} className="text-[16px] font-medium leading-normal text-foreground">
                              {seat}
                           </span>
                        ))}
                     </div>
                  </div>
               </div>

               {/* 입장 안내 카드 */}
               <div className="w-full bg-fill-hoveraccent border border-border-accent rounded-[14px] p-[25px]">
                  <div className="flex flex-col gap-2">
                     <span className="text-[18px] font-bold leading-[1.55] text-[#0054d1]">입장 안내</span>
                     <div className="flex flex-col gap-1 text-[16px] font-medium leading-normal text-[#0054d1]">
                        {ENTRANCE_GUIDES[deliveryMethod].map((guide, i) => (
                           <p key={i} className="w-full">
                              • {guide}
                           </p>
                        ))}
                     </div>
                  </div>
               </div>

               {/* 결제 정보 카드 */}
               <div className="w-full border border-border rounded-[14px] p-[25px] bg-background flex flex-col gap-[30px]">
                  <span className="text-[18px] font-bold leading-[1.55] text-foreground">결제 정보</span>
                  <div className="flex flex-col gap-3">
                     {[
                        { label: '결제 방법', value: order.paymentMethod },
                        { label: '주문상태', value: order.orderStatus ?? 'PENDING' },
                        { label: '주문접수일시', value: order.paidAt ?? order.orderedAt },
                        { label: '수령 방식', value: DELIVERY_LABELS[deliveryMethod] },
                     ].map(({ label, value }) => (
                        <div key={label} className="flex items-start justify-between text-[16px] leading-normal">
                           <span className="font-bold text-muted-foreground">{label}</span>
                           <span className="font-medium text-foreground">{value}</span>
                        </div>
                     ))}
                     <div className="flex items-start justify-between text-[16px] leading-normal">
                        <span className="font-bold text-muted-foreground">결제 금액</span>
                        <span className="font-medium text-destructive">{order.amount.toLocaleString('ko-KR')}원</span>
                     </div>
                  </div>
               </div>

               {/* 배송 정보 카드 (배송 수령 시에만 표시) */}
               {deliveryMethod === 'delivery' && (
                  <div className="w-full border border-border rounded-[14px] p-[25px] bg-background flex flex-col gap-[30px]">
                     <span className="text-[18px] font-bold leading-[1.55] text-foreground">배송 정보</span>
                     <div className="flex flex-col gap-3">
                        {[
                           { label: '받으시는 분', value: order.recipientName },
                           { label: '휴대폰번호', value: order.recipientPhone },
                           { label: '주소', value: order.recipientAddress },
                        ].map(({ label, value }) => (
                           <div key={label} className="flex items-start justify-between text-[16px] leading-normal">
                              <span className="font-bold text-muted-foreground">{label}</span>
                              <span className="font-medium text-foreground">{value}</span>
                           </div>
                        ))}
                     </div>
                  </div>
               )}

               {/* 하단 버튼 */}
               <div className="flex gap-4 justify-center w-full">
                  <Button variant="secondary" className="flex-1 max-w-[360px] py-3" onClick={() => navigate('/')}>
                     홈으로
                  </Button>
                  <Button variant="primary" className="flex-1 max-w-[360px] py-3" onClick={actionButton.onClick}>
                     {actionButton.label}
                  </Button>
               </div>
            </div>
         </main>
      </div>
   );
}
