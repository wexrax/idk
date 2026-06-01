import type {
  AdminProfile,
  Confirm2faResponse,
  LoginRequest,
  LoginResponse,
  RefreshResponse,
  Setup2faResponse,
  Verify2faRequest,
} from "./auth-contracts";
import { ApiError } from "./contracts";
import { apiEndpoints } from "./endpoints";
import { apiRequest, getAccessToken, getApiMode, setAccessToken } from "./http-client";

type JwtPayload = {
  sub?: string;
};

type ItemEnvelope<T> = {
  item?: T;
};

type RawAdminProfile = Partial<AdminProfile> & {
  _id?: string;
  id?: string;
  permissions?: string[];
};

function getJwtPayload(token: string | null): JwtPayload {
  if (!token || typeof window === "undefined") {
    return {};
  }

  try {
    const [, payload] = token.split(".");
    if (!payload) {
      return {};
    }

    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(window.atob(normalizedPayload)) as JwtPayload;
  } catch {
    return {};
  }
}

function normalizeAdminProfile(raw: RawAdminProfile): AdminProfile {
  const id = raw.id ?? raw._id ?? "admin";
  const email = raw.email ?? "admin@subhub.app";

  return {
    avatar_url: raw.avatar_url ?? null,
    email,
    id,
    mfa_enabled: Boolean(raw.mfa_enabled),
    name: raw.name ?? email.split("@")[0] ?? "Admin",
    permissions: raw.permissions ?? [],
    role: raw.role ?? "admin",
  };
}

function persistToken<T extends { access_token?: string }>(response: T): T {
  if (response.access_token) {
    setAccessToken(response.access_token);
  }

  return response;
}

export async function login(request: LoginRequest): Promise<LoginResponse> {
  if (getApiMode() === "mock") {
    return {
      requires_2fa: true,
      temp_token: `mock_2fa_${request.email}`,
    };
  }

  return persistToken(
    await apiRequest<LoginResponse>(apiEndpoints.auth.login, {
      body: request,
      method: "POST",
    }),
  );
}

export async function verify2fa(
  request: Verify2faRequest,
): Promise<RefreshResponse> {
  if (getApiMode() === "mock") {
    return persistToken({
      access_token: `mock_access_${request.temp_token}`,
      token_type: "bearer" as const,
    });
  }

  return persistToken(
    await apiRequest<RefreshResponse>(apiEndpoints.auth.verify2fa, {
      body: request,
      method: "POST",
    }),
  );
}

export async function refreshAuth(): Promise<RefreshResponse> {
  if (getApiMode() === "mock") {
    return persistToken({
      access_token: "mock_access_refreshed",
      token_type: "bearer" as const,
    });
  }

  return persistToken(
    await apiRequest<RefreshResponse>(apiEndpoints.auth.refresh, {
      method: "POST",
    }),
  );
}

export async function logout(): Promise<{ success: boolean }> {
  if (getApiMode() === "mock") {
    setAccessToken(null);
    return { success: true };
  }

  const response = await apiRequest<{ success: boolean }>(apiEndpoints.auth.logout, {
    method: "POST",
  });

  setAccessToken(null);
  return response;
}

export function setup2fa(): Promise<Setup2faResponse> {
  if (getApiMode() === "mock") {
    return Promise.resolve({
      otpauth_url: "otpauth://totp/SubHub:admin@subhub.app?secret=MOCK",
      secret: "MOCK",
    });
  }

  return apiRequest<Setup2faResponse>(apiEndpoints.auth.setup2fa, {
    method: "POST",
  });
}

export function confirm2faSetup(code: string): Promise<Confirm2faResponse> {
  if (getApiMode() === "mock") {
    return Promise.resolve({ enabled: code.length === 6 });
  }

  return apiRequest<Confirm2faResponse>(apiEndpoints.auth.confirm2faSetup, {
    body: { code },
    method: "POST",
  });
}

export function disable2fa(): Promise<Confirm2faResponse> {
  if (getApiMode() === "mock") {
    return Promise.resolve({ enabled: false });
  }

  return apiRequest<Confirm2faResponse>(apiEndpoints.auth.disable2fa, {
    method: "DELETE",
  });
}

export function getAdminProfile(): Promise<AdminProfile> {
  if (getApiMode() === "mock") {
    return Promise.resolve({
      avatar_url: null,
      email: "admin@subhub.app",
      id: "mock-admin",
      mfa_enabled: true,
      name: "SubHub Admin",
      permissions: ["dashboard:read", "billing:write", "security:read"],
      role: "super_admin",
    });
  }

  return apiRequest<AdminProfile>(apiEndpoints.auth.me)
    .then(normalizeAdminProfile)
    .catch(async (error) => {
      if (!(error instanceof ApiError) || error.status !== 404) {
        throw error;
      }

      const adminId = getJwtPayload(getAccessToken()).sub;
      if (!adminId) {
        throw error;
      }

      const raw = await apiRequest<ItemEnvelope<RawAdminProfile>>(
        apiEndpoints.security.adminUser(adminId),
      );
      return normalizeAdminProfile(raw.item ?? {});
    });
}
