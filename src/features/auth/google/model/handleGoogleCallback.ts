import { GOOGLE_REDIRECT_URI } from "@/shared/config/oauth";
import { submitAuthCode } from "@/features/auth/api/oauthApi";

export const handleGoogleCallback = async (search: string) => {
  const params = new URLSearchParams(search);
  const code = params.get("code");
  const state = params.get("state") ?? undefined;

  if (!code) {
    throw new Error("Missing Google authorization code.");
  }

  if (!GOOGLE_REDIRECT_URI) {
    throw new Error("Google OAuth redirect URI is not configured.");
  }

  return submitAuthCode({
    provider: "google",
    code,
    state,
    redirectUri: GOOGLE_REDIRECT_URI,
  });
};
