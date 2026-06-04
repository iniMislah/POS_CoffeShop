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
    if (response.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    }
    throw new ApiError(json?.message ?? "Request failed", response.status);
  }

  if (!json) {
    throw new ApiError("Invalid server response", 500);
  }

  return json.data;
}

async function download(path: string, token?: string | null) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const json = (await response.json().catch(() => null)) as ApiResponse<unknown> | null;
    throw new ApiError(json?.message ?? "Download failed", response.status);
  }

  const blob = await response.blob();
  const disposition = response.headers.get("content-disposition") ?? "";
  const contentType = response.headers.get("content-type") ?? "";
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  const basicMatch = disposition.match(/filename="?([^"]+)"?/i);
  const resolvedFileName = utf8Match?.[1]
    ? decodeURIComponent(utf8Match[1])
    : basicMatch?.[1];

  return {
    blob,
    fileName: resolvedFileName ?? (contentType.includes("spreadsheetml") ? "download.xlsx" : "download.bin"),
  };
}

export const apiClient = {
  get: <T>(path: string, token?: string | null) => request<T>(path, { token }),
  post: <T>(path: string, body?: unknown, token?: string | null) => request<T>(path, { method: "POST", body, token }),
  put: <T>(path: string, body?: unknown, token?: string | null) => request<T>(path, { method: "PUT", body, token }),
  patch: <T>(path: string, body?: unknown, token?: string | null) => request<T>(path, { method: "PATCH", body, token }),
  delete: <T>(path: string, token?: string | null) => request<T>(path, { method: "DELETE", token }),
  download,
};
