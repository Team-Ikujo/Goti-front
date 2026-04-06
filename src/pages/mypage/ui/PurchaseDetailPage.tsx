// src/pages/mypage/ui/PurchaseDetailPage.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import type { OrderTicket } from '@/entities/ticket/api/ticketApi';
import StatusBadge from './StatusBadge';
import TicketItem from './TicketItem';
import InfoItem from './InfoItem';
import { Snackbar } from '@/shared/ui/snackbar';
import { formatTicketNumber, getTicketNumberKind } from '../model/ticketNumber';
import {
   mapStatusLabel,
   mapTicketItemStatus,
   PURCHASE_BADGE,
   usePurchaseDetailData,
} from '../model/usePurchaseDetailData';
import { PurchaseDetailDialogs } from './PurchaseDetailDialogs';

// ─── 유틸 ──────────────────────────────────────────────────────

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

const formatDateTime = (isoStr: string): string => {
   const d = new Date(isoStr);
   const y = d.getFullYear();
   const m = String(d.getMonth() + 1).padStart(2, '0');
   const day = String(d.getDate()).padStart(2, '0');
   const dow = DAYS[d.getDay()];
   const h = String(d.getHours()).padStart(2, '0');
   const min = String(d.getMinutes()).padStart(2, '0');
   return `${y}.${m}.${day} (${dow}) ${h}:${min}`;
};

const formatPrice = (amount: number): string => `${amount.toLocaleString()}원`;

// ─── 서브 컴포넌트 ──────────────────────────────────────────────

function SectionCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
   return (
      <div className={`border border-[#e9ebee] rounded-2xl p-6.25 flex flex-col gap-6 ${className}`}>{children}</div>
   );
}

function InfoRow({ label, value }: { label: string; value: string }) {
   return (
      <div className="flex items-start justify-between text-body-1-regular">
         <span className="flex-1 text-[#646f7c] leading-normal">{label}</span>
         <span className="shrink-0 text-[#374553] text-right leading-normal">{value}</span>
      </div>
   );
}

function BulletItem({ text }: { text: string }) {
   return (
      <div className="flex gap-1 items-start">
         <span className="shrink-0">•</span>
         <span className="flex-1">{text}</span>
      </div>
   );
}

// ─── 메인 컴포넌트 ──────────────────────────────────────────────

