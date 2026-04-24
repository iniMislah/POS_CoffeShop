import { API_BASE_URL } from "./config";
import type { ApiResponse } from "./types";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
  headers?: HeadersInit;
  cache?: RequestCache;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, token, headers, cache = "no-store" } = options;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    cache,
  });

  const json = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!response.ok) {
    throw new ApiError(json?.message ?? "Request failed", response.status);
  }

  if (!json) {
    throw new ApiError("Invalid server response", 500);
  }

  return json.data;
}

export const apiClient = {
  get: <T>(path: string, token?: string | null) => request<T>(path, { token }),
  post: <T>(path: string, body?: unknown, token?: string | null) => request<T>(path, { method: "POST", body, token }),
  put: <T>(path: string, body?: unknown, token?: string | null) => request<T>(path, { method: "PUT", body, token }),
  patch: <T>(path: string, body?: unknown, token?: string | null) => request<T>(path, { method: "PATCH", body, token }),
  delete: <T>(path: string, token?: string | null) => request<T>(path, { method: "DELETE", token }),
};
