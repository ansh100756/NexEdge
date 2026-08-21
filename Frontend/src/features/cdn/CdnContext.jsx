import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { cdnService } from "./cdn.service";

const CdnContext = createContext(null);

export function CdnProvider({ children }) {
  const [edges, setEdges] = useState([]);
  const [location, setLocation] = useState(cdnService.getLocation);
  const [networkLoading, setNetworkLoading] = useState(true);
  const [networkError, setNetworkError] = useState("");
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");

  async function refreshEdges(signal) {
    try {
      const result = await cdnService.getEdges({ signal });
      setEdges(result.edges || []);
      setNetworkError("");
    } catch (error) {
      if (error.name !== "AbortError") setNetworkError(error.message);
    } finally {
      if (!signal?.aborted) setNetworkLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    refreshEdges(controller.signal);

    const timer = window.setInterval(() => refreshEdges(), 15_000);
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, []);

  async function useCurrentLocation() {
    setLocating(true);
    setLocationError("");

    try {
      const nextLocation = await cdnService.detectLocation();
      setLocation(nextLocation);
    } catch (error) {
      setLocationError(error.message);
    } finally {
      setLocating(false);
    }
  }

  const value = useMemo(() => ({
    edges,
    activeEdges: edges.filter((edge) => edge.isActive),
    location,
    locating,
    locationError,
    networkError,
    networkLoading,
    useCurrentLocation,
  }), [
    edges,
    location,
    locating,
    locationError,
    networkError,
    networkLoading,
  ]);

  return <CdnContext.Provider value={value}>{children}</CdnContext.Provider>;
}

export function useCdn() {
  const context = useContext(CdnContext);

  if (!context) {
    throw new Error("useCdn must be used inside CdnProvider.");
  }

  return context;
}
