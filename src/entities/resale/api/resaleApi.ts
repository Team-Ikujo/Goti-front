// src/entities/resale/api/resaleApi.ts

import apiClient from '@/shared/api/client';
import type { ApiEnvelope } from '@/features/auth/api/types';
import { createBookingFlowHeaders } from '@/shared/lib/guardrailHeaders';
import { configuredApiBaseUrl, shouldUseRelativeApiBase } from '@/shared/config/api';
const FORCE_RESALE_SOLD_OUT_MOCK = true;

export interface ResaleListingItem {
   listingId: string;
   orderId?: string;
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

export const fetchMyResaleListings = async (): Promise<ResaleListingItem[]> => fetchResaleListings();

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
         ...createBookingFlowHeaders(),
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

type CreateResaleListingsSinglePayload = Partial<ResaleListingItem> & {
   listingId: string;
   ticketId: string;
   listingPrice: number;
   listingStatus?: ResaleListingItem['listingStatus'];
   listedAt?: string;
   isCancelable?: boolean;
   isPurchasable?: boolean;
};

type CreateResaleListingsApiPayload =
   | CreateResaleListingsResponse
   | CreateResaleListingsSinglePayload;

export const createResaleListings = async (body: CreateResaleListingsRequest): Promise<CreateResaleListingsResponse> => {
   const response = await apiClient.post<ApiEnvelope<CreateResaleListingsApiPayload>>('/api/v1/resales/listings', body);
   const payload = response.data.data;

   if ('listings' in payload && Array.isArray(payload.listings)) {
      return {
         orders: Array.isArray(payload.orders) ? payload.orders : [],
         listings: payload.listings,
      };
   }

   const singlePayload = payload as CreateResaleListingsSinglePayload;

   return {
      orders: [],
      listings: [
         {
            listingId: singlePayload.listingId,
            ticketId: singlePayload.ticketId,
            sellerId: singlePayload.sellerId ?? '',
            gameId: singlePayload.gameId ?? '',
            seatId: singlePayload.seatId ?? '',
            gradeId: singlePayload.gradeId ?? '',
            seatInfo: singlePayload.seatInfo ?? '',
            dailyBasePrice: singlePayload.dailyBasePrice ?? singlePayload.listingPrice,
            listingPrice: singlePayload.listingPrice,
            listingStatus: singlePayload.listingStatus ?? 'LISTING',
            availableStatus: singlePayload.availableStatus ?? 'ENABLED',
            lastTransactionPrice: singlePayload.lastTransactionPrice,
            listedAt: singlePayload.listedAt ?? new Date().toISOString(),
            soldAt: singlePayload.soldAt,
            canceledAt: singlePayload.canceledAt,
            isCancelable: singlePayload.isCancelable ?? true,
            maxPrice: singlePayload.maxPrice ?? singlePayload.listingPrice,
            gameTitle: singlePayload.gameTitle,
            gameDate: singlePayload.gameDate,
            stadiumName: singlePayload.stadiumName,
            isPurchasable: singlePayload.isPurchasable ?? true,
         },
      ],
   };
};

export interface ResaleListingDetail {
   listingId: string;
   orderId?: string;
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

export type ResaleGameStatus = 'SCHEDULED' | 'AVAILABLE' | 'UNAVAILABLE';

export interface ResaleGameStatusResponse {
   status: ResaleGameStatus;
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
   if (FORCE_RESALE_SOLD_OUT_MOCK) {
      return 0;
   }

   const response = await apiClient.get<ApiEnvelope<ResaleGameListingCountResponse>>(
      `/api/v1/resales/games/${encodeURIComponent(gameId)}/count`,
   );

