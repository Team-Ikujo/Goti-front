import apiClient from "@/shared/api/client";
import type { ApiEnvelope } from "./types";

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

export type SignupGender = "MALE" | "FEMALE";

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

export const loginWithSocialVerifyToken = async (payload: {
  socialVerifyToken: string;
}): Promise<AuthTokenResponse> => {
  const response = await apiClient.post<ApiEnvelope<AuthTokenResponse>>(
    "/api/v1/auth/login",
    payload,
  );

  return response.data.data;
};

export const signupWithSocialVerifyToken = async (
  payload: SocialSignupParams,
): Promise<AuthTokenResponse> => {
  // 회원가입 상세 스펙은 doc/auth-api.md에 아직 비어 있으므로,
  // 현재 서버와 맞춰진 프론트 payload를 유지하되 응답 형식은 엄격히 검증한다.
  const response = await apiClient.post<ApiEnvelope<AuthTokenResponse>>(
    "/api/v1/auth/signup",
    payload,
  );

  if (!response.data.data?.accessToken) {
    throw new Error("회원가입 응답에 accessToken이 없습니다. auth signup 스펙 확인이 필요합니다.");
  }

  return response.data.data;
};

export const sendSignupSmsCode = async (
  payload: SendSignupSmsParams,
): Promise<string> => {
  const response = await apiClient.post<ApiEnvelope<string>>(
    "/api/v1/auth/signup/sms/send",
    payload,
  );

  return response.data.data;
};
