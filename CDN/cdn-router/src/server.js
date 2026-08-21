// cdn-router/src/server.js
//
// Implements Step 8-13's flow end to end:
//
//   User (with JWT cookie + lat/lng)
//     -> CDN Router
//         -> ask Origin: am I authorized for this fileId? (Step 12)
//         -> rank edges by Haversine distance (Step 9-10)
//         -> try nearest healthy edge, fall through if down (Step 14)
//         -> edge handles cache HIT/MISS itself (Step 4-6)
//     <- file bytes, streamed back to user
//
// The router NEVER touches Mongo directly and NEVER decides access on
// its own — it always defers to the origin's /api/cdn/authorize route,
// which is backed by the exact same logic as your existing
// openFile/downloadFile controllers. This is what makes Step 12 hold:
// caching can never bypass your file permissions, because the router
// re-checks authorization on every single request, cache or no cache.

import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import { rankEdgesByDistance } from "./geo.js";
import { edges, getActiveEdges, startHealthChecks } from "./edges.js";

const app = express();
app.use(express.json());
app.use(cookieParser());

const ROUTER_PORT = Number(process.env.ROUTER_PORT) || 6000;
const ORIGIN_URL = process.env.ORIGIN_URL || "http://localhost:3000";

startHealthChecks();

/**
 * @route GET /health
 */
app.get("/health", (req, res) => {
  res.json({ status: "healthy", service: "cdn-router" });
});

/**
 * @route GET /edges
 * @desc  Debug helper: see current known edges + health status.
 */
app.get("/edges", (req, res) => {
  res.json({ edges });
});

/**
 * @route GET /files/:fileId
 * @query lat, lng   - user's coordinates (Step 9). Frontend supplies these.
 * @desc  The single entrypoint users should call instead of hitting an
 *        edge or the origin directly (Step 8).
 */
app.get("/files/:fileId", async (req, res) => {
  const { fileId } = req.params;
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return res.status(400).json({ error: "lat and lng query params are required" });
  }

  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ error: "Unauthorized", detail: "No token provided" });
  }

  // Step 12: ask the origin, every time, regardless of cache state.
  let authResult;
  try {
    const authRes = await fetch(`${ORIGIN_URL}/api/cdn/authorize/${fileId}`, {
      headers: {
        Cookie: `token=${token}`,
        ...(process.env.CDN_SHARED_SECRET
          ? { "X-NexEdge-CDN-Secret": process.env.CDN_SHARED_SECRET }
          : {}),
      },
    });
    authResult = await authRes.json();

    if (!authRes.ok || !authResult.allowed) {
      return res.status(authRes.status).json({
        error: "Forbidden",
        detail: authResult.message ?? "Not authorized for this file",
      });
    }
  } catch (err) {
    return res.status(502).json({ error: "Could not reach origin for authorization", detail: err.message });
  }

  // Step 9-10: nearest edge first, Step 14: skip unhealthy ones.
  const activeEdges = getActiveEdges();
  if (activeEdges.length === 0) {
    return res.status(503).json({ error: "No healthy edges available" });
  }

  const ranked = rankEdgesByDistance(lat, lng, activeEdges);

  const qs = new URLSearchParams({
    originUrl: authResult.originUrl,
    version: String(authResult.version),
    mimeType: authResult.mimeType,
    size: String(authResult.size),
  });

  for (const edge of ranked) {
    try {
      const edgeRes = await fetch(`${edge.baseUrl}/serve/${fileId}?${qs}`, {
        signal: AbortSignal.timeout(15_000),
      });

      if (!edgeRes.ok) continue; // try next-nearest edge

      res.set("Content-Type", edgeRes.headers.get("content-type") ?? authResult.mimeType);
      res.set("X-Served-By-Edge", edge.name);
      res.set("X-Cache-Status", edgeRes.headers.get("x-cache-status") ?? "UNKNOWN");
      res.set("X-Edge-Distance-Km", edge.distanceKm.toFixed(1));

      const buffer = Buffer.from(await edgeRes.arrayBuffer());
      return res.send(buffer);
    } catch {
      continue; // this edge failed mid-request, try the next nearest
    }
  }

  return res.status(502).json({ error: "All candidate edges failed to serve the file" });
});

/**
 * @route DELETE /cache/:fileId
 * @desc  Step 13 — invalidation. Broadcasts a delete to every edge,
 *        regardless of health (best-effort; a down edge has no cache
 *        to worry about anyway, and will re-check version on restart).
 */
app.delete("/cache/:fileId", async (req, res) => {
  const results = await Promise.allSettled(
    edges.map((edge) => fetch(`${edge.baseUrl}/cache/${req.params.fileId}`, { method: "DELETE" })),
  );

  const summary = edges.map((edge, i) => ({
    edge: edge.name,
    ok: results[i].status === "fulfilled" && results[i].value.ok,
  }));

  res.json({ fileId: req.params.fileId, invalidated: summary });
});

/**
 * @route GET /metrics
 * @desc  Step 15 — aggregate metrics across all edges.
 */
app.get("/metrics", async (req, res) => {
  const results = await Promise.allSettled(
    edges.map((edge) => fetch(`${edge.baseUrl}/metrics`).then((r) => r.json())),
  );

  const perEdge = edges.map((edge, i) =>
    results[i].status === "fulfilled" ? results[i].value : { edge: edge.name, error: "unreachable" },
  );

  res.json({ edges: perEdge });
});

app.listen(ROUTER_PORT, () => {
  console.log(`CDN Router running at http://localhost:${ROUTER_PORT}`);
});
