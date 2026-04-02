// src/entities/order/api/orderApi.ts

import apiClient from '@/shared/api/client';
import type { ApiEnvelope } from '@/features/auth/api/types';

export interface OrderListItem {
   orderId: string;
   orderNumber: string;
   orderStatus: 'PENDING' | 'CONFIRMED' | 'CANCELED' | 'PARTIALLY_CANCELED';
   totalQuantity: number;
   totalAmount: number;
   orderedAt: string;
   gameId: string;
   stadiumId: string;
   // 서버/MSW 확장 필드 (game 정보)
   homeTeamName?: string;
   awayTeamName?: string;
   stadiumName?: string;
   gameStartAt?: string;
   seatGradeName?: string;
   seatInfos?: string[];
   ticketId?: string;
   ticketIds?: string[];
   orderItemIds?: string[];
}

export const fetchMyOrders = async (): Promise<OrderListItem[]> => {
   const response = await apiClient.get<ApiEnvelope<OrderListItem[]>>('/api/v1/orders');
   return response.data.data;
};

type CancelOrderRequestType = 'ORDER_PARTIAL' | 'ORDER_FULL' | 'GAME_CANCELED' | 'SCHEDULE_CHANGED';

export interface CancelOrderRequest {
   requestType: CancelOrderRequestType;
   orderItemIds?: string[];
   idempotencyKey: string;
}

const createCancelIdempotencyKey = () => `cancel-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export const cancelOrder = async (
   orderId: string,
   payload: Omit<CancelOrderRequest, 'idempotencyKey'> & { idempotencyKey?: string },
) => {
   const requestPayload: CancelOrderRequest = {
      ...payload,
      idempotencyKey: payload.idempotencyKey ?? createCancelIdempotencyKey(),
   };

   const response = await apiClient.post<ApiEnvelope<unknown>>(
      `/api/v1/orders/${encodeURIComponent(orderId)}/cancellations`,
      requestPayload,
   );

   return response.data.data;
};
