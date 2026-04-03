import axios, { AxiosError, AxiosHeaders, type AxiosRequestConfig } from "axios";
import { useAuthStore } from "@/entities/auth/model/authStore";
import { redirectToErrorPage } from '@/shared/lib/error-navigation';
import { applyGuardrailHeadersToAxiosConfig } from '@/shared/lib/guardrailHeaders';

export class ApiError extends Error {
   status?: number;
   data?: unknown;

   constructor(message: string, status?: number, data?: unknown) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
      this.data = data;
   }
}

const configuredApiBaseUrl = (import.meta.env.PUBLIC_API_BASE_URL ?? "").trim();
// dev 환경에서는 Rsbuild proxy가 /api 요청을 백엔드로 전달한다.
// preview/build 환경에서는 정적 서버가 /api를 처리하지 않으므로 절대 base URL을 사용한다.
const shouldUseRelativeApiBase = import.meta.env.DEV;
const tokenReissuePath = "/api/v1/auth/reissue";
const authorizationOptionalApiPaths = new Set([
  "/api/v1/auth/login",
  "/api/v1/auth/signup",
  "/api/v1/auth/signup/sms/send",
  tokenReissuePath,
]);
const shouldKeepSessionAlivePathPrefixes = ["/books", "/tickets"];
const PUBLIC_API_PATH_PATTERNS = [
  /^\/api\/v1\/seat-reservations(?:\/|$)/,
  // 예매/리셀 플로우 API는 queue token / hold 기반으로 동작하므로
  // 로그인 쿠키 세션을 같이 보내면 RBAC 게이트웨이에 막힐 수 있다.
  /^\/api\/v1\/orders(?:\/|$)/,
  /^\/api\/v1\/payments\/orders(?:\/|$)/,
  /^\/api\/v1\/resales\/holds(?:\/|$)/,
  /^\/api\/v1\/resales\/orders(?:\/|$)/,
  /^\/api\/v1\/payments\/resales(?:\/|$)/,
  /^\/api\/v1\/resales\/listings\/games(?:\/|$)/,
  /^\/api\/v1\/game-seats(?:\/|$)/,
  /^\/api\/v1\/stadium-seats(?:\/|$)/,
  /^\/api\/v1\/seats(?:\/|$)/,
  /^\/api\/v1\/teams\/[^/]+\/ticket-pricing-policies(?:\/|$)/,
];

const GUARDRAIL_HEADER_API_PATH_PATTERNS = [
  /^\/api\/v1\/seat-reservations(?:\/|$)/,
  /^\/api\/v1\/orders(?:\/|$)/,
  /^\/api\/v1\/payments\/orders(?:\/|$)/,
  /^\/api\/v1\/resales\/holds(?:\/|$)/,
  /^\/api\/v1\/resales\/orders(?:\/|$)/,
  /^\/api\/v1\/payments\/resales(?:\/|$)/,
  /^\/api\/v1\/resales\/listings(?:\/|$)/,
  /^\/api\/v1\/resales\/histories(?:\/|$)/,
  /^\/api\/v1\/game-seats(?:\/|$)/,
  /^\/api\/v1\/stadium-seats(?:\/|$)/,
  /^\/api\/v1\/seats(?:\/|$)/,
  /^\/api\/v1\/teams\/[^/]+\/ticket-pricing-policies(?:\/|$)/,
];

