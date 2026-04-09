// src/entities/user/api/memberApi.ts

import axios from 'axios';
import apiClient from '@/shared/api/client';
import type { ApiEnvelope } from '@/features/auth/api/types';
import { isMswEnabled } from '@/shared/config/runtime';

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

export interface ProfileEditMockRequest {
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
   if (!isMswEnabled) {
      return null;
   }

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
   if (!isMswEnabled) {
      return;
   }

   if (typeof window === 'undefined') {
      return;
   }

   window.localStorage.setItem(MY_PROFILE_MOCK_STORAGE_KEY, JSON.stringify(profile));
};

const mergeMockProfile = (profile?: MemberProfile): MemberProfile => {
   const storedProfile = isMswEnabled ? readStoredMockProfile() : null;

   if (!storedProfile) {
      return {
         ...profile,
      };
   }

   return {
      ...profile,
      // 이메일은 실제 API 응답을 우선 사용한다.
      email: profile?.email ?? storedProfile.email,
      // 이름/휴대폰/기타 편집 가능 필드만 mock 로컬 편집값을 보강한다.
      name: storedProfile.name ?? profile?.name,
      mobile: storedProfile.mobile ?? profile?.mobile,
      gender: storedProfile.gender ?? profile?.gender,
      birthDate: storedProfile.birthDate ?? profile?.birthDate,
      oAuthProvider: profile?.oAuthProvider ?? storedProfile.oAuthProvider,
      bankAccount: profile?.bankAccount ?? storedProfile.bankAccount,
      address: profile?.address ?? storedProfile.address,
      socialConnection: profile?.socialConnection ?? storedProfile.socialConnection,
   };
};

// GET /api/v1/members/me/summary 응답 (마이페이지 프로필 카드용 요약 정보)
export interface MemberSummary {
   name?: string;
   email?: string;
   mobile?: string;
}

export const fetchMyProfileSummary = async (): Promise<MemberSummary> => {
   try {
      const response = await apiClient.get<ApiEnvelope<MemberSummary>>('/api/v1/members/me/summary');
      return response.data.data;
   } catch (error) {
      // 마이페이지 프로필 요약은 summary API를 우선 사용하되,
      // 일부 배포 환경에서 summary 미배포(404)일 때만 /members/me 로 보완한다.
      if (axios.isAxiosError(error) && error.response?.status === 404) {
         const profile = await fetchMyProfile();

         return {
            name: profile.name,
            email: profile.email,
            mobile: profile.mobile,
         };
      }

      throw error;
   }
};

export const fetchMyProfile = async (): Promise<MemberProfile> => {
   try {
      const response = await apiClient.get<ApiEnvelope<MemberProfile>>('/api/v1/members/me');
      return mergeMockProfile(response.data.data);
   } catch {
      if (!isMswEnabled) {
         throw new Error('Failed to fetch member profile.');
      }

      await wait(MY_PROFILE_FALLBACK_DELAY_MS);
      return mergeMockProfile(MY_PROFILE_MOCK);
   }
};

export const updateMyProfile = async (body: MemberUpdateRequest): Promise<MemberUpdateResponse> => {
   const response = await apiClient.patch<ApiEnvelope<MemberUpdateResponse>>('/api/v1/members/me', body);
   return response.data.data;
};

export const sendProfileUpdateSmsCodeMock = async (): Promise<{ success: true }> => {
   await wait(MY_PROFILE_FALLBACK_DELAY_MS);
   return { success: true };
};

export const updateMemberProfileMock = async (body: ProfileEditMockRequest): Promise<MemberUpdateResponse> => {
   await wait(MY_PROFILE_FALLBACK_DELAY_MS);

   const nextProfile = {
      ...mergeMockProfile(),
      name: body.name,
      mobile: body.mobile,
      gender: body.gender,
      birthDate: body.birthDate,
   };

   writeStoredMockProfile(nextProfile);

   return {
      name: nextProfile.name ?? body.name,
      mobile: nextProfile.mobile ?? body.mobile,
      gender: body.gender,
      birthDate: body.birthDate,
   };
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
