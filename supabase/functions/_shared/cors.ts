const defaultAllowedOrigins = [
  "https://escalamargen.com",
  "https://www.escalamargen.com",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
];

const rawAllowedOrigins = Deno.env.get("ALLOWED_ORIGINS") || "";

export const allowedOrigins = new Set(
  rawAllowedOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
    .concat(defaultAllowedOrigins)
);

export const getCorsHeaders = (origin: string | null) => {
  const normalizedOrigin = origin?.trim() || "";
  const accessControlOrigin = allowedOrigins.has(normalizedOrigin)
    ? normalizedOrigin
    : "https://escalamargen.com";

  return {
    "Access-Control-Allow-Origin": accessControlOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
};

