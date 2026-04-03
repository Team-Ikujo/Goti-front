// src/pages/mypage/ui/PurchaseDetailPage.tsx

import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import CancelBookingDialog from './CancelBookingDialog';
import ResellRegisterDialog from './ResellRegisterDialog';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { useQuery } from '@tanstack/react-query';
import { fetchTicketDetail, fetchOrderTickets } from '@/entities/ticket/api/ticketApi';
import type { OrderTicket } from '@/entities/ticket/api/ticketApi';
import { fetchOrderPaymentDetail, formatOrderPaymentMethod } from '@/entities/payment/api/paymentApi';
import StatusBadge from './StatusBadge';
import type { BadgeVariant } from './StatusBadge';
import TicketItem from './TicketItem';
import type { TicketItemStatus } from './TicketItem';
import InfoItem from './InfoItem';
import QrViewDialog from './QrViewDialog';
import { Snackbar } from '@/shared/ui/snackbar';
import { formatTicketNumber, getTicketNumberKind } from '../model/ticketNumber';

// ─── 타입 ──────────────────────────────────────────────────────

type PurchaseStatus = '예매 완료' | '관람 완료' | '취소/환불';

// ─── 상태 → 배지 매핑 ──────────────────────────────────────────

const PURCHASE_BADGE: Record<string, BadgeVariant> = {
   ISSUED: 'success',
   USED: 'disabled',
   INVALID: 'warning',
   RESALE_ISSUED: 'success',
};

const mapStatusLabel = (status: string): string => {
   switch (status) {
      case 'ISSUED': return '예매 완료';
      case 'USED': return '관람 완료';
      case 'INVALID': return '취소/환불';
      case 'RESALE_ISSUED': return '예매 완료 (리셀)';
      default: return '예매 완료';
   }
};

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

const mapOverallStatus = (status: string): PurchaseStatus => {
   switch (status) {
      case 'ISSUED':
         return '예매 완료';
      case 'USED':
         return '관람 완료';
      case 'INVALID':
         return '취소/환불';
      case 'RESALE_ISSUED':
         return '예매 완료';
      default:
         return '예매 완료';
   }
};

const mapTicketItemStatus = (status: string): TicketItemStatus => {
   switch (status) {
      case 'ISSUED':
         return '예매완료';
      case 'USED':
         return '취소대기';
      case 'INVALID':
         return '취소완료';
      case 'RESALE_ISSUED':
         return '예매완료';
      default:
         return '예매완료';
   }
};

