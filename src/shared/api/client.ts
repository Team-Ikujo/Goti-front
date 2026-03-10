import axios, { AxiosError } from "axios";
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

const apiClient = axios.create({
  // 개발 환경에서는 dev server proxy를 통해 CORS 없이 백엔드에 붙는다.
  // MSW 사용 시에도 상대 경로(/api) 요청을 유지해 worker가 가로챌 수 있게 한다.
  baseURL: shouldUseRelativeApiBase ? "" : configuredApiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
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
