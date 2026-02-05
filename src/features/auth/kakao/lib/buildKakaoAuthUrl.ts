import { KAKAO_CLIENT_ID, KAKAO_REDIRECT_URI } from "@/shared/config/oauth";

export const buildKakaoAuthUrl = (state: string) => {
  if (!KAKAO_CLIENT_ID || !KAKAO_REDIRECT_URI) {
    throw new Error("Kakao OAuth env is not configured.");
  }

  const params = new URLSearchParams({
    client_id: KAKAO_CLIENT_ID,
    redirect_uri: KAKAO_REDIRECT_URI,
    response_type: "code",
    state
  });

  return `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
};
