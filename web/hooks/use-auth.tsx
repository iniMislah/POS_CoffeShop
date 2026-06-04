"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { apiClient } from "@/lib/api-client";
import { clearStoredAuth, readStoredAuth, writeStoredAuth } from "@/lib/auth-storage";
import type { AuthUser, LoginResponse } from "@/lib/types";

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  isLoggingIn: boolean;
  authError: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setAuthUser: (user: AuthUser) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      try {
        const stored = readStoredAuth();
        if (!stored) {
          return;
        }

        const profile = await apiClient.get<AuthUser>("/users/me", stored.token);
        if (!active) {
          return;
        }

        setUser(profile);
        setToken(stored.token);
        writeStoredAuth({
          token: stored.token,
          user: profile,
        });
      } catch {
        clearStoredAuth();
        if (!active) {
          return;
        }
        setUser(null);
        setToken(null);
      } finally {
        if (active) {
          setIsInitializing(false);
        }
      }
    };

    void bootstrap();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      clearStoredAuth();
      setUser(null);
      setToken(null);
      setAuthError("Session expired. Please login again.");
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoggingIn(true);
    setAuthError(null);

    try {
      const result = await apiClient.post<LoginResponse>("/auth/login", { email, password });
      setUser(result.user);
      setToken(result.accessToken);
      writeStoredAuth({
        token: result.accessToken,
        user: result.user,
      });
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Login failed");
      throw error;
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = () => {
    clearStoredAuth();
    setUser(null);
    setToken(null);
    setAuthError(null);
  };

  const setAuthUser = (nextUser: AuthUser) => {
    setUser(nextUser);

    if (token) {
      writeStoredAuth({
        token,
        user: nextUser,
      });
    }
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      isInitializing,
      isLoggingIn,
      authError,
      login,
      logout,
      setAuthUser,
    }),
    [user, token, isInitializing, isLoggingIn, authError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
