import type { AuthUser } from "./types";

const AUTH_STORAGE_KEY = "coffee-pos-auth";

export type StoredAuth = {
  token: string;
  user: AuthUser;
};

export function readStoredAuth(): StoredAuth | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredAuth;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function writeStoredAuth(value: StoredAuth) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(value));
  }
}

export function clearStoredAuth() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}
