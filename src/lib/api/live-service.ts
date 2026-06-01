import {
  ApiError,
  type AdminJob,
  type AnalyticsWorkspace,
  type AnalyticsExportRequest,
  type AnalyticsScheduledReportRequest,
  type Anomaly,
  type AdminNotification,
  type AdminNotificationStatus,
  type AdminNotificationTone,
  type ApiResponse,
  type BillingReport,
  type ChurnRisk,
  type DashboardKpis,
  type DashboardNewUsers,
  type DashboardRiskSummary,
  type ExportJob,
  type GamificationAchievement,
  type GamificationAchievementRequest,
  type GamificationLoyaltyTier,
  type GamificationLoyaltyTierRequest,
  type GamificationPointsAdjustmentRequest,
  type GamificationPointsAdjustmentResult,
  type GamificationRewardItem,
  type GamificationRewardRequest,
  type GamificationReview,
  type GamificationReviewPatchRequest,
  type GamificationReviewReplyRequest,
  type GamificationWorkspace,
  type GrantPointsRequest,
  type MarketingCampaign,
  type MarketingCampaignJob,
  type MarketingCampaignRequest,
  type MarketingPromoBulkRequest,
  type MarketingPromoCodeRequest,
  type MarketingPromoCoupon,
  type MarketingReferralConfigRequest,
  type MarketingSegment,
  type MarketingSegmentRequest,
  type MarketingTemplate,
  type MarketingTemplateRequest,
  type MarketingWorkspace,
  type MrrPoint,
  type NotificationStatusPatchRequest,
  type KpiMetric,
  type PaymentGateway,
  type PaymentGatewayStatus,
  type PaymentGatewayPatchRequest,
  type PaymentGatewayTestResult,
  type PaymentTransaction,
  type PaymentTransactionStatus,
  type PaginatedResponse,
  type AdminSession,
  type SecurityHeaderPolicy,
  type SecurityPoliciesPatchRequest,
  type SecurityRoleAssignmentRequest,
  type SecurityRateLimitRule,
  type SecurityWorkspace,
  type SecurityRoleKey,
  type SecuritySeverity,
  type SettingsPatchRequest,
  type SettingsWorkspace,
  type SmartAnalyticsWorkspace,
  type SmartAutomationRunResult,
  type Subscription,
  type SubscriptionMutationRequest,
  type SubscriptionPromoRequest,
  type Tariff,
  type TariffMutationRequest,
  type TopService,
  type UserBulkActionRequest,
  type UserBulkActionResult,
  type UserFilterParams,
  type UserNoteRequest,
  type UserProfile,
  type UserRow,
  type UserStatus,
} from "./contracts";
import { apiEndpoints } from "./endpoints";
import { apiRequest, type QueryParams } from "./http-client";

type ApiRecord = Record<string, unknown>;

type ListEnvelope<T> = {
  items?: T[];
  page?: number;
  per_page?: number;
  total?: number;
  total_pages?: number;
};

let isNotificationsListEndpointMissing = false;

type ItemEnvelope<T> = {
  item?: T;
};

const currencyFallback = "RUB" as const;

function response<T>(data: T): ApiResponse<T> {
  return { data };
}

function asRecord(value: unknown): ApiRecord {
  return value && typeof value === "object" ? (value as ApiRecord) : {};
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asList<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function idOf(record: ApiRecord): string {
  return asString(record.id ?? record._id);
}

function payloadDataFrom(payload: unknown): unknown {
  const envelope = asRecord(payload);
  return envelope.data ?? payload;
}

function itemFrom<T>(payload: ItemEnvelope<T> | T): T {
  const data = payloadDataFrom(payload);
  const envelope = asRecord(data);
  return (envelope.item ?? data) as T;
}

function listFrom<T>(payload: ListEnvelope<T> | T[]): T[] {
  const data = payloadDataFrom(payload);

  if (Array.isArray(data)) {
    return data as T[];
  }

  return asList<T>(asRecord(data).items);
}

function listEnvelopeFrom<T>(payload: ListEnvelope<T> | T[]): ListEnvelope<T> {
  const data = payloadDataFrom(payload);

  if (Array.isArray(data)) {
    return {
      items: data as T[],
      page: 1,
      per_page: data.length,
      total: data.length,
      total_pages: 1,
    };
  }

  return data as ListEnvelope<T>;
}

async function optionalList<T>(path: string): Promise<ListEnvelope<T>> {
  try {
    return await apiRequest<ListEnvelope<T>>(path);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return { items: [], page: 1, per_page: 25, total: 0, total_pages: 1 };
    }

    throw error;
  }
}

async function optionalRecord(path: string): Promise<ApiRecord> {
  try {
    return asRecord(await apiRequest<ApiRecord>(path));
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return {};
    }

    throw error;
  }
}

async function recoverableList<T>(path: string): Promise<ListEnvelope<T>> {
  try {
    return await apiRequest<ListEnvelope<T>>(path);
  } catch (error) {
    if (
      error instanceof ApiError &&
      (error.status === 404 || error.status >= 500)
    ) {
      return { items: [], page: 1, per_page: 25, total: 0, total_pages: 1 };
    }

    throw error;
  }
}

function normalizeKpi(value: unknown): KpiMetric {
  if (value && typeof value === "object") {
    return {
      trend: "flat" as const,
      value: 0,
      ...(value as ApiRecord),
    } as KpiMetric;
  }

  return {
    trend: "flat" as const,
    value: asNumber(value),
  };
}

function normalizeService(raw: unknown) {
  const record = asRecord(raw);

  return {
    icon_url: asString(record.icon_url) || null,
    id: idOf(record),
    name: asString(record.name, "Service"),
  };
}

function normalizeTopService(raw: unknown): TopService {
  const record = asRecord(raw);

  return {
    ...normalizeService(record),
    subscribers: asNumber(
      record.subscribers ?? record.active_subscriptions_count ?? record.subscriptions_count ?? record.users_count,
    ),
  };
}

function normalizeUserRow(raw: unknown): UserRow {
  const record = asRecord(raw);
  const tariff = asRecord(record.tariff);

  return {
    avatar_url: asString(record.avatar_url) || null,
    churn_risk: asString(record.churn_risk, "low") as ChurnRisk,
    email: asString(record.email),
    id: idOf(record),
    last_seen_at: asString(record.last_seen_at ?? record.updated_at),
    mrr: asNumber(record.mrr),
    name: asString(record.name, asString(record.email)),
    registered_at: asString(record.registered_at ?? record.created_at),
    status: asString(record.status, "active") as UserStatus,
    tariff: asString(record.tariff_name ?? tariff.name, "Unknown"),
    tariff_id: asString(record.tariff_id ?? tariff.id),
  };
}

function normalizeDashboardNewUsers(raw: unknown): DashboardNewUsers {
  const record = asRecord(raw);

  return {
    count: asNumber(record.count ?? record.total),
    items: asList<unknown>(record.items).map(normalizeUserRow),
  };
}

function normalizeDashboardRiskSummary(raw: unknown): DashboardRiskSummary {
  const record = asRecord(raw);

  return {
    currency: asString(record.currency, currencyFallback) as DashboardRiskSummary["currency"],
    expected_loss: asNumber(record.expected_loss),
    high: asNumber(record.high),
    low: asNumber(record.low),
    medium: asNumber(record.medium),
  };
}

function normalizeNotificationTone(raw: unknown): AdminNotificationTone {
  const value = asString(raw).toLowerCase();

  if (value === "critical" || value === "danger" || value === "error") {
    return "danger";
  }

  if (value === "success" || value === "queued") {
    return "success";
  }

  if (value === "warning") {
    return "warning";
  }

  return "info";
}

function normalizeNotificationStatus(raw: unknown): AdminNotificationStatus {
  const value = asString(raw, "unread").toLowerCase();

  if (value === "read" || value === "archived") {
    return value;
  }

  return "unread";
}

function notificationHref(raw: ApiRecord): string {
  const notificationArea = asString(raw.module ?? raw.area ?? raw.type ?? raw.channel).toLowerCase();

  if (notificationArea.includes("security")) {
    return "/security";
  }

  if (notificationArea.includes("marketing") || notificationArea.includes("campaign")) {
    return "/marketing";
  }

  if (notificationArea.includes("analytics") || notificationArea.includes("report")) {
    return "/analytics";
  }

  if (
    notificationArea.includes("subscription")
    || notificationArea.includes("billing")
    || notificationArea.includes("payment")
  ) {
    return "/subscriptions";
  }

  if (notificationArea.includes("user")) {
    return "/users";
  }

  return asString(raw.href, "/dashboard");
}

function normalizeNotification(raw: unknown): AdminNotification {
  const record = asRecord(raw);
  const payload = asRecord(record.payload);
  const status = normalizeNotificationStatus(record.status);
  const title = asString(record.title ?? payload.title ?? record.type, "Notification");
  const description = asString(
    record.description ?? record.message ?? payload.description ?? payload.message ?? record.channel,
    "Notification event",
  );

  return {
    description,
    href: notificationHref(record),
    id: idOf(record),
    isRead: status === "read",
    status,
    time: asString(record.time ?? record.created_at ?? record.updated_at, "now"),
    title,
    tone: normalizeNotificationTone(record.severity ?? record.tone ?? record.type ?? record.status),
  };
}

