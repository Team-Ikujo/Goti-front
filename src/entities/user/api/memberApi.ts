// src/entities/user/api/memberApi.ts

import apiClient from '@/shared/api/client';
import type { ApiEnvelope } from '@/features/auth/api/types';

export interface MemberProfile {
   name?: string;
   email?: string;
   mobile?: string;
   gender?: 'MALE' | 'FEMALE' | 'UNKNOWN';
   birthDate?: string;
}

export interface MemberAccountRequest {
   accountNumber: string;
   bankName: string;
   accountHolder: string;
}

export interface MemberAccount {
   accountId: string;
   accountNumber: string;
   bankName: string;
   accountHolder: string;
}

export interface MemberAddressRequest {
   zipCode: string;
   baseAddress: string;
   detailAddress: string;
}

export interface MemberAddress {
   addressId: string;
   zipCode: string;
   baseAddress: string;
   detailAddress: string;
}

const MY_PROFILE_FALLBACK_DELAY_MS = 250;

export const MY_PROFILE_MOCK: Required<Pick<MemberProfile, 'name' | 'email' | 'mobile'>> = {
   name: '테스트 유저',
   email: 'test.user@goti.co.kr',
   mobile: '010-1234-1234',
};

const wait = (ms: number) => new Promise<void>((resolve) => {
   setTimeout(resolve, ms);
});

const withMockProfile = (profile?: MemberProfile): MemberProfile => ({
   ...profile,
   name: profile?.name?.trim() || MY_PROFILE_MOCK.name,
   email: profile?.email?.trim() || MY_PROFILE_MOCK.email,
   mobile: profile?.mobile?.trim() || MY_PROFILE_MOCK.mobile,
});

export const fetchMyProfile = async (): Promise<MemberProfile> => {
   try {
      const response = await apiClient.get<ApiEnvelope<MemberProfile>>('/api/v1/members/me');
      return withMockProfile(response.data.data);
   } catch {
      // 배포 환경에서도 프로필 API 실패 때문에 마이페이지 전체가 막히지 않도록 앱 내부 fallback 을 유지한다.
      await wait(MY_PROFILE_FALLBACK_DELAY_MS);
      return withMockProfile();
   }
};

export const createMemberAccount = async (body: MemberAccountRequest): Promise<MemberAccount> => {
   const response = await apiClient.post<ApiEnvelope<MemberAccount>>('/api/v1/members/accounts', body);
   return response.data.data;
};

export const createMemberAddress = async (body: MemberAddressRequest): Promise<MemberAddress> => {
   const response = await apiClient.post<ApiEnvelope<MemberAddress>>('/api/v1/members/addresses', body);
   return response.data.data;
};
