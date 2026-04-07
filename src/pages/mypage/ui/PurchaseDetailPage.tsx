// src/pages/mypage/ui/PurchaseDetailPage.tsx

import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { useQuery } from '@tanstack/react-query';
import { fetchTicketDetail, fetchOrderTickets } from '@/entities/ticket/api/ticketApi';
import { fetchOrderPaymentDetail, formatOrderPaymentMethod } from '@/entities/payment/api/paymentApi';
import StatusBadge from './StatusBadge';
import TicketItem from './TicketItem';
import InfoItem from './InfoItem';
import { PurchaseDetailDialogs } from './PurchaseDetailDialogs';
import { Snackbar } from '@/shared/ui/snackbar';
import { readStoredPaymentCompleteItems } from '@/shared/lib/paymentCompleteStorage';
import { useAuthStore } from '@/entities/auth/model/authStore';
import { decodeJwtPayload } from '@/shared/lib/jwt';
import { formatReservationNumber, formatTicketNumber, getTicketNumberKind } from '../model/ticketNumber';
import type { PurchaseDetailViewModel, PurchaseSeatItem } from '../model/purchaseDetailTypes';
import {
   PURCHASE_BADGE,
   mapStatusLabel,
   parseDateValue,
   formatDateTime,
   parseGradeName,
   getFallbackCancelableUntil,
   formatGameTitle,
   mapOverallStatus,
   mapTicketItemStatus,
   formatPrice,
} from '../model/purchaseDetailHelpers';

