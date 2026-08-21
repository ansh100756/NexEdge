import assert from "node:assert/strict";
import test from "node:test";
import {
  authCookieOptions,
  isAllowedOrigin,
} from "../src/config/app.js";

test("configured Vercel preview origins are matched safely", () => {
  const patterns = [
    "https://nexedge.vercel.app",
    "https://*.vercel.app",
  ];

  assert.equal(
    isAllowedOrigin("https://nexedge-preview.vercel.app", patterns),
    true,
  );
  assert.equal(isAllowedOrigin("https://example.com", patterns), false);
});

test("authentication cookie is HTTP-only", () => {
  assert.equal(authCookieOptions().httpOnly, true);
});
