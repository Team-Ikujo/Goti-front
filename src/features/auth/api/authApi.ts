import apiClient from "@/shared/api/client";
import type { ApiEnvelope } from "./types";

export type AuthTokenResponse = {
  accessToken: string;
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
