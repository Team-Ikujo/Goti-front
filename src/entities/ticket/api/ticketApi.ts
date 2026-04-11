// src/entities/ticket/api/ticketApi.ts

import apiClient from '@/shared/api/client';
import type { ApiEnvelope } from '@/features/auth/api/types';
import { isMswEnabled } from '@/shared/config/runtime';

export interface TicketDetail {
   ticketId: string;
   ticketNumber: string;
   orderItemId: string;
   orderId: string;
   resaleTransactionId?: string;
   gameId: string;
   gameTitle: string;
   gameDate: string;
   seatGradeName?: string;
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

const MYPAGE_MOCK_ORDER_ID = 'mock-order-mypage-actions';
const MYPAGE_MOCK_ORDERED_AT = '2026-03-19T09:00:00.000Z';
const MYPAGE_MOCK_GAME_DATE = '2026-03-21T18:30:00.000Z';
const MYPAGE_MOCK_STADIUM = '광주 KIA 홈구장';
const MYPAGE_MOCK_GAME_TITLE = 'KIA vs 삼성';
const MYPAGE_MOCK_ORDERER = '테스트 유저';

const MOCK_TICKET_DETAILS: TicketDetail[] = [
   {
      ticketId: 'mock-ticket-mypage-actions-1',
      ticketNumber: 'TKT-MOCK-1',
      orderItemId: 'mock-order-item-mypage-actions-1',
      orderId: MYPAGE_MOCK_ORDER_ID,
      gameId: 'game-kia-home-tomorrow',
      gameTitle: MYPAGE_MOCK_GAME_TITLE,
      gameDate: MYPAGE_MOCK_GAME_DATE,
      seatGradeName: '1루 내야지정석',
      stadiumName: MYPAGE_MOCK_STADIUM,
      seatInfo: '1루 내야지정석 104구역 A열 9번',
      ticketPrice: 17000,
      serviceFee: 1000,
      ticketStatus: 'ISSUED',
      resaleEnabledStatus: 'ENABLED',
      frozen: false,
      issuedAt: MYPAGE_MOCK_ORDERED_AT,
      orderedAt: MYPAGE_MOCK_ORDERED_AT,
      cancelableUntil: '2026-03-21T14:30:00.000Z',
      ordererName: MYPAGE_MOCK_ORDERER,
      paymentMethod: 'CARD',
      paymentMethodDisplay: '카드 결제',
   },
   {
      ticketId: 'mock-ticket-mypage-actions-2',
      ticketNumber: 'TKT-MOCK-2',
      orderItemId: 'mock-order-item-mypage-actions-2',
      orderId: MYPAGE_MOCK_ORDER_ID,
      gameId: 'game-kia-home-tomorrow',
      gameTitle: MYPAGE_MOCK_GAME_TITLE,
      gameDate: MYPAGE_MOCK_GAME_DATE,
      seatGradeName: '1루 내야지정석',
      stadiumName: MYPAGE_MOCK_STADIUM,
      seatInfo: '1루 내야지정석 104구역 A열 10번',
      ticketPrice: 17000,
      serviceFee: 1000,
      ticketStatus: 'ISSUED',
      resaleEnabledStatus: 'ENABLED',
      frozen: false,
      issuedAt: MYPAGE_MOCK_ORDERED_AT,
      orderedAt: MYPAGE_MOCK_ORDERED_AT,
      cancelableUntil: '2026-03-21T14:30:00.000Z',
      ordererName: MYPAGE_MOCK_ORDERER,
      paymentMethod: 'CARD',
      paymentMethodDisplay: '카드 결제',
   },
];

const buildMypageMockTicketDetail = (ticketId: string): TicketDetail | undefined => {
   const matchedTicket = MOCK_TICKET_DETAILS.find((ticket) => ticket.ticketId === ticketId);

   return matchedTicket;
};

const buildMypageMockOrderTickets = (): OrderTicket[] =>
   MOCK_TICKET_DETAILS.map((ticket) => ({
      ticketId: ticket.ticketId,
      ticketNumber: ticket.ticketNumber,
      orderItemId: ticket.orderItemId,
      seatInfo: ticket.seatInfo,
      ticketPrice: ticket.ticketPrice,
      serviceFee: ticket.serviceFee ?? 0,
      ticketStatus: ticket.ticketStatus,
   }));

export const fetchTicketDetail = async (ticketId: string): Promise<TicketDetail> => {
   if (isMswEnabled && ticketId.startsWith('mock-ticket-mypage-actions-')) {
      const mockDetail = buildMypageMockTicketDetail(ticketId);

      if (mockDetail) {
         return mockDetail;
      }
   }

   const response = await apiClient.get<ApiEnvelope<TicketDetail>>(`/api/v1/tickets/${ticketId}`);
   return response.data.data;
};

interface FetchOrderTicketsOptions {
   mockScenario?: string;
}

export const fetchOrderTickets = async (orderId: string, options?: FetchOrderTicketsOptions): Promise<OrderTicket[]> => {
   if (isMswEnabled && orderId === MYPAGE_MOCK_ORDER_ID) {
      return buildMypageMockOrderTickets();
   }

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
