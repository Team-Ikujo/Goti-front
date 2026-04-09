// src/entities/game/api/stadiumApi.ts

import apiClient from '@/shared/api/client';
import type { ApiEnvelope } from '@/features/auth/api/types';

export interface StadiumResponse {
   id: string;
   stadiumName: string;
   location: string;
   city?: string;
   district?: string;
}

export const fetchStadiumById = async (stadiumId: string): Promise<StadiumResponse> => {
   const response = await apiClient.get<ApiEnvelope<StadiumResponse>>(
      `/api/v1/stadiums/${encodeURIComponent(stadiumId)}`,
   );
   return response.data.data;
};
