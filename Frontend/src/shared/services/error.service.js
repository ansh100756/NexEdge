/**
 * Converts Axios/network errors into one predictable shape for the UI layer.
 * This service is intentionally feature-agnostic. It does not know what a
 * 401/409 means for authentication, projects, teams, etc.
 */
export function normalizeServiceError(error) {
  const status = error?.response?.status ?? null;
  const data = error?.response?.data;
  const backendMessage = data?.message || data?.error || null;
  const backendCode = data?.code || null;

  if (error?.code === "ECONNABORTED") {
    return {
      status: null,
      code: "REQUEST_TIMEOUT",
      message: "The request timed out. Please try again.",
    };
  }

  if (!error?.response) {
    return {
      status: null,
      code: "NETWORK_ERROR",
      message: "Unable to connect to the server. Please check your connection.",
    };
  }

  return {
    status,
    // Preserve an application/domain error code when the backend provides one.
    // Otherwise use a generic HTTP-level code as a safe fallback.
    code: backendCode || getDefaultErrorCode(status),
    message: backendMessage || getDefaultStatusMessage(status),
  };
}

function getDefaultStatusMessage(status) {
  switch (status) {
    case 400:
      return "The request could not be processed.";
    case 401:
      return "Authentication is required.";
    case 403:
      return "You do not have permission to perform this action.";
    case 404:
      return "The requested resource was not found.";
    case 409:
      return "The request conflicts with the current state.";
    case 422:
      return "Some of the provided information is invalid.";
    case 429:
      return "Too many requests. Please try again later.";
    default:
      if (status >= 500) {
        return "Something went wrong on the server. Please try again.";
      }
      return "Something went wrong. Please try again.";
  }
}

function getDefaultErrorCode(status) {
  switch (status) {
    case 400:
      return "BAD_REQUEST";
    case 401:
      return "UNAUTHORIZED";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 409:
      return "CONFLICT";
    case 422:
      return "VALIDATION_ERROR";
    case 429:
      return "RATE_LIMITED";
    default:
      return status >= 500 ? "SERVER_ERROR" : "UNKNOWN_ERROR";
  }
}
