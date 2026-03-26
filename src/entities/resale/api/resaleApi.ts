// src/entities/resale/api/resaleApi.ts

import apiClient from '@/shared/api/client';
import type { ApiEnvelope } from '@/features/auth/api/types';

export interface ResaleListingItem {
   listingId: string;
   ticketId: string;
   sellerId: string;
   gameId: string;
   seatId: string;
   gradeId: string;
   seatInfo: string;
   dailyBasePrice: number;
   listingPrice: number;
   listingStatus: 'LISTING' | 'HOLD' | 'SOLD' | 'SETTLED' | 'CANCELED';
   availableStatus: 'ENABLED' | 'DISABLED';
   lastTransactionPrice?: number;
   listedAt: string;
   soldAt?: string;
   canceledAt?: string;
   isCancelable: boolean;
   isPurchasable: boolean;
   minPrice: number;
   maxPrice: number;
}

export const fetchMyResaleListings = async (): Promise<ResaleListingItem[]> => {
   const response = await apiClient.get<ApiEnvelope<ResaleListingItem[]>>('/api/v1/resales/listings');
   return response.data.data;
};

export interface ResaleListingCreateRequest {
   ticketId: string;
   listingPrice: number;
}

export const createResaleListing = async (payload: ResaleListingCreateRequest): Promise<ResaleListingItem> => {
   const response = await apiClient.post<ApiEnvelope<ResaleListingItem>>('/api/v1/resales/listings', payload);
   return response.data.data;
};
