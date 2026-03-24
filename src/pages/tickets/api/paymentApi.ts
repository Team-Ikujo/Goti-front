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
   holdId: string;
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
   paymentMethod: ApiPaymentMethodCode;
   idempotencyKey: string;
};

export type OrderPaymentResponse = {
   paymentId: string;
   orderId: string;
   paymentType: string;
   paymentMethod: ApiPaymentMethodCode;
   paymentAmount: number;
   pgProvider: string;
   pgTid: string;
   paymentStatus: string;
   paidAt?: string | null;
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
   paymentMethod: ApiPaymentMethodCode;
   idempotencyKey: string;
};

type ApiPaymentMethodCode = 'CARD' | 'ACCOUNT_TRANSFER';

const UNSUPPORTED_PAYMENT_METHOD_MESSAGE = '아직 지원하지 않는 결제수단입니다.';

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

const assertNever = (value: never): never => {
   throw new Error(`지원하지 않는 결제 수단입니다: ${String(value)}`);
};

const toPaymentMethodCode = (paymentMethod: PaymentMethod): ApiPaymentMethodCode => {
   switch (paymentMethod) {
      case 'card':
         return 'CARD';
      case 'bank':
         return 'ACCOUNT_TRANSFER';
      case 'kakao':
      case 'naver':
      case 'toss':
         throw new Error(UNSUPPORTED_PAYMENT_METHOD_MESSAGE);
      default:
         return assertNever(paymentMethod);
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
      default:
         return assertNever(paymentMethod);
   }
};

const createOrder = async (payload: CreateOrderRequest) => {
   const response = await apiClient.post<ApiEnvelope<CreateOrderResponse>>('/api/v1/orders', payload);

   return response.data.data;
};

export const getOrderPayment = async (orderId: string) => {
   const response = await apiClient.get<ApiEnvelope<OrderPaymentResponse>>(`/api/v1/payments/orders/${orderId}`);

   return response.data.data;
};

const createOrderPayment = async (orderId: string, payload: OrderPaymentRequest) => {
   const response = await apiClient.post<ApiEnvelope<OrderPaymentResponse>>(
      `/api/v1/payments/orders/${orderId}`,
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

const buildPaymentResponse = ({
   amount,
   order,
   payment,
   paymentMethod,
   gameTitle,
   gameDate,
   gameVenue,
   seats,
   recipient,
}: {
   amount: number;
   order: CreateOrderResponse | ResaleOrderResponse;
   payment: OrderPaymentResponse;
   paymentMethod: PaymentMethod;
   gameTitle: string;
   gameDate: string;
   gameVenue: string;
   seats: string[];
   recipient?: {
      name: string;
      phone: string;
      address: string;
   };
}): PaymentResponse => {
   return {
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      paymentStatus: payment.paymentStatus,
      paidAt: payment.paidAt ?? undefined,
      gameTitle,
      gameDate,
      gameVenue,
      quantity: order.totalQuantity,
      seats,
      paymentMethod: toPaymentMethodLabel(paymentMethod),
      orderedAt: formatOrderedAt(new Date()),
      amount,
      ...(recipient && {
         recipientName: recipient.name,
         recipientPhone: recipient.phone,
         recipientAddress: recipient.address,
      }),
   };
};

export const submitTicketOrder = async (payload: TicketCheckoutRequest): Promise<PaymentResponse> => {
   const heldSeats = payload.selectedSeats.map(({ seatId, holdId, label }) => ({
      seatId,
      seatLabel: label,
      holdId,
   }));

   if (heldSeats.some(({ holdId }) => !holdId)) {
      throw new Error('좌석 점유 정보가 없어 주문을 생성할 수 없습니다.');
   }

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

   return buildPaymentResponse({
      amount: payment.paymentAmount,
      order,
      payment,
      paymentMethod: payload.paymentMethod,
      gameTitle: payload.matchTitle,
      gameDate: payload.gameDate,
      gameVenue: payload.gameVenue,
      seats: heldSeats.map(({ seatLabel }) => seatLabel),
      recipient:
         payload.deliveryMethod === 'delivery'
            ? {
                 name: payload.ordererName,
                 phone: payload.ordererPhone,
                 address: `${payload.address ?? ''} ${payload.addressDetail ?? ''}`.trim(),
              }
            : undefined,
   });
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

   return buildPaymentResponse({
      amount: payment.paymentAmount,
      order,
      payment,
      paymentMethod: payload.paymentMethod,
      gameTitle: payload.matchTitle,
      gameDate: payload.gameDate,
      gameVenue: payload.gameVenue,
      seats: [payload.seatInfo],
   });
};