export default function PurchaseDetailPage() {
   const navigate = useNavigate();
   const [qrOpen, setQrOpen] = useState(false);
   const [cancelOpen, setCancelOpen] = useState(false);
   const [resellOpen, setResellOpen] = useState(false);
   const {
      orderId,
      orderTickets,
      orderPaymentQuery,
      detail,
      isLoading,
      isError,
      showCancelSnackbar,
      setShowCancelSnackbar,
   } = usePurchaseDetailData();

   if (isLoading) return <div className="py-24 text-center text-body-1-regular">정보를 불러오는 중입니다...</div>;
   if (isError || !detail) {
      return (
         <div className="flex flex-col items-center justify-center py-24 gap-4">
            <p className="text-body-1-regular text-muted-foreground">내역을 찾을 수 없습니다.</p>
            <Button variant="tertiary" onClick={() => navigate('/mypage')}>
               마이페이지로 돌아가기
            </Button>
         </div>
      );
   }

   const statusLabel = mapStatusLabel(detail.ticketStatus);
   const serviceFee = detail.paymentSummary.fee;
   const totalQuantity = orderTickets.length || 1;
   const totalTicketPrice = detail.paymentSummary.ticketAmount;
   const totalPaid = detail.paymentSummary.total;
   const totalRefund = totalTicketPrice - serviceFee;
   const seatTickets: OrderTicket[] = orderTickets;

   return (
      <div className="flex flex-col items-center pt-8 lg:pt-12.5 pb-40 px-4">
         <Snackbar
            open={showCancelSnackbar}
            message="취소가 완료되었습니다."
            onClose={() => setShowCancelSnackbar(false)}
         />
         <PurchaseDetailDialogs
            orderId={orderId!}
            detail={detail}
            orderTickets={orderTickets}
            isBankTransfer={orderPaymentQuery.data?.paymentMethod === 'ACCOUNT_TRANSFER'}
            qrOpen={qrOpen}
            cancelOpen={cancelOpen}
            resellOpen={resellOpen}
            onCloseQr={() => setQrOpen(false)}
            onCloseCancel={() => setCancelOpen(false)}
            onCloseResell={() => setResellOpen(false)}
         />

         <div className="flex flex-col gap-14 w-full max-w-190 min-w-83.75">
            {/* 제목 */}
            <div className="flex items-center gap-4">
               <h1 className="text-[32px] font-bold text-[#111827] tracking-[-0.032px] leading-[1.45]">
                  예매내역 상세
               </h1>
            </div>

            {/* 섹션들 */}
            <div className="flex flex-col gap-12">
               {/* 경기 정보 */}
               <SectionCard>
                  <StatusBadge label={statusLabel} variant={PURCHASE_BADGE[detail.ticketStatus]} />
                  <div className="flex flex-col gap-4">
                     <p className="text-[32px] font-bold text-[#161d24] tracking-[-0.032px] leading-[1.45]">
                        {detail.game.teams}
                     </p>
                     <div className="flex flex-col gap-1 text-[18px] font-medium text-[#374553]">
                        <p className="leading-[1.55]">{formatDateTime(detail.game.datetime)}</p>
                        {detail.game.venue && (
                           <p className="leading-[1.55]">{detail.game.venue}</p>
                        )}
                     </div>
                  </div>
               </SectionCard>

               {/* 예약 정보 */}
               <SectionCard>
                  <h2 className="text-[20px] font-bold text-[#161d24] leading-normal">예약 정보</h2>
                  <div className="flex flex-col gap-3">
                     <InfoRow label="예약번호" value={detail.orderId} />
                     <InfoRow label="예매일시" value={detail.issuedAt ? formatDateTime(detail.issuedAt) : '-'} />
                     <InfoRow label="예매자" value={detail.orderer} />
                     <InfoRow
                        label="취소 가능 기한"
                        value={detail.cancelDeadline ? `${formatDateTime(detail.cancelDeadline)} 까지` : '-'}
                     />
                  </div>
               </SectionCard>

               {/* 좌석 정보 */}
               <SectionCard className="gap-8">
                  <h2 className="text-[20px] font-bold text-[#161d24] leading-normal">좌석 정보</h2>
                  <div className="flex flex-col gap-6">
                     {seatTickets.map((ticket, idx) => (
                        <div key={ticket.ticketId}>
                           {idx > 0 && <div className="h-px bg-[#e9ebee] mb-6" />}
                           <TicketItem
                              orderId={formatTicketNumber(
                                 ticket.ticketNumber,
                                 ticket.ticketStatus === 'RESALE_ISSUED' ? 'resale' : getTicketNumberKind(ticket.ticketNumber, 'ticket'),
                              )}
                              section={ticket.seatInfo.split(' ')[0]}
                              seatDetail={ticket.seatInfo}
                              status={mapTicketItemStatus(ticket.ticketStatus)}
                              price={ticket.ticketPrice}
                           />
                        </div>
                     ))}
                  </div>
               </SectionCard>

               {/* 티켓 수령 방법 */}
               <SectionCard>
                  <h2 className="text-[20px] font-bold text-[#161d24] leading-normal">티켓 수령 방법</h2>
                  <InfoRow label="수령 방법" value="모바일 QR" />
                  <Button variant="secondary" className="w-full py-3" onClick={() => setQrOpen(true)}>
                     모바일 QR 확인
                  </Button>
               </SectionCard>

               {/* 결제 정보 — 취소/환불 상태에서는 숨김 */}
               {detail.ticketStatus !== 'INVALID' && (
               <SectionCard>
                  <div className="flex items-start justify-between text-[20px] font-bold">
                        <span className="text-[#161d24] leading-normal">결제 정보</span>
                        <span className="text-primary leading-normal">결제 완료</span>
                  </div>
                  {orderPaymentQuery.isLoading ? (
                     <div className="rounded-xl bg-[#f7f8f9] px-5 py-6 text-center text-[14px] text-[#646f7c]">
                        결제 정보를 불러오는 중입니다.
                     </div>
                  ) : orderPaymentQuery.isError ? (
                     <div className="rounded-xl bg-[#f7f8f9] px-5 py-6 text-center text-[14px] text-[#646f7c]">
                        결제 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
                     </div>
                  ) : (
                     <>
                        <div className="bg-[#f7f8f9] rounded-xl p-5 flex flex-col gap-3">
                           <InfoRow label={`티켓 금액 (${totalQuantity}매)`} value={formatPrice(totalTicketPrice)} />
                           <InfoRow label="수수료" value={formatPrice(serviceFee)} />
                           <div className="flex items-center justify-between font-bold">
                              <span className="text-[16px] text-[#374553] leading-normal">총 결제 금액</span>
                              <span className="text-[20px] text-primary leading-normal">{formatPrice(totalPaid)}</span>
                           </div>
                        </div>
                        <div className="flex flex-col gap-3">
                           <InfoRow label="결제 수단" value={detail.paymentMethodDisplay ?? '-'} />
                           <InfoRow label="결제 일시" value={detail.paidAt ? formatDateTime(detail.paidAt) : '-'} />
                        </div>
                     </>
                  )}
               </SectionCard>
               )}

               {/* 취소/환불 정보 — INVALID 상태일 때만 표시 */}
               {detail.ticketStatus === 'INVALID' && (
                  <SectionCard>
                     <div className="flex items-start justify-between text-[20px] font-bold">
                        <span className="text-[#161d24] leading-normal">취소/환불 정보</span>
                        <span className="text-destructive leading-normal">취소/환불 완료</span>
                     </div>
                     {/* 금액 요약 */}
                     <div className="bg-[#f7f8f9] rounded-xl p-5 flex flex-col gap-3">
                        <InfoRow label={`티켓 금액 (${totalQuantity}매)`} value={formatPrice(totalTicketPrice)} />
                        <InfoRow label="수수료" value={`-${formatPrice(serviceFee)}`} />
                        <div className="flex items-center justify-between font-bold">
                           <span className="text-[16px] text-[#374553] leading-normal">환불 금액</span>
                           <span className="text-[20px] text-destructive leading-normal">{formatPrice(totalRefund)}</span>
                        </div>
                     </div>
                     {/* 환불 수단/일시 */}
                     {orderPaymentQuery.isLoading ? (
                        <div className="rounded-xl bg-[#f7f8f9] px-5 py-6 text-center text-[14px] text-[#646f7c]">
                           환불 정보를 불러오는 중입니다.
                        </div>
                     ) : orderPaymentQuery.isError ? (
                        <div className="rounded-xl bg-[#f7f8f9] px-5 py-6 text-center text-[14px] text-[#646f7c]">
                           환불 수단 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
                        </div>
                     ) : (
                        <div className="flex flex-col gap-3">
                           <InfoRow label="환불 수단" value={detail.paymentMethodDisplay ?? '정보 없음'} />
                           <InfoRow label="취소 일시" value={detail.paidAt ? formatDateTime(detail.paidAt) : '정보 없음'} />
                        </div>
                     )}
                     {/* 안내 문구 */}
                     <div className="bg-[#f7f8f9] rounded-xl p-5">
                        <div className="flex flex-col gap-1 text-[13px] font-medium text-[#646f7c] leading-normal">
                           <BulletItem text="취소/환불은 영업일 기준 1~3일 이내 처리될 예정입니다." />
                           <BulletItem text="문의사항은 고객센터로 문의해주세요." />
                        </div>
                     </div>
                  </SectionCard>
               )}

               {/* 취소/환불 정보 (InfoItem) */}
               {detail.refundInfo && !orderPaymentQuery.isError && (
                  <InfoItem
                     type="payment"
                     heading="취소/환불 정보"
                     statusText="취소/환불 완료"
                     statusColor="text-destructive"
                     summaryRows={[
                        {
                           label: `티켓 금액 (${detail.paymentSummary.ticketCount}매)`,
                           amount: detail.refundInfo.ticketAmount,
                        },
                        { label: '취소 수수료', amount: detail.refundInfo.cancelFee },
                     ]}
                     totalLabel="총 환불 금액"
                     totalAmount={detail.refundInfo.refundTotal}
                     totalColor="text-destructive"
                     infoRows={[
                        { label: '환불 수단', value: detail.refundInfo.method },
                        { label: '환불 일시', value: detail.refundInfo.date ?? '-' },
                     ]}
                     helperTexts={[
                        '• 판매 취소된 티켓은 예매 내역에서 확인하실 수 있습니다.',
                        '• 취소/환불은 영업일 기준 1~3일 이내 처리될 예정입니다. 문의사항은 고객센터로 문의해주세요.',
                     ]}
                  />
               )}
            </div>

            {/* 액션 버튼 */}
            <div className="flex gap-3">
               {detail.canCancel && (
                  <Button
                     variant="tertiary"
                     className="flex-1 py-3"
                     onClick={() => setCancelOpen(true)}
                  >
                     예매 취소하기
                  </Button>
               )}
               {detail.canSell && (
                  <Button
                     variant="secondary"
                     className="flex-1 py-3"
                     onClick={() => setResellOpen(true)}
                  >
                     판매 등록하기
                  </Button>
               )}
            </div>

            {/* 입장 안내 */}
            <div className="bg-[#f4f7fe] rounded-[14px] p-6 flex flex-col gap-2">
               <h4 className="text-[18px] font-bold text-primary leading-[1.55]">입장 안내</h4>
               <div className="flex flex-col gap-1 text-[14px] text-[#374553] leading-normal">
                  <BulletItem text="경기 시작 2시간 전부터 입장 가능합니다" />
                  <BulletItem text="모바일 티켓 QR코드를 게이트에서 제시해주세요" />
                  <BulletItem text="신분증을 함께 지참해주세요" />
               </div>
            </div>

            {/* 유의사항 */}
            <div className="bg-[#f7f8f9] rounded-[14px] p-6 flex flex-col gap-6">
               <div className="flex items-center gap-1">
                  <AlertCircle size={20} className="text-[#161d24] shrink-0" />
                  <h4 className="text-[18px] font-bold text-[#161d24] leading-[1.55]">유의사항</h4>
               </div>
               <div className="flex flex-col gap-6">
                  {/* 취소/환불 안내 */}
                  <div className="flex flex-col gap-2">
                     <p className="text-[16px] font-bold text-[#374553] leading-normal">취소/환불 안내</p>
                     <div className="flex flex-col gap-1 text-[14px] text-[#374553] leading-normal">
                        <BulletItem text="예매 당일 취소 시 전액 환불됩니다. (예매 수수료 포함)" />
                        <BulletItem text="예매 익일 ~ 경기 시작 4시간 전까지 취소 시 예매 수수료와 취소 수수료가 부과됩니다." />
                        <BulletItem text="경기 시작 4시간 전인 예매 취소 마감 기간 이후 취소 및 환불이 불가능합니다." />
                        <BulletItem text="리셀로 구매한 티켓은 취소 및 환불이 불가능합니다." />
                        <BulletItem text="취소/환불 금액은 은행 영업일 기준 1~3일 내에 지정된 계좌로 입금됩니다." />
                        <BulletItem text="환불 규정에 따라 환불 처리가 됩니다." />
                     </div>
                  </div>
                  {/* 티켓 리셀 안내 */}
                  <div className="flex flex-col gap-2">
                     <p className="text-[16px] font-bold text-[#374553] leading-normal">티켓 리셀 안내</p>
                     <div className="flex flex-col gap-1 text-[14px] text-[#374553] leading-normal">
                        <BulletItem text="안전한 거래를 위해 모바일 티켓만 리셀 등록이 가능합니다." />
                        <BulletItem text="구매하신 티켓은 예매 시작 이후 2시간이 된 시점부터 경기 시작 이후 1시간까지 리셀 마켓에 등록하실 수 있습니다." />
                        <BulletItem text="리셀 시 별도의 취소 수수료는 없으며, 거래 완료 시 판매 금액의 5% 중개 수수료가 적용됩니다." />
                     </div>
                  </div>
               </div>
            </div>
         </div>

      </div>
   );
}