async function getDashboardRiskSummaryFallback(): Promise<DashboardRiskSummary> {
  const raw = await apiRequest<ListEnvelope<ApiRecord>>(apiEndpoints.users.list, {
    query: { page: 1, per_page: 100 },
  });
  const users = listFrom(raw).map(normalizeUserRow);
  const high = users.filter((user) => user.churn_risk === "high").length;
  const medium = users.filter((user) => user.churn_risk === "medium").length;
  const low = users.filter((user) => user.churn_risk === "low").length;
  const expectedLoss = users
    .filter((user) => user.churn_risk === "high" || user.churn_risk === "medium")
    .reduce((sum, user) => sum + user.mrr, 0);

  return {
    currency: currencyFallback,
    expected_loss: expectedLoss,
    high,
    low,
    medium,
  };
}

function normalizeSubscription(raw: unknown, fallbackTariff = "Unknown"): Subscription {
  const sub = asRecord(raw);
  const amount = asRecord(sub.amount);
  const tariff = asRecord(sub.tariff);

  return {
    auto_renew: asBoolean(sub.auto_renew, true),
    currency: asString(sub.currency ?? amount.currency, currencyFallback) as Subscription["currency"],
    expires_at: asString(sub.expires_at ?? sub.ends_at ?? sub.next_billing_at),
    id: idOf(sub),
    price: asNumber(sub.price ?? sub.amount, asNumber(amount.amount)),
    service: normalizeService(sub.service),
    started_at: asString(sub.started_at ?? sub.created_at),
    status: asString(sub.status, "active") as Subscription["status"],
    tariff: asString(sub.tariff_name ?? tariff.name ?? sub.tariff, fallbackTariff),
    tariff_id: asString(sub.tariff_id ?? tariff.id),
  };
}

function normalizeUserProfile(raw: unknown): UserProfile {
  const record = asRecord(raw);
  const row = normalizeUserRow(record);
  const subscriptions = asList<unknown>(
    record.subscriptions ?? record.active_subscriptions,
  ).map((subscription) => normalizeSubscription(subscription, row.tariff));

  return {
    ...row,
    active_subscriptions: subscriptions.filter((item) => item.status === "active"),
    block_reason: asString(record.block_reason) || undefined,
    churn_probability: asNumber(record.churn_probability),
    country: asString(record.country, "RU"),
    devices: asList<ApiRecord>(record.devices).map((device) => ({
      app_version: asString(device.app_version),
      id: idOf(device),
      last_seen_at: asString(device.last_seen_at),
      model: asString(device.model),
      platform: asString(device.platform, "web") as UserProfile["devices"][number]["platform"],
    })),
    notes: asList<string>(record.notes),
    phone: asString(record.phone) || null,
    points_balance: asNumber(record.points_balance),
    subscriptions,
  };
}

function normalizeTariff(raw: unknown): Tariff {
  const record = asRecord(raw);
  const price = asRecord(record.price);

  return {
    currency: asString(price.currency, currencyFallback) as Tariff["currency"],
    id: idOf(record),
    is_public: asBoolean(record.is_public, true),
    name: asString(record.name, "Tariff"),
    period: asString(record.period ?? record.billing_period, "month") as Tariff["period"],
    price: asNumber(record.price, asNumber(price.amount)),
    services: asList<unknown>(record.services).map(normalizeService),
    status: asString(record.status, "active") as Tariff["status"],
    subscribers: asNumber(record.subscribers),
    trial_days: asNumber(record.trial_days),
  };
}

function normalizeTransactionStatus(value: unknown): PaymentTransactionStatus {
  const status = asString(value, "success");

  if (status === "failed" || status === "refund" || status === "disputed") {
    return status;
  }

  return "success";
}

function normalizePaymentTransaction(raw: unknown): PaymentTransaction {
  const record = asRecord(raw);
  const user = asRecord(record.user);
  const amount = asRecord(record.amount);
  const gateway = asRecord(record.gateway);

  return {
    amount: asNumber(record.amount, asNumber(amount.amount)),
    date: asString(record.date ?? record.created_at ?? record.paid_at),
    gateway: asString(record.gateway_name ?? gateway.name ?? record.gateway, "Gateway"),
    id: idOf(record),
    status: normalizeTransactionStatus(record.status),
    user: asString(
      record.user_name ?? user.name ?? user.email ?? record.email ?? record.user_id,
      "User",
    ),
  };
}

function normalizeGatewayStatus(value: unknown): PaymentGatewayStatus {
  const status = asString(value, "active");

  if (status === "test" || status === "disabled") {
    return status;
  }

  return "active";
}

function normalizePaymentGateway(raw: unknown): PaymentGateway {
  const record = asRecord(raw);

  return {
    declineRate: asNumber(record.declineRate ?? record.decline_rate ?? record.decline_rate_pct),
    id: idOf(record),
    methods: asList<string>(record.methods).join(", ") || asString(record.methods, "Cards"),
    name: asString(record.name, "Gateway"),
    priority: asNumber(record.priority, 1),
    status: record.enabled === false ? "disabled" : normalizeGatewayStatus(record.status),
  };
}

function normalizeBillingReport(raw: unknown): BillingReport {
  const record = asRecord(raw);

  return {
    arr: asNumber(record.arr),
    churn_revenue: asNumber(record.churn_revenue),
    mrr: asNumber(record.mrr),
    nrr: asNumber(record.nrr),
  };
}

function normalizeExportJob(raw: unknown): ExportJob {
  const record = asRecord(raw);

  return {
    job_id: asString(record.job_id ?? record.id),
    status: asString(record.status, "queued"),
  };
}

function normalizeUserBulkActionResult(raw: unknown): UserBulkActionResult {
  const record = asRecord(raw);

  return {
    job_id: asString(record.job_id) || undefined,
    status: asString(record.status, "queued"),
    updated: asNumber(record.updated),
  };
}

function normalizeGatewayTestResult(raw: unknown, gatewayId: string): PaymentGatewayTestResult {
  const record = asRecord(raw);

  return {
    gateway_id: asString(record.gateway_id, gatewayId),
    ok: asBoolean(record.ok),
  };
}

function normalizeCampaignStatus(value: unknown): MarketingWorkspace["campaigns"][number]["status"] {
  const status = asString(value, "draft");

  if (status === "scheduled" || status === "sending") {
    return status;
  }

  if (status === "cancelled") {
    return "cancelled";
  }

  if (status === "completed" || status === "sent") {
    return "completed";
  }

  return "draft";
}

function normalizeMarketingChannel(value: unknown): MarketingWorkspace["campaigns"][number]["channel"] {
  const channel = asString(value, "email");

  if (channel === "push" || channel === "sms") {
    return channel;
  }

  return "email";
}

function normalizeSegmentName(segmentId: unknown, segmentsById: Map<string, string>): string {
  const id = asString(segmentId);
  return (segmentsById.get(id) ?? id) || "All users";
}

function normalizeSecuritySeverity(value: unknown, fallback: SecuritySeverity = "low"): SecuritySeverity {
  const raw = asString(value).toLowerCase();

  if (["critical", "high", "danger"].includes(raw)) {
    return "high";
  }

  if (["medium", "warning", "warn"].includes(raw)) {
    return "medium";
  }

  if (raw === "low") {
    return "low";
  }

  return fallback;
}

function normalizeSecurityRoleKey(value: unknown): SecurityRoleKey {
  const raw = asString(value, "support").toLowerCase();

  if (["owner", "super_admin", "admin", "root"].includes(raw)) {
    return "owner";
  }

  if (["security", "security_admin"].includes(raw)) {
    return "security";
  }

  if (["finance", "billing"].includes(raw)) {
    return "finance";
  }

  if (["analyst", "analytics", "marketer", "marketing"].includes(raw)) {
    return "analyst";
  }

  return "support";
}

function severityFromAction(action: string): SecuritySeverity {
  const normalized = action.toLowerCase();

  if (
    normalized.includes("delete") ||
    normalized.includes("terminate") ||
    normalized.includes("settings") ||
    normalized.includes("refund")
  ) {
    return "high";
  }

  if (
    normalized.includes("update") ||
    normalized.includes("create") ||
    normalized.includes("login") ||
    normalized.includes("2fa")
  ) {
    return "medium";
  }

  return "low";
}

function normalizeSecurityAuditEvent(value: unknown): SecurityWorkspace["audit_events"][number] {
  const record = asRecord(value);
  const actor = asRecord(record.actor);
  const action = asString(record.action, "audit.event");
  const metadata = record.metadata ?? record.details ?? record.evidence;

  return {
    action,
    actor:
      asString(actor.email) ||
      asString(record.actor_email) ||
      asString(record.actor_id) ||
      asString(record.actor, "system"),
    evidence: typeof metadata === "string" ? metadata : JSON.stringify(metadata ?? {}),
    id: idOf(record) || `${action}-${asString(record.created_at, "live")}`,
    ip: asString(record.ip ?? record.ip_address ?? record.request_ip, "unknown"),
    severity: normalizeSecuritySeverity(record.severity, severityFromAction(action)),
    target: asString(record.target_id ?? record.target ?? record.resource, "-"),
    time: asString(record.created_at ?? record.timestamp ?? record.time, ""),
  };
}

