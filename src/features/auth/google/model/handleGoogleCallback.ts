import { submitAuthCode } from "@/features/auth/api/submitAuthCode";

export const handleGoogleCallback = async (search: string) => {
  const params = new URLSearchParams(search);
  const code = params.get("code");
  const state = params.get("state") ?? undefined;

  if (!code) {
    throw new Error("Missing Google authorization code.");
  }

  return submitAuthCode({ provider: "google", code, state });
};
