const isProduction = process.env.NODE_ENV === "production";

function cleanUrl(value) {
  return value?.trim().replace(/\/$/, "");
}

export function getBackendUrl() {
  if (process.env.BACKEND_URL) return cleanUrl(process.env.BACKEND_URL);

  if (process.env.RENDER_EXTERNAL_HOSTNAME) {
    return `https://${process.env.RENDER_EXTERNAL_HOSTNAME}`;
  }

  return "http://localhost:3000";
}

export function getFrontendUrl() {
  return cleanUrl(process.env.FRONTEND_URL) || "http://localhost:5173";
}

export function getAllowedOrigins() {
  const configured = process.env.CORS_ORIGINS
    ?.split(",")
    .map(cleanUrl)
    .filter(Boolean);

  if (configured?.length) return configured;
  if (process.env.FRONTEND_URL) return [getFrontendUrl()];
  return isProduction ? [] : ["http://localhost:5173"];
}

export function isAllowedOrigin(origin, patterns) {
  return patterns.some((pattern) => {
    if (origin === pattern) return true;
    if (!pattern.includes("*")) return false;

    const [prefix, suffix] = pattern.split("*");
    return origin.startsWith(prefix) && origin.endsWith(suffix);
  });
}

export function authCookieOptions() {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

export function clearAuthCookieOptions() {
  const { maxAge, ...options } = authCookieOptions();
  return options;
}