   return response.data.data.count;
};

export const fetchResaleListingCountsByGames = async (gameIds: string[]): Promise<Map<string, number>> => {
   const uniqueGameIds = [...new Set(gameIds.filter(Boolean))];

   if (uniqueGameIds.length === 0) {
      return new Map<string, number>();
   }

   if (FORCE_RESALE_SOLD_OUT_MOCK) {
      return new Map<string, number>(uniqueGameIds.map((gameId) => [gameId, 0]));
   }

   const counts = await Promise.all(
      uniqueGameIds.map(async gameId => [gameId, await fetchResaleListingCountByGame(gameId)] as const),
   );

   return new Map<string, number>(counts);
};

/** 경기의 등급별 리셀 좌석 개수 조회 (gradeId 기준) */
export const fetchResaleListingCountByGameAndGrade = async (gameId: string, gradeId: string): Promise<number> => {
   const response = await apiClient.get<ApiEnvelope<ResaleGameListingCountResponse>>(
      `/api/v1/resales/games/${encodeURIComponent(gameId)}/grade/${encodeURIComponent(gradeId)}/count`,
   );

   return response.data.data.count;
};

/** 복수 gradeId 에 대한 리셀 좌석 개수 일괄 조회 — Map<gradeId, count> 반환 */
export const fetchResaleListingCountsByGrades = async (
   gameId: string,
   gradeIds: string[],
): Promise<Map<string, number>> => {
   const uniqueGradeIds = [...new Set(gradeIds.filter(Boolean))];

   if (!gameId || uniqueGradeIds.length === 0) {
      return new Map<string, number>();
   }

   const counts = await Promise.all(
      uniqueGradeIds.map(async (gradeId) => [
         gradeId,
         await fetchResaleListingCountByGameAndGrade(gameId, gradeId),
      ] as const),
   );

   return new Map<string, number>(counts);
};
export const fetchResaleListings = async (): Promise<ResaleListingItem[]> => {
   const resaleOrders = await fetchMyResaleListingOrders();

   if (resaleOrders.list.length === 0) {
      return [];
   }

   const listingGroups = await Promise.all(
      resaleOrders.list.map((order) => fetchResaleListingOrderDetails(order.orderId)),
   );

   return listingGroups.flat();
};

/** 구매자용 마켓 전체 리스팅 조회 — GET /api/v1/resales/listings */
export const fetchMarketResaleListings = async (): Promise<ResaleListingItem[]> => {
   if (FORCE_RESALE_SOLD_OUT_MOCK) {
      return [];
   }

   const response = await apiClient.get<ApiEnvelope<ResaleListingItem[]>>('/api/v1/resales/listings');
   return response.data.data;
};

export const fetchMyResaleListingSummary = async (userId: string): Promise<MyResaleListingSummaryResponse> => {
   const response = await apiClient.get<ApiEnvelope<MyResaleListingSummaryResponse>>('/api/v1/resales/listings/count', {
      params: { userId },
   });

   return response.data.data;
};

export const fetchResaleGameStatusByGame = async (gameId: string): Promise<ResaleGameStatus> => {
   if (FORCE_RESALE_SOLD_OUT_MOCK) {
      return 'UNAVAILABLE';
   }

   const response = await apiClient.get<ApiEnvelope<ResaleGameStatusResponse>>(
      `/api/v1/resales/games/${encodeURIComponent(gameId)}/status`,
   );

   return response.data.data.status;
};

export const fetchResaleGameStatusesByGames = async (gameIds: string[]): Promise<Map<string, ResaleGameStatus>> => {
   const uniqueGameIds = [...new Set(gameIds.filter(Boolean))];

   if (uniqueGameIds.length === 0) {
      return new Map<string, ResaleGameStatus>();
   }

   if (FORCE_RESALE_SOLD_OUT_MOCK) {
      return new Map<string, ResaleGameStatus>(uniqueGameIds.map((gameId) => [gameId, 'UNAVAILABLE']));
   }

   const statuses = await Promise.all(
      uniqueGameIds.map(async (gameId) => [gameId, await fetchResaleGameStatusByGame(gameId)] as const),
   );

   return new Map<string, ResaleGameStatus>(statuses);
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

export const fetchResaleGameStatus = async (gameId: string): Promise<ResaleGameStatusResponse> => {
   const response = await apiClient.get<ApiEnvelope<ResaleGameStatusResponse>>(
      `/api/v1/resales/games/${encodeURIComponent(gameId)}/status`,
   );

   return response.data.data;
};

// ─── 내 판매 그룹 (리셀 등록 주문 그룹) ─────────────────────────────

export type ResaleListingOrderStatus = 'LISTING' | 'PARTIAL' | 'SOLD' | 'SETTLED' | 'CANCELED';

export interface ResaleListingOrderSummary {
   orderId: string;
   orderNumber: string;
   gradeId: string;
   orderStatus: ResaleListingOrderStatus;
   createdAt: string;
}

interface ResaleListingOrderPageResponse {
   list: ResaleListingOrderSummary[];
   totalCount: number;
   totalPages: number;
}

export interface FetchMyResaleListingOrdersParams {
   months?: number;
   startDate?: string;
   endDate?: string;
   status?: 'ALL' | 'LISTING' | 'PENDING' | 'SETTLED' | 'CANCELED';
   page?: number;
   size?: number;
}

export const fetchMyResaleListingOrders = async (
   params?: FetchMyResaleListingOrdersParams,
): Promise<ResaleListingOrderPageResponse> => {
   const response = await apiClient.get<ApiEnvelope<ResaleListingOrderPageResponse>>(
      '/api/v1/resales/listings/orders',
      { params },
   );

   return response.data.data;
};

// 특정 판매 그룹에 속한 리셀 목록 상세
export const fetchResaleListingOrderDetails = async (orderId: string): Promise<ResaleListingItem[]> => {
   const response = await apiClient.get<ApiEnvelope<ResaleListingItem[]>>(
      `/api/v1/resales/listings/orders/${encodeURIComponent(orderId)}`,
   );

   return response.data.data;
};
