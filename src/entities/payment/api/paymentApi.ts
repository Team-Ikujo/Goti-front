import axios from 'axios';
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

export const fetchResaleUnsettledAmount = async (userId: string): Promise<ResaleUnsettledAmountResponse> => {
   const response = await apiClient.get<ApiEnvelope<ResaleUnsettledAmountResponse>>('/api/v1/payments/resales/unsettled', {
      params: { userId },
   });
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

const buildPurchaseHistoryParams = (params?: FetchPurchaseHistoryParams) => {
   if (!params) {
      return undefined;
   }

   const normalizedParams =
      params.type === 'NORMAL'
         ? { ...params, type: undefined }
         : params;

   return Object.fromEntries(
      Object.entries(normalizedParams).filter(([, value]) => value !== undefined && value !== null && value !== ''),
   ) as FetchPurchaseHistoryParams;
};

const filterPurchaseHistoryItems = (
   list: PurchaseHistoryItem[],
   type?: PurchaseHistoryType,
) => {
   if (!type || type === 'ALL') {
      return list;
   }

   return list.filter((item) => {
      const normalizedType = (item.purchaseType ?? '').toUpperCase();

      if (type === 'NORMAL') {
         return normalizedType !== 'RESALE';
      }

      return normalizedType === 'RESALE';
   });
};

export const fetchPurchaseHistory = async (
   params?: FetchPurchaseHistoryParams,
): Promise<PurchaseHistoryPageResponse> => {
   const normalizedParams = buildPurchaseHistoryParams(params);

   try {
      const response = await apiClient.get<ApiEnvelope<PurchaseHistoryPageResponse>>(
         '/api/v1/payments/purchases',
         { params: normalizedParams },
      );

      return response.data.data;
   } catch (error) {
      // 일부 백엔드는 type 쿼리를 아직 지원하지 않아 400을 반환한다.
      // 이 경우 전체 목록을 받은 뒤 프런트에서 purchaseType 기준으로 필터링한다.
      if (!axios.isAxiosError(error) || error.response?.status !== 400 || !normalizedParams?.type) {
         throw error;
      }

      const { type, ...fallbackParams } = normalizedParams;
      const fallbackResponse = await apiClient.get<ApiEnvelope<PurchaseHistoryPageResponse>>(
         '/api/v1/payments/purchases',
         { params: fallbackParams },
      );
      const payload = fallbackResponse.data.data;
      const filteredList = filterPurchaseHistoryItems(payload.list, type);

      return {
         ...payload,
         list: filteredList,
         totalCount: filteredList.length,
         totalPages:
            typeof normalizedParams.size === 'number' && normalizedParams.size > 0
               ? Math.ceil(filteredList.length / normalizedParams.size)
               : payload.totalPages,
      };
   }
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
