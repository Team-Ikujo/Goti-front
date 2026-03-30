// src/pages/tickets/ui/payment/ResellPaymentPage.tsx

import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/entities/auth/model/authStore';
import { Button } from '@/shared/ui/button';
import type { ResaleCheckoutRequest } from '@/pages/tickets/api/paymentApi';
import type { BotReport } from '@/shared/lib/botDetector';
import { resolveUserIdFromJwt } from '@/shared/lib/jwt';
import {
   CashReceiptCard,
   DiscountCard,
   OrdererInfoCard,
   OrderSummaryCard,
   PAYMENT_LABELS,
   PaymentAmountCard,
   PaymentHeader,
   PaymentMethodCard,
   PaymentCard,
   RadioOptionCard,
   type CashReceiptNumType,
   type CashReceiptType,
   type PaymentMethod,
   isSupportedPaymentMethod,
} from './_shared';

import { ResellNotesCard } from './ResellNotesCard';
import { ResellTermsCard } from './ResellTermsCard';

// TODO: 예매 단계 완성 후 라우터 state/params로 교체
const MOCK_GAME = {
   matchTitle: '기아 vs LG',
   venue: '기아 챔피언스필드',
   dateTime: '3.21 (토) 오후 18:30',
};

const MOCK_RESALE_ENTRY = {
   listingId: '2df84c70-833e-4374-85ad-fa52f92f939e',
   holdId: undefined,
   queueTokenJti: 'queue-token-resale-001',
   sellerId: '7df84c70-833e-4374-85ad-fa52f92f939e',
   settlementAmount: 46000,
   totalAmount: 54000,
   totalBuyerFee: 2000,
   totalSellerFee: 2000,
   seatInfo: '1루 지정석 1열 12번',
};

type ResellPaymentEntryState = Partial<typeof MOCK_RESALE_ENTRY> & {
   matchTitle?: string;
   venue?: string;
   dateTime?: string;
   botData?: BotReport;
};