// ─── 로컬 서브 컴포넌트 ────────────────────────────────────────
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
   const { id: orderId } = useParams<{ id: string }>();
   const navigate = useNavigate();
   const location = useLocation();
   const [showCancelSnackbar, setShowCancelSnackbar] = useState(false);
   const [qrOpen, setQrOpen] = useState(false);
   const [cancelOpen, setCancelOpen] = useState(false);
   const [resellOpen, setResellOpen] = useState(false);

   const orderTicketsQuery = useQuery({
      queryKey: ['orderTickets', orderId],
      queryFn: () => fetchOrderTickets(orderId!),
      enabled: Boolean(orderId),
      retry: false,
   });

   const orderTickets = orderTicketsQuery.data ?? [];
   const primaryTicketId = orderTickets[0]?.ticketId;

   const ticketDetailQuery = useQuery({
      queryKey: ['ticketDetail', primaryTicketId],
      queryFn: () => fetchTicketDetail(primaryTicketId!),
      enabled: Boolean(primaryTicketId),
      retry: false,
   });

   const orderPaymentQuery = useQuery({
      queryKey: ['orderPaymentDetail', orderId],
      queryFn: () => fetchOrderPaymentDetail(orderId!),
      enabled: Boolean(orderId),
      retry: false,
   });

   const apiDetail = ticketDetailQuery.data;
   const isLoading = orderTicketsQuery.isLoading || (Boolean(primaryTicketId) && ticketDetailQuery.isLoading);
   const isError =
      orderTicketsQuery.isError ||
      (!primaryTicketId && !orderTicketsQuery.isLoading) ||
      (Boolean(primaryTicketId) && ticketDetailQuery.isError);

   useEffect(() => {
      if ((location.state as { showCancelSuccess?: boolean } | null)?.showCancelSuccess) {
         setShowCancelSnackbar(true);
         window.history.replaceState({}, '');
      }
   }, [location.state]);

   // ─── API 데이터를 UI 형태로 변환 ────────────────────────────
   const detail = useMemo(() => {
      if (!apiDetail) return undefined;

      const overallStatus = mapOverallStatus(apiDetail.ticketStatus);
      const isInvalid = apiDetail.ticketStatus === 'INVALID';

      const seatItems = orderTickets.map(t => ({
         ticketId: t.ticketId,
         orderId: formatTicketNumber(
            t.ticketNumber,
            t.ticketStatus === 'RESALE_ISSUED' ? 'resale' : getTicketNumberKind(t.ticketNumber, 'ticket'),
         ),
         section: t.seatInfo.split(' ')[0] ?? '',
         seatDetail: t.seatInfo,
         status: mapTicketItemStatus(t.ticketStatus),
         price: t.ticketPrice,
      }));

      const ticketCount = seatItems.length;
      const ticketAmount = seatItems.reduce((sum, s) => sum + s.price, 0);
      const fee = orderTickets.reduce((sum, t) => sum + (t.serviceFee ?? 0), 0);
      const total = ticketAmount + fee;
      const paymentMethodDisplay = orderPaymentQuery.data?.paymentMethod
         ? formatOrderPaymentMethod(orderPaymentQuery.data.paymentMethod)
         : undefined;
      const paidAt = orderPaymentQuery.data?.paidAt;
      const paymentAmount = orderPaymentQuery.data?.paymentAmount ?? total;

      return {
         id: apiDetail.ticketId,
         overallStatus,
         ticketStatus: apiDetail.ticketStatus,
         game: {
            teams: apiDetail.gameTitle,
            venue: apiDetail.stadiumName ?? '',
            datetime: apiDetail.gameDate,
         },
         orderId: formatTicketNumber(
            apiDetail.ticketNumber,
            apiDetail.ticketStatus === 'RESALE_ISSUED' ? 'resale' : getTicketNumberKind(apiDetail.ticketNumber, 'ticket'),
         ),
         orderDate: apiDetail.orderedAt ?? apiDetail.issuedAt,
         orderer: apiDetail.ordererName ?? '-',
         issuedAt: apiDetail.issuedAt,
         cancelDeadline: isInvalid ? undefined : (apiDetail.cancelableUntil ?? undefined),
         cancelDate: isInvalid ? (apiDetail.issuedAt ?? '-') : undefined,
         seatInfo: apiDetail.seatInfo,
         ticketPrice: apiDetail.ticketPrice,
         paymentMethodDisplay,
         paidAt,
         seatItems,
         paymentSummary: {
            status: isInvalid ? '결제 완료' : '결제 완료',
            ticketCount,
            ticketAmount,
            fee,
            total: paymentAmount,
            date: paidAt,
            bankAccount: undefined as string | undefined,
            bankDeadline: undefined as string | undefined,
         },
         paymentEvents: [{ type: '결제 완료' as const, method: paymentMethodDisplay }],
         refundInfo: isInvalid && orderPaymentQuery.data
            ? {
                 ticketAmount,
                 cancelFee: 0,
                 refundTotal: ticketAmount,
                 method: paymentMethodDisplay ?? '정보 없음',
                 date: paidAt,
              }
            : undefined,
         canCancel: apiDetail.ticketStatus === 'ISSUED',
         canSell: apiDetail.resaleEnabledStatus === 'ENABLED',
         deliveryMethod: '모바일 QR' as string,
         deliveryAddress: undefined as string | undefined,
         deliveryStatus: undefined as string | undefined,
         deliveryCarrier: undefined as string | undefined,
         deliveryTrackingNumber: undefined as string | undefined,
      };
   }, [apiDetail, orderPaymentQuery.data, orderTickets]);

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

         {cancelOpen && (
            <CancelBookingDialog
               open={cancelOpen}
               onClose={() => setCancelOpen(false)}
               orderId={orderId!}
               game={{ teams: detail.game.teams, datetime: detail.game.datetime }}
               isBankTransfer={orderPaymentQuery.data?.paymentMethod === 'ACCOUNT_TRANSFER'}
               paymentMethod={detail.paymentMethodDisplay}
               seats={seatTickets.map((ticket) => ({
                  orderId: formatTicketNumber(
                     ticket.ticketNumber,
                     ticket.ticketStatus === 'RESALE_ISSUED' ? 'resale' : getTicketNumberKind(ticket.ticketNumber, 'ticket'),
                  ),
                  section: ticket.seatInfo.split(' ')[0] ?? '',
                  seatDetail: ticket.seatInfo,
                  price: ticket.ticketPrice,
               }))}
            />
         )}

         {resellOpen && (
            <ResellRegisterDialog
               open={resellOpen}
               onClose={() => setResellOpen(false)}
               onCompleteConfirm={() => navigate('/mypage', { state: { activeTab: 'sale' } })}
               item={{
                  id: detail.id,
                  rawOrderId: orderId,
                  orderId: detail.orderId,
                  orderDate: detail.orderDate,
                  type: '티켓',
                  game: {
                     teams: detail.game.teams,
                     venue: detail.game.venue || '홈구장',
                     datetime: detail.game.datetime,
                     quantity: 1,
                     section: detail.seatInfo.split(' ')[0],
                     seats: [detail.seatInfo],
                  },
                  price: detail.ticketPrice,
                  paymentStatus: '예매 완료',
                  deliveryType: '모바일 티켓',
                  canSell: detail.canSell,
                  ticketIds: orderTickets.map((ticket) => ticket.ticketId),
               }}
            />
         )}

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

         <QrViewDialog
            open={qrOpen}
            onClose={() => setQrOpen(false)}
            seats={detail.seatItems
               .filter(s => s.status !== '취소완료')
               .map(s => ({ ticketId: s.ticketId, section: s.section, seatDetail: s.seatDetail }))}
         />
      </div>
   );
}
