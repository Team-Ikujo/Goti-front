import { submitAuthCode } from "../api/submitAuthCode";

export const handleKakaoCallback = async (search: string) => {
  const params = new URLSearchParams(search);
  const code = params.get("code");
  const state = params.get("state") ?? undefined;

  if (!code) {
    throw new Error("Missing Kakao authorization code.");
  }

  return submitAuthCode({ code, state });
};
