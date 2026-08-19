// cdn-router/src/geo.js
// Step 10 — straight from the doc, unchanged.

export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Returns edges sorted nearest-first, so the caller can try the
 * nearest, and fall through to the next if it's unhealthy (Step 14).
 */
export function rankEdgesByDistance(userLat, userLng, edgeServers) {
  return [...edgeServers]
    .map((edge) => ({
      ...edge,
      distanceKm: calculateDistance(userLat, userLng, edge.latitude, edge.longitude),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
}
