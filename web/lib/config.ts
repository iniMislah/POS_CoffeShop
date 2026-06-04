const isProduction = process.env.NODE_ENV === "production";

function getPublicEnv(
  name: "NEXT_PUBLIC_API_BASE_URL" | "NEXT_PUBLIC_APP_URL",
  developmentFallback: string
) {
  const value = process.env[name]?.replace(/\/$/, "");

  if (value) {
    return value;
  }

  if (isProduction) {
    throw new Error(`${name} must be configured in production`);
  }

  return developmentFallback;
}

export const API_BASE_URL = getPublicEnv(
  "NEXT_PUBLIC_API_BASE_URL",
  "http://localhost:4000/api"
);

export const API_ORIGIN = API_BASE_URL.replace(/\/api$/, "");

export const APP_BASE_URL = getPublicEnv(
  "NEXT_PUBLIC_APP_URL",
  "http://localhost:3000"
);