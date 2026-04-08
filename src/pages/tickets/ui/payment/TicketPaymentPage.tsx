// src/pages/tickets/ui/payment/TicketPaymentPage.tsx

import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getSelectedSeatPaymentSummary } from '@/pages/books/model/getSelectedSeatPaymentSummary';
import { getSelectedSeatDetails } from '@/pages/books/model/selectedSeats';
import { useBookingPurchaseLimit } from '@/pages/books/model/useBookingPurchaseLimit';
import { useSeatHoldStore } from '@/entities/seat-hold/model/useSeatHoldStore';
import { MAX_SELECTED_SEATS, MAX_SELECTED_SEATS_MESSAGE } from '@/entities/seat-selection/model/constants';
import { useSeatSelectionStore } from '@/entities/seat-selection/model/useSeatSelectionStore';
import { getBookingTeamConfig, getBookingZones } from '@/pages/books/model/zoneData';
import { Button } from '@/shared/ui/button';
import { logBookingFlow, summarizeBookingEntry } from '@/shared/lib/bookingFlowDebug';
import { mergeBookingEntryState, useBookingEntryStore, type BookingEntryState } from '@/shared/lib/useBookingEntryStore';
import BooksPurchaseLimitDialog from '@/shared/widgets/layout/books/BooksPurchaseLimitDialog';
import type { TicketCheckoutRequest } from '@/pages/tickets/api/paymentApi';
import {
   CashReceiptCard,
   DiscountCard,
   NotesCard,
   OrdererInfoCard,
   OrderSummaryCard,
   PAYMENT_LABELS,
   PaymentAmountCard,
   PaymentHeader,
   PaymentMethodCard,
   PaymentCard,
   RadioOptionCard,
   ShippingAddressCard,
   TermsCard,
   type CashReceiptNumType,
   type CashReceiptType,
   type PaymentMethod,
   isSupportedPaymentMethod,
} from './_shared';

type DeliveryMethod = 'mobile' | 'onsite' | 'delivery';

const DELIVERY_LABELS: Record<DeliveryMethod, string> = {
   mobile: '모바일 티켓',
   onsite: '현장 수령',
   delivery: '배송 수령',
};

// TODO: 예매 단계 완성 후 라우터 state/params로 교체
const MOCK_GAME = {
   matchTitle: '기아 vs LG',
   venue: '기아 챔피언스필드',
   dateTime: '3.21 (토) 오후 18:30',
};

