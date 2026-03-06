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

const apiClient = axios.create({
  // MSW가 켜진 환경에서는 상대 경로(/api) 요청을 사용해 worker가 가로채도록 한다.
  baseURL: isMswEnabled ? "" : configuredApiBaseUrl,
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