type RetriableAxiosRequestConfig = AxiosRequestConfig & {
  _retry?: boolean;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isHtmlDocument = (value: unknown): value is string =>
  typeof value === "string" && /^\s*(<!DOCTYPE html>|<html[\s>])/i.test(value);

export const unwrapApiData = <T>(payload: { data: T } | T): T => {
  if (isHtmlDocument(payload)) {
    throw new ApiError(
      "API expected JSON but received HTML. Check PUBLIC_API_BASE_URL, dev proxy, or MSW configuration.",
      502,
      payload,
    );
  }

  if (isRecord(payload) && "data" in payload) {
    return payload.data as T;
  }

  return payload as T;
};

const canAttemptTokenReissue = () => {
  if (typeof window === "undefined") {
    return false;
  }

  const authState = useAuthStore.getState();

  if (authState.isManualLogout) {
    return false;
  }

  if (!authState.accessToken || !authState.authExpiresAt) {
    return false;
  }

  // 좌석 선택/결제 화면에서 발생하는 모든 401을 자동 로그아웃으로 해석하면 안 된다.
  // 실제 세션 만료 임박 구간에서만 재발급을 시도해야 "로그인 1시간 후" 규칙과 일치한다.
  if (authState.sessionRemainingSeconds > 60) {
    return false;
  }

  return shouldKeepSessionAlivePathPrefixes.some((prefix) =>
    window.location.pathname.startsWith(prefix),
  );
};

const toAbsoluteUrl = (config?: AxiosRequestConfig) => {
  const baseURL = config?.baseURL ?? "";
  const url = config?.url ?? "";

  try {
    return new URL(url, baseURL || window.location.origin).toString();
  } catch {
    return `${baseURL}${url}`;
  }
};

const shouldSkipAuthorizationHeader = (config: AxiosRequestConfig) => {
  const requestUrl = toAbsoluteUrl(config);

  try {
    const { pathname } = new URL(requestUrl, window.location.origin);
    if (authorizationOptionalApiPaths.has(pathname)) {
      return true;
    }

    if (/^\/api\/v1\/auth\/[^/]+\/state$/.test(pathname)) {
      return true;
    }

    if (/^\/api\/v1\/auth\/[^/]+\/social\/verify$/.test(pathname)) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
};

const shouldSkipCredentials = (config: AxiosRequestConfig) => {
  const requestUrl = toAbsoluteUrl(config);

  try {
    const { pathname } = new URL(requestUrl, window.location.origin);
    return PUBLIC_API_PATH_PATTERNS.some((pattern) => pattern.test(pathname));
  } catch {
    return false;
  }
};

const shouldAttachGuardrailHeaders = (config: AxiosRequestConfig) => {
  const requestUrl = toAbsoluteUrl(config);

  try {
    const { pathname } = new URL(requestUrl, window.location.origin);
    return GUARDRAIL_HEADER_API_PATH_PATTERNS.some((pattern) => pattern.test(pathname));
  } catch {
    return false;
  }
};

const isAuthorizationConflictMessage = (message: string) => {
  const normalizedMessage = message.trim().toLowerCase();

  return (
    normalizedMessage.includes("rbac") ||
    normalizedMessage.includes("access denied") ||
    normalizedMessage.includes("jwt issuer") ||
    normalizedMessage.includes("issuer is not configured") ||
    normalizedMessage.includes("unauthorized") ||
    normalizedMessage.includes("forbidden")
  );
};

const normalizeApiErrorMessage = (message: string, status?: number) => {
  if (status === 401 || status === 403 || isAuthorizationConflictMessage(message)) {
    return "로그인 또는 권한 정보를 확인할 수 없습니다. 다시 시도해 주세요.";
  }

  return message;
};

const apiClient = axios.create({
  // 개발 환경에서는 dev server proxy를 통해 CORS 없이 백엔드에 붙는다.
  // MSW 사용 시에도 상대 경로(/api) 요청을 유지해 worker가 가로챌 수 있게 한다.
  baseURL: shouldUseRelativeApiBase ? "" : configuredApiBaseUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshAccessTokenPromise: Promise<string> | null = null;

const reissueAccessTokenFromCookie = async () => {
  if (useAuthStore.getState().isManualLogout) {
    throw new ApiError("수동 로그아웃 상태에서는 토큰을 재발급하지 않습니다.", 401);
  }

  if (!refreshAccessTokenPromise) {
    refreshAccessTokenPromise = axios
      .post(
        tokenReissuePath,
        undefined,
        {
          baseURL: shouldUseRelativeApiBase ? "" : configuredApiBaseUrl,
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        },
      )
      .then((response) => {
        const data = unwrapApiData<{ accessToken: string }>(response.data);

        if (!data.accessToken) {
          throw new ApiError("토큰 재발급 응답에 accessToken이 없습니다.", response.status, response.data);
        }

        if (useAuthStore.getState().isManualLogout) {
          throw new ApiError("로그아웃 이후 도착한 토큰 재발급 응답은 무시합니다.", 401, response.data);
        }

        useAuthStore.getState().setAccessToken(data.accessToken);
        return data.accessToken;
      })
      .catch((error: unknown) => {
        if (!useAuthStore.getState().isManualLogout) {
          useAuthStore.getState().clearAuth("expired");
        }
        throw error;
      })
      .finally(() => {
        refreshAccessTokenPromise = null;
      });
  }

  return refreshAccessTokenPromise;
};

apiClient.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken;
  const shouldSkipAuth = shouldSkipAuthorizationHeader(config);
  const shouldOmitCredentials = shouldSkipCredentials(config);
  const shouldIncludeGuardrailHeaders = shouldAttachGuardrailHeaders(config);

  if (shouldOmitCredentials) {
    config.withCredentials = false;
  }

  if (shouldIncludeGuardrailHeaders) {
    applyGuardrailHeadersToAxiosConfig(config);
  }

  if (accessToken && !shouldSkipAuth) {
    if (config.headers && typeof config.headers.set === "function") {
      config.headers.set("Authorization", `Bearer ${accessToken}`);
    } else {
      const nextHeaders = AxiosHeaders.from(config.headers);
      nextHeaders.set("Authorization", `Bearer ${accessToken}`);
      config.headers = nextHeaders;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    if (isHtmlDocument(response.data)) {
      return Promise.reject(
        new ApiError(
          "API expected JSON but received HTML. Check PUBLIC_API_BASE_URL, dev proxy, or MSW configuration.",
          response.status,
          response.data,
        ),
      );
    }
    return response;
  },
  (error: AxiosError) => {
    const requestConfig = error.config as RetriableAxiosRequestConfig | undefined;
    const requestUrl = requestConfig?.url ?? "";
    const isReissueRequest = requestUrl.includes(tokenReissuePath);

    if (
      error.response?.status === 401 &&
      requestConfig &&
      requestConfig.withCredentials !== false &&
      !requestConfig._retry &&
      !isReissueRequest &&
      canAttemptTokenReissue()
    ) {
      requestConfig._retry = true;

      return reissueAccessTokenFromCookie().then((accessToken) => {
        if (shouldAttachGuardrailHeaders(requestConfig)) {
          applyGuardrailHeadersToAxiosConfig(requestConfig);
        }

        if (!shouldSkipAuthorizationHeader(requestConfig)) {
          const nextHeaders = AxiosHeaders.from(requestConfig.headers);
          nextHeaders.set("Authorization", `Bearer ${accessToken}`);
          requestConfig.headers = nextHeaders;
        }

        return apiClient(requestConfig);
      });
    }

    if (error.response?.status === 302 || error.response?.status === 503) {
      redirectToErrorPage(error.response.status);
    }

    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      const message = normalizeApiErrorMessage(
        typeof data === "string"
          ? data
          : (data as { message?: string })?.message ?? "Request failed",
        status,
      );

         return Promise.reject(new ApiError(message, status, data));
      }

      return Promise.reject(new ApiError(normalizeApiErrorMessage(error.message)));
   },
);

export default apiClient;
