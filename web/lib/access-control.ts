import type { AuthUser } from "@/lib/types";

export const APP_ROLES = {
  OWNER: "ADMIN",
  CASHIER: "CASHIER",
} as const;

export type AppRole = AuthUser["role"];

export const CASHIER_ALLOWED_PATHS = ["/pos", "/transactions"] as const;

export function getDefaultRouteForRole(role?: AppRole | null) {
  if (role === APP_ROLES.CASHIER) {
    return "/pos";
  }

  return "/";
}

export function canAccessPath(role: AppRole, pathname: string) {
  if (pathname === "/unauthorized") {
    return true;
  }

  if (role === APP_ROLES.OWNER) {
    return true;
  }

  return CASHIER_ALLOWED_PATHS.some(
    (allowedPath) =>
      pathname === allowedPath || pathname.startsWith(`${allowedPath}/`)
  );
}

export function getRoleLabel(role?: AppRole | null) {
  if (role === APP_ROLES.OWNER) {
    return "Admin";
  }

  if (role === APP_ROLES.CASHIER) {
    return "Cashier";
  }

  return "Guest";
}
