import axios, { AxiosError, AxiosHeaders, type AxiosRequestConfig, type AxiosResponse } from "axios";
import { useAuthStore } from "@/entities/auth/model/authStore";
import { redirectToErrorPage } from '@/shared/lib/error-navigation';

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
const shouldKeepSessionAlivePathPrefixes = ["/books", "/tickets"];

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

  if (useAuthStore.getState().isManualLogout) {
    return false;
  }

  return shouldKeepSessionAlivePathPrefixes.some((prefix) =>
    window.location.pathname.startsWith(prefix),
  );
};

const getConsoleTargets = (): Console[] => {
  const targets: Console[] = [console];

  if (typeof window === "undefined" || !window.opener || window.opener.closed) {
    return targets;
  }

  try {
    if (window.opener.location.origin === window.location.origin) {
      targets.push(window.opener.console);
    }
  } catch {
    // Cross-origin opener access is blocked by the browser.
  }

  return targets;
};

const logToConsoles = (method: "log" | "error", ...args: unknown[]) => {
  getConsoleTargets().forEach((target) => {
    target[method](...args);
  });
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

    switch (true) {
      // 일정/팀 메타 조회는 비로그인 접근 가능한 공개 조회 API로 운영 중.
      // 일부 배포 게이트웨이에서 Authorization 헤더가 붙으면 인증 리다이렉트 루프가 발생할 수 있어 제외한다.
      case pathname === "/api/v1/games/schedules":
      case /^\/api\/v1\/baseball-teams\/[^/]+$/.test(pathname):
      // 좌석 등급/구역/좌석 메타 조회도 문서상 공개 조회 API다.
      // dev 게이트웨이에서 일반 사용자 토큰이 붙으면 RBAC 403이 발생할 수 있어 인증 헤더를 제외한다.
      case /^\/api\/v1\/stadium-seats\/stadiums\/[^/]+\/seat-sections$/.test(pathname):
      case /^\/api\/v1\/stadium-seats\/stadiums\/[^/]+\/games\/[^/]+\/seat-grades$/.test(pathname):
      case /^\/api\/v1\/seats\/seat-sections\/[^/]+\/seats$/.test(pathname):
        return true;
      default:
        return false;
    }
  } catch {
    return false;
  }
};

const getSerializableData = (value: unknown) => {
  if (value === undefined) {
    return null;
  }

  if (typeof FormData !== "undefined" && value instanceof FormData) {
    const entries: Array<[string, FormDataEntryValue]> = [];
    value.forEach((entryValue, entryKey) => {
      entries.push([entryKey, entryValue]);
    });
    return Object.fromEntries(entries);
  }

  return value;
};

const logRequest = (config: AxiosRequestConfig) => {
  logToConsoles("log", "[API REQUEST]", {
    method: config.method?.toUpperCase() ?? "GET",
    url: toAbsoluteUrl(config),
    params: config.params ?? null,
    data: getSerializableData(config.data),
    headers: config.headers ?? null,
  });
};

const logResponse = (response: AxiosResponse) => {
  logToConsoles("log", "[API RESPONSE]", {
    method: response.config.method?.toUpperCase() ?? "GET",
    url: toAbsoluteUrl(response.config),
    status: response.status,
    data: response.data,
  });
};

const logError = (error: AxiosError) => {
  logToConsoles("error", "[API ERROR]", {
    method: error.config?.method?.toUpperCase() ?? "UNKNOWN",
    url: toAbsoluteUrl(error.config),
    status: error.response?.status ?? null,
    data: error.response?.data ?? null,
    message: error.message,
  });
};

const apiClient = axios.create({
  // 개발 환경에서는 dev server proxy를 통해 CORS 없이 백엔드에 붙는다.
  // MSW 사용 시에도 상대 경로(/api) 요청을 유지해 worker가 가로챌 수 있게 한다.
  baseURL: shouldUseRelativeApiBase ? "" : configuredApiBaseUrl,
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

  if (accessToken && !shouldSkipAuth) {
    if (config.headers && typeof config.headers.set === "function") {
      config.headers.set("Authorization", `Bearer ${accessToken}`);
    } else {
      const nextHeaders = AxiosHeaders.from(config.headers);
      nextHeaders.set("Authorization", `Bearer ${accessToken}`);
      config.headers = nextHeaders;
    }
  }

  logRequest(config);
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

    logResponse(response);
    return response;
  },
  (error: AxiosError) => {
    logError(error);

    const requestConfig = error.config as RetriableAxiosRequestConfig | undefined;
    const requestUrl = requestConfig?.url ?? "";
    const isReissueRequest = requestUrl.includes(tokenReissuePath);

    if (
      error.response?.status === 401 &&
      requestConfig &&
      !requestConfig._retry &&
      !isReissueRequest &&
      canAttemptTokenReissue()
    ) {
      requestConfig._retry = true;

      return reissueAccessTokenFromCookie().then((accessToken) => {
        const nextHeaders = AxiosHeaders.from(requestConfig.headers);
        nextHeaders.set("Authorization", `Bearer ${accessToken}`);
        requestConfig.headers = nextHeaders;

        return apiClient(requestConfig);
      });
    }

    if (error.response?.status === 302 || error.response?.status === 503) {
      redirectToErrorPage(error.response.status);
    }

    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      const message =
        typeof data === "string"
          ? data
          : (data as { message?: string })?.message ?? "Request failed";

         return Promise.reject(new ApiError(message, status, data));
      }

      return Promise.reject(new ApiError(error.message));
   },
);

export default apiClient;
