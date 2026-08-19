// cdn-router/src/edges.js
//
// Static registry of known edges (Step 7/8). For an MVP, hardcoding
// the 5 known locations + ports here is completely reasonable — real
// CDNs use service discovery, but that's beyond project scope.
//
// isActive is updated by periodic health checks (Step 14).

export const edges = [
  { name: "Delhi", baseUrl: "http://localhost:5001", latitude: 28.6139, longitude: 77.209, isActive: true },
  { name: "Mumbai", baseUrl: "http://localhost:5002", latitude: 19.076, longitude: 72.8777, isActive: true },
  { name: "Kolkata", baseUrl: "http://localhost:5003", latitude: 22.5726, longitude: 88.3639, isActive: true },
  { name: "Bangalore", baseUrl: "http://localhost:5004", latitude: 12.9716, longitude: 77.5946, isActive: true },
  { name: "Chennai", baseUrl: "http://localhost:5005", latitude: 13.0827, longitude: 80.2707, isActive: true },
];

const HEALTH_CHECK_INTERVAL_MS = 10_000;

async function checkOne(edge) {
  try {
    const res = await fetch(`${edge.baseUrl}/health`, { signal: AbortSignal.timeout(2000) });
    edge.isActive = res.ok;
  } catch {
    edge.isActive = false;
  }
}

export function startHealthChecks() {
  const run = () => Promise.all(edges.map(checkOne));
  run(); // check once immediately on boot
  setInterval(run, HEALTH_CHECK_INTERVAL_MS);
}

export function getActiveEdges() {
  return edges.filter((e) => e.isActive);
}
