export const API_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export async function request(path, options = {}) {
  const isFormData = options.body instanceof FormData;

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      credentials: "include",
      ...options,
      headers: {
        ...(!isFormData && options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error("Cannot connect to the backend. Make sure it is running on port 3000.");
  }

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    throw new Error(data?.message || data?.errors?.[0]?.msg || "The request could not be completed.");
  }

  return data;
}

export function apiUrl(path) {
  return `${API_URL}${path}`;
}
