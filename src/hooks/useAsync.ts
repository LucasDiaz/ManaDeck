import { useCallback, useEffect, useRef, useState } from "react";

export type AsyncStatus = "idle" | "pending" | "success" | "error";

export interface AsyncState<T> {
  data: T | null;
  error: Error | null;
  status: AsyncStatus;
}

export interface UseAsyncResult<T, Args extends unknown[]>
  extends AsyncState<T> {
  isIdle: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  /** Invoke the async function; state updates are ignored after unmount
   *  and superseded calls are dropped (last call wins). */
  run: (...args: Args) => Promise<T | undefined>;
  /** Return to the idle state and discard any in-flight result. */
  reset: () => void;
}

export interface UseAsyncOptions<T> {
  /** Run once on mount (only meaningful when the fn takes no arguments). */
  immediate?: boolean;
  /** Seed value for `data` before the first successful run. */
  initialData?: T | null;
}

function toError(value: unknown): Error {
  if (value instanceof Error) return value;
  if (typeof value === "string") return new Error(value);
  return new Error("Se produjo un error inesperado.");
}

/**
 * Generic async-state manager: wraps a promise-returning function and
 * exposes `{ data, error, status }` plus `run` / `reset`.
 *
 * ```ts
 * const { data, isLoading, error, run } = useAsync(searchCards);
 * // ...
 * run({ q: "bolt" }, 1);
 * ```
 */
export function useAsync<T, Args extends unknown[] = []>(
  asyncFn: (...args: Args) => Promise<T>,
  options: UseAsyncOptions<T> = {},
): UseAsyncResult<T, Args> {
  const { immediate = false, initialData = null } = options;

  const [state, setState] = useState<AsyncState<T>>({
    data: initialData,
    error: null,
    status: immediate ? "pending" : "idle",
  });

  const mountedRef = useRef(true);
  const callIdRef = useRef(0);
  const fnRef = useRef(asyncFn);

  useEffect(() => {
    fnRef.current = asyncFn;
  }, [asyncFn]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const run = useCallback((...args: Args): Promise<T | undefined> => {
    const callId = ++callIdRef.current;
    setState((prev) => ({ ...prev, status: "pending", error: null }));

    return fnRef.current(...args).then(
      (data) => {
        if (mountedRef.current && callId === callIdRef.current) {
          setState({ data, error: null, status: "success" });
        }
        return data;
      },
      (error: unknown) => {
        if (mountedRef.current && callId === callIdRef.current) {
          setState((prev) => ({
            ...prev,
            error: toError(error),
            status: "error",
          }));
        }
        return undefined;
      },
    );
  }, []);

  const reset = useCallback(() => {
    callIdRef.current += 1;
    setState({ data: initialData, error: null, status: "idle" });
  }, [initialData]);

  useEffect(() => {
    // `run` sets state synchronously (→ "pending"); kicking off the request
    // on mount is the intended behaviour when `immediate` is set.
    /* eslint-disable react/set-state-in-effect */
    if (immediate) {
      void run(...([] as unknown as Args));
    }
    /* eslint-enable react/set-state-in-effect */
  }, [immediate, run]);

  return {
    ...state,
    isIdle: state.status === "idle",
    isLoading: state.status === "pending",
    isSuccess: state.status === "success",
    isError: state.status === "error",
    run,
    reset,
  };
}