function normalizeAdminSession(value: unknown): AdminSession {
  const record = asRecord(value);
  const revoked = asBoolean(record.revoked) || asBoolean(record.is_revoked);
  const expired = asBoolean(record.expired) || asBoolean(record.is_expired);
  const status = revoked || expired ? "terminated" : "active";

  return {
    admin:
      asString(record.admin_email) ||
      asString(record.user_email) ||
      asString(record.email) ||
      asString(record.sub) ||
      asString(record.admin_id ?? record.user_id, "admin"),
    device: asString(record.device ?? record.user_agent ?? record.client, "Browser session"),
    id: asString(record.jti) || idOf(record),
    ip: asString(record.ip ?? record.ip_address, "unknown"),
    last_seen: asString(record.last_seen ?? record.updated_at ?? record.created_at ?? record.expires_at, ""),
    location: asString(record.location ?? record.country ?? record.city, "unknown"),
    risk: normalizeSecuritySeverity(record.risk, revoked ? "high" : "low"),
    status,
  };
}

function normalizeSecurityRoles(adminUsers: ApiRecord[]): SecurityWorkspace["roles"] {
  const counts = new Map<SecurityRoleKey, number>();

  for (const user of adminUsers) {
    const role = normalizeSecurityRoleKey(user.role);
    counts.set(role, (counts.get(role) ?? 0) + 1);
  }

  const names: Record<SecurityRoleKey, string> = {
    analyst: "Analyst",
    finance: "Finance",
    owner: "Owner",
    security: "Security",
    support: "Support",
  };

  return (Object.keys(names) as SecurityRoleKey[]).map((role) => ({
    description: `Live admin users with ${role} permissions`,
    id: role,
    name: names[role],
    risk: role === "owner" || role === "security" ? "medium" : "low",
    users: counts.get(role) ?? 0,
  }));
}

function normalizeSecurityAssignments(adminUsers: ApiRecord[]): SecurityWorkspace["role_assignments"] {
  return adminUsers.map((user) => ({
    changed_by: asString(user.updated_by ?? user.created_by, "backend"),
    id: idOf(user) || asString(user.email),
    reason: "Backend admin user role",
    role: normalizeSecurityRoleKey(user.role),
    status: asString(user.status).toLowerCase() === "disabled" ? "expired" : "active",
    user: asString(user.email ?? user.name, "admin"),
  }));
}

function normalizeMfaUsers(adminUsers: ApiRecord[]): SecurityWorkspace["mfa_users"] {
  return adminUsers.map((user) => {
    const enabled = asBoolean(user.two_factor_enabled) || asBoolean(user.mfa_enabled);

    return {
      admin: asString(user.email ?? user.name, "admin"),
      backup_codes_left: asNumber(user.backup_codes_left),
      id: idOf(user) || asString(user.email),
      last_challenge_at: asString(user.last_challenge_at ?? user.updated_at, ""),
      primary_factor: "totp",
      recommendation: enabled ? "MFA enabled" : "Enable MFA for this admin",
      risk: enabled ? "low" : "medium",
      role: normalizeSecurityRoleKey(user.role),
      status: enabled ? "enabled" : "pending",
      trusted_devices: asNumber(user.trusted_devices),
    };
  });
}

function normalizePermissionMatrix(): SecurityWorkspace["permission_matrix"] {
  return [
    {
      analyst: true,
      area: "dashboard:read",
      finance: true,
      id: "dashboard-read",
      owner: true,
      security: true,
      support: true,
    },
    {
      analyst: false,
      area: "security:admin",
      finance: false,
      id: "security-admin",
      owner: true,
      security: true,
      support: false,
    },
    {
      analyst: false,
      area: "settings:admin",
      finance: false,
      id: "settings-admin",
      owner: true,
      security: true,
      support: false,
    },
    {
      analyst: false,
      area: "billing:write",
      finance: true,
      id: "billing-write",
      owner: true,
      security: false,
      support: false,
    },
  ];
}

function normalizeMfaPolicy(settings: ApiRecord): SecurityWorkspace["mfa_policy"] {
  const policy = asRecord(settings.mfa_policy);
  const requiredRoles = asList<unknown>(policy.required_for_roles ?? settings.mfa_required_for_roles)
    .map(normalizeSecurityRoleKey);

  return {
    backup_codes_required: asNumber(policy.backup_codes_required ?? settings.mfa_backup_codes_required),
    grace_period_days: asNumber(policy.grace_period_days ?? settings.mfa_grace_period_days),
    min_coverage_pct: asNumber(policy.min_coverage_pct ?? settings.mfa_min_coverage_pct),
    required_for_roles: requiredRoles,
    updated_at: asString(policy.updated_at ?? settings.updated_at, ""),
  };
}

function normalizeRateLimitRule(raw: unknown): SecurityRateLimitRule {
  const record = asRecord(raw);
  const status = asString(record.status, "active");
  const risk = asString(record.risk ?? record.severity, "medium");

  return {
    burst: asNumber(record.burst),
    endpoint: asString(record.endpoint ?? record.path, "*"),
    id: idOf(record) || asString(record.name, "rate-limit"),
    limit: asNumber(record.limit),
    name: asString(record.name, "Rate limit"),
    owner: asString(record.owner ?? record.updated_by, "security"),
    risk: risk === "high" || risk === "low" ? risk : "medium",
    status: status === "review" || status === "disabled" ? status : "active",
    updated_at: asString(record.updated_at),
    window_seconds: asNumber(record.window_seconds ?? record.window),
  };
}

function normalizeHeaderPolicy(raw: unknown): SecurityHeaderPolicy {
  const record = asRecord(raw);
  const status = asString(record.status, "active");
  const risk = asString(record.risk ?? record.severity, "medium");

  return {
    coverage_pct: asNumber(record.coverage_pct ?? record.coverage),
    header: asString(record.header ?? record.name, "Header"),
    id: idOf(record) || asString(record.header ?? record.name, "header-policy"),
    recommendation: asString(record.recommendation),
    risk: risk === "high" || risk === "low" ? risk : "medium",
    status: status === "review" || status === "disabled" ? status : "active",
    value: asString(record.value),
  };
}

function normalizePoliciesRecord(raw: ApiRecord): Pick<
  SecurityWorkspace,
  "header_policies" | "mfa_policy" | "rate_limit_rules"
> {
  return {
    header_policies: asList<unknown>(raw.header_policies ?? raw.headers).map(normalizeHeaderPolicy),
    mfa_policy: normalizeMfaPolicy(raw),
    rate_limit_rules: asList<unknown>(raw.rate_limit_rules ?? raw.rate_limits).map(normalizeRateLimitRule),
  };
}

function normalizeSettingsAlertRules(settings: ApiRecord): SettingsWorkspace["alert_rules"] {
  const rules: SettingsWorkspace["alert_rules"] = [];
  const churnThreshold = settings.alert_churn_rate_threshold;
  const declineThreshold = settings.alert_decline_rate_threshold;
  const latencyThreshold = settings.alert_api_latency_ms_threshold;

  if (typeof churnThreshold === "number") {
    rules.push({
      channel: "Admin console",
      id: "alert-churn-rate-threshold",
      name: "Churn anomaly",
      owner: "backend",
      status: churnThreshold > 0 ? "active" : "muted",
      threshold: `${churnThreshold}%`,
    });
  }

  if (typeof declineThreshold === "number") {
    rules.push({
      channel: "Payments",
      id: "alert-decline-rate-threshold",
      name: "Payment decline rate",
      owner: "backend",
      status: declineThreshold > 0 ? "active" : "muted",
      threshold: `${declineThreshold}%`,
    });
  }

  if (typeof latencyThreshold === "number") {
    rules.push({
      channel: "API",
      id: "alert-api-latency-ms-threshold",
      name: "API latency",
      owner: "backend",
      status: latencyThreshold > 0 ? "active" : "muted",
      threshold: `${latencyThreshold} ms`,
    });
  }

  return rules;
}

function normalizeMarketingCampaign(
  raw: unknown,
  segmentsById: Map<string, string>,
): MarketingWorkspace["campaigns"][number] {
  const record = asRecord(raw);
  const stats = asRecord(record.stats);

  return {
    audience_size: asNumber(record.audience_size ?? record.users_count ?? stats.sent),
    channel: normalizeMarketingChannel(record.channel),
    conversion_rate: asNumber(record.conversion_rate ?? stats.conversion_rate),
    ctr: asNumber(record.ctr ?? stats.ctr ?? stats.opened),
    id: idOf(record),
    name: asString(record.name, "Campaign"),
    segment: normalizeSegmentName(record.segment_id ?? record.segment, segmentsById),
    starts_at: asString(record.starts_at ?? record.scheduled_at ?? record.created_at),
    status: normalizeCampaignStatus(record.status),
  };
}

function normalizeMarketingPromoCoupon(raw: unknown): MarketingWorkspace["promo_coupons"][number] {
  const record = asRecord(raw);
  const isActive = asBoolean(record.is_active, true);

  return {
    code: asString(record.code),
    discount_type: asString(record.discount_type, "percent") === "fixed" ? "fixed" : "percent",
    discount_value: asNumber(record.discount_value),
    expires_at: asString(record.expires_at),
    id: idOf(record),
    segment: asString(record.segment, "All users"),
    status: isActive ? "active" : "expired",
    title: asString(record.title ?? record.code, "Promo code"),
    usage_limit: asNumber(record.usage_limit ?? record.max_uses),
    used_count: asNumber(record.used_count),
  };
}

function normalizeMarketingSegment(raw: unknown): MarketingSegment {
  const record = asRecord(raw);

  return {
    audience_size: asNumber(record.audience_size ?? record.users_count ?? record.count),
    filters: asRecord(record.filters),
    id: idOf(record),
    name: asString(record.name, "Segment"),
    updated_at: asString(record.updated_at ?? record.created_at),
  };
}

