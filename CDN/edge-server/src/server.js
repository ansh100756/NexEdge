// edge-server/src/server.js
//
// One reusable edge-server codebase. Which "location" it represents is
// entirely determined by environment variables (see .env.example) —
// this is Step 7's rule: never clone this file per-city.
//
// This server does NOT do authorization and does NOT talk to Mongo.
// It only ever serves a file after the CDN Router has already told it
// (via the request) that the request is authorized, and handed it the
// origin (ImageKit) URL to fetch from on a MISS.

import "dotenv/config";
import express from "express";
import {
  ensureCacheDir,
  getCached,
  readCachedBytes,
  setCached,
  deleteCached,
  listCached,
} from "./cache.js";
import { recordRequest, getMetrics } from "./metrics.js";
import { logger } from "./logger.js";
const app = express();
app.use(express.json());

const EDGE_NAME = process.env.EDGE_NAME ?? "unknown-edge";
const EDGE_PORT = Number(process.env.EDGE_PORT) || 5000;
const EDGE_LAT = Number(process.env.EDGE_LAT);
const EDGE_LNG = Number(process.env.EDGE_LNG);

ensureCacheDir();

/**
 * @route GET /health
 * @desc  Used by the CDN Router (Step 14) to skip dead edges before
 *        Haversine-selecting the nearest one.
 */
app.get("/health", (req, res) => {
  res.json({ status: "healthy", edge: EDGE_NAME });
});

/**
 * @route GET /metrics
 * @desc  Step 15 monitoring — hit ratio, avg response time, etc.
 */
app.get("/metrics", (req, res) => {
  res.json(getMetrics());
});

/**
 * @route GET /location
 * @desc  Lets the CDN Router discover this edge's coordinates without
 *        hardcoding them in the router too. Small convenience, not
 *        strictly required by the doc but avoids config duplication.
 */
app.get("/location", (req, res) => {
  res.json({ edge: EDGE_NAME, latitude: EDGE_LAT, longitude: EDGE_LNG });
});

/**
 * @route GET /serve/:fileId
 * @query originUrl   - ImageKit URL to fetch from on a MISS (router provides this)
 * @query version     - origin's file.updatedAt timestamp, used for invalidation
 * @query mimeType
 * @query size
 * @desc  The core CDN mechanic: Steps 4-6. This route is ONLY ever
 *        called by the CDN Router, after the router has already
 *        confirmed the requesting user is authorized. The edge trusts
 *        the router the same way your origin trusts a verified JWT.
 */
app.get("/serve/:fileId", async (req, res) => {
  const start = Date.now();
  const { fileId } = req.params;
  const { originUrl, version, mimeType, size } = req.query;

  if (!originUrl) {
    return res.status(400).json({ error: "originUrl is required" });
  }

  try {
    const cached = await getCached(
      fileId,
      version ? Number(version) : undefined,
    );

    if (cached) {
      console.log(`[CACHE HIT] fileId=${fileId} edge=${EDGE_NAME}`);
      const buffer = await readCachedBytes(fileId);
      res.set("Content-Type", cached.mimeType);
      res.set("X-Cache-Status", "HIT");
      res.set("X-Edge-Server", EDGE_NAME);
      recordRequest({ cacheStatus: "HIT", responseTimeMs: Date.now() - start });
      return res.send(buffer);
    }

    logger.info({ event: "cache_miss", fileId, edge: EDGE_NAME });

    const originResponse = await fetch(originUrl);
    if (!originResponse.ok) {
      return res
        .status(502)
        .json({ error: "Failed to fetch file from origin" });
    }

    const arrayBuffer = await originResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await setCached(fileId, buffer, {
      mimeType:
        mimeType ??
        originResponse.headers.get("content-type") ??
        "application/octet-stream",
      size: size ? Number(size) : buffer.length,
      version: version ? Number(version) : Date.now(),
    });

    logger.info({
      event: "cache_stored",
      fileId,
      edge: EDGE_NAME,
      responseTimeMs: Date.now() - start,
    });
    res.set("Content-Type", mimeType ?? "application/octet-stream");
    res.set("X-Cache-Status", "MISS");
    res.set("X-Edge-Server", EDGE_NAME);
    recordRequest({ cacheStatus: "MISS", responseTimeMs: Date.now() - start });
    return res.send(buffer);
  } catch (err) {
    return res
      .status(500)
      .json({ error: "Edge serve failed", detail: err.message });
  }
});

/**
 * @route DELETE /cache/:fileId
 * @desc  Step 13 — cache invalidation. Called by the CDN Router when
 *        the origin reports a file was deleted or changed.
 */
app.delete("/cache/:fileId", async (req, res) => {
  await deleteCached(req.params.fileId);
  logger.info({
    event: "cache_invalidated",
    fileId: req.params.fileId,
    edge: EDGE_NAME,
  });
  res.json({ deleted: true, fileId: req.params.fileId, edge: EDGE_NAME });
});

/**
 * @route GET /cache
 * @desc  Debug helper: list what's currently cached on this edge.
 */
app.get("/cache", async (req, res) => {
  const fileIds = await listCached();
  res.json({ edge: EDGE_NAME, cachedFileIds: fileIds });
});

app.listen(EDGE_PORT, () => {
  console.log(
    `[${EDGE_NAME}] Edge server running at http://localhost:${EDGE_PORT}`,
  );
  console.log(`[${EDGE_NAME}] Location: ${EDGE_LAT}, ${EDGE_LNG}`);
});
