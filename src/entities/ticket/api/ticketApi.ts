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
   seatInfo: string;
   ticketPrice: number;
   serviceFee: number;
   ticketStatus: 'ISSUED' | 'USED' | 'INVALID' | 'RESALE_ISSUED';
}

export const fetchTicketDetail = async (ticketId: string): Promise<TicketDetail> => {
   const response = await apiClient.get<ApiEnvelope<TicketDetail>>(`/api/v1/tickets/${ticketId}`);
   return response.data.data;
};

export const fetchOrderTickets = async (orderId: string): Promise<OrderTicket[]> => {
   const response = await apiClient.get<ApiEnvelope<OrderTicket[]>>(`/api/v1/orders/${orderId}/tickets`);
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

export const cancelTicket = async (ticketId: string): Promise<void> => {
   await apiClient.post(`/api/v1/tickets/${ticketId}/cancel`);
};
