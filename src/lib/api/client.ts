import type { Paginated } from "./types";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

const ACCESS_TOKEN_KEY = "nh.accessToken";
const REFRESH_TOKEN_KEY = "nh.refreshToken";

export const tokenStore = {
  get access() {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  get refresh() {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  set(access: string, refresh?: string) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ACCESS_TOKEN_KEY, access);
    if (refresh) window.localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  },
  clear() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

/** Shape of the backend's `common.exceptions.custom_exception_handler`. */
export interface ApiErrorBody {
  error: string;
  details?: Record<string, unknown>;
  status_code: number;
}

export class ApiError extends Error {
  readonly status: number;
  readonly details?: Record<string, unknown>;

  constructor(status: number, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

type Query = Record<string, string | number | boolean | undefined | null>;

export interface RequestOptions extends Omit<RequestInit, "body"> {
  query?: Query;
  body?: unknown;
  /** Skip the one-shot token refresh on 401 (used by the refresh call itself). */
  noRetry?: boolean;
}

function buildUrl(path: string, query?: Query) {
  const url = new URL(
    path.startsWith("http") ? path : `${API_BASE_URL}${path}`,
  );
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function refreshAccessToken(): Promise<boolean> {
  const refresh = tokenStore.refresh;
  if (!refresh) return false;
  const response = await fetch(buildUrl("/auth/token/refresh"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  if (!response.ok) {
    tokenStore.clear();
    return false;
  }
  const data = (await response.json()) as { access: string; refresh?: string };
  tokenStore.set(data.access, data.refresh);
  return true;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { query, body, noRetry, headers, ...init } = options;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  const response = await fetch(buildUrl(path, query), {
    ...init,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(tokenStore.access ? { Authorization: `Bearer ${tokenStore.access}` } : {}),
      ...headers,
    },
    body: body == null ? undefined : isFormData ? body : JSON.stringify(body),
  });

  if (response.status === 401 && !noRetry && (await refreshAccessToken())) {
    return request<T>(path, { ...options, noRetry: true });
  }

  if (response.status === 204) return undefined as T;

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error = payload as ApiErrorBody | null;
    throw new ApiError(
      response.status,
      error?.error ?? response.statusText ?? "Request failed",
      error?.details,
    );
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string, query?: Query) => request<T>(path, { method: "GET", query }),
  list: <T>(path: string, query?: Query) => request<Paginated<T>>(path, { method: "GET", query }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: "PUT", body }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

/**
 * Flattens an ApiError's `details` into one message per field, keyed by the
 * serializer's own field name. `common.exceptions.format_error_detail` leaves
 * behind a string, a list of strings, or — for a nested serializer — a dict,
 * so each shape is reduced to the readable lines it holds.
 */
export function fieldErrors(error: ApiError): Record<string, string> {
  const flattened: Record<string, string> = {};
  for (const [field, value] of Object.entries(error.details ?? {})) {
    const message = flattenDetail(value);
    if (message) flattened[field] = message;
  }
  return flattened;
}

function flattenDetail(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(flattenDetail).filter(Boolean).join(" ");
  if (value && typeof value === "object") {
    return Object.values(value).map(flattenDetail).filter(Boolean).join(" ");
  }
  return "";
}
