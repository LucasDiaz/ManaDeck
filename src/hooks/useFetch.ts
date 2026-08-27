import { type DependencyList, useEffect, useRef, useState } from "react";
import { type AsyncState } from "./useAsync";

export interface UseFetchResult<T> extends AsyncState<T> {
  isIdle: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  /** Re-run the current factory (same deps). */
  refetch: () => void;
}

export interface UseFetchOptions<T> {
  /** When false the factory is not called and state stays idle. */
  enabled?: boolean;
  initialData?: T | null;
}

function toError(value: unknown): Error {
  if (value instanceof Error) return value;
  if (typeof value === "string") return new Error(value);
  return new Error("Se produjo un error inesperado.");
}

/**
 * Declarative data fetching: runs `factory` on mount and whenever `deps`
 * change, tracking loading / error / data. The factory receives an
 * `AbortSignal` — pass it to the service call so superseded requests are
 * cancelled.
 *
 * `deps` should hold primitive values (ids, query strings, page numbers);
 * they are serialised to detect changes.
 *
 * ```ts
 * const { data: card, isLoading, error, refetch } = useFetch(
 *   (signal) => getCardById(id, { signal }),
 *   [id],
 * );
 * ```
 */
export function useFetch<T>(
  factory: (signal: AbortSignal) => Promise<T>,
  deps: DependencyList,
  options: UseFetchOptions<T> = {},
): UseFetchResult<T> {
  const { enabled = true, initialData = null } = options;

  const [state, setState] = useState<AsyncState<T>>({
    data: initialData,
    error: null,
    status: enabled ? "pending" : "idle",
  });

  const factoryRef = useRef(factory);
  const initialDataRef = useRef(initialData);
  useEffect(() => {
    factoryRef.current = factory;
    initialDataRef.current = initialData;
  });

  const [reloadToken, setReloadToken] = useState(0);
  const depsKey = deps.map((d) => String(d)).join("|");

  useEffect(() => {
    // Synchronous transitions to "pending"/"idle" here are intentional: this
    // effect synchronises component state with an external data source, which
    // is exactly the data-fetching pattern from the React docs.
    /* eslint-disable react/set-state-in-effect */
    if (!enabled) {
      setState({ data: initialDataRef.current, error: null, status: "idle" });
      return;
    }

    const controller = new AbortController();
    let active = true;
    setState((prev) => ({ ...prev, status: "pending", error: null }));
    /* eslint-enable react/set-state-in-effect */

    factoryRef.current(controller.signal).then(
      (data) => {
        if (active) setState({ data, error: null, status: "success" });
      },
      (error: unknown) => {
        if (!active) return;
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState((prev) => ({ ...prev, error: toError(error), status: "error" }));
      },
    );

    return () => {
      active = false;
      controller.abort();
    };
  }, [enabled, reloadToken, depsKey]);

  return {
    ...state,
    isIdle: state.status === "idle",
    isLoading: state.status === "pending",
    isSuccess: state.status === "success",
    isError: state.status === "error",
    refetch: () => setReloadToken((n) => n + 1),
  };
}
