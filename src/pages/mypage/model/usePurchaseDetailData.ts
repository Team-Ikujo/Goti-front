import { useEffect, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchTicketDetail, fetchOrderTickets } from '@/entities/ticket/api/ticketApi';
import { fetchOrderPaymentDetail, formatOrderPaymentMethod } from '@/entities/payment/api/paymentApi';
import { formatTicketNumber, getTicketNumberKind } from './ticketNumber';

export type PurchaseStatus = '예매 완료' | '관람 완료' | '취소/환불';

export const PURCHASE_BADGE: Record<string, 'success' | 'disabled' | 'warning'> = {
   ISSUED: 'success',
   USED: 'disabled',
   INVALID: 'warning',
   RESALE_ISSUED: 'success',
};

export const mapStatusLabel = (status: string): string => {
   switch (status) {
      case 'ISSUED': return '예매 완료';
      case 'USED': return '관람 완료';
      case 'INVALID': return '취소/환불';
      case 'RESALE_ISSUED': return '예매 완료 (리셀)';
      default: return '예매 완료';
   }
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

export const mapTicketItemStatus = (status: string): '예매완료' | '취소대기' | '취소완료' => {
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

export function usePurchaseDetailData() {
   const { id: orderId } = useParams<{ id: string }>();
   const location = useLocation();
   const [showCancelSnackbar, setShowCancelSnackbar] = useState(false);

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

   const detail = useMemo(() => {
      if (!apiDetail) return undefined;

      const isInvalid = apiDetail.ticketStatus === 'INVALID';
      const seatItems = orderTickets.map((ticket) => ({
         ticketId: ticket.ticketId,
         orderId: formatTicketNumber(
            ticket.ticketNumber,
            ticket.ticketStatus === 'RESALE_ISSUED' ? 'resale' : getTicketNumberKind(ticket.ticketNumber, 'ticket'),
         ),
         section: ticket.seatInfo.split(' ')[0] ?? '',
         seatDetail: ticket.seatInfo,
         status: mapTicketItemStatus(ticket.ticketStatus),
         price: ticket.ticketPrice,
      }));
      const ticketCount = seatItems.length;
      const ticketAmount = seatItems.reduce((sum, seat) => sum + seat.price, 0);
      const fee = orderTickets.reduce((sum, ticket) => sum + (ticket.serviceFee ?? 0), 0);
      const total = ticketAmount + fee;
      const paymentMethodDisplay = orderPaymentQuery.data?.paymentMethod
         ? formatOrderPaymentMethod(orderPaymentQuery.data.paymentMethod)
         : undefined;
      const paidAt = orderPaymentQuery.data?.paidAt;
      const paymentAmount = orderPaymentQuery.data?.paymentAmount ?? total;

      return {
         id: apiDetail.ticketId,
         overallStatus: mapOverallStatus(apiDetail.ticketStatus),
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
            status: '결제 완료' as const,
            ticketCount,
            ticketAmount,
            fee,
            total: paymentAmount,
            date: paidAt,
         },
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
      };
   }, [apiDetail, orderPaymentQuery.data, orderTickets]);

   return {
      orderId,
      orderTickets,
      orderPaymentQuery,
      detail,
      isLoading,
      isError,
      showCancelSnackbar,
      setShowCancelSnackbar,
   };
}
