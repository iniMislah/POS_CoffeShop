import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export { formatCurrency, formatDate, formatDateTime, formatOrderStatus, formatPaymentMethod, formatPaymentStatus } from "./formatters";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function extractReceiptToken(url?: string | null) {
  if (!url) {
    return null;
  }

  const segments = url.split("/");
  return segments[segments.length - 1] || null;
}
