"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError } from "./client";

export interface QueryState<T> {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
  /** Re-runs the fetcher, e.g. after a mutation. */
  refetch: () => void;
}

interface Settled<T> {
  key: object;
  data: T | null;
  error: ApiError | null;
}

const toApiError = (caught: unknown) =>
  caught instanceof ApiError
    ? caught
    : new ApiError(0, caught instanceof Error ? caught.message : "Request failed");

/**
 * Minimal client-side data fetching: run `fetcher`, expose loading/error/data,
 * and drop the result of a request a newer one has superseded.
 *
 * `loading` is derived by comparing the settled result against the current
 * request identity rather than being set from inside the effect, which keeps
 * the previous data on screen while a refetch is in flight.
 *
 * `fetcher` must be stable — wrap it in `useCallback` at the call site, which
 * is also where the dependencies that should trigger a refetch belong. Pass
 * `enabled: false` to hold off entirely; the last result is kept, so a tab
 * panel that is switched away from and back does not lose what it loaded.
 */
export function useApi<T>(fetcher: () => Promise<T>, enabled = true): QueryState<T> {
  const [nonce, setNonce] = useState(0);
  const [result, setResult] = useState<Settled<T> | null>(null);

  // A fresh object per (fetcher, nonce) pair identifies the request in flight.
  const key = useMemo(() => ({ fetcher, nonce }), [fetcher, nonce]);

  useEffect(() => {
    if (!enabled) return;
    let active = true;

    fetcher()
      .then((data) => {
        if (active) setResult({ key, data, error: null });
      })
      .catch((caught: unknown) => {
        if (active) setResult({ key, data: null, error: toApiError(caught) });
      });

    return () => {
      active = false;
    };
  }, [enabled, key, fetcher]);

  const settled = result?.key === key;
  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  return {
    data: result?.data ?? null,
    error: settled ? (result?.error ?? null) : null,
    loading: enabled && !settled,
    refetch,
  };
}

/** Lets a tab panel hold off on fetching until it is actually opened. */
export const useApiWhen = <T,>(enabled: boolean, fetcher: () => Promise<T>) =>
  useApi(fetcher, enabled);
