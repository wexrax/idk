import { ApiError } from "./contracts";
import { API_PREFIX, apiPath } from "./endpoints";

export type ApiMode = "mock" | "live";
export type QueryValue = string | number | boolean | null | undefined;
export type QueryParams = Record<string, QueryValue | QueryValue[]>;

type RequestOptions = {
  body?: unknown;
  headers?: HeadersInit;
  method?: "DELETE" | "GET" | "PATCH" | "POST" | "PUT";
  query?: QueryParams;
  signal?: AbortSignal;
};

type FastApiErrorBody = {
  detail?: string | unknown[];
  error?: {
    code?: string;
    details?: unknown;
    message?: string;
  };
  request_id?: string;
};

const accessTokenKey = "subhub.admin.access_token";
const defaultLiveApiBaseUrl = "http://localhost:8000";
const refreshPath = "/auth/refresh";
const authRefreshExcludedPaths = [
  "/auth/login",
  "/auth/logout",
  "/auth/2fa",
  refreshPath,
] as const;
let refreshPromise: Promise<string | null> | null = null;

function isBrowser() {
  return typeof window !== "undefined";
}

function trimSlashes(value: string) {
  return value.replace(/\/+$/, "");
}

function normalizeApiBaseUrl(value: string): string {
  try {
    const url = new URL(value);

    if (url.hostname === "0.0.0.0") {
      url.hostname = isBrowser() ? window.location.hostname : "127.0.0.1";
    }

    return trimSlashes(url.toString());
  } catch {
    return trimSlashes(value);
  }
}

export function getApiMode(): ApiMode {
  return process.env.NEXT_PUBLIC_API_MODE === "live" ? "live" : "mock";
}

export function getApiBaseUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
    (getApiMode() === "live" ? defaultLiveApiBaseUrl : "");

  if (!configured) {
    return "";
  }

  return normalizeApiBaseUrl(configured);
}

export function getAccessToken(): string | null {
  if (!isBrowser()) {
    return null;
  }

  return window.localStorage.getItem(accessTokenKey);
}

export function setAccessToken(token: string | null): void {
  if (!isBrowser()) {
    return;
  }

  if (token) {
    window.localStorage.setItem(accessTokenKey, token);
    window.dispatchEvent(new Event("subhub-auth-change"));
    return;
  }

  window.localStorage.removeItem(accessTokenKey);
  window.dispatchEvent(new Event("subhub-auth-change"));
}

export function buildApiUrl(path: string, query?: QueryParams): string {
  const normalizedPath = path.startsWith(API_PREFIX) ? path : apiPath(path);
  const url = new URL(`${getApiBaseUrl()}${normalizedPath}`, "http://subhub.local");

  Object.entries(query ?? {}).forEach(([key, value]) => {
    const values = Array.isArray(value) ? value : [value];

    values.forEach((item) => {
      if (item !== undefined && item !== null && item !== "") {
        url.searchParams.append(key, String(item));
      }
    });
  });

  if (getApiBaseUrl()) {
    return url.toString();
  }

  return `${url.pathname}${url.search}`;
}

function normalizeDetails(details: unknown): Record<string, string[]> | undefined {
  if (!details || typeof details !== "object") {
    return undefined;
  }

  if (!Array.isArray(details)) {
    return details as Record<string, string[]>;
  }

  return details.reduce<Record<string, string[]>>((acc, detail) => {
    if (!detail || typeof detail !== "object") {
      return acc;
    }

    const item = detail as { loc?: unknown[]; msg?: string };
    const key = item.loc?.map(String).join(".") ?? "request";
    acc[key] = [...(acc[key] ?? []), item.msg ?? "Invalid value"];
    return acc;
  }, {});
}

async function parseResponse(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

function apiErrorFromResponse(
  response: Response,
  payload: unknown,
): ApiError {
  const body = payload as FastApiErrorBody;
  const error = body?.error;
  const detailMessage =
    typeof body?.detail === "string" ? body.detail : undefined;
  const detailErrors = Array.isArray(body?.detail) ? body.detail : undefined;
  const fallbackMessage =
    typeof payload === "string" && payload ? payload : response.statusText;

  return new ApiError({
    code: error?.code ?? `HTTP_${response.status}`,
    details: normalizeDetails(error?.details ?? detailErrors),
    message: error?.message ?? detailMessage ?? fallbackMessage,
    request_id: body?.request_id ?? response.headers.get("x-request-id") ?? "",
    status: response.status,
  });
}

function apiErrorFromNetwork(error: unknown): ApiError {
  const message =
    error instanceof Error && error.message
      ? `Live API unavailable: ${error.message}`
      : "Live API unavailable";

  return new ApiError({
    code: "NETWORK_ERROR",
    details: {
      api_base_url: [getApiBaseUrl() || "not configured"],
    },
    message,
    request_id: "network",
    status: 503,
  });
}

function canRefreshUnauthorized(path: string): boolean {
  return !authRefreshExcludedPaths.some((excludedPath) =>
    path.includes(excludedPath),
  );
}

async function refreshAccessToken(): Promise<string | null> {
  if (!isBrowser()) {
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const response = await fetch(buildApiUrl(refreshPath), {
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
          method: "POST",
        });
        const payload = await parseResponse(response);

        if (!response.ok) {
          return null;
        }

        const accessToken =
          payload && typeof payload === "object"
            ? (payload as { access_token?: unknown }).access_token
            : null;

        if (typeof accessToken !== "string" || !accessToken) {
          return null;
        }

        setAccessToken(accessToken);
        return accessToken;
      } catch {
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
}

async function executeRequest<T>(
  path: string,
  options: RequestOptions,
  hasRetriedAfterRefresh: boolean,
): Promise<T> {
  const token = getAccessToken();
  const headers = new Headers(options.headers);

  headers.set("Accept", "application/json");

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(buildApiUrl(path, options.query), {
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      credentials: "include",
      headers,
      method: options.method ?? (options.body === undefined ? "GET" : "POST"),
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }

    throw apiErrorFromNetwork(error);
  }

  const payload = await parseResponse(response);

  if (!response.ok) {
    if (
      response.status === 401 &&
      token &&
      !hasRetriedAfterRefresh &&
      canRefreshUnauthorized(path)
    ) {
      const refreshedToken = await refreshAccessToken();

      if (refreshedToken) {
        return executeRequest<T>(path, options, true);
      }

      setAccessToken(null);
    }

    throw apiErrorFromResponse(response, payload);
  }

  return payload as T;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  return executeRequest<T>(path, options, false);
}
