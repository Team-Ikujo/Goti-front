import type { SocialProvider } from "@/features/auth/api/oauthApi";

export const OAUTH_SUCCESS_MESSAGE_TYPE = "__OAUTH_SUCCESS__" as const;

export type OAuthSuccessMessage = {
  type: typeof OAUTH_SUCCESS_MESSAGE_TYPE;
  accessToken: string | null;
  socialVerifyToken: string | null;
  provider?: SocialProvider;
  redirectPath?: string;
};

const isNullableString = (value: unknown): value is string | null => {
  return typeof value === "string" || value === null;
};

export const isOAuthSuccessMessage = (
  data: unknown,
): data is OAuthSuccessMessage => {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  const message = data as Record<string, unknown>;
  const provider = message.provider;
  const isValidProvider =
    provider === undefined ||
    provider === "kakao" ||
    provider === "naver" ||
    provider === "google";

  return (
    message.type === OAUTH_SUCCESS_MESSAGE_TYPE &&
    isNullableString(message.accessToken) &&
    isNullableString(message.socialVerifyToken) &&
    isValidProvider &&
    (message.redirectPath === undefined || typeof message.redirectPath === "string")
  );
};