export default function TicketPaymentPage() {
   const navigate = useNavigate();
   const location = useLocation();
   const locationState = location.state as BookingEntryState | null;
   const routeBookingEntryState = locationState;
   const storedBookingEntryState = useBookingEntryStore(state => state.entry);
   const bookingEntryState = mergeBookingEntryState(routeBookingEntryState, storedBookingEntryState);
   const setBookingEntry = useBookingEntryStore(state => state.setEntry);
   const zonesState = useSeatSelectionStore(state => state.zones);
   const holdsBySeatId = useSeatHoldStore(state => state.holdsBySeatId);
   const bookingTeamConfig = getBookingTeamConfig(bookingEntryState?.homeTeamId);
   const bookingZones = bookingEntryState?.bookingZones ?? getBookingZones(bookingEntryState?.homeTeamId);
   const paymentSummary = getSelectedSeatPaymentSummary(zonesState, bookingZones);
   const selectedSeatDetails = getSelectedSeatDetails(zonesState, bookingZones);
   const purchaseLimit = useBookingPurchaseLimit();
   const [isPurchaseLimitDialogOpen, setIsPurchaseLimitDialogOpen] = useState(false);
   const selectedSeats = selectedSeatDetails.map(({ seat, zoneName }) => ({
      seatId: seat.apiSeatId,
      holdId: holdsBySeatId[seat.id]?.holdId ?? '',
      label: `${zoneName} ${seat.block}블록 ${seat.rowLabel} ${seat.seatNumber}번`,
   }));
   const botData = locationState?.botData;

   // 주문자 정보
   const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('mobile');
   const [name, setName] = useState('');
   const [phone, setPhone] = useState('');
   const [email, setEmail] = useState('');

   // 배송지 정보 (배송 수령 선택 시)
   const [zipCode, setZipCode] = useState('');
   const [address, setAddress] = useState('');
   const [addressDetail, setAddressDetail] = useState('');

   // 결제 수단
   const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');

   // 현금영수증 (무통장 입금 선택 시)
   const [cashReceiptType, setCashReceiptType] = useState<CashReceiptType>('income');
   const [cashReceiptNumType, setCashReceiptNumType] = useState<CashReceiptNumType>('phone');
   const [cashReceiptNum, setCashReceiptNum] = useState('');
   const [saveCashReceipt, setSaveCashReceipt] = useState(false);

   // 약관
   const [agreedPrivacy, setAgreedPrivacy] = useState(false);
   const [agreedPolicy, setAgreedPolicy] = useState(false);
   const [agreedResell, setAgreedResell] = useState(false);
   const phoneDigits = phone.replace(/\D/g, '');

   const shippingFee = deliveryMethod === 'delivery' ? 3000 : 0;

   const isDeliveryValid = deliveryMethod !== 'delivery' || (!!zipCode && !!address && !!addressDetail);
   // 무통장 입금 + 미발행이 아닌 경우 현금영수증 번호 필수
   const isCashReceiptValid = paymentMethod !== 'bank' || cashReceiptType === 'none' || !!cashReceiptNum;
   const isFormValid =
      !!name &&
      phoneDigits.length === 11 &&
      !!email &&
      isDeliveryValid &&
      isCashReceiptValid &&
      selectedSeats.length > 0 &&
      selectedSeats.length <= MAX_SELECTED_SEATS &&
      selectedSeats.every(seat => !!seat.holdId) &&
      !!bookingEntryState?.gameId &&
      !!bookingEntryState?.queueTokenJti &&
      agreedPrivacy &&
      agreedPolicy &&
      agreedResell;

   const handleZipResult = (zip: string, addr: string) => {
      setZipCode(zip);
      setAddress(addr);
   };

   const handleSelectPaymentMethod = (method: PaymentMethod) => {
      if (!isSupportedPaymentMethod(method)) {
         window.alert('아직 지원하지 않는 결제수단입니다.');
         return;
      }

      setPaymentMethod(method);
   };

   const orderInfo = {
      matchTitle: bookingEntryState?.matchTitle ?? `${bookingTeamConfig.displayName} 홈경기`,
      dateTime: bookingEntryState?.dateTime ?? MOCK_GAME.dateTime,
      quantity: paymentSummary.quantity,
      seats: paymentSummary.seatLabels,
      deliveryLabel: DELIVERY_LABELS[deliveryMethod],
      paymentLabel: PAYMENT_LABELS[paymentMethod],
   };

   // 수수료: 매당 1,000원
   const fee = orderInfo.quantity * 1000;
   const ticketPrice = paymentSummary.totalPrice;
   const totalPayment = ticketPrice + shippingFee + fee; // 할인 0원

   useEffect(() => {
      logBookingFlow('TicketPaymentPage', 'render snapshot', {
         pathname: location.pathname,
         bookingEntryState: summarizeBookingEntry(bookingEntryState),
         selectedSeatCount: selectedSeats.length,
         selectedSeats,
         totalPayment,
         isFormValid,
      });
   }, [bookingEntryState, isFormValid, location.pathname, selectedSeats, totalPayment]);

   useEffect(() => {
      if (routeBookingEntryState) {
         logBookingFlow('TicketPaymentPage', 'sync route state to store', summarizeBookingEntry(routeBookingEntryState));
         setBookingEntry(routeBookingEntryState);
      }
   }, [routeBookingEntryState, setBookingEntry]);

   const handlePay = async () => {
      logBookingFlow('TicketPaymentPage', 'handlePay start', {
         bookingEntryState: summarizeBookingEntry(bookingEntryState),
         selectedSeatCount: selectedSeats.length,
         selectedSeats,
         totalPayment,
      });
      if (!bookingEntryState?.gameId || !bookingEntryState.queueTokenJti) {
         logBookingFlow('TicketPaymentPage', 'handlePay blocked: missing booking entry');
         return;
      }

      if (selectedSeats.length > MAX_SELECTED_SEATS) {
         window.alert(MAX_SELECTED_SEATS_MESSAGE);
         return;
      }

      try {
         const purchaseLimitResult = await purchaseLimit.checkPurchaseLimit({
            gameId: bookingEntryState.gameId,
            selectedSeatCount: selectedSeats.length,
         });

         if (purchaseLimitResult.isLimitExceeded) {
            setIsPurchaseLimitDialogOpen(true);
            return;
         }
      } catch (error) {
         console.error('[TicketPaymentPage] 구매 제한 사전 체크 실패', error);
      }

      const paymentRequest: TicketCheckoutRequest = {
         gameId: bookingEntryState.gameId,
         queueTokenJti: bookingEntryState.queueTokenJti,
         userId: bookingEntryState.userId,
         matchTitle: orderInfo.matchTitle,
         gameDate: orderInfo.dateTime,
         gameVenue: bookingEntryState?.venue ?? bookingTeamConfig.stadiumName ?? MOCK_GAME.venue,
         amount: totalPayment,
         selectedSeats,
         deliveryMethod,
         ordererName: name,
         ordererPhone: phoneDigits,
         ordererEmail: email,
         paymentMethod,
         botData,
         ...(deliveryMethod === 'delivery' && { zipCode, address, addressDetail }),
         ...(paymentMethod === 'bank' && {
            cashReceiptType,
            cashReceiptNumType,
            cashReceiptNum,
         }),
      };

      navigate('/tickets/payment/processing', { state: { request: paymentRequest, amount: totalPayment } });
      logBookingFlow('TicketPaymentPage', 'navigate /tickets/payment/processing', {
         paymentRequest,
         amount: totalPayment,
      });
   };

   return (
      <div className="min-h-screen flex flex-col bg-background">
         <BooksPurchaseLimitDialog
            open={isPurchaseLimitDialogOpen}
            onConfirm={() => {
               setIsPurchaseLimitDialogOpen(false);
               navigate('/books', {
                  replace: true,
                  state: bookingEntryState ?? undefined,
               });
            }}
         />
         <PaymentHeader
            matchTitle={orderInfo.matchTitle}
            venue={bookingEntryState?.venue ?? bookingTeamConfig.stadiumName ?? MOCK_GAME.venue}
            dateTime={orderInfo.dateTime}
         />

         <main className="flex-1 bg-white flex justify-center px-4">
            <div className="w-full max-w-300 py-8 flex flex-col gap-8">
               <h1 className="text-title-1-bold leading-[1.45] tracking-[-0.032px] text-foreground">주문서</h1>

               <div className="flex flex-col lg:flex-row gap-8 items-start">
                  {/* 왼쪽: 주문자 정보 */}
                  <div className="w-full lg:flex-1 min-w-0 flex flex-col gap-2.5">
                     <div className="flex flex-col gap-6">
                        {/* 수령 방식 선택 */}
                        <PaymentCard>
                           <h3 className="text-heading-3-bold leading-normal text-foreground mb-5">수령 방식 선택</h3>
                           <div className="flex flex-col gap-3">
                              <RadioOptionCard
                                 selected={deliveryMethod === 'mobile'}
                                 onSelect={() => setDeliveryMethod('mobile')}
                                 label="모바일 티켓"
                                 description="QR코드로 바로 입장 · 무료"
                              />
                              <RadioOptionCard
                                 selected={deliveryMethod === 'onsite'}
                                 onSelect={() => setDeliveryMethod('onsite')}
                                 label="현장 수령"
                                 description="경기장에서 직접 발권 · 무료"
                              />
                              <RadioOptionCard
                                 selected={deliveryMethod === 'delivery'}
                                 onSelect={() => setDeliveryMethod('delivery')}
                                 label="배송 수령"
                                 description="실물 티켓 배송"
                                 extra="+3,000"
                              />
                           </div>
                        </PaymentCard>

                        {/* 주문자 정보 */}
                        <OrdererInfoCard
                           name={name}
                           phone={phone}
                           email={email}
                           onChangeName={setName}
                           onChangePhone={setPhone}
                           onChangeEmail={setEmail}
                        />

                        {/* 배송지 정보 (배송 수령 선택 시에만 표시) */}
                        {deliveryMethod === 'delivery' && (
                           <ShippingAddressCard
                              zipCode={zipCode}
                              address={address}
                              addressDetail={addressDetail}
                              onZipResult={handleZipResult}
                              onChangeAddressDetail={setAddressDetail}
                           />
                        )}

                        {/* 할인 선택 */}
                        <DiscountCard />

                        {/* 결제 방법 */}
                        <PaymentMethodCard selected={paymentMethod} onSelect={handleSelectPaymentMethod} />

                        {/* 현금영수증 (무통장 입금 선택 시에만 표시) */}
                        {paymentMethod === 'bank' && (
                           <CashReceiptCard
                              receiptType={cashReceiptType}
                              onChangeReceiptType={setCashReceiptType}
                              numType={cashReceiptNumType}
                              onChangeNumType={setCashReceiptNumType}
                              num={cashReceiptNum}
                              onChangeNum={setCashReceiptNum}
                              saveInfo={saveCashReceipt}
                              onChangeSaveInfo={setSaveCashReceipt}
                           />
                        )}

                        {/* 유의사항 */}
                        <NotesCard />

                        {/* 약관 동의 */}
                        <TermsCard
                           agreedPrivacy={agreedPrivacy}
                           agreedPolicy={agreedPolicy}
                           agreedResell={agreedResell}
                           onChangePrivacy={setAgreedPrivacy}
                           onChangePolicy={setAgreedPolicy}
                           onChangeResell={setAgreedResell}
                        />

                        {/* 모바일 전용: 약관 동의 이후 주문정보 + 결제금액 + 버튼 */}
                        <div className="lg:hidden flex flex-col gap-6">
                           <OrderSummaryCard orderInfo={orderInfo} />
                           <PaymentAmountCard
                              ticketPrice={ticketPrice}
                              shippingFee={shippingFee}
                              discounts={[
                                 { label: '학생 할인 5%', amount: 0 },
                                 { label: '조기 예매 할인 10%', amount: 0 },
                              ]}
                              fee={fee}
                           />
                           <Button
                              variant="primary"
                              size="lg"
                              className="w-full"
                              disabled={!isFormValid || purchaseLimit.isChecking}
                              onClick={() => void handlePay()}
                           >
                              {purchaseLimit.isChecking ? '구매 가능 수량 확인 중' : `${totalPayment.toLocaleString('ko-KR')}원 결제하기`}
                           </Button>
                        </div>
                     </div>
                  </div>

                  {/* 오른쪽: 주문 정보 — 데스크톱 전용 */}
                  <div className="hidden lg:flex flex-col flex-1 max-w-100 shrink-0 gap-2.5">
                     <div className="flex flex-col gap-6">
                        <OrderSummaryCard orderInfo={orderInfo} />

                        <PaymentAmountCard
                           ticketPrice={ticketPrice}
                           shippingFee={shippingFee}
                           discounts={[
                              { label: '학생 할인 5%', amount: 0 },
                              { label: '조기 예매 할인 10%', amount: 0 },
                           ]}
                           fee={fee}
                        />
                        <Button
                           variant="primary"
                           size="lg"
                           className="w-full"
                           disabled={!isFormValid || purchaseLimit.isChecking}
                           onClick={() => void handlePay()}
                        >
                           {purchaseLimit.isChecking ? '구매 가능 수량 확인 중' : `${totalPayment.toLocaleString('ko-KR')}원 결제하기`}
                        </Button>
                     </div>
                  </div>
               </div>
            </div>
         </main>
      </div>
   );
}
