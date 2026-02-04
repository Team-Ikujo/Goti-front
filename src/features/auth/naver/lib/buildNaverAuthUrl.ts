import { NAVER_CLIENT_ID, NAVER_REDIRECT_URI } from "@/shared/config/oauth";

export const buildNaverAuthUrl = (state: string): string => {
  if (!NAVER_CLIENT_ID || !NAVER_REDIRECT_URI) {
    throw new Error("Naver OAuth env is not configured.");
  }

  const params = new URLSearchParams({
    response_type: "code",
    client_id: NAVER_CLIENT_ID,
    redirect_uri: NAVER_REDIRECT_URI,
    state,
  });

  return `https://nid.naver.com/oauth2.0/authorize?${params.toString()}`;
};
