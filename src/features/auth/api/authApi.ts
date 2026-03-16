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
