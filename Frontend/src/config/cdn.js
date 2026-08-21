export const CDN_URL = import.meta.env.VITE_CDN_BASE_URL || "/cdn";
export const CDN_MODE = import.meta.env.VITE_CDN_MODE || "local";
export const USES_GLOBAL_CDN = CDN_MODE === "cloudflare";

export function cdnUrl(path) {
  return `${CDN_URL}${path}`;
}