function SectionCard({ children, className = '' }: { children: ReactNode; className?: string }) {
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

export default function PurchaseDetailPage() {
   const navigate = useNavigate();
   const location = useLocation();
   const { id: orderId } = useParams<{ id: string }>();
   const accessToken = useAuthStore(state => state.accessToken);
   const [showCancelSnackbar, setShowCancelSnackbar] = useState(false);
   const [qrOpen, setQrOpen] = useState(false);
   const [cancelOpen, setCancelOpen] = useState(false);
   const [resellOpen, setResellOpen] = useState(false);

   const fallbackOrdererName = useMemo(() => {
      const payload = decodeJwtPayload(accessToken);
      const candidates = [payload?.name, payload?.nickname, payload?.preferred_username, payload?.email, payload?.sub];
      const resolved = candidates.find(value => typeof value === 'string' && value.trim().length > 0);
      return typeof resolved === 'string' ? resolved : '예매자';
   }, [accessToken]);

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
   const storedPaymentDetail = useMemo(() => {
      if (!orderId) return undefined;
      return readStoredPaymentCompleteItems().find(item => {
         return item.ticketId === orderId || item.orderId === orderId || item.orderNumber === orderId;
      });
   }, [orderId]);
   const isLoading = orderTicketsQuery.isLoading || (Boolean(primaryTicketId) && ticketDetailQuery.isLoading);
   const isError =
      orderTicketsQuery.isError ||
      (!primaryTicketId && !orderTicketsQuery.isLoading && !storedPaymentDetail) ||
      (Boolean(primaryTicketId) && ticketDetailQuery.isError);

   useEffect(() => {
      if ((location.state as { showCancelSuccess?: boolean } | null)?.showCancelSuccess) {
         setShowCancelSnackbar(true);
         window.history.replaceState({}, '');
      }
   }, [location.state]);

   const detail = useMemo<PurchaseDetailViewModel | undefined>(() => {
      if (!apiDetail && !storedPaymentDetail) return undefined;

      if (!apiDetail && storedPaymentDetail) {
         const seats = storedPaymentDetail.seats.length > 0 ? storedPaymentDetail.seats : ['좌석 정보'];
         const isCanceledOrder =
            storedPaymentDetail.orderStatus === 'CANCELED' || storedPaymentDetail.paymentStatus === 'CANCELED';
         const seatItems: PurchaseSeatItem[] = seats.map((seatInfo, index) => ({
            ticketId:
               storedPaymentDetail.ticketId ??
               `${storedPaymentDetail.orderId ?? storedPaymentDetail.orderNumber}-${index}`,
            orderId: formatTicketNumber(storedPaymentDetail.orderNumber, 'ticket'),
            section: parseGradeName(seatInfo),
            seatDetail: seatInfo,
            status: '예매완료',
            price: Math.round(storedPaymentDetail.amount / Math.max(seats.length, 1)),
         }));

         return {
            id: storedPaymentDetail.ticketId ?? storedPaymentDetail.orderId ?? storedPaymentDetail.orderNumber,
            rawOrderId: storedPaymentDetail.orderId ?? storedPaymentDetail.orderNumber,
            overallStatus: '예매 완료' as const,
            ticketStatus: storedPaymentDetail.orderType === 'resale' ? 'RESALE_ISSUED' : 'ISSUED',
            game: {
               teams: formatGameTitle(storedPaymentDetail.gameTitle),
               venue: storedPaymentDetail.gameVenue,
               datetime: storedPaymentDetail.gameDate,
            },
            orderId: formatReservationNumber(storedPaymentDetail.orderNumber),
            orderDate: storedPaymentDetail.orderedAt,
            orderer: fallbackOrdererName,
            issuedAt: storedPaymentDetail.paidAt ?? storedPaymentDetail.orderedAt,
            cancelDeadline: getFallbackCancelableUntil(storedPaymentDetail.paidAt ?? storedPaymentDetail.orderedAt),
            cancelDate: undefined,
            seatInfo: seats[0],
            ticketPrice: Math.round(storedPaymentDetail.amount / Math.max(seats.length, 1)),
            paymentMethodDisplay: storedPaymentDetail.paymentMethod,
            seatItems,
            paymentSummary: {
               status: '결제 완료',
               ticketCount: seats.length,
               ticketAmount: storedPaymentDetail.amount,
               fee: 0,
               total: storedPaymentDetail.amount,
               date: storedPaymentDetail.paidAt ?? storedPaymentDetail.orderedAt,
            },
            paymentEvents: [{ type: '결제 완료', method: storedPaymentDetail.paymentMethod }],
            refundInfo: undefined,
            canCancel: !isCanceledOrder,
            canSell: !isCanceledOrder,
            deliveryMethod: '모바일 QR',
         };
      }

      if (!apiDetail) return undefined;

      const currentApiDetail = apiDetail;
      const overallStatus = mapOverallStatus(currentApiDetail.ticketStatus);
      const isInvalid = currentApiDetail.ticketStatus === 'INVALID';
      const isActionableTicket = currentApiDetail.ticketStatus !== 'INVALID';

      const seatItems: PurchaseSeatItem[] =
         orderTickets.length > 0
            ? orderTickets.map(t => ({
                 ticketId: t.ticketId,
                 orderId: formatTicketNumber(
                    t.ticketNumber,
                    t.ticketStatus === 'RESALE_ISSUED' ? 'resale' : getTicketNumberKind(t.ticketNumber, 'ticket'),
                 ),
                 section: parseGradeName(t.seatInfo),
                 seatDetail: t.seatInfo,
                 status: mapTicketItemStatus(t.ticketStatus),
                 price: t.ticketPrice,
              }))
            : [
                 {
                    ticketId: currentApiDetail.ticketId,
                    orderId: formatTicketNumber(
                       currentApiDetail.ticketNumber,
                       currentApiDetail.ticketStatus === 'RESALE_ISSUED'
                          ? 'resale'
                          : getTicketNumberKind(currentApiDetail.ticketNumber, 'ticket'),
                    ),
                    section: parseGradeName(currentApiDetail.seatInfo),
                    seatDetail: currentApiDetail.seatInfo,
                    status: mapTicketItemStatus(currentApiDetail.ticketStatus),
                    price: currentApiDetail.ticketPrice,
                 },
              ];

      const ticketCount = seatItems.length;
      const ticketAmount = seatItems.reduce((sum, s) => sum + s.price, 0);
      const fee =
         orderTickets.length > 0
            ? orderTickets.reduce((sum, t) => sum + (t.serviceFee ?? 0), 0)
            : (currentApiDetail.serviceFee ?? 0);
      const total = ticketAmount + fee;
      const paymentMethodDisplay = orderPaymentQuery.data?.paymentMethod
         ? formatOrderPaymentMethod(orderPaymentQuery.data.paymentMethod)
         : (currentApiDetail.paymentMethodDisplay ?? currentApiDetail.paymentMethod ?? undefined);
      const paidAt = orderPaymentQuery.data?.paidAt;
      const paymentAmount = orderPaymentQuery.data?.paymentAmount ?? total;

      return {
         id: currentApiDetail.ticketId,
         rawOrderId: currentApiDetail.orderId,
         overallStatus,
         ticketStatus: currentApiDetail.ticketStatus,
         game: {
            teams: currentApiDetail.gameTitle,
            venue: currentApiDetail.stadiumName ?? '',
            datetime: currentApiDetail.gameDate,
         },
         orderId: formatReservationNumber(currentApiDetail.ticketNumber),
         orderDate: currentApiDetail.orderedAt ?? currentApiDetail.issuedAt,
         orderer: currentApiDetail.ordererName ?? fallbackOrdererName,
         issuedAt: currentApiDetail.issuedAt,
         cancelDeadline: isInvalid
            ? undefined
            : (currentApiDetail.cancelableUntil ??
              getFallbackCancelableUntil(currentApiDetail.orderedAt ?? currentApiDetail.issuedAt)),
         cancelDate: isInvalid ? (currentApiDetail.issuedAt ?? '-') : undefined,
         seatInfo: currentApiDetail.seatInfo,
         ticketPrice: currentApiDetail.ticketPrice,
         paymentMethodDisplay,
         paidAt,
         seatItems,
         paymentSummary: {
            status: '결제 완료',
            ticketCount,
            ticketAmount,
            fee,
            total: paymentAmount,
            date: paidAt,
            bankAccount: undefined as string | undefined,
            bankDeadline: undefined as string | undefined,
         },
         paymentEvents: [{ type: '결제 완료' as const, method: paymentMethodDisplay ?? '-' }],
         refundInfo: isInvalid
            ? {
                 ticketAmount,
                 cancelFee: 0,
                 refundTotal: ticketAmount,
                 method: paymentMethodDisplay ?? '정보 없음',
                 date: paidAt,
              }
            : undefined,
         canCancel: isActionableTicket,
         canSell: isActionableTicket,
         deliveryMethod: '모바일 QR',
      };
   }, [apiDetail, fallbackOrdererName, orderPaymentQuery.data, orderTickets, storedPaymentDetail]);

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
   const totalQuantity = detail.paymentSummary.ticketCount;
   const totalTicketPrice = detail.paymentSummary.ticketAmount;
   const totalPaid = detail.paymentSummary.total;
   const totalRefund = totalTicketPrice - serviceFee;
   const seatTickets = detail.seatItems;
   const hasPaymentFallback = Boolean(detail.paymentMethodDisplay || detail.paidAt || totalPaid > 0);

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
            <div className="flex items-center gap-4">
               <h1 className="text-title-1-bold text-foreground">예매내역 상세</h1>
            </div>

            <div className="flex flex-col gap-12">
               <SectionCard>
                  <StatusBadge label={statusLabel} variant={PURCHASE_BADGE[detail.ticketStatus]} />
                  <div className="flex flex-col gap-4">
                     <p className="text-title-1-bold text-foreground">{detail.game.teams}</p>
                     <div className="flex flex-col gap-1 text-heading-4-medium text-muted-foreground">
                        <p className="leading-[1.55]">{formatDateTime(detail.game.datetime)}</p>
                        {detail.game.venue && <p className="leading-[1.55]">{detail.game.venue}</p>}
                     </div>
                  </div>
               </SectionCard>

               <SectionCard>
                  <h2 className="text-heading-3-bold text-foreground">예약 정보</h2>
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

               <SectionCard className="gap-8">
                  <h2 className="text-heading-3-bold text-foreground">좌석 정보</h2>
                  <div className="flex flex-col gap-6">
                     {seatTickets.map((ticket, idx) => (
                        <div key={ticket.ticketId}>
                           {idx > 0 && <div className="h-px bg-border mb-6" />}
                           <TicketItem
                              orderId={ticket.orderId}
                              section={ticket.section}
                              seatDetail={ticket.seatDetail}
                              status={ticket.status}
                              price={ticket.price}
                           />
                        </div>
                     ))}
                  </div>
               </SectionCard>

               <SectionCard>
                  <h2 className="text-heading-3-bold text-foreground">티켓 수령 방법</h2>
                  <InfoRow label="수령 방법" value="모바일 QR" />
                  <Button variant="secondary" className="w-full py-3" onClick={() => setQrOpen(true)}>
                     모바일 QR 확인
                  </Button>
               </SectionCard>

               {detail.ticketStatus !== 'INVALID' && (
               <SectionCard>
                  <div className="flex items-start justify-between text-heading-3-bold">
                        <span className="text-foreground leading-normal">결제 정보</span>
                        <span className="text-primary leading-normal">결제 완료</span>
                  </div>
                  {orderPaymentQuery.isLoading && !hasPaymentFallback ? (
                     <div className="rounded-xl bg-surface px-5 py-6 text-center text-body-2-regular text-(--text-tertiary)">
                        결제 정보를 불러오는 중입니다.
                     </div>
                  ) : orderPaymentQuery.isError && !hasPaymentFallback ? (
                     <div className="rounded-xl bg-surface px-5 py-6 text-center text-body-2-regular text-(--text-tertiary)">
                        결제 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
                     </div>
                  ) : (
                     <>
                        <div className="bg-surface rounded-xl p-5 flex flex-col gap-3">
                           <InfoRow label={`티켓 금액 (${totalQuantity}매)`} value={formatPrice(totalTicketPrice)} />
                           <InfoRow label="수수료" value={formatPrice(serviceFee)} />
                           <div className="flex items-center justify-between font-bold">
                              <span className="text-body-1-regular text-muted-foreground leading-normal">총 결제 금액</span>
                              <span className="text-heading-3-bold text-primary leading-normal">{formatPrice(totalPaid)}</span>
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

               {detail.ticketStatus === 'INVALID' && (
                  <SectionCard>
                     <div className="flex items-start justify-between text-heading-3-bold">
                        <span className="text-foreground leading-normal">취소/환불 정보</span>
                        <span className="text-destructive leading-normal">취소/환불 완료</span>
                     </div>
                     <div className="bg-surface rounded-xl p-5 flex flex-col gap-3">
                        <InfoRow label={`티켓 금액 (${totalQuantity}매)`} value={formatPrice(totalTicketPrice)} />
                        <InfoRow label="수수료" value={`-${formatPrice(serviceFee)}`} />
                        <div className="flex items-center justify-between font-bold">
                           <span className="text-body-1-regular text-muted-foreground leading-normal">환불 금액</span>
                           <span className="text-heading-3-bold text-destructive leading-normal">
                              {formatPrice(totalRefund)}
                           </span>
                        </div>
                     </div>
                     {orderPaymentQuery.isLoading && !hasPaymentFallback ? (
                        <div className="rounded-xl bg-surface px-5 py-6 text-center text-body-2-regular text-(--text-tertiary)">
                           환불 정보를 불러오는 중입니다.
                        </div>
                     ) : orderPaymentQuery.isError && !hasPaymentFallback ? (
                        <div className="rounded-xl bg-surface px-5 py-6 text-center text-body-2-regular text-(--text-tertiary)">
                           환불 수단 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
                        </div>
                     ) : (
                        <div className="flex flex-col gap-3">
                           <InfoRow label="환불 수단" value={detail.paymentMethodDisplay ?? '정보 없음'} />
                           <InfoRow label="취소 일시" value={detail.paidAt ? formatDateTime(detail.paidAt) : '정보 없음'} />
                        </div>
                     )}
                     <div className="bg-surface rounded-xl p-5">
                        <div className="flex flex-col gap-1 text-body-3-medium text-(--text-tertiary) leading-normal">
                           <BulletItem text="취소/환불은 영업일 기준 1~3일 이내 처리될 예정입니다." />
                           <BulletItem text="문의사항은 고객센터로 문의해주세요." />
                        </div>
                     </div>
                  </SectionCard>
               )}

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

            <div className="flex gap-3">
               {detail.canCancel && (
                  <Button variant="tertiary" className="flex-1 py-3" onClick={() => setCancelOpen(true)}>
                     예매 취소하기
                  </Button>
               )}
               {detail.canSell && (
                  <Button variant="secondary" className="flex-1 py-3" onClick={() => setResellOpen(true)}>
                     판매 등록하기
                  </Button>
               )}
            </div>

            <div className="bg-primary-light rounded-[14px] p-6 flex flex-col gap-2">
               <h4 className="text-heading-4-bold text-primary leading-[1.55]">입장 안내</h4>
               <div className="flex flex-col gap-1 text-body-2-regular text-muted-foreground leading-normal">
                  <BulletItem text="경기 시작 2시간 전부터 입장 가능합니다" />
                  <BulletItem text="모바일 티켓 QR코드를 게이트에서 제시해주세요" />
                  <BulletItem text="신분증을 함께 지참해주세요" />
               </div>
            </div>

            <div className="bg-surface rounded-[14px] p-6 flex flex-col gap-6">
               <div className="flex items-center gap-1">
                  <AlertCircle size={20} className="text-foreground shrink-0" />
                  <h4 className="text-heading-4-bold text-foreground leading-[1.55]">유의사항</h4>
               </div>
               <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                     <p className="text-body-1-bold text-muted-foreground leading-normal">취소/환불 안내</p>
                     <div className="flex flex-col gap-1 text-body-2-regular text-muted-foreground leading-normal">
                        <BulletItem text="예매 당일 취소 시 전액 환불됩니다. (예매 수수료 포함)" />
                        <BulletItem text="예매 익일 ~ 경기 시작 4시간 전까지 취소 시 예매 수수료와 취소 수수료가 부과됩니다." />
                        <BulletItem text="경기 시작 4시간 전인 예매 취소 마감 기간 이후 취소 및 환불이 불가능합니다." />
                        <BulletItem text="리셀로 구매한 티켓은 취소 및 환불이 불가능합니다." />
                        <BulletItem text="취소/환불 금액은 은행 영업일 기준 1~3일 내에 지정된 계좌로 입금됩니다." />
                        <BulletItem text="환불 규정에 따라 환불 처리가 됩니다." />
                     </div>
                  </div>
                  <div className="flex flex-col gap-2">
                     <p className="text-body-1-bold text-muted-foreground leading-normal">티켓 리셀 안내</p>
                     <div className="flex flex-col gap-1 text-body-2-regular text-muted-foreground leading-normal">
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
