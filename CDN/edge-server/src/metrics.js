// edge-server/src/metrics.js
//
// In-memory metrics for this edge instance (Step 15). Resets on
// restart, which is fine for a dev/demo project. Good enough to show
// hit ratio and avg response time in a /metrics endpoint or console.

const state = {
  requests: 0,
  hits: 0,
  misses: 0,
  totalResponseTimeMs: 0,
};

export function recordRequest({ cacheStatus, responseTimeMs }) {
  state.requests += 1;
  state.totalResponseTimeMs += responseTimeMs;
  if (cacheStatus === "HIT") state.hits += 1;
  if (cacheStatus === "MISS") state.misses += 1;
}

export function getMetrics() {
  const hitRatio = state.requests > 0 ? state.hits / state.requests : 0;
  const avgResponseTime =
    state.requests > 0 ? state.totalResponseTimeMs / state.requests : 0;

  return {
    edge: process.env.EDGE_NAME ?? "unknown",
    requests: state.requests,
    cacheHits: state.hits,
    cacheMisses: state.misses,
    hitRatio: Number((hitRatio * 100).toFixed(1)),
    avgResponseTimeMs: Number(avgResponseTime.toFixed(1)),
  };
}
