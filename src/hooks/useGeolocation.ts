import { useCallback, useEffect, useRef, useState } from "react";

export type GeolocationStatus =
  | "idle"
  | "pending"
  | "success"
  | "denied"
  | "error"
  | "unsupported";

export interface GeoCoords {
  lat: number;
  lon: number;
  /** Accuracy radius in meters, as reported by the browser. */
  accuracy?: number;
}

export interface UseGeolocationResult {
  coords: GeoCoords | null;
  status: GeolocationStatus;
  error: string | null;
  isLocating: boolean;
  /** Ask the browser for the user's current position. */
  locate: () => void;
}

const GEOLOCATION_TIMEOUT_MS = 10_000;

function messageFor(err: GeolocationPositionError): string {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return "Permiso de ubicación denegado.";
    case err.POSITION_UNAVAILABLE:
      return "No se pudo determinar tu ubicación.";
    case err.TIMEOUT:
      return "Se agotó el tiempo para obtener tu ubicación.";
    default:
      return "No se pudo obtener tu ubicación.";
  }
}

/**
 * Thin wrapper around `navigator.geolocation.getCurrentPosition`. Never
 * fires automatically — the caller decides when to ask (`locate()`), so a
 * "Usar mi ubicación" button can drive it explicitly and the app can fall
 * back to a default city center whenever `coords` is `null`.
 */
export function useGeolocation(): UseGeolocationResult {
  const [coords, setCoords] = useState<GeoCoords | null>(null);
  const [status, setStatus] = useState<GeolocationStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const locate = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unsupported");
      setError("Tu navegador no admite geolocalización.");
      return;
    }

    setStatus("pending");
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!mountedRef.current) return;
        setCoords({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setStatus("success");
      },
      (err) => {
        if (!mountedRef.current) return;
        setStatus(err.code === err.PERMISSION_DENIED ? "denied" : "error");
        setError(messageFor(err));
      },
      {
        enableHighAccuracy: false,
        timeout: GEOLOCATION_TIMEOUT_MS,
        maximumAge: 60_000,
      },
    );
  }, []);

  return { coords, status, error, isLocating: status === "pending", locate };
}
