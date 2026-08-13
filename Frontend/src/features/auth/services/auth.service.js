import { httpService } from "../../../shared/services/http.service";
import { normalizeServiceError } from "../../../shared/services/error.service";
import { AUTH_ERROR_CODES, AUTH_ERROR_MESSAGES } from "../auth.errors";

export const authService = {
  register: async (payload) => {
    try {
      return (await httpService.post("/auth/register", payload)).data;
    } catch (error) {
      throw normalizeAuthError(error, "register");
    }
  },

  login: async (payload) => {
    try {
      return (await httpService.post("/auth/login", payload)).data;
    } catch (error) {
      throw normalizeAuthError(error, "login");
    }
  },

  getCurrentUser: async () => {
    try {
      return (await httpService.get("/auth/get-me")).data;
    } catch (error) {
      throw normalizeAuthError(error, "session");
    }
  },

  verifyEmail: async (token) => {
    try {
      return (
        await httpService.get(
          `/auth/verify-email?token=${encodeURIComponent(token)}`
        )
      ).data;
    } catch (error) {
      throw normalizeAuthError(error, "verify");
    }
  },
};

/**
 * Auth owns authentication-specific meaning.
 * HTTP status codes alone are not globally meaningful business errors.
 *
 * If the backend sends { code, message }, its code is preserved. When it
 * doesn't, we use endpoint + status as a controlled fallback so the current
 * backend can still provide useful auth UX without changing the backend.
 */
function normalizeAuthError(error, operation) {
  const normalized = normalizeServiceError(error);
  const backendCode = error?.response?.data?.code;
  const backendMessage =
    error?.response?.data?.message || error?.response?.data?.error;

  // A backend application code is authoritative. Do not reinterpret it.
  if (backendCode) {
    return normalized;
  }

  const fallback = getAuthFallback(operation, normalized.status);

  if (!fallback) {
    return normalized;
  }

  return {
    ...normalized,
    code: fallback.code,
    message: backendMessage || fallback.message,
  };
}

function getAuthFallback(operation, status) {
  if (operation === "login") {
    if (status === 401) {
      return {
        code: AUTH_ERROR_CODES.INVALID_CREDENTIALS,
        message: AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS,
      };
    }

    if (status === 403) {
      return {
        code: AUTH_ERROR_CODES.AUTH_FORBIDDEN,
        message: AUTH_ERROR_MESSAGES.AUTH_FORBIDDEN,
      };
    }
  }

  if (operation === "register" && status === 409) {
    return {
      code: AUTH_ERROR_CODES.EMAIL_ALREADY_EXISTS,
      message: AUTH_ERROR_MESSAGES.EMAIL_ALREADY_EXISTS,
    };
  }

  if (
    operation === "verify" &&
    (status === 400 || status === 404)
  ) {
    return {
      code: AUTH_ERROR_CODES.INVALID_VERIFICATION_TOKEN,
      message: AUTH_ERROR_MESSAGES.INVALID_VERIFICATION_TOKEN,
    };
  }

  if (operation === "session" && status === 401) {
    return {
      code: AUTH_ERROR_CODES.SESSION_EXPIRED,
      message: AUTH_ERROR_MESSAGES.SESSION_EXPIRED,
    };
  }

  return null;
}
