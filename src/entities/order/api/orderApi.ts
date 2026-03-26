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
}

export const fetchMyOrders = async (): Promise<OrderListItem[]> => {
   const response = await apiClient.get<ApiEnvelope<OrderListItem[]>>('/api/v1/orders');
   return response.data.data;
};
