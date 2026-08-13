export const AUTH_ERROR_CODES = Object.freeze({
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  EMAIL_NOT_VERIFIED: "EMAIL_NOT_VERIFIED",
  EMAIL_ALREADY_EXISTS: "EMAIL_ALREADY_EXISTS",
  INVALID_VERIFICATION_TOKEN: "INVALID_VERIFICATION_TOKEN",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  AUTH_FORBIDDEN: "AUTH_FORBIDDEN",
});

export const AUTH_ERROR_MESSAGES = Object.freeze({
  INVALID_CREDENTIALS: "Invalid email or password.",
  EMAIL_NOT_VERIFIED: "Please verify your email before signing in.",
  EMAIL_ALREADY_EXISTS: "An account with this email already exists.",
  INVALID_VERIFICATION_TOKEN: "This verification link is invalid or has expired.",
  SESSION_EXPIRED: "Your session has expired. Please sign in again.",
  AUTH_FORBIDDEN: "You are not allowed to sign in with this account.",
});
