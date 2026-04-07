import apiClient from '@/shared/api/client';
import type { ApiEnvelope } from '@/features/auth/api/types';

export type OrderPaymentMethod = 'CARD' | 'ACCOUNT_TRANSFER';
export type OrderPaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELED';
export type OrderPaymentType = 'PAYMENT' | 'REFUND';

export interface OrderPaymentDetail {
   paymentId: string;
   orderId: string;
   paymentType: OrderPaymentType;
   paymentMethod: OrderPaymentMethod;
   paymentAmount: number;
   pgProvider: string;
   pgTid: string;
   paymentStatus: OrderPaymentStatus;
   paidAt?: string;
   failedReason?: string | null;
}

export interface ResaleUnsettledAmountResponse {
   unsettledAmount: number;
}

export const fetchOrderPaymentDetail = async (orderId: string): Promise<OrderPaymentDetail> => {
   const response = await apiClient.get<ApiEnvelope<OrderPaymentDetail>>(
      `/api/v1/payments/orders/${encodeURIComponent(orderId)}`,
   );

   return response.data.data;
};

export const fetchResaleUnsettledAmount = async (): Promise<ResaleUnsettledAmountResponse> => {
   const response = await apiClient.get<ApiEnvelope<ResaleUnsettledAmountResponse>>('/api/v1/payments/resales/unsettled');
   return response.data.data;
};

// ─── 구매 내역 통합 조회 (GET /api/v1/payments/purchases) ─────────

export type PurchaseHistoryType = 'ALL' | 'NORMAL' | 'RESALE';

export interface PurchaseHistoryItem {
   purchaseType: string;
   orderId: string;
   orderNumber: string;
   orderStatus: string;
   totalQuantity: number;
   totalAmount: number;
   orderedAt: string;
   gameId: string;
   stadiumId: string;
   gameTitle: string;
   gameDate: string;
   seatInfos: string[];
}

interface PurchaseHistoryPageResponse {
   list: PurchaseHistoryItem[];
   totalCount: number;
   totalPages: number;
}

export interface FetchPurchaseHistoryParams {
   type?: PurchaseHistoryType;
   keyword?: string;
   months?: number;
   startDate?: string;
   endDate?: string;
   page?: number;
   size?: number;
}

export const fetchPurchaseHistory = async (
   params?: FetchPurchaseHistoryParams,
): Promise<PurchaseHistoryPageResponse> => {
   const response = await apiClient.get<ApiEnvelope<PurchaseHistoryPageResponse>>(
      '/api/v1/payments/purchases',
      { params },
   );

   return response.data.data;
};

export const formatOrderPaymentMethod = (paymentMethod?: string): string => {
   switch (paymentMethod) {
      case 'CARD':
         return '카드 결제';
      case 'ACCOUNT_TRANSFER':
         return '무통장 입금';
      default:
         return paymentMethod ?? '-';
   }
};
