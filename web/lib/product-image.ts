import { API_ORIGIN } from "@/lib/config";

export function resolveProductImageUrl(imageUrl?: string | null) {
  const value = imageUrl?.trim();

  if (!value) {
    return null;
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  if (value.startsWith("/uploads")) {
    return `${API_ORIGIN}${value}`;
  }

  return value;
}
