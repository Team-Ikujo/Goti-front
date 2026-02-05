import axios, { AxiosError } from "axios";

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

const apiClient = axios.create({
  baseURL: import.meta.env.PUBLIC_API_BASE_URL ?? "",
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