function normalizeMarketingTemplate(raw: unknown): MarketingTemplate {
  const record = asRecord(raw);
  const status = asString(record.status, "active");

  return {
    body: asString(record.body),
    category: asString(record.category, "General"),
    channel: normalizeMarketingChannel(record.channel),
    cta: asString(record.cta),
    id: idOf(record),
    name: asString(record.name, "Template"),
    status: status === "draft" || status === "archived" ? status : "active",
    subject: asString(record.subject ?? record.title),
    usage_count: asNumber(record.usage_count ?? record.used_count),
  };
}

function normalizeReferralEvent(raw: unknown): MarketingWorkspace["referral_events"][number] {
  const record = asRecord(raw);
  const advocate = asRecord(record.advocate);
  const friend = asRecord(record.friend);
  const status = asString(record.status, "pending");

  return {
    advocate: asString(record.advocate_name ?? advocate.name ?? record.advocate_id, "Advocate"),
    channel: normalizeMarketingChannel(record.channel),
    friend: asString(record.friend_name ?? friend.name ?? record.friend_id, "Friend"),
    id: idOf(record),
    invited_at: asString(record.invited_at ?? record.created_at),
    reward: asString(record.reward ?? record.reward_points, "0"),
    status: status === "active" || status === "rewarded" ? status : "pending",
  };
}

function normalizeAnalyticsReport(raw: unknown): AnalyticsWorkspace["reports"][number] {
  const record = asRecord(raw);
  const status = asString(record.status, "ready");

  return {
    arpu: asString(record.arpu, String(asNumber(record.arpu_amount))),
    churn: asString(record.churn, String(asNumber(record.churn_rate))),
    id: idOf(record),
    mrr: asString(record.mrr, String(asNumber(record.mrr_amount))),
    name: asString(record.name, "Report"),
    owner: asString(record.owner ?? record.created_by, "Analytics"),
    period: asString(record.period),
    segment: asString(record.segment, "All users"),
    status: status === "review" || status === "queued" ? status : "ready",
  };
}

function normalizeAnalyticsExport(raw: unknown): AnalyticsWorkspace["exports"][number] {
  const record = asRecord(raw);
  const format = asString(record.format, "CSV").toUpperCase();

  return {
    format: format === "PDF" || format === "XLSX" ? format : "CSV",
    id: asString(record.id ?? record.job_id),
    name: asString(record.name ?? record.type, "Export"),
    rows: asString(record.rows, String(asNumber(record.row_count))),
    status: asString(record.status, "queued"),
  };
}

function normalizeAnalyticsSchedule(raw: unknown): AnalyticsWorkspace["scheduled_reports"][number] {
  const record = asRecord(raw);
  const format = asString(record.format, "PDF").toUpperCase();
  const frequency = asString(record.frequency, "weekly");

  return {
    format: format === "CSV" || format === "XLSX" ? format : "PDF",
    frequency:
      frequency === "daily" || frequency === "monthly" ? frequency : "weekly",
    id: idOf(record),
    name: asString(record.name, "Scheduled report"),
    next_run_at: asString(record.next_run_at),
    owner_email: asString(record.owner_email ?? asList<string>(record.recipients)[0]),
    status: asString(record.status, "active"),
  };
}

function normalizeGamificationAchievement(raw: unknown): GamificationAchievement {
  const record = asRecord(raw);

  return {
    description: asString(record.description),
    icon: asString(record.icon, "TROPHY"),
    id: idOf(record),
    reward_type: asString(record.reward_type, "points") as GamificationAchievement["reward_type"],
    reward_value: asString(record.reward_value ?? record.reward),
    status: asString(record.status, "active") as GamificationAchievement["status"],
    title: asString(record.title ?? record.name),
    trigger_count: asNumber(record.trigger_count, 1),
    trigger_event: asString(record.trigger_event, "manual"),
  };
}

function normalizeGamificationReward(raw: unknown): GamificationRewardItem {
  const record = asRecord(raw);

  return {
    category: asString(record.category, "General"),
    cost: asNumber(record.cost),
    id: idOf(record),
    name: asString(record.name ?? record.title),
    redemptions: asNumber(record.redemptions ?? record.redeemed_count),
    stock: asNumber(record.stock),
  };
}

function normalizeGamificationLoyaltySummary(raw: unknown): GamificationWorkspace["loyalty_summary"] {
  const record = asRecord(raw);

  return {
    active_members: asNumber(record.active_members ?? record.members),
    average_points_per_user: asNumber(
      record.average_points_per_user ?? record.average_balance,
    ),
    points_balance: asNumber(record.points_balance ?? record.total_points),
    points_earned_month: asNumber(record.points_earned_month ?? record.earned_month),
    points_spent_month: asNumber(record.points_spent_month ?? record.spent_month),
  };
}

function normalizeGamificationLoyaltyTier(raw: unknown): GamificationLoyaltyTier {
  const record = asRecord(raw);

  return {
    benefit: asString(record.benefit ?? record.description),
    id: idOf(record),
    members: asNumber(record.members ?? record.users_count),
    name: asString(record.name ?? record.title),
    status: asString(record.status, "active") as GamificationLoyaltyTier["status"],
    threshold: asNumber(record.threshold ?? record.min_points),
  };
}

function normalizeGamificationReview(raw: unknown): GamificationReview {
  const record = asRecord(raw);

  return {
    date: asString(record.date ?? record.created_at),
    id: idOf(record),
    rating: asNumber(record.rating),
    response: asString(record.response ?? record.reply),
    sentiment: asString(record.sentiment, "neutral") as GamificationReview["sentiment"],
    source: asString(record.source),
    status: asString(record.status, "new") as GamificationReview["status"],
    tags: asList<string>(record.tags),
    text: asString(record.text ?? record.body ?? record.comment),
    user: asString(record.user ?? record.user_name),
  };
}

function normalizeGamificationLoyaltyEvent(
  raw: unknown,
): GamificationWorkspace["loyalty_events"][number] {
  const record = asRecord(raw);

  return {
    amount: asNumber(record.amount),
    date: asString(record.date ?? record.created_at),
    event_type: asString(
      record.event_type,
      "adjusted",
    ) as GamificationWorkspace["loyalty_events"][number]["event_type"],
    id: idOf(record),
    reason: asString(record.reason ?? record.comment),
    source: asString(record.source),
    user: asString(record.user ?? record.user_name),
  };
}

function normalizeGamificationPointsAdjustmentResult(
  raw: unknown,
): GamificationPointsAdjustmentResult {
  const payload = itemFrom(raw as ItemEnvelope<unknown> | unknown);
  const record = asRecord(payload);
  const eventRaw = record.event ?? record.item ?? payload;
  const summaryRaw = record.loyalty_summary ?? record.summary;

  return {
    event: normalizeGamificationLoyaltyEvent(eventRaw),
    loyalty_summary: normalizeGamificationLoyaltySummary(summaryRaw),
  };
}

function normalizeAdminJob(raw: unknown): AdminJob {
  const record = asRecord(raw);
  const status = asString(record.status, "queued");

  return {
    created_at: asString(record.created_at),
    error: asString(record.error) || null,
    finished_at: asString(record.finished_at) || null,
    input_data: asRecord(record.input_data ?? record.input),
    job_id: asString(record.job_id ?? record.id),
    progress_pct: asNumber(record.progress_pct ?? record.progress),
    requested_by: asString(record.requested_by),
    result: record.result ? asRecord(record.result) : null,
    started_at: asString(record.started_at) || null,
    status:
      status === "running" ||
      status === "completed" ||
      status === "failed" ||
      status === "cancelled"
        ? status
        : "queued",
    type: asString(record.type, "job"),
  };
}

function automationTriggerLabel(value: unknown): string {
  const trigger = asRecord(value);
  const type = asString(trigger.type ?? value, "manual");

  if (type === "subscription_expiring") {
    const days = asNumber(trigger.days_before);
    return days > 0 ? `subscription_expiring_${days}d` : "subscription_expiring";
  }

  return type;
}

function automationChannel(actions: unknown): MarketingWorkspace["automation_rules"][number]["channel"] {
  const firstAction = asList<ApiRecord>(actions)[0];
  const type = asString(firstAction?.type);

  if (type === "send_push") {
    return "push";
  }

  if (type === "send_sms") {
    return "sms";
  }

  return "email";
}

function automationTemplateId(actions: unknown): string {
  const firstAction = asList<ApiRecord>(actions)[0];
  return asString(firstAction?.template_id ?? firstAction?.title ?? firstAction?.type);
}

function normalizeMarketingAutomation(
  raw: unknown,
  segmentsById: Map<string, string>,
): MarketingWorkspace["automation_rules"][number] {
  const record = asRecord(raw);

  return {
    channel: automationChannel(record.actions),
    delay_hours: asNumber(record.delay_hours),
    id: idOf(record),
    name: asString(record.name, "Automation"),
    segment: normalizeSegmentName(record.segment_id ?? record.segment, segmentsById),
    status: asString(record.status, "active") === "paused" ? "paused" : "active",
    template_id: automationTemplateId(record.actions),
    trigger: automationTriggerLabel(record.trigger),
  };
}

function normalizeSmartAutomation(raw: unknown): SmartAnalyticsWorkspace["automations"][number] {
  const record = asRecord(raw);
  const status = asString(record.status, "active");

  return {
    audience: asString(record.audience ?? record.segment ?? record.segment_id, "All users"),
    channel: automationChannel(record.actions),
    id: idOf(record),
    name: asString(record.name, "Automation"),
    status: status === "active" ? "active" : status === "paused" ? "review" : "draft",
    trigger: automationTriggerLabel(record.trigger),
  };
}

