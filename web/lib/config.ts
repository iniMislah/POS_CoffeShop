const PRODUCTION_API_BASE_URL =
  "https://poscoffeshop-production.up.railway.app/api";

const DEVELOPMENT_API_BASE_URL =
  "http://localhost:4000/api";

const PRODUCTION_APP_BASE_URL =
  "https://pos-coffe-shop-nine.vercel.app";

const DEVELOPMENT_APP_BASE_URL =
  "http://localhost:3000";

function cleanUrl(value: string) {
  return value.trim().replace(/\/$/, "");
}

const isProduction = process.env.NODE_ENV === "production";

export const API_BASE_URL = cleanUrl(
  process.env.NEXT_PUBLIC_API_BASE_URL ||
    (isProduction ? PRODUCTION_API_BASE_URL : DEVELOPMENT_API_BASE_URL)
);

export const API_ORIGIN = API_BASE_URL.replace(/\/api$/, "");

export const APP_BASE_URL = cleanUrl(
  process.env.NEXT_PUBLIC_APP_URL ||
    (isProduction ? PRODUCTION_APP_BASE_URL : DEVELOPMENT_APP_BASE_URL)
);