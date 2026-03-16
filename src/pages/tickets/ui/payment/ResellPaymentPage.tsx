// src/pages/tickets/ui/payment/ResellPaymentPage.tsx

import { useState } from 'react';
import { Button } from '@/shared/ui/button';
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
} from './_shared';

import { ResellNotesCard } from './ResellNotesCard';
import { ResellTermsCard } from './ResellTermsCard';

// TODO: 예매 단계 완성 후 라우터 state/params로 교체
const MOCK_GAME = {
   matchTitle: '기아 vs LG',
   venue: '기아 챔피언스필드',
   dateTime: '3.21 (토) 오후 18:30',
};

export default function ResellPaymentPage() {
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

   // 무통장 입금 + 미발행이 아닌 경우 현금영수증 번호 필수
   const isCashReceiptValid = paymentMethod !== 'bank' || cashReceiptType === 'none' || !!cashReceiptNum;
   const isFormValid = !!name && !!phone && !!email && isCashReceiptValid && agreedPrivacy && agreedResell;

   const orderInfo = {
      matchTitle: MOCK_GAME.matchTitle,
      dateTime: MOCK_GAME.dateTime,
      quantity: 2,
      seats: ['1E-2구역 0열 0번', '1E-2구역 0열 0번'],
      deliveryLabel: '모바일 티켓',
      paymentLabel: PAYMENT_LABELS[paymentMethod],
   };

   // 수수료: 매당 1,000원
   const fee = orderInfo.quantity * 1000;
   const totalPayment = fee; // ticketPrice·배송비·할인 0원 (TODO: 실데이터 연결 후 업데이트)

   const handlePay = () => {
      // TODO: 결제 API 연결
   };

   return (
      <div className="min-h-screen flex flex-col bg-background">
         <PaymentHeader {...MOCK_GAME} />

         <main className="flex-1 bg-white flex justify-center px-4">
            <div className="w-full max-w-[1200px] py-8 flex flex-col gap-8">
               <h1 className="text-[32px] font-bold leading-[1.45] tracking-[-0.032px] text-foreground">주문서</h1>

               <div className="flex gap-8 items-start">
                  {/* 왼쪽: 주문자 정보 */}
                  <div className="flex-1 min-w-0 flex flex-col gap-[10px]">
                     <h2 className="text-[24px] font-bold leading-[1.5] text-foreground h-[42px]">주문자 정보 입력</h2>

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
                        <PaymentMethodCard selected={paymentMethod} onSelect={setPaymentMethod} />

                        {/* 약관 동의 */}
                        <ResellTermsCard
                           agreedPrivacy={agreedPrivacy}
                           agreedResell={agreedResell}
                           onChangePrivacy={setAgreedPrivacy}
                           onChangeResell={setAgreedResell}
                        />

                        {/* 유의사항 */}
                        <ResellNotesCard />
                     </div>
                  </div>

                  {/* 오른쪽: 주문 정보 */}
                  <div className="flex-1 max-w-[400px] shrink-0 flex flex-col gap-[10px]">
                     <h2 className="text-[24px] font-bold leading-[1.5] text-foreground h-[36px]">주문 정보 확인</h2>

                     <div className="flex flex-col gap-6">
                        <OrderSummaryCard orderInfo={orderInfo} />

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

                        <PaymentAmountCard
                           ticketPrice={0}
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
