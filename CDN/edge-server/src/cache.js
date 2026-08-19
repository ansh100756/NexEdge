// edge-server/src/cache.js
//
// Disk-backed cache for this edge instance. Each edge process gets its
// own cache directory (configured via CACHE_DIR), so running 5 edges
// on one machine during dev never collides.
//
// Layout per cached file:
//   <CACHE_DIR>/<fileId>.bin        the actual bytes
//   <CACHE_DIR>/<fileId>.meta.json  { cachedAt, expiresAt, version, mimeType, size, lastAccessedAt }

import fs from "node:fs/promises";
import fssync from "node:fs";
import path from "node:path";

const TTL_MS = Number(process.env.CACHE_TTL_SECONDS ?? 300) * 1000; // default 5 min, per the doc's dev advice
const CACHE_DIR = process.env.CACHE_DIR ?? "./cache-data";

function binPath(fileId) {
  return path.join(CACHE_DIR, `${fileId}.bin`);
}

function metaPath(fileId) {
  return path.join(CACHE_DIR, `${fileId}.meta.json`);
}

export function ensureCacheDir() {
  if (!fssync.existsSync(CACHE_DIR)) {
    fssync.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

/**
 * Look up a cached file. Returns null on MISS (not found, or expired,
 * or stale version). Deletes expired/stale entries as it finds them
 * (Step 6's pseudo logic).
 */
export async function getCached(fileId, currentVersion) {
  try {
    const metaRaw = await fs.readFile(metaPath(fileId), "utf-8");
    const meta = JSON.parse(metaRaw);

    const isExpired = Date.now() > meta.expiresAt;
    const isStale = currentVersion !== undefined && meta.version !== currentVersion;

    if (isExpired || isStale) {
      await deleteCached(fileId);
      return null;
    }

    meta.lastAccessedAt = new Date().toISOString();
    await fs.writeFile(metaPath(fileId), JSON.stringify(meta, null, 2));

    return meta;
  } catch {
    return null; // no meta file = not cached
  }
}

export async function readCachedBytes(fileId) {
  return fs.readFile(binPath(fileId));
}

/**
 * Save fetched bytes + metadata to this edge's local cache.
 */
export async function setCached(fileId, buffer, { mimeType, size, version }) {
  ensureCacheDir();

  const now = Date.now();
  const meta = {
    fileId,
    edgeServer: process.env.EDGE_NAME ?? "unknown",
    cachedAt: new Date(now).toISOString(),
    expiresAt: now + TTL_MS,
    mimeType,
    size,
    version,
    lastAccessedAt: new Date(now).toISOString(),
  };

  await fs.writeFile(binPath(fileId), buffer);
  await fs.writeFile(metaPath(fileId), JSON.stringify(meta, null, 2));

  return meta;
}

export async function deleteCached(fileId) {
  await fs.rm(binPath(fileId), { force: true });
  await fs.rm(metaPath(fileId), { force: true });
}

export async function listCached() {
  ensureCacheDir();
  const files = await fs.readdir(CACHE_DIR);
  return files.filter((f) => f.endsWith(".meta.json")).map((f) => f.replace(".meta.json", ""));
}
