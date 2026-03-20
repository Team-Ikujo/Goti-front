import apiClient from '@/shared/api/client';
import type { ApiEnvelope } from '@/features/auth/api/types';
import type { CashReceiptNumType, CashReceiptType, PaymentMethod } from '../ui/payment/types';
import type { BotReport } from '@/shared/lib/botDetector';

interface CheckoutFormRequest {
   deliveryMethod: 'mobile' | 'onsite' | 'delivery';
   ordererName: string;
   ordererPhone: string;
   ordererEmail: string;
   zipCode?: string;
   address?: string;
   addressDetail?: string;
   paymentMethod: PaymentMethod;
   cashReceiptType?: CashReceiptType;
   cashReceiptNumType?: CashReceiptNumType;
   cashReceiptNum?: string;
   botData?: BotReport;
}

export interface PaymentResponse {
   orderNumber: string;
   gameTitle: string;
   gameDate: string;
   gameVenue: string;
   quantity: number;
   seats: string[];
   paymentMethod: string;
   orderedAt: string;
   amount: number;
   orderId?: string;
   orderStatus?: string;
   paymentStatus?: string;
   paidAt?: string;
   issuedTicketCount?: number;
   recipientName?: string;
   recipientPhone?: string;
   recipientAddress?: string;
}
export type TicketCheckoutSeat = {
   seatId: string;
   label: string;
};

export interface TicketCheckoutRequest extends CheckoutFormRequest {
   gameId: string;
   queueTokenJti: string;
   matchTitle: string;
   gameDate: string;
   gameVenue: string;
   amount: number;
   selectedSeats: TicketCheckoutSeat[];
}

export interface ResaleCheckoutRequest extends CheckoutFormRequest {
   buyerId: string;
   listingId: string;
   queueTokenJti: string;
   sellerId: string;
   settlementAmount: number;
   totalAmount: number;
   totalBuyerFee: number;
   totalSellerFee: number;
   seatInfo: string;
   matchTitle: string;
   gameDate: string;
   gameVenue: string;
}

type HoldSeatRequest = {
   gameId: string;
   queueTokenJti: string;
};

type HoldSeatResponse = {
   holdId: string;
};

type CreateOrderRequest = {
   gameId: string;
   holdIds: string[];
   ordererName: string;
   ordererPhone: string;
   ordererEmail: string;
};

type CreateOrderResponse = {
   orderId: string;
   orderNumber: string;
   gameId: string;
   orderStatus: string;
   totalQuantity: number;
   totalAmount: number;
};

type OrderPaymentRequest = {
   paymentMethod: string;
   idempotencyKey: string;
};

type OrderPaymentResponse = {
   paymentId: string;
   orderId: string;
   paymentType: string;
   paymentMethod: string;
   paymentAmount: number;
   pgProvider: string;
   pgTid: string;
   paymentStatus: string;
   paidAt: string;
   failedReason?: string | null;
};

type ResaleHoldRequest = {
   listingId: string;
   queueTokenJti: string;
};

type ResaleHoldResponse = {
   holdId: string;
};

type ResaleOrderRequest = {
   holdIds: string[];
};

type ResaleOrderResponse = {
   orderId: string;
   orderNumber: string;
   orderStatus: string;
   totalQuantity: number;
   totalAmount: number;
};

type ResalePaymentItem = {
   transactionId: string;
   sellerId: string;
   settlementAmount: number;
};

type ResalePaymentRequest = {
   orderId: string;
   buyerId: string;
   totalAmount: number;
   totalBuyerFee: number;
   totalSellerFee: number;
   items: ResalePaymentItem[];
   paymentMethod: string;
   idempotencyKey: string;
};

const formatOrderedAt = (date: Date) => {
   return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
   });
};

const createClientTransactionId = (prefix: string) => {
   if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `${prefix}-${crypto.randomUUID()}`;
   }

   return `${prefix}-${Date.now()}`;
};

const toPaymentMethodCode = (paymentMethod: PaymentMethod) => {
   switch (paymentMethod) {
      case 'card':
      case 'kakao':
      case 'naver':
      case 'toss':
         return 'CARD';
      case 'bank':
         return 'ACCOUNT_TRANSFER';
   }
};

const toPaymentMethodLabel = (paymentMethod: PaymentMethod) => {
   switch (paymentMethod) {
      case 'card':
         return '신용/체크카드';
      case 'kakao':
         return '카카오페이';
      case 'naver':
         return '네이버페이';
      case 'toss':
         return '토스페이';
      case 'bank':
         return '무통장 입금';
   }
};

const holdSeat = async (seatId: string, payload: HoldSeatRequest) => {
   const response = await apiClient.post<ApiEnvelope<HoldSeatResponse>>(
      `/api/v1/seat-reservations/seats/${encodeURIComponent(seatId)}`,
      payload,
   );
   return response.data.data;
};

