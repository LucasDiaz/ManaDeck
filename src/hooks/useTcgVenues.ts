import { useEffect, useState } from "react";
import type { GameVenue } from "../types";
import { FALLBACK_TCG_VENUES, fetchTcgVenues, mergeWithFallbackVenues } from "../services";

export type TcgVenuesStatus = "pending" | "success" | "error";

export interface UseTcgVenuesOptions {
  lat: number;
  lon: number;
  /** Search radius in meters. Defaults to 5 km (see `fetchTcgVenues`). */
  radiusMeters?: number;
}

export interface UseTcgVenuesResult {
  venues: GameVenue[];
  status: TcgVenuesStatus;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  /** True once live Overpass data failed/timed out and the offline list is shown instead. */
  usingFallback: boolean;
  refetch: () => void;
}

function toError(value: unknown): Error {
  if (value instanceof Error) return value;
  return new Error("Se produjo un error inesperado.");
}

/**
 * Fetches nearby TCG/game-store venues from Overpass for the Contact
 * screen's map. The curated {@link FALLBACK_TCG_VENUES} (real Buenos Aires
 * stores) are always merged into the result via `mergeWithFallbackVenues`,
 * so they render regardless of where the live query is centered; on
 * failure or timeout the curated list is shown on its own and
 * `usingFallback` flips to `true`.
 *
 * ```ts
 * const { venues, isLoading, usingFallback } = useTcgVenues({ lat, lon });
 * ```
 */
export function useTcgVenues({
  lat,
  lon,
  radiusMeters,
}: UseTcgVenuesOptions): UseTcgVenuesResult {
  const [venues, setVenues] = useState<GameVenue[]>([]);
  const [status, setStatus] = useState<TcgVenuesStatus>("pending");
  const [error, setError] = useState<Error | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    // Synchronous transition to "pending" here mirrors useFetch: this effect
    // synchronises component state with an external data source.
    /* eslint-disable react/set-state-in-effect */
    setStatus("pending");
    setError(null);
    /* eslint-enable react/set-state-in-effect */

    fetchTcgVenues(
      { lat, lon, radiusMeters },
      { signal: controller.signal },
    ).then(
      (data) => {
        if (!active) return;
        setVenues(mergeWithFallbackVenues(data));
        setUsingFallback(false);
        setStatus("success");
      },
      (reason: unknown) => {
        if (!active) return;
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setVenues([...FALLBACK_TCG_VENUES]);
        setUsingFallback(true);
        setError(toError(reason));
        setStatus("error");
      },
    );

    return () => {
      active = false;
      controller.abort();
    };
  }, [lat, lon, radiusMeters, reloadToken]);

  return {
    venues,
    status,
    isLoading: status === "pending",
    isError: status === "error",
    error,
    usingFallback,
    refetch: () => setReloadToken((n) => n + 1),
  };
}
