// src/entities/resale/api/resaleApi.ts

import apiClient from '@/shared/api/client';
import type { ApiEnvelope } from '@/features/auth/api/types';
import { useBookingEntryStore } from '@/shared/lib/useBookingEntryStore';
import { createBookingFlowHeaders } from '@/shared/lib/guardrailHeaders';

const configuredApiBaseUrl = (import.meta.env.PUBLIC_API_BASE_URL ?? '').trim();
const shouldUseRelativeApiBase = import.meta.env.DEV;

export interface ResaleListingItem {
   listingId: string;
   ticketId: string;
   ticketNumber?: string;
   sellerId: string;
   gameId: string;
   seatId: string;
   gradeId: string;
   seatInfo: string;
   dailyBasePrice: number;
   listingPrice: number;
   listingStatus: 'LISTING' | 'HOLD' | 'SOLD' | 'SETTLED' | 'CANCEL_REQUESTED' | 'CANCELED';
   availableStatus: 'ENABLED' | 'DISABLED';
   lastTransactionPrice?: number;
   listedAt: string;
   soldAt?: string;
   canceledAt?: string;
   isCancelable: boolean;
   maxPrice: number;
   gameTitle?: string;
   gameDate?: string;
   stadiumName?: string;
   isPurchasable?: boolean;
}

export interface ResaleHoldRequest {
   listingId: string;
   queueTokenJti: string;
}

export interface ResaleHoldResponse {
   holdId: string;
}

const getResaleHoldReleaseUrl = (holdId: string) => {
   const path = `/api/v1/resales/holds/${encodeURIComponent(holdId)}/release`;

   if (shouldUseRelativeApiBase || !configuredApiBaseUrl) {
      return path;
   }

   return new URL(path, configuredApiBaseUrl).toString();
};

export const fetchMyResaleListings = async (): Promise<ResaleListingItem[]> => {
   const response = await apiClient.get<ApiEnvelope<ResaleListingItem[]>>('/api/v1/resales/listings');
   return response.data.data;
};

export const holdResaleListing = async (body: ResaleHoldRequest): Promise<ResaleHoldResponse> => {
   const response = await apiClient.post<ApiEnvelope<ResaleHoldResponse>>('/api/v1/resales/holds', body);
   return response.data.data;
};

export const releaseResaleListingHold = async (holdId: string): Promise<ResaleHoldResponse> => {
   const response = await apiClient.patch<ApiEnvelope<ResaleHoldResponse>>(
      `/api/v1/resales/holds/${encodeURIComponent(holdId)}/release`,
   );

   return response.data.data;
};

export const releaseResaleListingHoldKeepalive = (holdId: string) => {
   if (typeof window === 'undefined') {
      return;
   }

   void fetch(getResaleHoldReleaseUrl(holdId), {
      method: 'PATCH',
      headers: {
         'Content-Type': 'application/json',
         ...createBookingFlowHeaders(useBookingEntryStore.getState().entry?.turnstileToken),
      },
      credentials: 'omit',
      keepalive: true,
   });
};

export interface CreateResaleListingRequest {
   ticketId: string;
   listingPrice: number;
}

export interface CreateResaleListingsRequest {
   listings: CreateResaleListingRequest[];
}

export interface ResaleListingOrderSummary {
   orderId: string;
   orderNumber: string;
}

export interface CreateResaleListingsResponse {
   orders: ResaleListingOrderSummary[];
   listings: ResaleListingItem[];
}

export const createResaleListings = async (body: CreateResaleListingsRequest): Promise<CreateResaleListingsResponse> => {
   const response = await apiClient.post<ApiEnvelope<CreateResaleListingsResponse>>('/api/v1/resales/listings', body);
   return response.data.data;
};

export interface ResaleListingDetail {
   listingId: string;
   ticketId: string;
   ticketNumber?: string;
   seatInfo: string;
   listingPrice: number;
   listingStatus: 'LISTING' | 'HOLD' | 'SOLD' | 'SETTLED' | 'CANCEL_REQUESTED' | 'CANCELED';
   listedAt: string;
   canceledAt?: string;
   gameTitle: string;
   gameDate: string;
   stadiumName: string;
   isCancelable: boolean;
}

export const fetchResaleListingDetail = async (listingId: string): Promise<ResaleListingDetail> => {
   const response = await apiClient.get<ApiEnvelope<ResaleListingDetail>>(`/api/v1/resales/listings/${listingId}`);
   return response.data.data;
};