const createOrder = async (payload: CreateOrderRequest) => {
   const response = await apiClient.post<ApiEnvelope<CreateOrderResponse>>('/api/v1/orders', payload);

   return response.data.data;
};

const createOrderPayment = async (orderId: string, payload: OrderPaymentRequest) => {
   const response = await apiClient.post<ApiEnvelope<OrderPaymentResponse>>(
      `/api/v1/orders/${orderId}/payments`,
      payload,
   );

   return response.data.data;
};

const createResaleHold = async (payload: ResaleHoldRequest) => {
   const response = await apiClient.post<ApiEnvelope<ResaleHoldResponse>>('/api/v1/resales/holds', payload);

   return response.data.data;
};

const createResaleOrder = async (payload: ResaleOrderRequest) => {
   const response = await apiClient.post<ApiEnvelope<ResaleOrderResponse>>('/api/v1/resales/orders', payload);

   return response.data.data;
};

const getResaleTransactions = async (orderId: string) => {
   const response = await apiClient.get<ApiEnvelope<string[]>>(`/api/v1/resales/orders/${orderId}/transactions`);

   return response.data.data;
};

const createResalePayment = async (payload: ResalePaymentRequest) => {
   const response = await apiClient.post<ApiEnvelope<OrderPaymentResponse>>('/api/v1/resales/payments', payload);

   return response.data.data;
};

export const submitTicketOrder = async (payload: TicketCheckoutRequest): Promise<PaymentResponse> => {
   const heldSeats = await Promise.all(
      payload.selectedSeats.map(async ({ seatId, label }) => {
         const result = await holdSeat(seatId, {
            gameId: payload.gameId,
            queueTokenJti: payload.queueTokenJti,
         });

         return {
            seatId,
            seatLabel: label,
            holdId: result.holdId,
         };
      }),
   );

   const order = await createOrder({
      gameId: payload.gameId,
      holdIds: heldSeats.map(({ holdId }) => holdId),
      ordererName: payload.ordererName,
      ordererPhone: payload.ordererPhone,
      ordererEmail: payload.ordererEmail,
   });

   const payment = await createOrderPayment(order.orderId, {
      paymentMethod: toPaymentMethodCode(payload.paymentMethod),
      idempotencyKey: createClientTransactionId('idempotency'),
   });

   return {
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      paymentStatus: payment.paymentStatus,
      paidAt: payment.paidAt,
      gameTitle: payload.matchTitle,
      gameDate: payload.gameDate,
      gameVenue: payload.gameVenue,
      quantity: order.totalQuantity,
      seats: heldSeats.map(({ seatLabel }) => seatLabel),
      paymentMethod: toPaymentMethodLabel(payload.paymentMethod),
      orderedAt: formatOrderedAt(new Date()),
      amount: payload.amount,
      ...(payload.deliveryMethod === 'delivery' && {
         recipientName: payload.ordererName,
         recipientPhone: payload.ordererPhone,
         recipientAddress: `${payload.address ?? ''} ${payload.addressDetail ?? ''}`.trim(),
      }),
   };
};

export const submitResaleOrder = async (payload: ResaleCheckoutRequest): Promise<PaymentResponse> => {
   const hold = await createResaleHold({
      listingId: payload.listingId,
      queueTokenJti: payload.queueTokenJti,
   });

   const order = await createResaleOrder({
      holdIds: [hold.holdId],
   });

   const transactionIds = await getResaleTransactions(order.orderId);

   if (transactionIds.length === 0) {
      throw new Error('리셀 거래 정보가 없어 결제를 진행할 수 없습니다.');
   }

   const payment = await createResalePayment({
      orderId: order.orderId,
      buyerId: payload.buyerId,
      totalAmount: payload.totalAmount,
      totalBuyerFee: payload.totalBuyerFee,
      totalSellerFee: payload.totalSellerFee,
      items: transactionIds.map((transactionId) => ({
         transactionId,
         sellerId: payload.sellerId,
         settlementAmount: payload.settlementAmount,
      })),
      paymentMethod: toPaymentMethodCode(payload.paymentMethod),
      idempotencyKey: createClientTransactionId('resale-idempotency'),
   });

   return {
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      paymentStatus: payment.paymentStatus,
      paidAt: payment.paidAt,
      gameTitle: payload.matchTitle,
      gameDate: payload.gameDate,
      gameVenue: payload.gameVenue,
      quantity: order.totalQuantity,
      seats: [payload.seatInfo],
      paymentMethod: toPaymentMethodLabel(payload.paymentMethod),
      orderedAt: formatOrderedAt(new Date()),
      amount: payload.totalAmount,
   };
};
