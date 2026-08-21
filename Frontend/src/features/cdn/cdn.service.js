import { cdnUrl, USES_GLOBAL_CDN } from "../../config/cdn";

const LOCATION_KEY = "nexedge-cdn-location";

const INDIA_CENTER = {
  latitude: 20.5937,
  longitude: 78.9629,
  label: "India center",
  source: "fallback",
};

async function errorMessage(response) {
  try {
    const data = await response.json();
    return data.detail || data.message || data.error;
  } catch {
    return "The CDN could not complete this request.";
  }
}

async function cdnRequest(path, options = {}) {
  let response;

  try {
    response = await fetch(cdnUrl(path), {
      credentials: "include",
      ...options,
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;

    throw new Error(
      "Cannot reach the CDN. Please try again shortly.",
    );
  }

  if (!response.ok) {
    throw new Error((await errorMessage(response)) || "CDN request failed.");
  }

  return response;
}

function savedLocation() {
  try {
    const location = JSON.parse(localStorage.getItem(LOCATION_KEY));

    if (
      Number.isFinite(location?.latitude)
      && Number.isFinite(location?.longitude)
    ) {
      return location;
    }
  } catch {
    // Use the fallback when stored data is missing or invalid.
  }

  return INDIA_CENTER;
}

function detectLocation() {
  if (!navigator.geolocation) {
    return Promise.reject(
      new Error("Location is not supported by this browser."),
    );
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const location = {
          latitude: coords.latitude,
          longitude: coords.longitude,
          label: "Your location",
          source: "device",
        };

        localStorage.setItem(LOCATION_KEY, JSON.stringify(location));
        resolve(location);
      },
      () => reject(new Error("Location permission was not granted.")),
      { enableHighAccuracy: false, maximumAge: 300_000, timeout: 8_000 },
    );
  });
}

export const cdnService = {
  getLocation: savedLocation,
  detectLocation,

  async getEdges({ signal } = {}) {
    const response = await cdnRequest("/edges", { signal });
    return response.json();
  },

  async deliver(fileId, location, { signal } = {}) {
    const params = USES_GLOBAL_CDN
      ? ""
      : `?${new URLSearchParams({
        lat: String(location.latitude),
        lng: String(location.longitude),
      })}`;
    const response = await cdnRequest(`/files/${fileId}${params}`, { signal });

    return {
      blob: await response.blob(),
      edge: response.headers.get("x-served-by-edge") || "Nearest edge",
      cacheStatus: response.headers.get("x-cache-status") || "UNKNOWN",
      distanceKm: response.headers.get("x-edge-distance-km"),
    };
  },
};
