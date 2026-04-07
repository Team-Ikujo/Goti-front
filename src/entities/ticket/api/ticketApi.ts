// src/entities/ticket/api/ticketApi.ts

import apiClient from '@/shared/api/client';
import type { ApiEnvelope } from '@/features/auth/api/types';

export interface TicketDetail {
   ticketId: string;
   ticketNumber: string;
   orderItemId: string;
   orderId: string;
   resaleTransactionId?: string;
   gameId: string;
   gameTitle: string;
   gameDate: string;
   stadiumName?: string;
   seatInfo: string;
   ticketPrice: number;
   serviceFee?: number;
   resalePrice?: number;
   ticketStatus: 'ISSUED' | 'USED' | 'INVALID' | 'RESALE_ISSUED';
   resaleEnabledStatus: 'ENABLED' | 'DISABLED';
   frozen?: boolean;
   frozenUntil?: string;
   issuedAt: string;
   usedAt?: string;
   orderedAt?: string;
   cancelableUntil?: string;
   ordererName?: string;
   paymentMethod?: string;
   paymentMethodDisplay?: string;
}

export interface OrderTicket {
   ticketId: string;
   ticketNumber: string;
   orderItemId: string;
   seatInfo: string;
   ticketPrice: number;
   serviceFee: number;
   ticketStatus: 'ISSUED' | 'USED' | 'INVALID' | 'RESALE_ISSUED';
}

export const fetchTicketDetail = async (ticketId: string): Promise<TicketDetail> => {
   const response = await apiClient.get<ApiEnvelope<TicketDetail>>(`/api/v1/tickets/${ticketId}`);
   return response.data.data;
};

interface FetchOrderTicketsOptions {
   mockScenario?: string;
}

export const fetchOrderTickets = async (orderId: string, options?: FetchOrderTicketsOptions): Promise<OrderTicket[]> => {
   const response = await apiClient.get<ApiEnvelope<OrderTicket[]>>(`/api/v1/orders/${orderId}/tickets`, {
      params: options?.mockScenario ? { mockScenario: options.mockScenario } : undefined,
   });
   return response.data.data;
};

export interface TicketQrResponse {
   ticketId: string;
   qrToken: string;
   expiresAt: string;
}

export const fetchTicketQr = async (ticketId: string): Promise<TicketQrResponse> => {
   const response = await apiClient.get<ApiEnvelope<TicketQrResponse>>(`/api/v1/tickets/${ticketId}/qr`);
   return response.data.data;
};

// GET /api/v1/tickets/myinfo — 사용자 티켓 현황 조회
export interface MyTicketInfo {
   ownedTicketCount: number;
   listingCount: number;
   soldCount: number;
   unsettledAmount: number;
}

export const fetchMyTicketInfo = async (): Promise<MyTicketInfo> => {
   const response = await apiClient.get<ApiEnvelope<MyTicketInfo>>('/api/v1/tickets/myinfo');
   return response.data.data;
};
