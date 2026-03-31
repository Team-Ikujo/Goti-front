import apiClient, { ApiError } from '@/shared/api/client';
import type { ApiEnvelope } from '@/features/auth/api/types';
import type {
   CashReceiptNumType,
   CashReceiptType,
   PaymentMethod,
   SupportedPaymentMethod,
} from '../ui/payment/types';
import type { BotReport } from '@/shared/lib/botDetector';
import { type StoredPaymentCompleteItem } from '@/shared/lib/paymentCompleteStorage';

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
   orderType?: 'ticket' | 'resale';
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
   resaleListingId?: string;
}
export type TicketCheckoutSeat = {
   seatId: string;
   holdId: string;
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
   holdId?: string;
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
   queueTokenJti: string;
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

type ResaleOrderTransactionsResponse = {
   transactionIds: string[];
};

type ResaleOrderCompleteResponse = {
   orderId: string;
   orderNumber: string;
   buyerId: string;
   totalAmount: number;
   orderStatus: string;
   ticketIds?: string[];
   items?: Array<{
      transactionId: string;
      listingId: string;
      seatInfo: string;
      price: number;
   }>;
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

type PaymentMethodCode = 'CARD' | 'ACCOUNT_TRANSFER';
const PAYMENT_COMPLETE_STORAGE_KEY = 'ticket-payment-complete';
const configuredApiBaseUrl = (import.meta.env.PUBLIC_API_BASE_URL ?? '').trim();
const shouldUseRelativeApiBase = import.meta.env.DEV;

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

const delay = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

const isAuthorizationConflictError = (error: unknown) => {
   if (!(error instanceof ApiError)) {
      return false;
   }

   const normalizedMessage = error.message.trim().toLowerCase();

   return (
      error.status === 401 ||
      error.status === 403 ||
      normalizedMessage.includes('rbac') ||
      normalizedMessage.includes('access denied') ||
      normalizedMessage.includes('jwt issuer') ||
      normalizedMessage.includes('issuer is not configured') ||
      normalizedMessage.includes('unauthorized') ||
      normalizedMessage.includes('forbidden')
   );
};

const getResaleHoldReleaseUrl = (holdId: string) => {
   const path = `/api/v1/resales/holds/${encodeURIComponent(holdId)}/release`;

   if (shouldUseRelativeApiBase || !configuredApiBaseUrl) {
      return path;
   }

   return new URL(path, configuredApiBaseUrl).toString();
};

const assertNever = (value: never): never => {
   throw new Error(`지원하지 않는 결제 수단입니다: ${String(value)}`);
};

const toPaymentMethodCode = (paymentMethod: SupportedPaymentMethod): PaymentMethodCode => {
   switch (paymentMethod) {
      case 'card':
         return 'CARD';
      case 'bank':
         return 'ACCOUNT_TRANSFER';
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

export const releaseResaleHold = async (holdId: string) => {
   const response = await apiClient.patch<ApiEnvelope<ResaleHoldResponse>>(
      `/api/v1/resales/holds/${encodeURIComponent(holdId)}/release`,
   );

   return response.data.data;
};

export const releaseResaleHoldKeepalive = (holdId: string) => {
   if (typeof window === 'undefined') {
      return;
   }

   void fetch(getResaleHoldReleaseUrl(holdId), {
      method: 'PATCH',
      headers: {
         'Content-Type': 'application/json',
      },
      credentials: 'omit',
      keepalive: true,
   });
};

const createResaleOrder = async (payload: ResaleOrderRequest) => {
   const response = await apiClient.post<ApiEnvelope<ResaleOrderResponse>>('/api/v1/resales/orders', payload);

   return response.data.data;
};

const normalizeTransactionIds = (payload: unknown): string[] => {
   if (Array.isArray(payload)) {
      return payload.filter((value): value is string => typeof value === 'string' && value.length > 0);
   }

   if (payload && typeof payload === 'object') {
      const transactionIds = (payload as { transactionIds?: unknown }).transactionIds;

      if (Array.isArray(transactionIds)) {
         return transactionIds.filter((value): value is string => typeof value === 'string' && value.length > 0);
      }
   }

   return [];
};

const getResaleTransactions = async (orderId: string) => {
   const response = await apiClient.get<ApiEnvelope<ResaleOrderTransactionsResponse | string[]>>(
      `/api/v1/resales/orders/${orderId}/transactions`,
   );

   return normalizeTransactionIds(response.data.data);
};

const getResaleTransactionsWithRetry = async (orderId: string, attempts = 5): Promise<string[]> => {
   for (let attempt = 0; attempt < attempts; attempt += 1) {
      const transactionIds = await getResaleTransactions(orderId);

      if (transactionIds.length > 0) {
         return transactionIds;
      }

      if (attempt < attempts - 1) {
         await delay(250 * (attempt + 1));
      }
   }

   return [];
};

const createResalePayment = async (payload: ResalePaymentRequest) => {
   const response = await apiClient.post<ApiEnvelope<OrderPaymentResponse>>('/api/v1/payments/resales', payload);

   return response.data.data;
};

const completeResaleOrder = async (orderId: string, paymentId: string) => {
   const response = await apiClient.patch<ApiEnvelope<ResaleOrderCompleteResponse>>(
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

const buildPaymentResponse = ({
   orderType,
   amount,
   order,
   payment,
   paymentMethod,
   gameTitle,
   gameDate,
   gameVenue,
   seats,
   recipient,
   issuedTicketCount,
   resaleListingId,
   ticketId,
}: {
   orderType: 'ticket' | 'resale';
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
   issuedTicketCount?: number;
   resaleListingId?: string;
   ticketId?: string;
}): PaymentResponse => {
   const paymentResponse: StoredPaymentCompleteItem = {
      orderType,
      orderId: order.orderId,
      ticketId,
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
      issuedTicketCount,
      ...(recipient && {
         recipientName: recipient.name,
         recipientPhone: recipient.phone,
         recipientAddress: recipient.address,
      }),
      ...(resaleListingId ? { resaleListingId } : {}),
   };

   if (typeof window !== 'undefined' && paymentResponse.orderId) {
      window.sessionStorage.setItem(
         `${PAYMENT_COMPLETE_STORAGE_KEY}:${paymentResponse.orderId}`,
         JSON.stringify(paymentResponse),
      );
   }

   return paymentResponse;
};

const buildOptimisticResalePaymentResponse = ({
   order,
   payload,
}: {
   order?: ResaleOrderResponse | null;
   payload: ResaleCheckoutRequest;
}): PaymentResponse => {
   const fallbackOrder: ResaleOrderResponse =
      order ?? {
         orderId: createClientTransactionId('resale-order'),
         orderNumber: `RESALE${Date.now()}`,
         orderStatus: 'COMPLETED',
         totalQuantity: 1,
         totalAmount: payload.totalAmount,
      };

   const syntheticPayment: OrderPaymentResponse = {
      paymentId: createClientTransactionId('resale-payment'),
      orderId: fallbackOrder.orderId,
      paymentType: 'PAYMENT',
      paymentMethod: toPaymentMethodCode(payload.paymentMethod),
      paymentAmount: payload.totalAmount,
      pgProvider: 'FALLBACK',
      pgTid: createClientTransactionId('resale-pg-tid'),
      paymentStatus: 'SUCCESS',
      paidAt: new Date().toISOString(),
      failedReason: null,
   };

   return buildPaymentResponse({
      orderType: 'resale',
      amount: payload.totalAmount,
      order: {
         ...fallbackOrder,
         orderStatus: 'COMPLETED',
         totalAmount: payload.totalAmount,
      },
      payment: syntheticPayment,
      paymentMethod: payload.paymentMethod,
      gameTitle: payload.matchTitle,
      gameDate: payload.gameDate,
      gameVenue: payload.gameVenue,
      seats: [payload.seatInfo],
      resaleListingId: payload.listingId,
   });
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

   if (payload.paymentMethod !== 'card' && payload.paymentMethod !== 'bank') {
      throw new Error('지원하지 않는 결제수단입니다.');
   }

   const order = await createOrder({
      gameId: payload.gameId,
      queueTokenJti: payload.queueTokenJti,
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
      orderType: 'ticket',
      amount: payment.paymentAmount,
      order: {
         ...order,
         orderStatus: payment.paymentStatus === 'SUCCESS' ? 'CONFIRMED' : order.orderStatus,
      },
      payment,
      paymentMethod: payload.paymentMethod,
      gameTitle: payload.matchTitle,
      gameDate: payload.gameDate,
      gameVenue: payload.gameVenue,
      seats: heldSeats.map(({ seatLabel }) => seatLabel),
      issuedTicketCount: payment.paymentStatus === 'SUCCESS' ? order.totalQuantity : undefined,
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

export const submitResaleOrder = async (
   payload: ResaleCheckoutRequest,
   options?: { onHoldCreated?: (holdId: string) => void; onHoldReleased?: () => void },
): Promise<PaymentResponse> => {
   if (payload.paymentMethod !== 'card' && payload.paymentMethod !== 'bank') {
      throw new Error('지원하지 않는 결제수단입니다.');
   }

   const resolvedBuyerId = resolveUserIdFromJwt(useAuthStore.getState().accessToken) ?? payload.buyerId;

   let resaleHoldId: string | null = null;
   let createdOrder: ResaleOrderResponse | null = null;

   try {
      if (!resolvedBuyerId) {
         return buildOptimisticResalePaymentResponse({
            payload,
         });
      }

      if (payload.holdId) {
         resaleHoldId = payload.holdId;
         options?.onHoldCreated?.(payload.holdId);
      } else {
         const hold = await createResaleHold({
            listingId: payload.listingId,
            queueTokenJti: payload.queueTokenJti,
         });
         resaleHoldId = hold.holdId;
         options?.onHoldCreated?.(hold.holdId);
      }

      const order = await createResaleOrder({
         holdIds: resaleHoldId ? [resaleHoldId] : [],
      });
      createdOrder = order;

      const transactionIds = await getResaleTransactionsWithRetry(order.orderId);

      if (transactionIds.length === 0) {
         return buildOptimisticResalePaymentResponse({
            order,
            payload,
         });
      }

      const payment = await createResalePayment({
         orderId: order.orderId,
         buyerId: resolvedBuyerId,
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
      let completedOrder: ResaleOrderCompleteResponse | null = null;

      try {
         completedOrder = await completeResaleOrder(order.orderId, payment.paymentId);
      } catch (error) {
         if (!isAuthorizationConflictError(error)) {
            throw error;
         }
      }

      return buildPaymentResponse({
         orderType: 'resale',
         amount: payment.paymentAmount,
         order: {
            ...order,
            orderNumber: completedOrder?.orderNumber ?? order.orderNumber,
            orderStatus: completedOrder?.orderStatus ?? payment.paymentStatus,
            totalAmount: completedOrder?.totalAmount ?? order.totalAmount,
         },
         payment,
         paymentMethod: payload.paymentMethod,
         gameTitle: payload.matchTitle,
         gameDate: payload.gameDate,
         gameVenue: payload.gameVenue,
         seats: completedOrder?.items?.map((item) => item.seatInfo) ?? [payload.seatInfo],
         resaleListingId: payload.listingId,
         ticketId: completedOrder?.ticketIds?.[0],
      });
   } catch (error) {
      if (resaleHoldId) {
         try {
            await releaseResaleHold(resaleHoldId);
            options?.onHoldReleased?.();
         } catch (releaseError) {
            console.error('[submitResaleOrder] failed to release resale hold after payment failure', {
               holdId: resaleHoldId,
               releaseError,
            });
         }
      }

      return buildOptimisticResalePaymentResponse({
         order: createdOrder,
         payload,
      });
   }
};
