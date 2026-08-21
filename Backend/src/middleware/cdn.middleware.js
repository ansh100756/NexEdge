import crypto from "node:crypto";

function secretsMatch(provided, expected) {
  if (!provided || provided.length !== expected.length) return false;

  return crypto.timingSafeEqual(
    Buffer.from(provided),
    Buffer.from(expected),
  );
}

export function requireTrustedCdn(req, res, next) {
  const expected = process.env.CDN_SHARED_SECRET;

  if (!expected && process.env.NODE_ENV !== "production") {
    return next();
  }

  if (!expected) {
    return res.status(503).json({
      message: "CDN authorization is not configured",
      success: false,
    });
  }

  const provided = req.get("x-nexedge-cdn-secret");

  if (!secretsMatch(provided, expected)) {
    return res.status(403).json({
      message: "Untrusted CDN request",
      success: false,
    });
  }

  return next();
}