function queryFromUserParams(params: UserFilterParams = {}): QueryParams {
  return {
    churn_risk: params.churn_risk ?? params.risk,
    page: params.page,
    per_page: params.per_page,
    registered_from: params.registered_from,
    registered_to: params.registered_to,
    search: params.search,
    status: params.status,
    tariff_id: params.tariff_id,
  };
}

export const liveApiService = {
  async getDashboard(): Promise<ApiResponse<DashboardKpis>> {
    const raw = asRecord(await apiRequest(apiEndpoints.dashboard.kpis));
    const mrr = asRecord(raw.mrr);

    return response({
      active_users: normalizeKpi(raw.active_users),
      churn_rate: {
        ...normalizeKpi(raw.churn_rate),
        delta_pp: asNumber(asRecord(raw.churn_rate).delta_pp),
        is_alert: asBoolean(asRecord(raw.churn_rate).is_alert),
      },
      ltv_cac_ratio: {
        ...normalizeKpi(raw.ltv_cac_ratio),
        romi_pct: asNumber(asRecord(raw.ltv_cac_ratio).romi_pct),
      },
      mrr: {
        ...normalizeKpi(mrr),
        arr: asNumber(mrr.arr, asNumber(mrr.value) * 12),
        currency: asString(mrr.currency, currencyFallback) as DashboardKpis["mrr"]["currency"],
      },
      updated_at: asString(raw.updated_at ?? raw.generated_at ?? raw.refreshed_at, new Date().toISOString()),
    });
  },

  async getMrrChart(): Promise<ApiResponse<MrrPoint[]>> {
    const raw = await apiRequest<ListEnvelope<ApiRecord>>(apiEndpoints.dashboard.mrrChart);

    return response(
      listFrom(raw).map((point) => ({
        date: asString(point.date ?? point.period, "current"),
        mrr: asNumber(point.mrr),
        new_users: asNumber(point.new_users),
      })),
    );
  },

  async getDashboardNewUsers(): Promise<ApiResponse<DashboardNewUsers>> {
    const raw = await apiRequest<ApiRecord>(apiEndpoints.dashboard.newUsers);
    return response(normalizeDashboardNewUsers(raw));
  },

  async getDashboardRiskSummary(): Promise<ApiResponse<DashboardRiskSummary>> {
    try {
      const raw = await apiRequest<ApiRecord>(apiEndpoints.dashboard.riskSummary);
      return response(normalizeDashboardRiskSummary(raw));
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return response(await getDashboardRiskSummaryFallback());
      }

      throw error;
    }
  },

  async getAnomalies(): Promise<ApiResponse<Anomaly[]>> {
    const raw = await apiRequest<ListEnvelope<ApiRecord>>(apiEndpoints.dashboard.anomalies);

    return response(
      listFrom(raw).map((item) => ({
        created_at: asString(item.created_at),
        description: asString(item.description),
        id: idOf(item),
        is_read: asBoolean(item.is_read),
        severity: asString(item.severity, "info") as Anomaly["severity"],
        title: asString(item.title, "Anomaly"),
      })),
    );
  },

  async getTopServices(): Promise<ApiResponse<TopService[]>> {
    const raw = await apiRequest<ListEnvelope<ApiRecord>>(apiEndpoints.dashboard.topServices);
    return response(listFrom(raw).map(normalizeTopService));
  },

  async getUsers(
    params?: UserFilterParams,
  ): Promise<ApiResponse<PaginatedResponse<UserRow>>> {
    const raw = await apiRequest<ListEnvelope<ApiRecord>>(apiEndpoints.users.list, {
      query: queryFromUserParams(params),
    });
    const envelope = listEnvelopeFrom(raw);
    const items = listFrom(envelope).map(normalizeUserRow);
    const page = envelope.page ?? params?.page ?? 1;
    const perPage = envelope.per_page ?? params?.per_page ?? 25;
    const total = envelope.total ?? items.length;

    return response({
      items,
      page,
      per_page: perPage,
      total,
      total_pages: envelope.total_pages ?? Math.max(1, Math.ceil(total / perPage)),
    });
  },

  async exportUsers(): Promise<ApiResponse<ExportJob>> {
    const raw = await apiRequest<ApiRecord>(apiEndpoints.users.export);
    return response(normalizeExportJob(raw));
  },

  async bulkUserAction(
    request: UserBulkActionRequest,
  ): Promise<ApiResponse<UserBulkActionResult>> {
    const raw = await apiRequest<ApiRecord>(apiEndpoints.users.bulkAction, {
      body: request,
      method: "POST",
    });
    return response(normalizeUserBulkActionResult(raw));
  },

  async getUser(id: string): Promise<ApiResponse<UserProfile>> {
    const raw = await apiRequest<ItemEnvelope<ApiRecord>>(apiEndpoints.users.user(id));
    return response(normalizeUserProfile(itemFrom(raw)));
  },

  async blockUser(id: string): Promise<ApiResponse<null>> {
    await apiRequest(apiEndpoints.users.block(id), { method: "POST" });
    return response(null);
  },

  async unblockUser(id: string): Promise<ApiResponse<null>> {
    await apiRequest(apiEndpoints.users.unblock(id), { method: "POST" });
    return response(null);
  },

  async grantPoints(
    id: string,
    request: GrantPointsRequest,
  ): Promise<ApiResponse<null>> {
    await apiRequest(apiEndpoints.users.grantPoints(id), {
      body: {
        points: request.amount,
        reason: request.comment,
      },
      method: "POST",
    });
    return response(null);
  },

  async deductPoints(
    id: string,
    request: GrantPointsRequest,
  ): Promise<ApiResponse<null>> {
    await apiRequest(apiEndpoints.users.deductPoints(id), {
      body: {
        points: request.amount,
        reason: request.comment,
      },
      method: "POST",
    });
    return response(null);
  },

  async addUserNote(id: string, request: UserNoteRequest): Promise<ApiResponse<string[]>> {
    const raw = await apiRequest<ApiRecord>(apiEndpoints.users.notes(id), {
      body: request,
      method: "POST",
    });
    return response(asList<string>(raw.notes));
  },

  async getTariffs(): Promise<ApiResponse<Tariff[]>> {
    const raw = await apiRequest<ListEnvelope<ApiRecord>>(apiEndpoints.subscriptions.tariffs);
    return response(listFrom(raw).map(normalizeTariff));
  },

  async createTariff(request: TariffMutationRequest): Promise<ApiResponse<Tariff>> {
    const raw = await apiRequest<ItemEnvelope<ApiRecord>>(apiEndpoints.subscriptions.tariffs, {
      body: request,
      method: "POST",
    });
    return response(normalizeTariff(itemFrom(raw)));
  },

  async updateTariff(
    tariffId: string,
    request: TariffMutationRequest,
  ): Promise<ApiResponse<Tariff>> {
    const raw = await apiRequest<ItemEnvelope<ApiRecord>>(apiEndpoints.subscriptions.tariff(tariffId), {
      body: request,
      method: "PATCH",
    });
    return response(normalizeTariff(itemFrom(raw)));
  },

  async archiveTariff(tariffId: string): Promise<ApiResponse<{ success: boolean }>> {
    const raw = await apiRequest<{ success: boolean }>(
      apiEndpoints.subscriptions.tariffArchive(tariffId),
      { method: "POST" },
    );
    return response({ success: Boolean(raw.success) });
  },

  async duplicateTariff(tariffId: string): Promise<ApiResponse<Tariff>> {
    const raw = await apiRequest<ItemEnvelope<ApiRecord>>(
      apiEndpoints.subscriptions.tariffDuplicate(tariffId),
      { method: "POST" },
    );
    return response(normalizeTariff(itemFrom(raw)));
  },

  async getSubscriptions(): Promise<ApiResponse<Subscription[]>> {
    const raw = await apiRequest<ListEnvelope<ApiRecord>>(apiEndpoints.subscriptions.subscriptions);
    return response(listFrom(raw).map((subscription) => normalizeSubscription(subscription)));
  },

  async updateSubscription(
    subscriptionId: string,
    request: SubscriptionMutationRequest,
  ): Promise<ApiResponse<Subscription>> {
    const raw = await apiRequest<ItemEnvelope<ApiRecord>>(
      apiEndpoints.subscriptions.subscription(subscriptionId),
      {
        body: request,
        method: "PATCH",
      },
    );
    return response(normalizeSubscription(itemFrom(raw)));
  },

  async applySubscriptionPromo(
    subscriptionId: string,
    request: SubscriptionPromoRequest,
  ): Promise<ApiResponse<Subscription>> {
    const raw = await apiRequest<ItemEnvelope<ApiRecord>>(
      apiEndpoints.subscriptions.subscriptionApplyPromo(subscriptionId),
      {
        body: {
          code: request.code.trim().toUpperCase(),
        },
        method: "POST",
      },
    );
    return response(normalizeSubscription(itemFrom(raw)));
  },

  async getTransactions(): Promise<ApiResponse<PaymentTransaction[]>> {
    const raw = await apiRequest<ListEnvelope<ApiRecord>>(apiEndpoints.billing.transactions);
    return response(listFrom(raw).map(normalizePaymentTransaction));
  },

  async getPaymentGateways(): Promise<ApiResponse<PaymentGateway[]>> {
    const raw = await apiRequest<ListEnvelope<ApiRecord>>(apiEndpoints.billing.gateways);
    return response(listFrom(raw).map(normalizePaymentGateway));
  },

  async getBillingReport(): Promise<ApiResponse<BillingReport>> {
    const raw = await apiRequest<ApiRecord>(apiEndpoints.billing.report);
    return response(normalizeBillingReport(raw));
  },

  async exportBillingReport(): Promise<ApiResponse<ExportJob>> {
    const raw = await apiRequest<ApiRecord>(apiEndpoints.billing.reportExport);
    return response(normalizeExportJob(raw));
  },

  async testPaymentGateway(
    gatewayId: string,
  ): Promise<ApiResponse<PaymentGatewayTestResult>> {
    const raw = await apiRequest<ApiRecord>(apiEndpoints.billing.gatewayTest(gatewayId), {
      method: "POST",
    });
    return response(normalizeGatewayTestResult(raw, gatewayId));
  },

  async updatePaymentGateway(
    gatewayId: string,
    request: PaymentGatewayPatchRequest,
  ): Promise<ApiResponse<PaymentGateway>> {
    const raw = await apiRequest<ItemEnvelope<ApiRecord>>(apiEndpoints.billing.gateway(gatewayId), {
      body: request,
      method: "PATCH",
    });
    return response(normalizePaymentGateway(itemFrom(raw)));
  },

  async getMarketingWorkspace(): Promise<ApiResponse<MarketingWorkspace>> {
    const [campaigns, promoCodes, segments, templates, referralStats, referrals, automations] = await Promise.all([
      apiRequest<ListEnvelope<ApiRecord>>(apiEndpoints.marketing.campaigns),
      apiRequest<ListEnvelope<ApiRecord>>(apiEndpoints.marketing.promoCodes),
      optionalList<ApiRecord>(apiEndpoints.marketing.segments),
      optionalList<ApiRecord>(apiEndpoints.marketing.templates),
      apiRequest<ApiRecord>(apiEndpoints.marketing.referralStats),
      apiRequest<ListEnvelope<ApiRecord>>(apiEndpoints.marketing.referrals),
      apiRequest<ListEnvelope<ApiRecord>>(apiEndpoints.automations.list),
    ]);
    const segmentItems = listFrom(segments);
    const segmentsById = new Map(
      segmentItems.map((segment) => [idOf(segment), asString(segment.name, idOf(segment))]),
    );

    return response({
      automation_rules: listFrom(automations).map((automation) =>
        normalizeMarketingAutomation(automation, segmentsById),
      ),
      campaigns: listFrom(campaigns).map((campaign) =>
        normalizeMarketingCampaign(campaign, segmentsById),
      ),
      experiments: [],
      message_drafts: [],
      promo_coupons: listFrom(promoCodes).map(normalizeMarketingPromoCoupon),
      referral_events: listFrom(referrals).map(normalizeReferralEvent),
      referral_summary: {
        active_advocates: asNumber(referralStats.active_advocates ?? referralStats.participants),
        conversion_rate: asNumber(referralStats.conversion_rate),
        conversions_month: asNumber(referralStats.conversions_month ?? referralStats.rewarded),
        invites_month: asNumber(referralStats.invites_month ?? referralStats.participants),
        reward_budget: asNumber(referralStats.reward_budget),
      },
      referral_tiers: [],
      segments: segmentItems.map(normalizeMarketingSegment),
      templates: listFrom(templates).map(normalizeMarketingTemplate),
    });
  },

  async createMarketingCampaign(
    request: MarketingCampaignRequest,
  ): Promise<ApiResponse<MarketingCampaign>> {
    const raw = await apiRequest<ItemEnvelope<ApiRecord>>(apiEndpoints.marketing.campaigns, {
      body: request,
      method: "POST",
    });

    return response(normalizeMarketingCampaign(itemFrom(raw), new Map()));
  },

  async updateMarketingCampaign(
    campaignId: string,
    request: MarketingCampaignRequest,
  ): Promise<ApiResponse<MarketingCampaign>> {
    const raw = await apiRequest<ItemEnvelope<ApiRecord>>(apiEndpoints.marketing.campaign(campaignId), {
      body: request,
      method: "PATCH",
    });

    return response(normalizeMarketingCampaign(itemFrom(raw), new Map()));
  },

  async sendMarketingCampaign(campaignId: string): Promise<ApiResponse<MarketingCampaignJob>> {
    const raw = asRecord(
      await apiRequest<ApiRecord>(apiEndpoints.marketing.campaignSend(campaignId), {
        method: "POST",
      }),
    );

    return response({
      campaign_id: asString(raw.campaign_id, campaignId),
      job_id: asString(raw.job_id),
      status: asString(raw.status, "queued"),
    });
  },

  async cancelMarketingCampaign(campaignId: string): Promise<ApiResponse<{ success: boolean }>> {
    const raw = await apiRequest<{ success?: boolean }>(
      apiEndpoints.marketing.campaignCancel(campaignId),
      {
        method: "POST",
      },
    );

    return response({ success: raw.success !== false });
  },

  async deleteMarketingCampaign(campaignId: string): Promise<ApiResponse<{ success: boolean }>> {
    const raw = await apiRequest<{ success?: boolean }>(
      apiEndpoints.marketing.campaign(campaignId),
      {
        method: "DELETE",
      },
    );

    return response({ success: raw.success !== false });
  },

  async createMarketingPromoCode(
    request: MarketingPromoCodeRequest,
  ): Promise<ApiResponse<MarketingPromoCoupon>> {
    const raw = await apiRequest<ItemEnvelope<ApiRecord>>(apiEndpoints.marketing.promoCodes, {
      body: request,
      method: "POST",
    });

    return response(normalizeMarketingPromoCoupon(itemFrom(raw)));
  },

  async createMarketingPromoCodesBulk(
    request: MarketingPromoBulkRequest,
  ): Promise<ApiResponse<MarketingPromoCoupon[]>> {
    const raw = await apiRequest<ListEnvelope<ApiRecord> | ApiRecord[]>(
      apiEndpoints.marketing.promoCodesBulk,
      {
        body: request,
        method: "POST",
      },
    );

    return response(listFrom(raw).map(normalizeMarketingPromoCoupon));
  },

  async updateMarketingPromoCode(
    promoId: string,
    request: Partial<MarketingPromoCodeRequest>,
  ): Promise<ApiResponse<MarketingPromoCoupon>> {
    const raw = await apiRequest<ItemEnvelope<ApiRecord>>(apiEndpoints.marketing.promoCode(promoId), {
      body: request,
      method: "PATCH",
    });

    return response(normalizeMarketingPromoCoupon(itemFrom(raw)));
  },

  async deactivateMarketingPromoCode(promoId: string): Promise<ApiResponse<{ success: boolean }>> {
    const raw = await apiRequest<{ success?: boolean }>(
      apiEndpoints.marketing.promoCode(promoId),
      {
        method: "DELETE",
      },
    );

    return response({ success: raw.success !== false });
  },

  async createMarketingSegment(
    request: MarketingSegmentRequest,
  ): Promise<ApiResponse<MarketingSegment>> {
    const raw = await apiRequest<ItemEnvelope<ApiRecord>>(apiEndpoints.marketing.segments, {
      body: request,
      method: "POST",
    });

    return response(normalizeMarketingSegment(itemFrom(raw)));
  },

  async updateMarketingSegment(
    segmentId: string,
    request: MarketingSegmentRequest,
  ): Promise<ApiResponse<MarketingSegment>> {
    const raw = await apiRequest<ItemEnvelope<ApiRecord>>(apiEndpoints.marketing.segment(segmentId), {
      body: request,
      method: "PATCH",
    });

    return response(normalizeMarketingSegment(itemFrom(raw)));
  },

  async refreshMarketingSegment(segmentId: string): Promise<ApiResponse<MarketingSegment>> {
    const raw = await apiRequest<ItemEnvelope<ApiRecord>>(
      apiEndpoints.marketing.segmentRefresh(segmentId),
      {
        method: "POST",
      },
    );

    return response(normalizeMarketingSegment(itemFrom(raw)));
  },

  async createMarketingTemplate(
    request: MarketingTemplateRequest,
  ): Promise<ApiResponse<MarketingTemplate>> {
    const raw = await apiRequest<ItemEnvelope<ApiRecord>>(apiEndpoints.marketing.templates, {
      body: request,
      method: "POST",
    });

    return response(normalizeMarketingTemplate(itemFrom(raw)));
  },

  async updateMarketingTemplate(
    templateId: string,
    request: Partial<MarketingTemplateRequest>,
  ): Promise<ApiResponse<MarketingTemplate>> {
    const raw = await apiRequest<ItemEnvelope<ApiRecord>>(apiEndpoints.marketing.template(templateId), {
      body: request,
      method: "PATCH",
    });

    return response(normalizeMarketingTemplate(itemFrom(raw)));
  },

  async deleteMarketingTemplate(templateId: string): Promise<ApiResponse<{ success: boolean }>> {
    const raw = await apiRequest<{ success?: boolean }>(
      apiEndpoints.marketing.template(templateId),
      {
        method: "DELETE",
      },
    );

    return response({ success: raw.success !== false });
  },

  async updateReferralConfig(
    request: MarketingReferralConfigRequest,
  ): Promise<ApiResponse<{ success: boolean }>> {
    const raw = await apiRequest<{ success?: boolean }>(apiEndpoints.marketing.referralConfig, {
      body: request,
      method: "PATCH",
    });

    return response({ success: raw.success !== false });
  },

  async getAnalyticsWorkspace(): Promise<ApiResponse<AnalyticsWorkspace>> {
    const [ltv, churnRisk, reports, exports, scheduledReports] = await Promise.all([
      apiRequest<ApiRecord>(apiEndpoints.analytics.ltv),
      apiRequest<ListEnvelope<ApiRecord>>(apiEndpoints.analytics.churnRisk),
      optionalList<ApiRecord>(apiEndpoints.analytics.reports),
      optionalList<ApiRecord>(apiEndpoints.analytics.exports),
      optionalList<ApiRecord>(apiEndpoints.analytics.scheduledReports),
    ]);

    return response({
      cohorts: listFrom(churnRisk).map((segment) => ({
        arpu: String(asNumber(segment.arpu)),
        churn: String(asNumber(segment.churn_probability ?? segment.churn)),
        id: idOf(segment),
        name: asString(segment.name ?? segment.user_id, "Segment"),
        recommendation: asString(segment.recommended_action),
        retention: String(100 - asNumber(segment.churn_probability ?? segment.churn)),
        users: asNumber(segment.users, 1),
      })),
      custom_dashboards: [],
      exports: listFrom(exports).map(normalizeAnalyticsExport),
      reports: listFrom(reports).map(normalizeAnalyticsReport),
      scheduled_reports: listFrom(scheduledReports).map(normalizeAnalyticsSchedule),
      summary: {
        churn: "0",
        churn_delta: "0",
        mrr: String(asNumber(ltv.mrr)),
        mrr_delta: "0",
      },
    });
  },

  async createAnalyticsExport(
    request: AnalyticsExportRequest,
  ): Promise<ApiResponse<AnalyticsWorkspace["exports"][number]>> {
    const raw = await apiRequest<ItemEnvelope<ApiRecord>>(apiEndpoints.analytics.exports, {
      body: request,
      method: "POST",
    });

    return response(normalizeAnalyticsExport(itemFrom(raw)));
  },

  async createAnalyticsScheduledReport(
    request: AnalyticsScheduledReportRequest,
  ): Promise<ApiResponse<AnalyticsWorkspace["scheduled_reports"][number]>> {
    const raw = await apiRequest<ItemEnvelope<ApiRecord>>(
      apiEndpoints.analytics.scheduledReports,
      {
        body: request,
        method: "POST",
      },
    );

    return response(normalizeAnalyticsSchedule(itemFrom(raw)));
  },

  async getGamificationWorkspace(): Promise<ApiResponse<GamificationWorkspace>> {
    const [
      achievements,
      rewards,
      rewardHistory,
      loyaltyLedger,
      loyaltySummary,
      loyaltyTiers,
      reviews,
    ] = await Promise.all([
      apiRequest<ListEnvelope<ApiRecord>>(
        apiEndpoints.gamification.achievements,
      ),
      apiRequest<ListEnvelope<ApiRecord>>(
        apiEndpoints.gamification.rewards,
      ),
      optionalList<ApiRecord>(
        apiEndpoints.gamification.rewardHistory,
      ),
      optionalList<ApiRecord>(apiEndpoints.gamification.loyaltyLedger),
      optionalRecord(apiEndpoints.gamification.loyaltySummary),
      optionalList<ApiRecord>(apiEndpoints.gamification.loyaltyTiers),
      apiRequest<ListEnvelope<ApiRecord>>(
        apiEndpoints.gamification.reviews,
      ),
    ]);
    const ledgerItems = listFrom(loyaltyLedger);

    return response({
      achievements: listFrom(achievements).map(normalizeGamificationAchievement),
      loyalty_events: (ledgerItems.length > 0 ? ledgerItems : listFrom(rewardHistory)).map(
        normalizeGamificationLoyaltyEvent,
      ),
      loyalty_summary: normalizeGamificationLoyaltySummary(loyaltySummary),
      loyalty_tiers: listFrom(loyaltyTiers).map(normalizeGamificationLoyaltyTier),
      rewards: listFrom(rewards).map(normalizeGamificationReward),
      reviews: listFrom(reviews).map(normalizeGamificationReview),
    });
  },

  async createGamificationAchievement(
    request: GamificationAchievementRequest,
  ): Promise<ApiResponse<GamificationAchievement>> {
    const raw = await apiRequest<ItemEnvelope<ApiRecord>>(apiEndpoints.gamification.achievements, {
      body: request,
      method: "POST",
    });

    return response(normalizeGamificationAchievement(itemFrom(raw)));
  },

  async updateGamificationAchievement(
    achievementId: string,
    request: Partial<GamificationAchievementRequest>,
  ): Promise<ApiResponse<GamificationAchievement>> {
    const raw = await apiRequest<ItemEnvelope<ApiRecord>>(
      apiEndpoints.gamification.achievement(achievementId),
      {
        body: request,
        method: "PATCH",
      },
    );

    return response(normalizeGamificationAchievement(itemFrom(raw)));
  },

  async deleteGamificationAchievement(
    achievementId: string,
  ): Promise<ApiResponse<{ success: boolean }>> {
    const raw = await apiRequest<{ success?: boolean }>(
      apiEndpoints.gamification.achievement(achievementId),
      { method: "DELETE" },
    );

    return response({ success: raw.success !== false });
  },

  async createGamificationReward(
    request: GamificationRewardRequest,
  ): Promise<ApiResponse<GamificationRewardItem>> {
    const raw = await apiRequest<ItemEnvelope<ApiRecord>>(apiEndpoints.gamification.rewards, {
      body: request,
      method: "POST",
    });

    return response(normalizeGamificationReward(itemFrom(raw)));
  },

  async updateGamificationReward(
    rewardId: string,
    request: Partial<GamificationRewardRequest>,
  ): Promise<ApiResponse<GamificationRewardItem>> {
    const raw = await apiRequest<ItemEnvelope<ApiRecord>>(
      apiEndpoints.gamification.reward(rewardId),
      {
        body: request,
        method: "PATCH",
      },
    );

    return response(normalizeGamificationReward(itemFrom(raw)));
  },

  async deleteGamificationReward(rewardId: string): Promise<ApiResponse<{ success: boolean }>> {
    const raw = await apiRequest<{ success?: boolean }>(
      apiEndpoints.gamification.reward(rewardId),
      { method: "DELETE" },
    );

    return response({ success: raw.success !== false });
  },

  async createGamificationLoyaltyTier(
    request: GamificationLoyaltyTierRequest,
  ): Promise<ApiResponse<GamificationLoyaltyTier>> {
    const raw = await apiRequest<ItemEnvelope<ApiRecord>>(apiEndpoints.gamification.loyaltyTiers, {
      body: request,
      method: "POST",
    });

    return response(normalizeGamificationLoyaltyTier(itemFrom(raw)));
  },

  async updateGamificationLoyaltyTier(
    tierId: string,
    request: Partial<GamificationLoyaltyTierRequest>,
  ): Promise<ApiResponse<GamificationLoyaltyTier>> {
    const raw = await apiRequest<ItemEnvelope<ApiRecord>>(
      apiEndpoints.gamification.loyaltyTier(tierId),
      {
        body: request,
        method: "PATCH",
      },
    );

    return response(normalizeGamificationLoyaltyTier(itemFrom(raw)));
  },

  async deleteGamificationLoyaltyTier(
    tierId: string,
  ): Promise<ApiResponse<{ success: boolean }>> {
    const raw = await apiRequest<{ success?: boolean }>(
      apiEndpoints.gamification.loyaltyTier(tierId),
      { method: "DELETE" },
    );

    return response({ success: raw.success !== false });
  },

  async adjustGamificationPoints(
    request: GamificationPointsAdjustmentRequest,
  ): Promise<ApiResponse<GamificationPointsAdjustmentResult>> {
    const raw = await apiRequest<ItemEnvelope<ApiRecord> | ApiRecord>(
      apiEndpoints.gamification.loyaltyPointsAdjust,
      {
        body: request,
        method: "POST",
      },
    );

    return response(normalizeGamificationPointsAdjustmentResult(raw));
  },

  async updateGamificationReview(
    reviewId: string,
    request: GamificationReviewPatchRequest,
  ): Promise<ApiResponse<GamificationReview>> {
    const raw = await apiRequest<ItemEnvelope<ApiRecord>>(
      apiEndpoints.gamification.review(reviewId),
      {
        body: request,
        method: "PATCH",
      },
    );

    return response(normalizeGamificationReview(itemFrom(raw)));
  },

  async replyToGamificationReview(
    reviewId: string,
    request: GamificationReviewReplyRequest,
  ): Promise<ApiResponse<GamificationReview>> {
    const raw = await apiRequest<ItemEnvelope<ApiRecord>>(
      apiEndpoints.gamification.reviewReply(reviewId),
      {
        body: request,
        method: "POST",
      },
    );

    return response(normalizeGamificationReview(itemFrom(raw)));
  },

  async getSmartAnalyticsWorkspace(): Promise<ApiResponse<SmartAnalyticsWorkspace>> {
    const [whatIf, churnRisk, automations] = await Promise.all([
      apiRequest<ApiRecord>(apiEndpoints.analytics.whatIf, {
        body: { horizon_months: 6 },
        method: "POST",
      }),
      apiRequest<ListEnvelope<ApiRecord>>(apiEndpoints.analytics.churnRisk),
      apiRequest<ListEnvelope<ApiRecord>>(apiEndpoints.automations.list),
    ]);

    return response({
      automations: listFrom(automations).map(normalizeSmartAutomation),
      risk_segments: listFrom(churnRisk).map((segment) => ({
        confidence_pct: asNumber(segment.confidence_pct),
        churn_probability_pct: asNumber(segment.churn_probability_pct),
        expected_loss: asNumber(segment.expected_loss),
        id: idOf(segment),
        name: asString(segment.name ?? segment.user_id, "Risk segment"),
        owner: asString(segment.owner),
        recommended_action: asString(segment.recommended_action),
        risk_score: asNumber(segment.risk_score),
        top_drivers: asList<string>(segment.top_drivers),
        users: asNumber(segment.users, 1),
      })),
      scenarios: [
        {
          churn_delta_pp: asNumber(whatIf.churn_delta_pp),
          horizon_months: asNumber(whatIf.horizon_months, 6),
          id: "live_what_if",
          ltv_impact_pct: asNumber(whatIf.ltv_impact_pct),
          name: "Live what-if",
          price_delta_pct: asNumber(whatIf.price_delta_pct),
          projected_mrr: asNumber(whatIf.projected_mrr),
          status: "ready",
          tariff: "Premium",
        },
      ],
    });
  },

  async runSmartAutomation(
    automationId: string,
  ): Promise<ApiResponse<SmartAutomationRunResult>> {
    const raw = await apiRequest<ApiRecord>(apiEndpoints.automations.automationRun(automationId), {
      method: "POST",
    });

    return response({
      actions: asList<unknown>(raw.actions),
      automation_id: asString(raw.automation_id ?? automationId, automationId),
      matched: asNumber(raw.matched),
    });
  },

  async getSecurityWorkspace(): Promise<ApiResponse<SecurityWorkspace>> {
    const [auditLog, sessions, adminUsers, settings, policies] = await Promise.all([
      recoverableList<ApiRecord>(apiEndpoints.security.auditLog),
      apiRequest<ListEnvelope<ApiRecord>>(apiEndpoints.security.sessions),
      apiRequest<ListEnvelope<ApiRecord>>(apiEndpoints.security.adminUsers),
      apiRequest<ItemEnvelope<ApiRecord>>(apiEndpoints.security.settings),
      optionalRecord(apiEndpoints.security.policies),
    ]);
    const adminUserItems = listFrom(adminUsers).map(asRecord);
    const settingsItem = asRecord(itemFrom(settings));
    const policiesItem = normalizePoliciesRecord({ ...settingsItem, ...policies });
    const mfaUsers = normalizeMfaUsers(adminUserItems);
    const mfaCoveragePct =
      mfaUsers.length > 0
        ? Math.round(
            (mfaUsers.filter((user) => user.status === "enabled").length / mfaUsers.length) * 100,
          )
        : asNumber(settingsItem.mfa_coverage_pct);

    return response({
      access_rules: [],
      audit_events: listFrom(auditLog).map(normalizeSecurityAuditEvent),
      change_history: [],
      header_policies: policiesItem.header_policies,
      mfa_coverage_pct: mfaCoveragePct,
      mfa_policy: policiesItem.mfa_policy,
      mfa_users: mfaUsers,
      permission_matrix: normalizePermissionMatrix(),
      rate_limit_rules: policiesItem.rate_limit_rules,
      role_assignments: normalizeSecurityAssignments(adminUserItems),
      roles: normalizeSecurityRoles(adminUserItems),
      session_history: [],
      sessions: listFrom(sessions).map(normalizeAdminSession),
    });
  },

  async updateSecurityPolicies(
    request: SecurityPoliciesPatchRequest,
  ): Promise<ApiResponse<SecurityWorkspace>> {
    const raw = await apiRequest<ApiRecord>(apiEndpoints.security.policies, {
      body: request,
      method: "PATCH",
    });
    const policies = normalizePoliciesRecord(raw);
    const current = await this.getSecurityWorkspace();

    return response({
      ...current.data,
      header_policies:
        policies.header_policies.length > 0 ? policies.header_policies : current.data.header_policies,
      mfa_policy: policies.mfa_policy,
      rate_limit_rules:
        policies.rate_limit_rules.length > 0 ? policies.rate_limit_rules : current.data.rate_limit_rules,
    });
  },

  async assignSecurityRole(
    request: SecurityRoleAssignmentRequest,
  ): Promise<ApiResponse<SecurityWorkspace>> {
    const adminUsers = await apiRequest<ListEnvelope<ApiRecord>>(
      apiEndpoints.security.adminUsers,
    );
    const normalizedUser = request.user.trim().toLowerCase();
    const existing = listFrom(adminUsers)
      .map(asRecord)
      .find((user) =>
        [idOf(user), asString(user.email), asString(user.name)]
          .map((value) => value.toLowerCase())
          .includes(normalizedUser),
      );

    if (existing) {
      const adminUserId = idOf(existing) || asString(existing.email);
      await apiRequest(apiEndpoints.security.adminUser(adminUserId), {
        body: { role: request.role, status: "active" },
        headers: {
          "X-Change-Reason": request.reason,
        },
        method: "PATCH",
      });
    } else {
      throw new ApiError({
        code: "ADMIN_USER_NOT_FOUND",
        message:
          "Администратор не найден. Сначала создайте пользователя с временным паролем.",
        request_id: "client-validation",
        status: 404,
      });
    }

    return this.getSecurityWorkspace();
  },

  async getJobs(): Promise<ApiResponse<PaginatedResponse<AdminJob>>> {
    const raw = await optionalList<ApiRecord>(apiEndpoints.jobs.list);
    const envelope = listEnvelopeFrom(raw);
    const items = listFrom(envelope).map(normalizeAdminJob);
    const page = envelope.page ?? 1;
    const perPage = envelope.per_page ?? 25;
    const total = envelope.total ?? items.length;

    return response({
      items,
      page,
      per_page: perPage,
      total,
      total_pages: envelope.total_pages ?? Math.max(1, Math.ceil(total / perPage)),
    });
  },

  async getJob(jobId: string): Promise<ApiResponse<AdminJob>> {
    const raw = await apiRequest<ItemEnvelope<ApiRecord>>(apiEndpoints.jobs.job(jobId));
    return response(normalizeAdminJob(itemFrom(raw)));
  },

  async cancelJob(jobId: string): Promise<ApiResponse<{ success: boolean }>> {
    const raw = await apiRequest<{ success?: boolean }>(apiEndpoints.jobs.job(jobId), {
      method: "DELETE",
    });

    return response({ success: raw.success !== false });
  },

  async getNotifications(): Promise<ApiResponse<PaginatedResponse<AdminNotification>>> {
    if (isNotificationsListEndpointMissing) {
      return response({
        items: [],
        page: 1,
        per_page: 25,
        total: 0,
        total_pages: 1,
      });
    }

    let raw: ListEnvelope<ApiRecord>;
    try {
      raw = await apiRequest<ListEnvelope<ApiRecord>>(apiEndpoints.notifications.list, {
        query: { page: 1, per_page: 25 },
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        isNotificationsListEndpointMissing = true;
        return response({
          items: [],
          page: 1,
          per_page: 25,
          total: 0,
          total_pages: 1,
        });
      }

      throw error;
    }
    const items = listFrom(raw)
      .map(normalizeNotification)
      .filter((notification) => notification.status !== "archived");
    const envelope = listEnvelopeFrom(raw);
    const page = envelope.page ?? 1;
    const perPage = envelope.per_page ?? 25;
    const total = envelope.total ?? items.length;

    return response({
      items,
      page,
      per_page: perPage,
      total,
      total_pages: envelope.total_pages ?? Math.max(1, Math.ceil(total / perPage)),
    });
  },

  async updateNotificationStatus(
    notificationId: string,
    request: NotificationStatusPatchRequest,
  ): Promise<ApiResponse<AdminNotification>> {
    const raw = await apiRequest<ItemEnvelope<ApiRecord>>(
      apiEndpoints.notifications.notification(notificationId),
      {
        body: request,
        method: "PATCH",
      },
    );
    return response(normalizeNotification(itemFrom(raw)));
  },

  async terminateAdminSession(sessionId: string): Promise<ApiResponse<{ success: boolean }>> {
    const result = await apiRequest<{ success?: boolean }>(apiEndpoints.security.session(sessionId), {
      method: "DELETE",
    });

    return response({ success: result.success !== false });
  },

  async getSettingsWorkspace(): Promise<ApiResponse<SettingsWorkspace>> {
    const raw = asRecord(itemFrom(await apiRequest<ItemEnvelope<ApiRecord>>(apiEndpoints.security.settings)));

    return response({
      alert_rules: normalizeSettingsAlertRules(raw),
      config_drafts: Object.entries(raw).map(([section, value]) => ({
        environment: "live",
        id: section,
        owner: "backend",
        section,
        status: "published",
        value: typeof value === "string" ? value : JSON.stringify(value),
      })),
      integrations: [],
      last_published_at: new Date().toISOString(),
    });
  },

  async updateSettings(request: SettingsPatchRequest): Promise<ApiResponse<SettingsWorkspace>> {
    const raw = asRecord(
      itemFrom(
        await apiRequest<ItemEnvelope<ApiRecord>>(apiEndpoints.security.settings, {
          body: request,
          method: "PATCH",
        }),
      ),
    );

    return response({
      alert_rules: normalizeSettingsAlertRules(raw),
      config_drafts: Object.entries(raw).map(([section, value]) => ({
        environment: "live",
        id: section,
        owner: "backend",
        section,
        status: "published",
        value: typeof value === "string" ? value : JSON.stringify(value),
      })),
      integrations: [],
      last_published_at: new Date().toISOString(),
    });
  },
};
