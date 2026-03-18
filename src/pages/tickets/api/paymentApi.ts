// src/pages/tickets/api/paymentApi.ts

import apiClient from '@/shared/api/client';
import type { ApiEnvelope } from '@/features/auth/api/types';
import type { CashReceiptNumType, CashReceiptType, PaymentMethod } from '../ui/payment/types';

export interface PaymentRequest {
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
   // 배송 수령 시 수신자 정보
   recipientName?: string;
   recipientPhone?: string;
   recipientAddress?: string;
}

export const createPayment = async (payload: PaymentRequest): Promise<PaymentResponse> => {
   const response = await apiClient.post<ApiEnvelope<PaymentResponse>>(
      '/api/v1/tickets/payment',
      payload,
   );
   return response.data.data;
};
