import { submitAuthCode } from "@/features/auth/api/submitAuthCode";

export const handleNaverCallback = async (search: string) => {
  const params = new URLSearchParams(search);
  const code = params.get("code");
  const state = params.get("state") ?? undefined;

  if (!code) {
    throw new Error("Missing Naver authorization code.");
  }

  return submitAuthCode({ provider: "naver", code, state });
};