export default function ResellPaymentPage() {
   const navigate = useNavigate();
   const location = useLocation();
   const accessToken = useAuthStore((state) => state.accessToken);
   const currentUserId = useAuthStore((state) => state.currentUserId);
   const resellEntryState = location.state as ResellPaymentEntryState | null;
   const resaleEntry = resellEntryState ?? null;

   const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
   const [name, setName] = useState('');
   const [phone, setPhone] = useState('');
   const [email, setEmail] = useState('');
   const [agreedPrivacy, setAgreedPrivacy] = useState(false);
   const [agreedResell, setAgreedResell] = useState(false);

   // 현금영수증 (무통장 입금 선택 시)
   const [cashReceiptType, setCashReceiptType] = useState<CashReceiptType>('income');
   const [cashReceiptNumType, setCashReceiptNumType] = useState<CashReceiptNumType>('phone');
   const [cashReceiptNum, setCashReceiptNum] = useState('');
   const [saveCashReceipt, setSaveCashReceipt] = useState(false);
   const phoneDigits = phone.replace(/\D/g, '');

   // 무통장 입금 + 미발행이 아닌 경우 현금영수증 번호 필수
   const isCashReceiptValid = paymentMethod !== 'bank' || cashReceiptType === 'none' || !!cashReceiptNum;
   const isFormValid = !!name && phoneDigits.length === 11 && !!email && isCashReceiptValid && agreedPrivacy && agreedResell;
   const resolvedBuyerId = currentUserId ?? resolveUserIdFromJwt(accessToken) ?? resellEntryState?.buyerId;

   const orderInfo = {
      matchTitle: resellEntryState?.matchTitle ?? MOCK_GAME.matchTitle,
      dateTime: resellEntryState?.dateTime ?? MOCK_GAME.dateTime,
      quantity: 1,
      seats: [resaleEntry?.seatInfo ?? MOCK_RESALE_ENTRY.seatInfo],
      deliveryLabel: '모바일 티켓',
      paymentLabel: PAYMENT_LABELS[paymentMethod],
   };

   const fee = resaleEntry?.totalBuyerFee ?? MOCK_RESALE_ENTRY.totalBuyerFee;
   const totalPayment = resaleEntry?.totalAmount ?? MOCK_RESALE_ENTRY.totalAmount;
   const ticketPrice = Math.max(totalPayment - fee, 0);

   const handleSelectPaymentMethod = (method: PaymentMethod) => {
      if (!isSupportedPaymentMethod(method)) {
         window.alert('아직 지원하지 않는 결제수단입니다.');
         return;
      }

      setPaymentMethod(method);
   };

   const handlePay = () => {
      if (!resolvedBuyerId) {
         window.alert('구매자 정보를 확인할 수 없습니다. 다시 로그인한 뒤 시도해 주세요.');
         return;
      }

      if (
         !resaleEntry?.listingId ||
         !resaleEntry?.holdId ||
         !resaleEntry?.queueTokenJti ||
         !resaleEntry?.sellerId ||
         typeof resaleEntry.settlementAmount !== 'number' ||
         typeof resaleEntry.totalAmount !== 'number' ||
         typeof resaleEntry.totalBuyerFee !== 'number' ||
         typeof resaleEntry.totalSellerFee !== 'number' ||
         !resaleEntry.seatInfo
      ) {
         window.alert('리셀 결제 정보가 올바르지 않습니다. 좌석을 다시 선택해 주세요.');
         navigate('/books?mode=resell', { replace: true });
         return;
      }

      const paymentRequest: ResaleCheckoutRequest = {
         buyerId: resolvedBuyerId,
         listingId: resaleEntry.listingId,
         holdId: resaleEntry.holdId,
         queueTokenJti: resaleEntry.queueTokenJti,
         sellerId: resaleEntry.sellerId,
         settlementAmount: resaleEntry.settlementAmount,
         totalAmount: resaleEntry.totalAmount,
         totalBuyerFee: resaleEntry.totalBuyerFee,
         totalSellerFee: resaleEntry.totalSellerFee,
         seatInfo: resaleEntry.seatInfo,
         matchTitle: orderInfo.matchTitle,
         gameDate: orderInfo.dateTime,
         gameVenue: resellEntryState?.venue ?? MOCK_GAME.venue,
         deliveryMethod: 'mobile',
         ordererName: name,
         ordererPhone: phoneDigits,
         ordererEmail: email,
         paymentMethod,
         botData: resellEntryState?.botData,
         ...(paymentMethod === 'bank' && {
            cashReceiptType,
            cashReceiptNumType,
            cashReceiptNum,
         }),
      };
      navigate('/tickets/payment/processing', { state: { request: paymentRequest, amount: totalPayment } });
   };

   return (
      <div className="min-h-screen flex flex-col bg-background">
         <PaymentHeader
            matchTitle={orderInfo.matchTitle}
            venue={resellEntryState?.venue ?? MOCK_GAME.venue}
            dateTime={orderInfo.dateTime}
         />

         <main className="flex-1 bg-white flex justify-center px-4">
            <div className="w-full max-w-[1200px] py-8 flex flex-col gap-8">
               <h1 className="text-[32px] font-bold leading-[1.45] tracking-[-0.032px] text-foreground">주문서</h1>

               <div className="flex flex-col lg:flex-row gap-8 items-start">
                  {/* 왼쪽: 주문자 정보 */}
                  <div className="w-full lg:flex-1 min-w-0 flex flex-col gap-[10px]">
                     <h2 className="hidden lg:block text-heading-1-bold leading-normal text-foreground h-9">
                        주문자 정보 입력
                     </h2>

                     <div className="flex flex-col gap-6">
                        {/* 수령 방식 — 리셀은 모바일 티켓만 가능 */}
                        <PaymentCard>
                           <h3 className="text-[20px] font-bold leading-[1.5] text-foreground mb-5">수령 방식</h3>
                           <RadioOptionCard
                              selected
                              onSelect={() => {}}
                              disabled
                              label="모바일 티켓 (추천)"
                              description="QR코드로 바로 입장 · 무료"
                           />
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
                        <ResellNotesCard />

                        {/* 약관 동의 */}
                        <ResellTermsCard
                           agreedPrivacy={agreedPrivacy}
                           agreedResell={agreedResell}
                           onChangePrivacy={setAgreedPrivacy}
                           onChangeResell={setAgreedResell}
                        />

                        {/* 모바일 전용: 약관 동의 이후 주문정보 + 결제금액 + 버튼 */}
                        <div className="lg:hidden flex flex-col gap-6">
                           <OrderSummaryCard orderInfo={orderInfo} />
                           <PaymentAmountCard
                              ticketPrice={ticketPrice}
                              shippingFee={0}
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
                              disabled={!isFormValid}
                              onClick={handlePay}
                           >
                              {totalPayment.toLocaleString('ko-KR')}원 결제하기
                           </Button>
                        </div>
                     </div>
                  </div>

                  {/* 오른쪽: 주문 정보 — 데스크톱 전용 */}
                  <div className="hidden lg:flex flex-col flex-1 max-w-100 shrink-0 gap-[10px]">
                     <h2 className="text-heading-1-bold leading-normal text-foreground h-9">주문 정보 확인</h2>

                     <div className="flex flex-col gap-6">
                        <OrderSummaryCard orderInfo={orderInfo} />

                        <PaymentAmountCard
                           ticketPrice={ticketPrice}
                           shippingFee={0}
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
                           disabled={!isFormValid}
                           onClick={handlePay}
                        >
                           {totalPayment.toLocaleString('ko-KR')}원 결제하기
                        </Button>
                     </div>
                  </div>
               </div>
            </div>
         </main>
      </div>
   );
}
