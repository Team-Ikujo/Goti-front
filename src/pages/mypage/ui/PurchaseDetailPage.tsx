// src/pages/mypage/ui/PurchaseDetailPage.tsx

import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/shared/ui/button';
import { useQuery } from '@tanstack/react-query';
import { fetchTicketDetail, fetchOrderTickets } from '@/entities/ticket/api/ticketApi';
import { fetchOrderPaymentDetail, formatOrderPaymentMethod } from '@/entities/payment/api/paymentApi';
import { PurchaseDetailDialogs } from './PurchaseDetailDialogs';
import { Snackbar } from '@/shared/ui/snackbar';
import { readStoredPaymentCompleteItems } from '@/shared/lib/paymentCompleteStorage';
import { useAuthStore } from '@/entities/auth/model/authStore';
import { decodeJwtPayload } from '@/shared/lib/jwt';
import { formatReservationNumber, formatTicketNumber, getTicketNumberKind } from '../model/ticketNumber';
import {
   formatGameTitle,
   getFallbackCancelableUntil,
   mapOverallStatus,
   mapStatusLabel,
   mapTicketItemStatus,
   parseGradeName,
   PURCHASE_BADGE,
   type PurchaseDetailViewModel,
   type PurchaseSeatItem,
} from '../model/purchaseDetail';
import {
   PurchaseActionButtons,
   PurchaseEntryGuideSection,
   PurchaseGameInfoSection,
   PurchaseNoticeSection,
   PurchasePaymentInfoSection,
   PurchaseRefundInfoSection,
   PurchaseReservationInfoSection,
   PurchaseSeatInfoSection,
   PurchaseTicketDeliverySection,
} from './PurchaseDetailSections';

// ─── 메인 컴포넌트 ──────────────────────────────────────────────

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

   // ─── API 데이터를 UI 형태로 변환 ────────────────────────────
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

      if (!apiDetail) {
         return undefined;
      }

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
            status: isInvalid ? '결제 완료' : '결제 완료',
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
               <PurchaseGameInfoSection
                  statusLabel={statusLabel}
                  statusVariant={PURCHASE_BADGE[detail.ticketStatus]}
                  teams={detail.game.teams}
                  datetime={detail.game.datetime}
                  venue={detail.game.venue}
               />

               <PurchaseReservationInfoSection
                  orderId={detail.orderId}
                  issuedAt={detail.issuedAt}
                  orderer={detail.orderer}
                  cancelDeadline={detail.cancelDeadline}
               />

               <PurchaseSeatInfoSection seatTickets={seatTickets} />
               <PurchaseTicketDeliverySection onOpenQr={() => setQrOpen(true)} />

               {detail.ticketStatus !== 'INVALID' && (
                  <PurchasePaymentInfoSection
                     isLoading={orderPaymentQuery.isLoading}
                     isError={orderPaymentQuery.isError}
                     totalQuantity={totalQuantity}
                     totalTicketPrice={totalTicketPrice}
                     serviceFee={serviceFee}
                     totalPaid={totalPaid}
                     paymentMethodDisplay={detail.paymentMethodDisplay}
                     paidAt={detail.paidAt}
                  />
               )}

               {detail.ticketStatus === 'INVALID' && (
                  <PurchaseRefundInfoSection
                     isLoading={orderPaymentQuery.isLoading}
                     isError={orderPaymentQuery.isError}
                     totalQuantity={totalQuantity}
                     totalTicketPrice={totalTicketPrice}
                     serviceFee={serviceFee}
                     totalRefund={totalRefund}
                     paymentMethodDisplay={detail.paymentMethodDisplay}
                     paidAt={detail.paidAt}
                  />
               )}
            </div>

            <PurchaseActionButtons
               canCancel={detail.canCancel}
               canSell={detail.canSell}
               onCancel={() => setCancelOpen(true)}
               onSell={() => setResellOpen(true)}
            />

            <PurchaseEntryGuideSection />
            <PurchaseNoticeSection />
         </div>

      </div>
   );
}