export const cancelResaleListing = async (listingId: string): Promise<void> => {
   await apiClient.patch('/api/v1/resales/listings/cancel', { listingId });
};

export interface ResaleGameListingCountResponse {
   count: number;
}

export interface MyResaleListingSummaryResponse {
   listingCount: number;
   soldCount: number;
}

export interface ResaleHistoryPointResponse {
   transactionPrice: number;
   confirmedAt: string;
}

export const fetchResaleListingCountByGame = async (gameId: string): Promise<number> => {
   const response = await apiClient.get<ApiEnvelope<ResaleGameListingCountResponse>>(
      `/api/v1/resales/listings/games/${encodeURIComponent(gameId)}/count`,
   );

   return response.data.data.count;
};

export const fetchResaleListingCountsByGames = async (gameIds: string[]): Promise<Map<string, number>> => {
   const uniqueGameIds = [...new Set(gameIds.filter(Boolean))];

   if (uniqueGameIds.length === 0) {
      return new Map<string, number>();
   }

   const counts = await Promise.all(
      uniqueGameIds.map(async gameId => [gameId, await fetchResaleListingCountByGame(gameId)] as const),
   );

   return new Map<string, number>(counts);
};

export const fetchResaleListingCountByGameAndSection = async (gameId: string, sectionId: string): Promise<number> => {
   const response = await apiClient.get<ApiEnvelope<ResaleGameListingCountResponse>>(
      `/api/v1/resales/listings/games/${encodeURIComponent(gameId)}/section/${encodeURIComponent(sectionId)}/count`,
   );

   return response.data.data.count;
};

export const fetchResaleListingCountsBySections = async (
   gameId: string,
   sectionIds: string[],
): Promise<Map<string, number>> => {
   const uniqueSectionIds = [...new Set(sectionIds.filter(Boolean))];

   if (!gameId || uniqueSectionIds.length === 0) {
      return new Map<string, number>();
   }

   const counts = await Promise.all(
      uniqueSectionIds.map(async (sectionId) => [
         sectionId,
         await fetchResaleListingCountByGameAndSection(gameId, sectionId),
      ] as const),
   );

   return new Map<string, number>(counts);
};

export const fetchResaleListings = async (): Promise<ResaleListingItem[]> => {
   const response = await apiClient.get<ApiEnvelope<ResaleListingItem[]>>('/api/v1/resales/listings');
   return response.data.data;
};

export const fetchMyResaleListingSummary = async (): Promise<MyResaleListingSummaryResponse> => {
   const response = await apiClient.get<ApiEnvelope<MyResaleListingSummaryResponse>>('/api/v1/resales/listings/count/listing');
   return response.data.data;
};

export const fetchResaleHistoryGraph = async (
   gameId: string,
   gradeId: string,
   range: 'HOUR' | 'DAY' | 'WEEK',
): Promise<ResaleHistoryPointResponse[]> => {
   const response = await apiClient.get<ApiEnvelope<ResaleHistoryPointResponse[]>>(
      `/api/v1/resales/histories/games/${encodeURIComponent(gameId)}/grade/${encodeURIComponent(gradeId)}/ranges/${range}/graph`,
   );

   return response.data.data;
};

export interface ResaleLedger {
   id: string;
   orderId: string;
   paymentId: string;
   totalAmount: number;
   buyerFee: number;
   sellerFee: number;
   vat: number;
   netProfit: number;
   settlementAmount: number;
   createdAt: string;
}

interface ResaleLedgerPageResponse {
   content: ResaleLedger[];
   totalElements: number;
   totalPages: number;
   number: number;
   size: number;
   empty: boolean;
}

export const fetchResaleLedgers = async (params?: {
   page?: number;
   size?: number;
}): Promise<ResaleLedgerPageResponse> => {
   const response = await apiClient.get<ApiEnvelope<ResaleLedgerPageResponse>>(
      '/api/v1/payments/resales/ledgers',
      { params },
   );

   return response.data.data;
};

export const fetchResaleLedgerByOrderId = async (orderId: string): Promise<ResaleLedger> => {
   const response = await apiClient.get<ApiEnvelope<ResaleLedger>>(
      `/api/v1/payments/resales/ledgers/orders/${encodeURIComponent(orderId)}`,
   );

   return response.data.data;
};
