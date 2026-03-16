// src/pages/tickets/ui/payment/ResellPaymentPage.tsx

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import {
   CashReceiptCard,
   DiscountCard,
   OrdererInfoCard,
   OrderSummaryCard,
   PAYMENT_LABELS,
   PaymentAmountCard,
   PaymentGuideCard,
   PaymentHeader,
   PaymentMethodCard,
   PaymentCard,
   RadioOptionCard,
   ResellInfoCard,
   TermsCard,
   type CashReceiptNumType,
   type CashReceiptType,
   type PaymentMethod,
} from './_shared';

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
   const [agreedPolicy, setAgreedPolicy] = useState(false);

   // 현금영수증 (무통장 입금 선택 시)
   const [cashReceiptType, setCashReceiptType] = useState<CashReceiptType>('income');
   const [cashReceiptNumType, setCashReceiptNumType] = useState<CashReceiptNumType>('phone');
   const [cashReceiptNum, setCashReceiptNum] = useState('');
   const [saveCashReceipt, setSaveCashReceipt] = useState(false);

   // 무통장 입금 + 미발행이 아닌 경우 현금영수증 번호 필수
   const isCashReceiptValid = paymentMethod !== 'bank' || cashReceiptType === 'none' || !!cashReceiptNum;
   const isFormValid = !!name && !!phone && !!email && isCashReceiptValid && agreedPrivacy && agreedPolicy;

   const orderInfo = {
      matchTitle: MOCK_GAME.matchTitle,
      dateTime: MOCK_GAME.dateTime,
      quantity: 2,
      seats: ['1E-2구역 0열 0번', '1E-2구역 0열 0번'],
      deliveryLabel: '모바일 티켓',
      paymentLabel: PAYMENT_LABELS[paymentMethod],
   };

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

                        {/* 취소/환불 불가 안내 — 리셀 전용 */}
                        <div className="bg-[#fef1f1] border border-[#fac7c7] rounded-[14px] p-[25px]">
                           <div className="flex gap-3 items-start">
                              <AlertCircle className="size-5 text-destructive mt-[3px] shrink-0" />
                              <div className="flex flex-col gap-2">
                                 <span className="text-[18px] font-bold leading-[1.55] text-destructive">
                                    취소 및 환불 불가 안내
                                 </span>
                                 <p className="text-[16px] font-medium leading-[1.5] text-destructive">
                                    리셀 티켓은 개인 간 거래로 진행되며, 구매 완료 후 취소 및 환불이 제한됩니다.
                                 </p>
                              </div>
                           </div>
                        </div>

                        {/* 티켓 리셀 안내 */}
                        <ResellInfoCard />

                        {/* 약관 동의 */}
                        <TermsCard
                           agreedPrivacy={agreedPrivacy}
                           agreedPolicy={agreedPolicy}
                           onChangePrivacy={setAgreedPrivacy}
                           onChangePolicy={setAgreedPolicy}
                        />
                     </div>
                  </div>

                  {/* 오른쪽: 결제 수단 */}
                  <div className="flex-1 max-w-[400px] shrink-0 flex flex-col gap-[10px]">
                     <h2 className="text-[24px] font-bold leading-[1.5] text-foreground h-[36px]">결제 수단 선택</h2>

                     <div className="flex flex-col gap-7">
                        <div className="flex flex-col gap-6">
                           <PaymentMethodCard selected={paymentMethod} onSelect={setPaymentMethod} />
                           <PaymentGuideCard />
                        </div>

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
                              fee={0}
                           />
                           <Button
                              variant="primary"
                              size="lg"
                              className="w-full"
                              disabled={!isFormValid}
                              onClick={handlePay}
                           >
                              0원 결제하기
                           </Button>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </main>
      </div>
   );
}
