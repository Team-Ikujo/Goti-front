import axios, { AxiosError, AxiosHeaders, type AxiosRequestConfig, type AxiosResponse } from "axios";
import { useAuthStore } from "@/entities/auth/model/authStore";
import { isMswEnabled } from "@/shared/config/runtime";

export class ApiError extends Error {
  status?: number;
  data?: unknown;

  constructor(message: string, status?: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

const configuredApiBaseUrl = (import.meta.env.PUBLIC_API_BASE_URL ?? "").trim();
const shouldUseRelativeApiBase = isMswEnabled || import.meta.env.DEV;

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

apiClient.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken;

  if (accessToken) {
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
    logResponse(response);
    return response;
  },
  (error: AxiosError) => {
    logError(error);

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
