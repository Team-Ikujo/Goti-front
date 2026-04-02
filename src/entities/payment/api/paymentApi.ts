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

export const fetchOrderPaymentDetail = async (orderId: string): Promise<OrderPaymentDetail> => {
   const response = await apiClient.get<ApiEnvelope<OrderPaymentDetail>>(
      `/api/v1/payments/orders/${encodeURIComponent(orderId)}`,
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
