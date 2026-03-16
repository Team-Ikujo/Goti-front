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
  const response = await apiClient.post<ApiEnvelope<AuthTokenResponse>>(
    "/api/v1/auth/signup",
    payload,
  );

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
