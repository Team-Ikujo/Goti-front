// src/entities/user/api/memberApi.ts

import apiClient from '@/shared/api/client';
import type { ApiEnvelope } from '@/features/auth/api/types';

// GET /api/v1/members/me 응답 내 중첩 타입들
export interface MemberBankAccount {
   bankName: string;
   accountNumber: string;
   accountHolder: string;
}

export interface MemberAddressInfo {
   zipCode: string;
   baseAddress: string;
   detailAddress: string;
}

export interface MemberSocialConnection {
   isGoogleConnected: boolean;
   isKakaoConnected: boolean;
   isNaverConnected: boolean;
}

// GET /api/v1/members/me 전체 응답 (MemberDetailResponse)
export interface MemberProfile {
   name?: string;
   email?: string;
   mobile?: string;
   gender?: 'MALE' | 'FEMALE' | 'UNKNOWN';
   birthDate?: string;
   oAuthProvider?: 'NAVER' | 'KAKAO' | 'GOOGLE';
   bankAccount?: MemberBankAccount;
   address?: MemberAddressInfo;
   socialConnection?: MemberSocialConnection;
}

export interface UpdateMemberProfileRequest {
   name: string;
   mobile: string;
   gender: 'MALE' | 'FEMALE' | 'UNKNOWN';
   birthDate: string;
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

// PATCH /api/v1/members/me 요청/응답
export interface MemberUpdateRequest {
   mobile: string;
   name: string;
   gender: 'MALE' | 'FEMALE' | 'UNKNOWN';
   birthDate: string;
   authCode: string;
}

export interface MemberUpdateResponse {
   mobile: string;
   name: string;
   gender: 'MALE' | 'FEMALE' | 'UNKNOWN';
   birthDate: string;
}

const MY_PROFILE_FALLBACK_DELAY_MS = 250;
const MY_PROFILE_MOCK_STORAGE_KEY = 'mypage-mock-profile';

export const MY_PROFILE_MOCK: Required<Pick<MemberProfile, 'name' | 'email' | 'mobile'>> = {
   name: '테스트 유저',
   email: 'test.user@goti.co.kr',
   mobile: '010-1234-1234',
};

const wait = (ms: number) => new Promise<void>((resolve) => {
   setTimeout(resolve, ms);
});

const readStoredMockProfile = (): MemberProfile | null => {
   if (typeof window === 'undefined') {
      return null;
   }

   const storedValue = window.localStorage.getItem(MY_PROFILE_MOCK_STORAGE_KEY);

   if (!storedValue) {
      return null;
   }

   try {
      return JSON.parse(storedValue) as MemberProfile;
   } catch {
      return null;
   }
};

const writeStoredMockProfile = (profile: MemberProfile) => {
   if (typeof window === 'undefined') {
      return;
   }

   window.localStorage.setItem(MY_PROFILE_MOCK_STORAGE_KEY, JSON.stringify(profile));
};

const withMockProfile = (profile?: MemberProfile): MemberProfile => {
   const storedProfile = readStoredMockProfile();
   const mergedProfile = {
      ...profile,
      ...storedProfile,
   };

   return {
      ...mergedProfile,
      name: mergedProfile.name?.trim() || MY_PROFILE_MOCK.name,
      email: mergedProfile.email?.trim() || MY_PROFILE_MOCK.email,
      mobile: mergedProfile.mobile?.trim() || MY_PROFILE_MOCK.mobile,
   };
};

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

export const updateMyProfile = async (body: MemberUpdateRequest): Promise<MemberUpdateResponse> => {
   const response = await apiClient.patch<ApiEnvelope<MemberUpdateResponse>>('/api/v1/members/me', body);
   return response.data.data;
};

export const createMemberAccount = async (body: MemberAccountRequest): Promise<MemberAccount> => {
   const response = await apiClient.post<ApiEnvelope<MemberAccount>>('/api/v1/members/accounts', body);
   return response.data.data;
};

export const createMemberAddress = async (body: MemberAddressRequest): Promise<MemberAddress> => {
   const response = await apiClient.post<ApiEnvelope<MemberAddress>>('/api/v1/members/addresses', body);
   return response.data.data;
};

export const withdrawMember = async (): Promise<void> => {
   // 탈퇴 엔드포인트는 서버 구현 후 연결 예정
   await apiClient.delete('/api/v1/members/me');
};
