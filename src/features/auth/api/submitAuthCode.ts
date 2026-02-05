import apiClient from "@/shared/api/client";

export type SocialProvider = "kakao" | "naver" | "google";

export type SubmitAuthCodeParams = {
  provider: SocialProvider;
  code: string;
  state?: string;
};

export type SubmitAuthCodeResponse = {
  isLinked: boolean;
  tempToken: string;
  accessToken: string;
};

const providerToPath = (provider: SocialProvider) => provider.toUpperCase();

export const submitAuthCode = async ({
  provider,
  code,
}: SubmitAuthCodeParams): Promise<SubmitAuthCodeResponse> => {
  const response = await apiClient.post<SubmitAuthCodeResponse>(
    `/api/v1/auth/${providerToPath(provider)}/login`,
    { code },
  );

  return response.data;
};
