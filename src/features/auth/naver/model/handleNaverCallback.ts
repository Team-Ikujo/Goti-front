import { NAVER_REDIRECT_URI } from "@/shared/config/oauth";
import { submitAuthCode } from "@/features/auth/api/oauthApi";

export const handleNaverCallback = async (search: string) => {
  const params = new URLSearchParams(search);
  const code = params.get("code");
  const state = params.get("state") ?? undefined;

  if (!code) {
    throw new Error("Missing Naver authorization code.");
  }

  if (!NAVER_REDIRECT_URI) {
    throw new Error("Naver OAuth redirect URI is not configured.");
  }

  return submitAuthCode({
    provider: "naver",
    code,
    state,
    redirectUri: NAVER_REDIRECT_URI,
  });
};
