// src/pages/tickets/ui/payment/PaymentCompletePage.tsx

import { useNavigate, useSearchParams } from 'react-router-dom';
import { Calendar, CheckCircle, MapPin } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import BooksHeader from '@/shared/widgets/layout/books/BooksHeader';

type DeliveryMethod = 'mobile' | 'onsite' | 'delivery';

const DELIVERY_LABELS: Record<DeliveryMethod, string> = {
   mobile: '모바일 티켓',
   onsite: '현장 수령',
   delivery: '배송 수령',
};

const ENTRANCE_GUIDES: Record<DeliveryMethod, string[]> = {
   mobile: [
      '경기 시작 2시간 전부터 입장 가능합니다',
      'QR코드는 마이페이지에서 확인하실 수 있습니다.',
      '모바일 티켓 QR코드를 게이트에서 제시해주세요',
      '신분증을 함께 지참해주세요',
   ],
   onsite: [
      '경기 시작 2시간 전부터 티켓 수령 및 입장이 가능합니다.',
      '경기장 티켓 수령처에서 예매 번호와 신분증을 제시해주세요.',
      '티켓 수령 후 게이트에서 티켓을 제시하고 입장해주세요.',
      '티켓 수령처 위치는 구장 안내를 참고해주세요.',
   ],
   delivery: [
      '경기 시작 2시간 전부터 입장 가능합니다',
      '배송된 실물 티켓을 지참하여 경기장에 방문해주세요.',
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
   const deliveryMethod = (searchParams.get('delivery') as DeliveryMethod) ?? 'mobile';
   const order = MOCK_ORDER;

   const actionButton =
      deliveryMethod === 'delivery'
         ? { label: '예매내역 확인하기', onClick: () => navigate('/') }
         : { label: 'QR 코드 확인하기', onClick: () => {} };

   return (
      <div className="min-h-screen flex flex-col bg-background">
         <BooksHeader />

         <main className="flex-1 bg-white flex justify-center px-4">
            <div className="w-full max-w-[1200px] py-12 flex flex-col gap-[26px] items-center">
               {/* 완료 헤더 */}
               <div className="flex flex-col gap-3 items-center w-full">
                  <div className="size-24 rounded-full bg-(--fill-hoveraccent) flex items-center justify-center">
                     <CheckCircle className="size-12 text-primary" strokeWidth={1.5} />
                  </div>
                  <p className="text-[32px] font-bold leading-[1.45] tracking-[-0.032px] text-[#101828] text-center">
                     예매 완료!
                  </p>
                  <p className="text-[20px] font-semibold leading-[1.5] text-[#4a5565] text-center">
                     티켓이 성공적으로 발급되었습니다
                  </p>
               </div>

               {/* 예매 정보 카드 */}
               <div className="w-full border-2 border-border-light rounded-[14px] p-[26px] flex flex-col gap-6 bg-background">
                  {/* 예매 번호 */}
                  <div className="flex flex-col gap-1">
                     <span className="text-[16px] font-bold leading-[1.5] text-(--text-secondary)">예매 번호</span>
                     <span className="text-[18px] font-bold leading-[1.55] text-foreground">{order.orderNumber}</span>
                  </div>

                  {/* 구분선 + 경기 / 수량 / 좌석 */}
                  <div className="border-t border-border pt-[30px] flex flex-col gap-[30px]">
                     {/* 경기 정보 */}
                     <div className="flex flex-col gap-2">
                        <span className="text-[16px] font-bold leading-[1.5] text-(--text-secondary)">경기 정보</span>
                        <span className="text-[24px] font-bold leading-[1.5] text-[#101828]">{order.gameTitle}</span>
                        <div className="flex items-center gap-4">
                           <div className="flex items-center gap-2">
                              <Calendar className="size-5 text-foreground shrink-0" />
                              <span className="text-[16px] font-medium leading-[1.5] text-foreground">
                                 {order.gameDate}
                              </span>
                           </div>
                           <div className="flex items-center gap-2">
                              <MapPin className="size-5 text-foreground shrink-0" />
                              <span className="text-[16px] font-medium leading-[1.5] text-foreground">
                                 {order.gameVenue}
                              </span>
                           </div>
                        </div>
                     </div>

                     {/* 수량 */}
                     <div className="flex flex-col gap-1">
                        <span className="text-[16px] font-bold leading-[1.5] text-(--text-secondary)">수량</span>
                        <span className="text-[16px] font-medium leading-[1.5] text-foreground">{order.quantity}매</span>
                     </div>

                     {/* 좌석 정보 */}
                     <div className="flex flex-col gap-1">
                        <span className="text-[16px] font-bold leading-[1.5] text-(--text-secondary)">좌석 정보</span>
                        {order.seats.map((seat, i) => (
                           <span key={i} className="text-[16px] font-medium leading-[1.5] text-foreground">
                              {seat}
                           </span>
                        ))}
                     </div>
                  </div>
               </div>

               {/* 입장 안내 카드 — 수령 방식별 문구 상이 */}
               <div className="w-full bg-(--fill-hoveraccent) border border-(--border-accent) rounded-[14px] p-[25px]">
                  <div className="flex flex-col gap-2">
                     <span className="text-[18px] font-bold leading-[1.55] text-[#0054d1]">입장 안내</span>
                     <div className="flex flex-col gap-1 text-[16px] font-medium leading-[1.5] text-[#0054d1]">
                        {ENTRANCE_GUIDES[deliveryMethod].map((guide, i) => (
                           <p key={i}>• {guide}</p>
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
                        { label: '주문상태', value: '결제완료' },
                        { label: '주문접수일시', value: order.orderedAt },
                        { label: '수령 방식', value: DELIVERY_LABELS[deliveryMethod] },
                     ].map(({ label, value }) => (
                        <div key={label} className="flex items-start justify-between text-[16px] leading-[1.5]">
                           <span className="font-bold text-foreground">{label}</span>
                           <span className="font-medium text-foreground">{value}</span>
                        </div>
                     ))}
                     <div className="flex items-start justify-between text-[16px] leading-[1.5]">
                        <span className="font-bold text-foreground">결제 금액</span>
                        <span className="font-medium text-destructive">
                           {order.amount.toLocaleString('ko-KR')}원
                        </span>
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
                           <div key={label} className="flex items-start justify-between text-[16px] leading-[1.5]">
                              <span className="font-bold text-foreground">{label}</span>
                              <span className="font-medium text-foreground">{value}</span>
                           </div>
                        ))}
                     </div>
                  </div>
               )}

               {/* 하단 버튼 */}
               <div className="flex gap-4 justify-center w-full">
                  <Button variant="secondary" className="w-[360px] py-3" onClick={() => navigate('/')}>
                     홈으로
                  </Button>
                  <Button variant="primary" className="w-[360px] py-3" onClick={actionButton.onClick}>
                     {actionButton.label}
                  </Button>
               </div>
            </div>
         </main>
      </div>
   );
}
