import apiClient from "@/shared/api/client";
import {
  GOOGLE_REDIRECT_URI,
  KAKAO_REDIRECT_URI,
  NAVER_REDIRECT_URI,
} from "@/shared/config/oauth";
import type { ApiEnvelope } from "./types";

export type SocialProvider = "kakao" | "naver" | "google";

export type SocialStateResponse = {
  state: string;
};

export type SubmitAuthCodeParams = {
  provider: SocialProvider;
  authCode: string;
  state?: string | null;
};

export type SubmitAuthCodeResponse = {
  isRegistered: boolean;
  socialVerifyToken: string;
};

const providerToPath = (provider: SocialProvider) => provider.toUpperCase();

export const getOAuthRedirectUri = (provider: SocialProvider): string => {
  switch (provider) {
    case "google":
      if (!GOOGLE_REDIRECT_URI) {
        throw new Error("Google OAuth redirect URI is not configured.");
      }
      return GOOGLE_REDIRECT_URI;
    case "naver":
      if (!NAVER_REDIRECT_URI) {
        throw new Error("Naver OAuth redirect URI is not configured.");
      }
      return NAVER_REDIRECT_URI;
    case "kakao":
      if (!KAKAO_REDIRECT_URI) {
        throw new Error("Kakao OAuth redirect URI is not configured.");
      }
      return KAKAO_REDIRECT_URI;
    default:
      throw new Error("Unsupported social provider.");
  }
};

export const issueSocialState = async (
  provider: SocialProvider,
): Promise<SocialStateResponse> => {
  const response = await apiClient.get<
    ApiEnvelope<SocialStateResponse> | SocialStateResponse
  >(
    `/api/v1/auth/${providerToPath(provider)}/state`,
  );

  const payload =
    "data" in response.data ? response.data.data : response.data;

  if (!payload?.state) {
    throw new Error("Invalid social state response.");
  }

  return payload;
};

export const submitAuthCode = async ({
  provider,
  authCode,
  state,
}: SubmitAuthCodeParams): Promise<SubmitAuthCodeResponse> => {
  const response = await apiClient.post<
    ApiEnvelope<SubmitAuthCodeResponse> | SubmitAuthCodeResponse
  >(
    `/api/v1/auth/${providerToPath(provider)}/social/verify`,
    { authCode, state: state ?? null },
  );

  const payload =
    "data" in response.data ? response.data.data : response.data;

  if (!payload?.socialVerifyToken) {
    throw new Error("Invalid social verify response.");
  }

  return payload;
};
