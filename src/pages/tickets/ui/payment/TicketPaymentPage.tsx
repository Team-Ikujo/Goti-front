// src/pages/tickets/ui/payment/TicketPaymentPage.tsx

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSeatSelectionStore } from '@/pages/books/model/useSeatSelectionStore';
import { Button } from '@/shared/ui/button';
import type { PaymentRequest } from '@/pages/tickets/api/paymentApi';
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
   const zonesState = useSeatSelectionStore((state) => state.zones);

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

   const shippingFee = deliveryMethod === 'delivery' ? 3000 : 0;

   const isDeliveryValid = deliveryMethod !== 'delivery' || (!!zipCode && !!address && !!addressDetail);
   // 무통장 입금 + 미발행이 아닌 경우 현금영수증 번호 필수
   const isCashReceiptValid = paymentMethod !== 'bank' || cashReceiptType === 'none' || !!cashReceiptNum;
   const isFormValid =
      !!name &&
      !!phone &&
      !!email &&
      isDeliveryValid &&
      isCashReceiptValid &&
      agreedPrivacy &&
      agreedPolicy &&
      agreedResell;

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

   // 수수료: 매당 1,000원
   const fee = orderInfo.quantity * 1000;
   const totalPayment = shippingFee + fee; // ticketPrice·할인 0원 (TODO: 실데이터 연결 후 업데이트)

   useEffect(() => {
      const selectedSeatSummary = Object.entries(zonesState).flatMap(([zoneId, zone]) =>
         zone.selectedSeatIds.map((seatId) => ({
            zoneId,
            seatId,
         })),
      );

      console.info('[TicketPaymentPage] mounted with seat selections', {
         selectedSeatCount: selectedSeatSummary.length,
         selectedSeatSummary,
      });
   }, [zonesState]);

   const handlePay = () => {
      const paymentRequest: PaymentRequest = {
         deliveryMethod,
         ordererName: name,
         ordererPhone: phone,
         ordererEmail: email,
         paymentMethod,
         ...(deliveryMethod === 'delivery' && { zipCode, address, addressDetail }),
         ...(paymentMethod === 'bank' && {
            cashReceiptType,
            cashReceiptNumType,
            cashReceiptNum,
         }),
      };
      navigate('/tickets/payment/processing', { state: paymentRequest });
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

                        {/* 결제 방법 */}
                        <PaymentMethodCard selected={paymentMethod} onSelect={setPaymentMethod} />

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
                     </div>
                  </div>

                  {/* 오른쪽: 주문 정보 */}
                  <div className="flex-1 max-w-100 shrink-0 flex flex-col gap-[10px]">
                     <h2 className="text-heading-1-bold leading-normal text-foreground h-9">주문 정보 확인</h2>

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
