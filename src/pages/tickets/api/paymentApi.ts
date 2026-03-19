import apiClient from '@/shared/api/client';
import type { ApiEnvelope } from '@/features/auth/api/types';
import type { CashReceiptNumType, CashReceiptType, PaymentMethod } from '../ui/payment/types';

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
   userId?: string;
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

type ConfirmOrderPaymentRequest = {
   userId: string;
   paymentId: string;
   pgTid: string;
};

type ConfirmOrderPaymentResponse = {
   orderId: string;
   orderStatus: string;
   issuedTicketCount: number;
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

type ResaleCompletedOrderItem = {
   transactionId: string;
   listingId: string;
   seatInfo: string;
   price: number;
};

type ResaleCompletedOrderResponse = {
   orderId: string;
   orderNumber: string;
   buyerId: string;
   totalAmount: number;
   orderStatus: string;
   items: ResaleCompletedOrderItem[];
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
         return 'CARD';
      case 'kakao':
         return 'KAKAO_PAY';
      case 'naver':
         return 'NAVER_PAY';
      case 'toss':
         return 'TOSS_PAY';
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
      `/api/v1/seat-reservations/seats/${seatId}`,
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

const confirmOrderPayment = async (orderId: string, payload: ConfirmOrderPaymentRequest) => {
   const response = await apiClient.post<ApiEnvelope<ConfirmOrderPaymentResponse>>(
      `/api/v1/orders/${orderId}/payment-confirmations`,
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

const completeResaleOrder = async (orderId: string, paymentId: string) => {
   const response = await apiClient.patch<ApiEnvelope<ResaleCompletedOrderResponse>>(
      `/api/v1/resales/orders/${orderId}/complete`,
      undefined,
      {
         params: {
            paymentId,
         },
      },
   );

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

   if (!payload.userId) {
      throw new Error('결제 사용자 ID가 없어 주문 확정을 진행할 수 없습니다. 로그인 정보를 다시 확인해 주세요.');
   }

   const payment = await createOrderPayment(order.orderId, {
      paymentMethod: toPaymentMethodCode(payload.paymentMethod),
      idempotencyKey: createClientTransactionId('idempotency'),
   });

   const confirmation = await confirmOrderPayment(order.orderId, {
      userId: payload.userId,
      paymentId: payment.paymentId,
      pgTid: payment.pgTid,
   });

   return {
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      orderStatus: confirmation.orderStatus,
      paymentStatus: payment.paymentStatus,
      paidAt: payment.paidAt,
      issuedTicketCount: confirmation.issuedTicketCount,
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

   const completedOrder = await completeResaleOrder(order.orderId, payment.paymentId);

   return {
      orderId: completedOrder.orderId,
      orderNumber: completedOrder.orderNumber,
      orderStatus: completedOrder.orderStatus,
      paymentStatus: payment.paymentStatus,
      paidAt: payment.paidAt,
      gameTitle: payload.matchTitle,
      gameDate: payload.gameDate,
      gameVenue: payload.gameVenue,
      quantity: completedOrder.items.length || order.totalQuantity,
      seats:
         completedOrder.items.length > 0
            ? completedOrder.items.map((item) => item.seatInfo)
            : [payload.seatInfo],
      paymentMethod: toPaymentMethodLabel(payload.paymentMethod),
      orderedAt: formatOrderedAt(new Date()),
      amount: payload.totalAmount,
   };
};
