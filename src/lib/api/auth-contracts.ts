import { apiEndpoints, apiPath } from "./endpoints";

export const authEndpoints = {
  confirm2faSetup: apiPath(apiEndpoints.auth.confirm2faSetup),
  disable2fa: apiPath(apiEndpoints.auth.disable2fa),
  login: apiPath(apiEndpoints.auth.login),
  logout: apiPath(apiEndpoints.auth.logout),
  me: apiPath(apiEndpoints.auth.me),
  refresh: apiPath(apiEndpoints.auth.refresh),
  setup2fa: apiPath(apiEndpoints.auth.setup2fa),
  verify2fa: apiPath(apiEndpoints.auth.verify2fa),
} as const;

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  access_token?: string;
  requires_2fa: boolean;
  temp_token?: string;
  token_type?: "bearer";
  user?: AuthUser;
};

export type Verify2faRequest = {
  code: string;
  temp_token: string;
};

export type AuthUser = {
  email: string;
  id: string;
  name: string;
  role: "admin" | "analyst" | "finance" | "marketer" | "support";
};

export type AdminProfileRole = AuthUser["role"] | "super_admin";

export type AdminProfile = {
  avatar_url: null | string;
  email: string;
  id: string;
  mfa_enabled: boolean;
  name: string;
  permissions: string[];
  role: AdminProfileRole;
};

export type RefreshResponse = {
  access_token: string;
  token_type?: "bearer";
};

export type Setup2faResponse = {
  otpauth_url: string;
  secret: string;
};

export type Confirm2faResponse = {
  enabled: boolean;
};
