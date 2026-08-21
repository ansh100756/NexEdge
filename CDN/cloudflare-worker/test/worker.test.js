import assert from "node:assert/strict";
import test from "node:test";
import worker from "../src/index.js";

const env = {
  ORIGIN_URL: "https://api.example.com",
  FRONTEND_ORIGIN: "https://app.example.com",
  CDN_SHARED_SECRET: "test-secret",
  CACHE_TTL_SECONDS: "300",
};

test("health endpoint responds and allows the configured origin", async () => {
  const request = new Request("https://cdn.example.com/health", {
    headers: { Origin: env.FRONTEND_ORIGIN },
  });
  const response = await worker.fetch(request, env, { waitUntil() {} });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), env.FRONTEND_ORIGIN);
  assert.equal((await response.json()).status, "healthy");
});

test("authorized files move from cache MISS to HIT", async () => {
  const originalFetch = globalThis.fetch;
  const originalCaches = globalThis.caches;
  const pending = [];
  let storedResponse;

  globalThis.caches = {
    default: {
      async match() {
        return storedResponse?.clone();
      },
      async put(key, response) {
        storedResponse = response.clone();
      },
    },
  };

  globalThis.fetch = async (input) => {
    const url = typeof input === "string" ? input : input.url;

    if (url.includes("/api/cdn/authorize/")) {
      return Response.json({
        allowed: true,
        originUrl: "https://ik.imagekit.io/example/file.txt",
        version: 1,
        mimeType: "text/plain",
      });
    }

    if (url === "https://ik.imagekit.io/example/file.txt") {
      return new Response("NexEdge file", {
        headers: { "Content-Type": "text/plain" },
      });
    }

    throw new Error(`Unexpected request: ${url}`);
  };

  const context = {
    waitUntil(promise) {
      pending.push(promise);
    },
  };
  const makeRequest = () => new Request("https://cdn.example.com/files/file-id", {
    headers: {
      Cookie: "token=valid-token",
      Origin: env.FRONTEND_ORIGIN,
    },
  });

  try {
    const miss = await worker.fetch(makeRequest(), env, context);
    assert.equal(miss.status, 200);
    assert.equal(miss.headers.get("X-Cache-Status"), "MISS");
    assert.equal(await miss.text(), "NexEdge file");
    await Promise.all(pending);

    const hit = await worker.fetch(makeRequest(), env, context);
    assert.equal(hit.status, 200);
    assert.equal(hit.headers.get("X-Cache-Status"), "HIT");
    assert.equal(hit.headers.get("Cache-Control"), "private, no-store");
    assert.equal(await hit.text(), "NexEdge file");
  } finally {
    globalThis.fetch = originalFetch;

    if (originalCaches === undefined) {
      delete globalThis.caches;
    } else {
      globalThis.caches = originalCaches;
    }
  }
});
