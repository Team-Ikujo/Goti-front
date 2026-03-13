// src/pages/tickets/ui/payment/TicketPaymentPage.tsx

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
   ShippingAddressCard,
   TermsCard,
   type CashReceiptNumType,
   type CashReceiptType,
   type PaymentMethod,
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

   const shippingFee = deliveryMethod === 'delivery' ? 3000 : 0;

   const isDeliveryValid = deliveryMethod !== 'delivery' || (!!zipCode && !!address && !!addressDetail);
   // 무통장 입금 + 미발행이 아닌 경우 현금영수증 번호 필수
   const isCashReceiptValid = paymentMethod !== 'bank' || cashReceiptType === 'none' || !!cashReceiptNum;
   const isFormValid =
      !!name && !!phone && !!email && isDeliveryValid && isCashReceiptValid && agreedPrivacy && agreedPolicy;

   const handleZipResult = (zip: string, addr: string) => {
      setZipCode(zip);
      setAddress(addr);
   };

   const orderInfo = {
      matchTitle: MOCK_GAME.matchTitle,
      dateTime: MOCK_GAME.dateTime,
      quantity: 2,
      seats: ['1E-2구역 0열 0번', '1E-2구역 0열 0번'],
      deliveryLabel: DELIVERY_LABELS[deliveryMethod],
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
                        {/* 수령 방식 선택 */}
                        <PaymentCard>
                           <h3 className="text-[20px] font-bold leading-[1.5] text-foreground mb-5">수령 방식 선택</h3>
                           <div className="flex flex-col gap-3">
                              <RadioOptionCard
                                 selected={deliveryMethod === 'mobile'}
                                 onSelect={() => setDeliveryMethod('mobile')}
                                 label="모바일 티켓 (추천)"
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

                        {/* 취소 수수료 안내 */}
                        <div className="bg-fill-hover border border-border rounded-[14px] p-[25px]">
                           <div className="flex gap-3 items-start">
                              <AlertCircle className="size-5 text-foreground mt-0.75 shrink-0" />
                              <div className="flex flex-col gap-2">
                                 <span className="text-[18px] font-bold leading-[1.55] text-foreground">
                                    취소 수수료 안내
                                 </span>
                                 <div className="flex flex-col gap-1 text-[16px] font-medium leading-normal text-foreground">
                                    <p>• 경기 7일 전까지: 무료 취소</p>
                                    <p>• 경기 6~3일 전: 티켓금액의 10%</p>
                                    <p>• 경기 2~1일 전: 티켓금액의 20%</p>
                                    <p className="text-destructive font-semibold">• 경기 당일: 취소 불가</p>
                                 </div>
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
                              shippingFee={shippingFee}
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
