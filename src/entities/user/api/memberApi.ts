// src/entities/user/api/memberApi.ts

import apiClient from '@/shared/api/client';
import type { ApiEnvelope } from '@/features/auth/api/types';

export interface MemberProfile {
   name?: string;
   mobile?: string;
}

export const fetchMyProfile = async (): Promise<MemberProfile> => {
   const response = await apiClient.get<ApiEnvelope<MemberProfile>>('/api/v1/members/me');
   return response.data.data;
};
