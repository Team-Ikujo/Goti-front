import apiClient, { unwrapApiData } from "@/shared/api/client";
import type { ApiEnvelope } from "./types";
import { reissueAccessTokenFromCookie } from '@/shared/lib/reissueAccessToken';

// 로그인 성공 후 서버에서 반환하는 계정 상태
export type LoginAccountStatus =
  | 'normal'           // 정상
  | 'failed_under_5'   // 로그인 실패 이력 (5회 미만)
  | 'failed_over_5'    // 로그인 제한 (5회 이상)
  | 'dormant'          // 휴면 계정
  | 'rejoining_locked' // 탈퇴 후 재가입 불가 (7일 이내)

export type AuthTokenResponse = {
  accessToken: string;
  accountStatus?: LoginAccountStatus;
  failCount?: number; // failed_under_5 / failed_over_5 일 때 실패 횟수
};

export type SignupGender = "MALE" | "FEMALE" | "UNKNOWN";

export type SocialSignupParams = {
  socialVerifyToken: string;
  name: string;
  gender: SignupGender;
  mobile: string;
  birthDate: string;
  authCode: string;
};

export type SendSignupSmsParams = {
  socialVerifyToken: string;
  mobile: string;
};

export type ReissueAccessTokenResponse = {
  accessToken: string;
};

export const loginWithSocialVerifyToken = async (payload: {
  socialVerifyToken: string;
}): Promise<AuthTokenResponse> => {
  const response = await apiClient.post<ApiEnvelope<AuthTokenResponse>>(
    "/api/v1/auth/login",
    payload,
    {
      withCredentials: true,
    },
  );

  return unwrapApiData<AuthTokenResponse>(response.data);
};

export const signupWithSocialVerifyToken = async (
  payload: SocialSignupParams,
): Promise<AuthTokenResponse> => {
  const response = await apiClient.post<ApiEnvelope<AuthTokenResponse>>(
    "/api/v1/auth/signup",
    payload,
    {
      withCredentials: true,
    },
  );

  const data = unwrapApiData<AuthTokenResponse>(response.data);

  if (!data?.accessToken) {
    throw new Error("회원가입 응답에 accessToken이 없습니다.");
  }

  return data;
};

export const sendSignupSmsCode = async (
  payload: SendSignupSmsParams,
): Promise<unknown> => {
  const response = await apiClient.post<ApiEnvelope<unknown>>(
    "/api/v1/auth/signup/sms/send",
    payload,
  );

  return unwrapApiData<unknown>(response.data);
};

export const reissueAccessToken = async (): Promise<ReissueAccessTokenResponse> => {
  const accessToken = await reissueAccessTokenFromCookie();
  return { accessToken };
};

export const logout = async (): Promise<void> => {
  await apiClient.post("/api/v1/auth/logout", undefined, {
    withCredentials: true,
  });
};
