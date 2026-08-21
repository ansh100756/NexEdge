function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function cleanUrl(value) {
  return value?.trim().replace(/\/$/, "");
}

function allowedOrigins(env) {
  return (env.FRONTEND_ORIGIN || "")
    .split(",")
    .map(cleanUrl)
    .filter(Boolean);
}

function withCors(response, request, env) {
  const origin = request.headers.get("Origin");
  const headers = new Headers(response.headers);

  if (origin && allowedOrigins(env).includes(cleanUrl(origin))) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Credentials", "true");
    headers.set("Vary", "Origin");
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function edgeName(request) {
  const colo = request.cf?.colo;
  return colo ? `Cloudflare ${colo}` : "Cloudflare edge";
}

function deliveryResponse(response, request, cacheStatus) {
  const headers = new Headers(response.headers);

  headers.set("Cache-Control", "private, no-store");
  headers.set("Content-Disposition", "inline");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Cache-Status", cacheStatus);
  headers.set("X-Served-By-Edge", edgeName(request));
  headers.delete("Set-Cookie");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function authorize(request, env, fileId) {
  const cookie = request.headers.get("Cookie");

  if (!cookie) {
    return { error: json({ error: "Unauthorized", detail: "No token provided" }, 401) };
  }

  const originUrl = cleanUrl(env.ORIGIN_URL);
  if (!originUrl) {
    return { error: json({ error: "CDN origin is not configured" }, 503) };
  }

  const response = await fetch(
    `${originUrl}/api/cdn/authorize/${encodeURIComponent(fileId)}`,
    {
      headers: {
        Cookie: cookie,
        "X-NexEdge-CDN-Secret": env.CDN_SHARED_SECRET,
      },
    },
  );

  const result = await response.json().catch(() => ({}));

  if (!response.ok || !result.allowed) {
    return {
      error: json({
        error: response.status === 401 ? "Unauthorized" : "Forbidden",
        detail: result.message || "File access was not authorized",
      }, response.status),
    };
  }

  return { result };
}

async function deliverFile(request, env, context, fileId) {
  const authorization = await authorize(request, env, fileId);
  if (authorization.error) return authorization.error;

  const { originUrl, version, mimeType } = authorization.result;
  const cacheKey = new Request(
    `https://cache.nexedge.internal/files/${encodeURIComponent(fileId)}?v=${encodeURIComponent(version)}`,
  );
  const cache = caches.default;
  const cached = await cache.match(cacheKey);

  if (cached) {
    return deliveryResponse(cached, request, "HIT");
  }

  const originResponse = await fetch(originUrl);
  if (!originResponse.ok) {
    return json({ error: "Failed to fetch file from ImageKit" }, 502);
  }

  const headers = new Headers(originResponse.headers);
  const ttl = Math.max(60, Number(env.CACHE_TTL_SECONDS) || 300);

  headers.set("Content-Type", mimeType || headers.get("Content-Type") || "application/octet-stream");
  headers.set("Cache-Control", `public, max-age=${ttl}`);
  headers.set("Content-Disposition", "inline");
  headers.delete("Set-Cookie");

  const cacheable = new Response(originResponse.body, {
    status: 200,
    headers,
  });

  context.waitUntil(cache.put(cacheKey, cacheable.clone()));
  return deliveryResponse(cacheable, request, "MISS");
}

async function route(request, env, context) {
  const url = new URL(request.url);

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
    });
  }

  if (request.method !== "GET") {
    return json({ error: "Method not allowed" }, 405);
  }

  if (url.pathname === "/health") {
    return json({ status: "healthy", service: "nexedge-cloudflare-cdn" });
  }

  if (url.pathname === "/edges") {
    return json({
      edges: [{
        name: "Cloudflare global edge",
        baseUrl: url.origin,
        isActive: true,
      }],
    });
  }

  const fileMatch = url.pathname.match(/^\/files\/([^/]+)$/);
  if (fileMatch) {
    return deliverFile(request, env, context, decodeURIComponent(fileMatch[1]));
  }

  return json({ error: "Not found" }, 404);
}

export default {
  async fetch(request, env, context) {
    try {
      return withCors(await route(request, env, context), request, env);
    } catch (error) {
      console.error("CDN request failed", error);
      return withCors(
        json({ error: "CDN request failed", detail: error.message }, 500),
        request,
        env,
      );
    }
  },
};
