export type SubmitAuthCodeParams = {
  provider: "kakao" | "naver" | "google";
  code: string;
  state?: string;
};

export const submitAuthCode = async ({ provider, code, state }: SubmitAuthCodeParams) => {
  return { provider, code, state };
};
