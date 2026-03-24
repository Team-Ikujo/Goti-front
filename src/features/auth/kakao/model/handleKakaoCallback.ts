import { KAKAO_REDIRECT_URI } from "@/shared/config/oauth";
import { submitAuthCode } from "@/features/auth/api/oauthApi";

export const handleKakaoCallback = async (search: string) => {
  const params = new URLSearchParams(search);
  const code = params.get("code");
  const state = params.get("state") ?? undefined;

  if (!code) {
    throw new Error("Missing Kakao authorization code.");
  }

  if (!KAKAO_REDIRECT_URI) {
    throw new Error("Kakao OAuth redirect URI is not configured.");
  }

  return submitAuthCode({
    provider: "kakao",
    authCode: code,
    state,
  });
};
