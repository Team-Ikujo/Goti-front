const resolveRedirectUri = (envValue: string | undefined, providerPath: string) => {
  if (typeof window !== 'undefined' && window.location.origin) {
    return `${window.location.origin}${providerPath}`;
  }

  return envValue;
};

export const KAKAO_CLIENT_ID = import.meta.env.PUBLIC_KAKAO_CLIENT_ID as
  | string
  | undefined;
export const KAKAO_REDIRECT_URI = resolveRedirectUri(
  import.meta.env.PUBLIC_KAKAO_REDIRECT_URI as string | undefined,
  '/auth/kakao/callback',
);

export const NAVER_CLIENT_ID = import.meta.env.PUBLIC_NAVER_CLIENT_ID as
  | string
  | undefined;
export const NAVER_REDIRECT_URI = resolveRedirectUri(
  import.meta.env.PUBLIC_NAVER_REDIRECT_URI as string | undefined,
  '/auth/naver/callback',
);

export const GOOGLE_CLIENT_ID = import.meta.env.PUBLIC_GOOGLE_CLIENT_ID as
  | string
  | undefined;
export const GOOGLE_REDIRECT_URI = resolveRedirectUri(
  import.meta.env.PUBLIC_GOOGLE_REDIRECT_URI as string | undefined,
  '/auth/google/callback',
);
export const GOOGLE_SCOPES = ["openid"];
