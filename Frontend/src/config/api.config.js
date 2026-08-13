export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api",
  withCredentials: import.meta.env.VITE_WITH_CREDENTIALS !== "false",
  timeout: 15000,
};
