import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { login, verify2fa } from "@/lib/api/auth-client";
import { apiEndpoints, apiPath } from "@/lib/api/endpoints";
import { apiRequest, buildApiUrl, getAccessToken, setAccessToken } from "@/lib/api/http-client";

describe("API integration client", () => {
  const originalMode = process.env.NEXT_PUBLIC_API_MODE;
  const originalBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  beforeEach(() => {
    vi.restoreAllMocks();
    const tokenStore = new Map<string, string>();

    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: vi.fn((key: string) => tokenStore.get(key) ?? null),
        removeItem: vi.fn((key: string) => {
          tokenStore.delete(key);
        }),
        setItem: vi.fn((key: string, value: string) => {
          tokenStore.set(key, value);
        }),
      },
    });
    process.env.NEXT_PUBLIC_API_MODE = "mock";
    process.env.NEXT_PUBLIC_API_BASE_URL = "";
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_MODE = originalMode;
    process.env.NEXT_PUBLIC_API_BASE_URL = originalBaseUrl;
  });

  it("keeps a complete catalog for documented API routes", () => {
    expect(apiPath(apiEndpoints.auth.login)).toBe("/api/v1/auth/login");
    expect(apiPath(apiEndpoints.dashboard.kpis)).toBe("/api/v1/dashboard/kpis");
    expect(apiPath(apiEndpoints.users.grantPoints("usr_1"))).toBe(
      "/api/v1/users/usr_1/grant-points",
    );
    expect(apiPath(apiEndpoints.billing.gatewayTest("stripe"))).toBe(
      "/api/v1/payment-gateways/stripe/test",
    );
    expect(apiPath(apiEndpoints.mobile.catalog)).toBe("/api/v1/mobile/catalog");
    expect(apiPath(apiEndpoints.stream.anomalies)).toBe("/api/v1/stream/anomalies");
  });

  it("builds live URLs with repeated query params", () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://backend.example.com/";

    expect(
      buildApiUrl(apiEndpoints.users.list, {
        page: 2,
        search: "anna",
        status: ["active", "trial"],
      }),
    ).toBe(
      "https://backend.example.com/api/v1/users?page=2&search=anna&status=active&status=trial",
    );
  });

  it("normalizes the backend bind address for browser requests", () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://0.0.0.0:8000";

    expect(buildApiUrl(apiEndpoints.dashboard.kpis)).toBe(
      "http://127.0.0.1:8000/api/v1/dashboard/kpis",
    );
  });

  it("uses the documented backend base when live mode has no explicit URL", () => {
    process.env.NEXT_PUBLIC_API_MODE = "live";
    process.env.NEXT_PUBLIC_API_BASE_URL = "";

    expect(buildApiUrl(apiEndpoints.auth.login)).toBe(
      "http://127.0.0.1:8000/api/v1/auth/login",
    );
  });

  it("normalizes FastAPI error envelopes into ApiError", async () => {
    process.env.NEXT_PUBLIC_API_MODE = "live";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            error: {
              code: "UNPROCESSABLE_ENTITY",
              details: [{ loc: ["body", "email"], msg: "Invalid email" }],
              message: "Request validation failed",
            },
            request_id: "req_123",
          }),
          {
            headers: { "content-type": "application/json" },
            status: 422,
          },
        ),
      ),
    );

    await expect(apiRequest(apiEndpoints.auth.login)).rejects.toMatchObject({
      code: "UNPROCESSABLE_ENTITY",
      details: { "body.email": ["Invalid email"] },
      request_id: "req_123",
      status: 422,
    });
  });

  it("sends bearer tokens, JSON bodies, and credentials for live requests", async () => {
    process.env.NEXT_PUBLIC_API_MODE = "live";
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://backend.example.com";
    setAccessToken("access_123");
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ success: true }), {
        headers: { "content-type": "application/json" },
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await apiRequest(apiEndpoints.users.block("usr_1"), {
      body: { reason: "Quality check" },
      method: "POST",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://backend.example.com/api/v1/users/usr_1/block",
      expect.objectContaining({
        body: JSON.stringify({ reason: "Quality check" }),
        credentials: "include",
        method: "POST",
      }),
    );
    const calls = fetchMock.mock.calls as unknown as [string, RequestInit][];
    const requestInit = calls[0]![1];
    const headers = requestInit.headers as Headers;

    expect(headers.get("Authorization")).toBe("Bearer access_123");
  });

  it("preserves the two-step auth flow in mock mode", async () => {
    const loginResponse = await login({
      email: "admin@subhub.app",
      password: "strong-password",
    });

    expect(loginResponse.requires_2fa).toBe(true);
    expect(loginResponse.temp_token).toContain("admin@subhub.app");

    await verify2fa({
      code: "123456",
      temp_token: loginResponse.temp_token!,
    });

    expect(getAccessToken()).toContain("mock_access_");
  });
});
