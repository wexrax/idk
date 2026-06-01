import {
  analyticsWorkspace,
  anomalies,
  dashboardKpis,
  gamificationWorkspace,
  marketingWorkspace,
  mrrChart,
  securityWorkspace,
  settingsWorkspace,
  smartAnalyticsWorkspace,
  tariffs,
  topServices,
  users,
} from "./mock-data";
import {
  type Anomaly,
  type AdminNotification,
  type AdminJob,
  type AnalyticsExportRequest,
  type AnalyticsScheduledReportRequest,
  type AnalyticsWorkspace,
  ApiError,
  type ApiResponse,
  type BillingReport,
  type BlockUserRequest,
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
  type PaymentGateway,
  type PaymentGatewayPatchRequest,
  type PaymentGatewayTestResult,
  type PaymentTransaction,
  type PaginatedResponse,
  type SecurityPoliciesPatchRequest,
  type SecurityRoleAssignmentRequest,
  type SecurityWorkspace,
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

const allowedPageSizes = [25, 50, 100] as const;
let mutableUsers = users.map((user) => cloneUser(user));
let mutableTariffs = tariffs.map((tariff) => cloneTariff(tariff));
let mutableSecurityWorkspace = cloneSecurityWorkspace(securityWorkspace);
let mutableSettingsWorkspace = cloneSettingsWorkspace(settingsWorkspace);
let mutableMarketingWorkspace = cloneMarketingWorkspace(marketingWorkspace);
let mutableAnalyticsWorkspace = cloneAnalyticsWorkspace(analyticsWorkspace);
let mutableGamificationWorkspace = cloneGamificationWorkspace(gamificationWorkspace);
let mutableJobs: AdminJob[] = [];
const initialMockNotifications: AdminNotification[] = [
  {
    description: "Robokassa вернула ошибку для 18 повторных списаний.",
    href: "/subscriptions",
    id: "notif-001",
    isRead: false,
    status: "unread",
    time: "2 мин",
    title: "Повторный платёж не прошёл",
    tone: "danger",
  },
  {
    description: "Новая сессия поддержки отмечена высоким risk score.",
    href: "/security",
    id: "notif-002",
    isRead: false,
    status: "unread",
    time: "12 мин",
    title: "Рискованная сессия администратора",
    tone: "warning",
  },
  {
    description: "MRR отчет за 90 дней готов к выгрузке.",
    href: "/analytics",
    id: "notif-003",
    isRead: false,
    status: "unread",
    time: "28 мин",
    title: "Экспорт выручки готов",
    tone: "success",
  },
  {
    description: "Stripe webhook latency стабилизировался после проверки.",
    href: "/settings",
    id: "notif-004",
    isRead: true,
    status: "read",
    time: "1 час",
    title: "Интеграция восстановлена",
    tone: "info",
  },
];
let mutableNotifications = initialMockNotifications.map((notification) => ({ ...notification }));

const mockTransactions: PaymentTransaction[] = [
  {
    amount: 3990,
    date: "21 мая, 12:14",
    gateway: "Robokassa",
    id: "txn-1001",
    status: "success",
    user: "Анна Р.",
  },
  {
    amount: 799,
    date: "21 мая, 11:48",
    gateway: "Stripe",
    id: "txn-1002",
    status: "failed",
    user: "Илья К.",
  },
  {
    amount: 1190,
    date: "20 мая, 18:22",
    gateway: "UnitPay",
    id: "txn-1003",
    status: "refund",
    user: "Мария С.",
  },
  {
    amount: 9900,
    date: "20 мая, 09:10",
    gateway: "Stripe",
    id: "txn-1004",
    status: "disputed",
    user: "Acme Team",
  },
];

const initialMockPaymentGateways: PaymentGateway[] = [
  {
    declineRate: 2.8,
    id: "robokassa",
    methods: "Карты, СБП",
    name: "Robokassa",
    priority: 1,
    status: "active",
  },
  {
    declineRate: 4.6,
    id: "stripe",
    methods: "Карты, Apple Pay",
    name: "Stripe",
    priority: 2,
    status: "test",
  },
  {
    declineRate: 8.1,
    id: "unitpay",
    methods: "Карты, кошельки",
    name: "UnitPay",
    priority: 3,
    status: "disabled",
  },
];
let mockPaymentGateways = initialMockPaymentGateways.map((gateway) => ({ ...gateway }));

function requestId(code: string) {
  return `mock_${code.toLowerCase()}_0001`;
}

function cloneUser(user: UserProfile): UserProfile {
  const subscriptions = user.active_subscriptions.map((subscription) => ({
    ...subscription,
    service: { ...subscription.service },
  }));

  return {
    ...user,
    active_subscriptions: subscriptions,
    devices: user.devices.map((device) => ({ ...device })),
    subscriptions,
  };
}

function cloneDashboard(data: DashboardKpis): DashboardKpis {
  return {
    active_users: { ...data.active_users },
    churn_rate: { ...data.churn_rate },
    ltv_cac_ratio: { ...data.ltv_cac_ratio },
    mrr: { ...data.mrr },
    updated_at: data.updated_at,
  };
}

function cloneMrrPoint(point: MrrPoint): MrrPoint {
  return { ...point };
}

function cloneAnomaly(anomaly: Anomaly): Anomaly {
  return { ...anomaly };
}

function cloneTopService(service: TopService): TopService {
  return { ...service };
}

function cloneTariff(tariff: Tariff): Tariff {
  return {
    ...tariff,
    services: tariff.services.map((service) => ({ ...service })),
  };
}

function tariffFromRequest(id: string, request: TariffMutationRequest): Tariff {
  return {
    currency: request.price.currency,
    id,
    is_public: true,
    name: request.name,
    period: request.billing_period,
    price: request.price.amount,
    services: request.service_ids.map((serviceId) => ({
      icon_url: null,
      id: serviceId,
      name: serviceId,
    })),
    status: request.status,
    subscribers: 0,
    trial_days: 0,
  };
}

function cloneMarketingWorkspace(data: MarketingWorkspace): MarketingWorkspace {
  return {
    automation_rules: data.automation_rules.map((rule) => ({ ...rule })),
    campaigns: data.campaigns.map((campaign) => ({ ...campaign })),
    experiments: data.experiments.map((experiment) => ({
      ...experiment,
      variants: experiment.variants.map((variant) => ({ ...variant })),
    })),
    message_drafts: data.message_drafts.map((draft) => ({ ...draft })),
    promo_coupons: data.promo_coupons.map((coupon) => ({ ...coupon })),
    referral_events: data.referral_events.map((event) => ({ ...event })),
    referral_summary: { ...data.referral_summary },
    referral_tiers: data.referral_tiers.map((tier) => ({ ...tier })),
    segments: data.segments.map((segment) => ({ ...segment, filters: { ...segment.filters } })),
    templates: data.templates.map((template) => ({ ...template })),
  };
}

function cloneAnalyticsWorkspace(data: AnalyticsWorkspace): AnalyticsWorkspace {
  return {
    cohorts: data.cohorts.map((cohort) => ({ ...cohort })),
    custom_dashboards: data.custom_dashboards.map((dashboard) => ({
      ...dashboard,
      widgets: dashboard.widgets.map((widget) => ({ ...widget })),
    })),
    exports: data.exports.map((job) => ({ ...job })),
    reports: data.reports.map((report) => ({ ...report })),
    scheduled_reports: data.scheduled_reports.map((report) => ({ ...report })),
    summary: { ...data.summary },
  };
}

function cloneGamificationWorkspace(data: GamificationWorkspace): GamificationWorkspace {
  return {
    achievements: data.achievements.map((achievement) => ({ ...achievement })),
    loyalty_events: data.loyalty_events.map((event) => ({ ...event })),
    loyalty_summary: { ...data.loyalty_summary },
    loyalty_tiers: data.loyalty_tiers.map((tier) => ({ ...tier })),
    rewards: data.rewards.map((reward) => ({ ...reward })),
    reviews: data.reviews.map((review) => ({
      ...review,
      tags: [...review.tags],
    })),
  };
}

function cloneSmartAnalyticsWorkspace(
  data: SmartAnalyticsWorkspace,
): SmartAnalyticsWorkspace {
  return {
    automations: data.automations.map((automation) => ({ ...automation })),
    risk_segments: data.risk_segments.map((segment) => ({
      ...segment,
      top_drivers: [...segment.top_drivers],
    })),
    scenarios: data.scenarios.map((scenario) => ({ ...scenario })),
  };
}

function cloneSecurityWorkspace(data: SecurityWorkspace): SecurityWorkspace {
  return {
    access_rules: data.access_rules.map((rule) => ({ ...rule })),
    audit_events: data.audit_events.map((event) => ({ ...event })),
    change_history: data.change_history.map((entry) => ({ ...entry })),
    mfa_coverage_pct: data.mfa_coverage_pct,
    permission_matrix: data.permission_matrix.map((row) => ({ ...row })),
    role_assignments: data.role_assignments.map((assignment) => ({ ...assignment })),
    roles: data.roles.map((role) => ({ ...role })),
    sessions: data.sessions.map((session) => ({ ...session })),
    session_history: data.session_history.map((entry) => ({ ...entry })),
    mfa_policy: {
      ...data.mfa_policy,
      required_for_roles: [...data.mfa_policy.required_for_roles],
    },
    mfa_users: data.mfa_users.map((user) => ({ ...user })),
    header_policies: data.header_policies.map((policy) => ({ ...policy })),
    rate_limit_rules: data.rate_limit_rules.map((rule) => ({ ...rule })),
  };
}

function cloneSettingsWorkspace(data: SettingsWorkspace): SettingsWorkspace {
  return {
    alert_rules: data.alert_rules.map((rule) => ({ ...rule })),
    config_drafts: data.config_drafts.map((draft) => ({ ...draft })),
    integrations: data.integrations.map((integration) => ({ ...integration })),
    last_published_at: data.last_published_at,
  };
}

function toUserRow(user: UserProfile): UserRow {
  return {
    avatar_url: user.avatar_url,
    churn_risk: user.churn_risk,
    email: user.email,
    id: user.id,
    last_seen_at: user.last_seen_at,
    mrr: user.mrr,
    name: user.name,
    registered_at: user.registered_at,
    status: user.status,
    tariff: user.tariff,
    tariff_id: user.tariff_id,
  };
}

function asArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function includesNormalized(source: string, query: string) {
  return source.toLocaleLowerCase("ru-RU").includes(query.toLocaleLowerCase("ru-RU"));
}

function apiResponse<T>(data: T): ApiResponse<T> {
  return { data };
}

function notFound(id: string): never {
  throw new ApiError({
    code: "USER_NOT_FOUND",
    message: `Пользователь ${id} не найден`,
    request_id: requestId("USER_NOT_FOUND"),
    status: 404,
  });
}

function validationError(details: Record<string, string[]>): never {
  throw new ApiError({
    code: "UNPROCESSABLE_ENTITY",
    details,
    message: "Invalid request parameters",
    request_id: requestId("UNPROCESSABLE_ENTITY"),
    status: 422,
  });
}

function validatePagination(params: UserFilterParams): { page: number; perPage: number } {
  const page = params.page ?? 1;
  const perPage = params.per_page ?? 25;
  const details: Record<string, string[]> = {};

  if (!Number.isInteger(page) || page < 1) {
    details.page = ["Must be greater than or equal to 1"];
  }

  if (!allowedPageSizes.includes(perPage as (typeof allowedPageSizes)[number])) {
    details.per_page = ["Must be one of 25, 50, or 100"];
  }

  if (Object.keys(details).length > 0) {
    validationError(details);
  }

  return { page, perPage };
}

function parseIsoDateBound(value: string, bound: "from" | "to"): number {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const startOfDay = Date.parse(`${value}T00:00:00.000Z`);
    return bound === "to" ? startOfDay + 24 * 60 * 60 * 1000 - 1 : startOfDay;
  }

  return Date.parse(value);
}

export function resetMockService(): void {
  mutableUsers = users.map((user) => cloneUser(user));
  mutableTariffs = tariffs.map((tariff) => cloneTariff(tariff));
  mutableSecurityWorkspace = cloneSecurityWorkspace(securityWorkspace);
  mutableSettingsWorkspace = cloneSettingsWorkspace(settingsWorkspace);
  mutableMarketingWorkspace = cloneMarketingWorkspace(marketingWorkspace);
  mutableAnalyticsWorkspace = cloneAnalyticsWorkspace(analyticsWorkspace);
  mutableGamificationWorkspace = cloneGamificationWorkspace(gamificationWorkspace);
  mutableJobs = [];
  mutableNotifications = initialMockNotifications.map((notification) => ({ ...notification }));
  mockPaymentGateways = initialMockPaymentGateways.map((gateway) => ({ ...gateway }));
}

export const mockApiService = {
  async getDashboard(): Promise<ApiResponse<DashboardKpis>> {
    return apiResponse({
      ...cloneDashboard(dashboardKpis),
      updated_at: new Date().toISOString(),
    });
  },

  async getMrrChart(): Promise<ApiResponse<MrrPoint[]>> {
    return apiResponse(mrrChart.map(cloneMrrPoint));
  },

  async getDashboardNewUsers(): Promise<ApiResponse<DashboardNewUsers>> {
    return apiResponse({
      count: mutableUsers.length,
      items: mutableUsers.slice(0, 25).map(cloneUser),
    });
  },

  async getDashboardRiskSummary(): Promise<ApiResponse<DashboardRiskSummary>> {
    const high = mutableUsers.filter((user) => user.churn_risk === "high").length;
    const medium = mutableUsers.filter((user) => user.churn_risk === "medium").length;
    const low = mutableUsers.filter((user) => user.churn_risk === "low").length;

    return apiResponse({
      currency: "RUB",
      expected_loss: mutableUsers
        .filter((user) => user.churn_risk === "high" || user.churn_risk === "medium")
        .reduce((sum, user) => sum + user.mrr, 0),
      high,
      low,
      medium,
    });
  },

  async getAnomalies(): Promise<ApiResponse<typeof anomalies>> {
    return apiResponse(anomalies.map(cloneAnomaly));
  },

  async getTopServices(): Promise<ApiResponse<typeof topServices>> {
    return apiResponse(topServices.map(cloneTopService));
  },

  async getMarketingWorkspace(): Promise<ApiResponse<MarketingWorkspace>> {
    return apiResponse(cloneMarketingWorkspace(mutableMarketingWorkspace));
  },

  async createMarketingCampaign(
    request: MarketingCampaignRequest,
  ): Promise<ApiResponse<MarketingCampaign>> {
    const audienceSize = Number(
      request.body.match(/Audience:\s*([\d.]+)/)?.[1] ?? 0,
    );
    const conversionRate = Number(
      request.body.match(/Expected conversion:\s*([\d.]+)/)?.[1] ?? 0,
    );
    const campaign: MarketingCampaign = {
      audience_size: audienceSize,
      channel: request.channel,
      conversion_rate: conversionRate,
      ctr: 0,
      id: `campaign-${Date.now()}`,
      name: request.name,
      segment: request.segment_id ?? "All users",
      starts_at: request.scheduled_at ?? new Date().toISOString(),
      status: "draft",
    };
    mutableMarketingWorkspace = {
      ...mutableMarketingWorkspace,
      campaigns: [campaign, ...mutableMarketingWorkspace.campaigns],
    };

    return apiResponse({ ...campaign });
  },

  async updateMarketingCampaign(
    campaignId: string,
    request: MarketingCampaignRequest,
  ): Promise<ApiResponse<MarketingCampaign>> {
    const existing = mutableMarketingWorkspace.campaigns.find((campaign) => campaign.id === campaignId);
    if (!existing) {
      notFound(campaignId);
    }

    const updated: MarketingCampaign = {
      ...existing,
      channel: request.channel ?? existing.channel,
      name: request.name ?? existing.name,
      segment: request.segment_id ?? existing.segment,
      starts_at: request.scheduled_at ?? existing.starts_at,
    };
    mutableMarketingWorkspace = {
      ...mutableMarketingWorkspace,
      campaigns: mutableMarketingWorkspace.campaigns.map((campaign) =>
        campaign.id === campaignId ? updated : campaign,
      ),
    };

    return apiResponse({ ...updated });
  },

  async sendMarketingCampaign(campaignId: string): Promise<ApiResponse<MarketingCampaignJob>> {
    mutableMarketingWorkspace = {
      ...mutableMarketingWorkspace,
      campaigns: mutableMarketingWorkspace.campaigns.map((campaign) =>
        campaign.id === campaignId ? { ...campaign, status: "sending" } : campaign,
      ),
    };

    return apiResponse({
      campaign_id: campaignId,
      job_id: `mock_campaign_send_${Date.now()}`,
      status: "queued",
    });
  },

  async cancelMarketingCampaign(campaignId: string): Promise<ApiResponse<{ success: boolean }>> {
    mutableMarketingWorkspace = {
      ...mutableMarketingWorkspace,
      campaigns: mutableMarketingWorkspace.campaigns.map((campaign) =>
        campaign.id === campaignId ? { ...campaign, status: "cancelled" } : campaign,
      ),
    };

    return apiResponse({ success: true });
  },

  async deleteMarketingCampaign(campaignId: string): Promise<ApiResponse<{ success: boolean }>> {
    mutableMarketingWorkspace = {
      ...mutableMarketingWorkspace,
      campaigns: mutableMarketingWorkspace.campaigns.filter(
        (campaign) => campaign.id !== campaignId,
      ),
    };

    return apiResponse({ success: true });
  },

  async createMarketingPromoCode(
    request: MarketingPromoCodeRequest,
  ): Promise<ApiResponse<MarketingPromoCoupon>> {
    const coupon: MarketingPromoCoupon = {
      code: request.code,
      discount_type: request.discount_type,
      discount_value: request.discount_value,
      expires_at: request.expires_at ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      id: `promo-${Date.now()}`,
      segment: "All users",
      status: "active",
      title: request.code,
      usage_limit: request.max_uses ?? 0,
      used_count: 0,
    };
    mutableMarketingWorkspace = {
      ...mutableMarketingWorkspace,
      promo_coupons: [coupon, ...mutableMarketingWorkspace.promo_coupons],
    };

    return apiResponse({ ...coupon });
  },

  async deactivateMarketingPromoCode(promoId: string): Promise<ApiResponse<{ success: boolean }>> {
    mutableMarketingWorkspace = {
      ...mutableMarketingWorkspace,
      promo_coupons: mutableMarketingWorkspace.promo_coupons.map((coupon) =>
        coupon.id === promoId ? { ...coupon, status: "expired" } : coupon,
      ),
    };

    return apiResponse({ success: true });
  },

  async createMarketingPromoCodesBulk(
    request: MarketingPromoBulkRequest,
  ): Promise<ApiResponse<MarketingPromoCoupon[]>> {
    const coupons = Array.from({ length: request.count }, (_, index): MarketingPromoCoupon => ({
      code: `${request.prefix}-${String(index + 1).padStart(3, "0")}`,
      discount_type: request.discount_type,
      discount_value: request.discount_value,
      expires_at: request.expires_at ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      id: `promo-bulk-${Date.now()}-${index}`,
      segment: "All users",
      status: "active",
      title: `${request.prefix} ${index + 1}`,
      usage_limit: request.max_uses ?? 1,
      used_count: 0,
    }));
    mutableMarketingWorkspace = {
      ...mutableMarketingWorkspace,
      promo_coupons: [...coupons, ...mutableMarketingWorkspace.promo_coupons],
    };

    return apiResponse(coupons.map((coupon) => ({ ...coupon })));
  },

  async updateMarketingPromoCode(
    promoId: string,
    request: Partial<MarketingPromoCodeRequest>,
  ): Promise<ApiResponse<MarketingPromoCoupon>> {
    const existing = mutableMarketingWorkspace.promo_coupons.find((coupon) => coupon.id === promoId);
    if (!existing) {
      notFound(promoId);
    }

    const updated: MarketingPromoCoupon = {
      ...existing,
      code: request.code ?? existing.code,
      discount_type: request.discount_type ?? existing.discount_type,
      discount_value: request.discount_value ?? existing.discount_value,
      expires_at: request.expires_at ?? existing.expires_at,
      usage_limit: request.max_uses ?? existing.usage_limit,
    };
    mutableMarketingWorkspace = {
      ...mutableMarketingWorkspace,
      promo_coupons: mutableMarketingWorkspace.promo_coupons.map((coupon) =>
        coupon.id === promoId ? updated : coupon,
      ),
    };

    return apiResponse({ ...updated });
  },

  async createMarketingSegment(
    request: MarketingSegmentRequest,
  ): Promise<ApiResponse<MarketingSegment>> {
    const segment: MarketingSegment = {
      audience_size: 0,
      filters: { ...request.filters },
      id: `segment-${Date.now()}`,
      name: request.name,
      updated_at: new Date().toISOString(),
    };
    mutableMarketingWorkspace = {
      ...mutableMarketingWorkspace,
      segments: [segment, ...mutableMarketingWorkspace.segments],
    };

    return apiResponse({ ...segment, filters: { ...segment.filters } });
  },

  async updateMarketingSegment(
    segmentId: string,
    request: MarketingSegmentRequest,
  ): Promise<ApiResponse<MarketingSegment>> {
    const existing = mutableMarketingWorkspace.segments.find((segment) => segment.id === segmentId);
    if (!existing) {
      notFound(segmentId);
    }

    const updated: MarketingSegment = {
      ...existing,
      filters: { ...request.filters },
      name: request.name,
      updated_at: new Date().toISOString(),
    };
    mutableMarketingWorkspace = {
      ...mutableMarketingWorkspace,
      segments: mutableMarketingWorkspace.segments.map((segment) =>
        segment.id === segmentId ? updated : segment,
      ),
    };

    return apiResponse({ ...updated, filters: { ...updated.filters } });
  },

  async refreshMarketingSegment(segmentId: string): Promise<ApiResponse<MarketingSegment>> {
    const existing = mutableMarketingWorkspace.segments.find((segment) => segment.id === segmentId);
    if (!existing) {
      notFound(segmentId);
    }

    const refreshed: MarketingSegment = {
      ...existing,
      audience_size: mutableUsers.length,
      updated_at: new Date().toISOString(),
    };
    mutableMarketingWorkspace = {
      ...mutableMarketingWorkspace,
      segments: mutableMarketingWorkspace.segments.map((segment) =>
        segment.id === segmentId ? refreshed : segment,
      ),
    };

    return apiResponse({ ...refreshed, filters: { ...refreshed.filters } });
  },

  async createMarketingTemplate(
    request: MarketingTemplateRequest,
  ): Promise<ApiResponse<MarketingTemplate>> {
    const template: MarketingTemplate = {
      body: request.body,
      category: request.category ?? "General",
      channel: request.channel,
      cta: request.cta ?? "",
      id: `template-${Date.now()}`,
      name: request.name,
      status: request.status ?? "active",
      subject: request.subject ?? "",
      usage_count: 0,
    };
    mutableMarketingWorkspace = {
      ...mutableMarketingWorkspace,
      templates: [template, ...mutableMarketingWorkspace.templates],
    };

    return apiResponse({ ...template });
  },

  async updateMarketingTemplate(
    templateId: string,
    request: Partial<MarketingTemplateRequest>,
  ): Promise<ApiResponse<MarketingTemplate>> {
    const existing = mutableMarketingWorkspace.templates.find((template) => template.id === templateId);
    if (!existing) {
      notFound(templateId);
    }

    const updated: MarketingTemplate = {
      ...existing,
      body: request.body ?? existing.body,
      category: request.category ?? existing.category,
      channel: request.channel ?? existing.channel,
      cta: request.cta ?? existing.cta,
      name: request.name ?? existing.name,
      status: request.status ?? existing.status,
      subject: request.subject ?? existing.subject,
    };
    mutableMarketingWorkspace = {
      ...mutableMarketingWorkspace,
      templates: mutableMarketingWorkspace.templates.map((template) =>
        template.id === templateId ? updated : template,
      ),
    };

    return apiResponse({ ...updated });
  },

  async deleteMarketingTemplate(templateId: string): Promise<ApiResponse<{ success: boolean }>> {
    mutableMarketingWorkspace = {
      ...mutableMarketingWorkspace,
      templates: mutableMarketingWorkspace.templates.filter((template) => template.id !== templateId),
    };

    return apiResponse({ success: true });
  },

  async updateReferralConfig(
    request: MarketingReferralConfigRequest,
  ): Promise<ApiResponse<{ success: boolean }>> {
    mutableMarketingWorkspace = {
      ...mutableMarketingWorkspace,
      referral_tiers: mutableMarketingWorkspace.referral_tiers.map((tier, index) =>
        index === 0
          ? {
              ...tier,
              advocate_reward: request.advocate_reward,
              friend_reward: request.friend_reward,
              invite_goal: request.invite_goal,
            }
          : tier,
      ),
    };

    return apiResponse({ success: true });
  },

  async getAnalyticsWorkspace(): Promise<ApiResponse<AnalyticsWorkspace>> {
    return apiResponse(cloneAnalyticsWorkspace(mutableAnalyticsWorkspace));
  },

  async createAnalyticsExport(
    request: AnalyticsExportRequest,
  ): Promise<ApiResponse<AnalyticsWorkspace["exports"][number]>> {
    const job: AnalyticsWorkspace["exports"][number] = {
      format: request.format,
      id: `export-${Date.now()}`,
      name: `${request.report_type} - ${request.segment}`,
      rows: String(mutableUsers.length),
      status: "queued",
    };
    mutableAnalyticsWorkspace = {
      ...mutableAnalyticsWorkspace,
      exports: [job, ...mutableAnalyticsWorkspace.exports],
    };
    mutableJobs = [
      {
        created_at: new Date().toISOString(),
        error: null,
        finished_at: null,
        input_data: { ...request },
        job_id: job.id,
        progress_pct: 0,
        requested_by: "mock-admin",
        result: null,
        started_at: null,
        status: "queued",
        type: "analytics_export",
      },
      ...mutableJobs,
    ];

    return apiResponse({ ...job });
  },

  async createAnalyticsScheduledReport(
    request: AnalyticsScheduledReportRequest,
  ): Promise<ApiResponse<AnalyticsWorkspace["scheduled_reports"][number]>> {
    const schedule: AnalyticsWorkspace["scheduled_reports"][number] = {
      format: request.format,
      frequency: request.frequency,
      id: `schedule-${Date.now()}`,
      name: request.name,
      next_run_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      owner_email: request.owner_email,
      status: "active",
    };
    mutableAnalyticsWorkspace = {
      ...mutableAnalyticsWorkspace,
      scheduled_reports: [schedule, ...mutableAnalyticsWorkspace.scheduled_reports],
    };

    return apiResponse({ ...schedule });
  },

  async getJobs(): Promise<ApiResponse<PaginatedResponse<AdminJob>>> {
    return apiResponse({
      items: mutableJobs.map((job) => ({ ...job })),
      page: 1,
      per_page: 25,
      total: mutableJobs.length,
      total_pages: 1,
    });
  },

  async getJob(jobId: string): Promise<ApiResponse<AdminJob>> {
    const job = mutableJobs.find((item) => item.job_id === jobId);
    if (!job) {
      notFound(jobId);
    }

    return apiResponse({ ...job });
  },

  async cancelJob(jobId: string): Promise<ApiResponse<{ success: boolean }>> {
    mutableJobs = mutableJobs.map((job) =>
      job.job_id === jobId ? { ...job, status: "cancelled" } : job,
    );

    return apiResponse({ success: true });
  },

  async getGamificationWorkspace(): Promise<ApiResponse<GamificationWorkspace>> {
    return apiResponse(cloneGamificationWorkspace(mutableGamificationWorkspace));
  },

  async createGamificationAchievement(
    request: GamificationAchievementRequest,
  ): Promise<ApiResponse<GamificationAchievement>> {
    const achievement: GamificationAchievement = {
      ...request,
      id: `ach-${Date.now()}`,
    };
    mutableGamificationWorkspace = {
      ...mutableGamificationWorkspace,
      achievements: [achievement, ...mutableGamificationWorkspace.achievements],
    };

    return apiResponse({ ...achievement });
  },

  async updateGamificationAchievement(
    achievementId: string,
    request: Partial<GamificationAchievementRequest>,
  ): Promise<ApiResponse<GamificationAchievement>> {
    const existing = mutableGamificationWorkspace.achievements.find(
      (achievement) => achievement.id === achievementId,
    );
    if (!existing) {
      notFound(achievementId);
    }

    const updated: GamificationAchievement = { ...existing, ...request };
    mutableGamificationWorkspace = {
      ...mutableGamificationWorkspace,
      achievements: mutableGamificationWorkspace.achievements.map((achievement) =>
        achievement.id === achievementId ? updated : achievement,
      ),
    };

    return apiResponse({ ...updated });
  },

  async deleteGamificationAchievement(
    achievementId: string,
  ): Promise<ApiResponse<{ success: boolean }>> {
    mutableGamificationWorkspace = {
      ...mutableGamificationWorkspace,
      achievements: mutableGamificationWorkspace.achievements.filter(
        (achievement) => achievement.id !== achievementId,
      ),
    };

    return apiResponse({ success: true });
  },

  async createGamificationReward(
    request: GamificationRewardRequest,
  ): Promise<ApiResponse<GamificationRewardItem>> {
    const reward: GamificationRewardItem = {
      category: request.category,
      cost: request.cost,
      id: `reward-${Date.now()}`,
      name: request.name,
      redemptions: request.redemptions ?? 0,
      stock: request.stock,
    };
    mutableGamificationWorkspace = {
      ...mutableGamificationWorkspace,
      rewards: [reward, ...mutableGamificationWorkspace.rewards],
    };

    return apiResponse({ ...reward });
  },

  async updateGamificationReward(
    rewardId: string,
    request: Partial<GamificationRewardRequest>,
  ): Promise<ApiResponse<GamificationRewardItem>> {
    const existing = mutableGamificationWorkspace.rewards.find((reward) => reward.id === rewardId);
    if (!existing) {
      notFound(rewardId);
    }

    const updated: GamificationRewardItem = {
      ...existing,
      category: request.category ?? existing.category,
      cost: request.cost ?? existing.cost,
      name: request.name ?? existing.name,
      redemptions: request.redemptions ?? existing.redemptions,
      stock: request.stock ?? existing.stock,
    };
    mutableGamificationWorkspace = {
      ...mutableGamificationWorkspace,
      rewards: mutableGamificationWorkspace.rewards.map((reward) =>
        reward.id === rewardId ? updated : reward,
      ),
    };

    return apiResponse({ ...updated });
  },

  async deleteGamificationReward(rewardId: string): Promise<ApiResponse<{ success: boolean }>> {
    mutableGamificationWorkspace = {
      ...mutableGamificationWorkspace,
      rewards: mutableGamificationWorkspace.rewards.filter((reward) => reward.id !== rewardId),
    };

    return apiResponse({ success: true });
  },

  async createGamificationLoyaltyTier(
    request: GamificationLoyaltyTierRequest,
  ): Promise<ApiResponse<GamificationLoyaltyTier>> {
    const tier: GamificationLoyaltyTier = {
      benefit: request.benefit,
      id: `tier-${Date.now()}`,
      members: 0,
      name: request.name,
      status: request.status,
      threshold: request.threshold,
    };
    mutableGamificationWorkspace = {
      ...mutableGamificationWorkspace,
      loyalty_tiers: [tier, ...mutableGamificationWorkspace.loyalty_tiers],
    };

    return apiResponse({ ...tier });
  },

  async updateGamificationLoyaltyTier(
    tierId: string,
    request: Partial<GamificationLoyaltyTierRequest>,
  ): Promise<ApiResponse<GamificationLoyaltyTier>> {
    const existing = mutableGamificationWorkspace.loyalty_tiers.find(
      (tier) => tier.id === tierId,
    );
    if (!existing) {
      notFound(tierId);
    }

    const updated: GamificationLoyaltyTier = { ...existing, ...request };
    mutableGamificationWorkspace = {
      ...mutableGamificationWorkspace,
      loyalty_tiers: mutableGamificationWorkspace.loyalty_tiers.map((tier) =>
        tier.id === tierId ? updated : tier,
      ),
    };

    return apiResponse({ ...updated });
  },

  async deleteGamificationLoyaltyTier(
    tierId: string,
  ): Promise<ApiResponse<{ success: boolean }>> {
    const existing = mutableGamificationWorkspace.loyalty_tiers.find(
      (tier) => tier.id === tierId,
    );
    if (!existing) {
      notFound(tierId);
    }

    mutableGamificationWorkspace = {
      ...mutableGamificationWorkspace,
      loyalty_tiers: mutableGamificationWorkspace.loyalty_tiers.filter(
        (tier) => tier.id !== tierId,
      ),
    };

    return apiResponse({ success: true });
  },

  async adjustGamificationPoints(
    request: GamificationPointsAdjustmentRequest,
  ): Promise<ApiResponse<GamificationPointsAdjustmentResult>> {
    if (!Number.isFinite(request.amount) || request.amount <= 0) {
      throw new ApiError({
        code: "VALIDATION_ERROR",
        details: {
          amount: ["Points amount must be a positive number"],
        },
        message: "Invalid points amount",
        request_id: requestId("VALIDATION_ERROR"),
        status: 422,
      });
    }

    const signedAmount = request.action === "revoke" ? -request.amount : request.amount;
    const event = {
      amount: signedAmount,
      date: new Date().toISOString(),
      event_type: request.action === "revoke" ? "adjusted" : "earned",
      id: `loyalty-event-${Date.now()}`,
      reason: request.comment,
      source: "Admin",
      user: request.user,
    } satisfies GamificationWorkspace["loyalty_events"][number];
    const base = mutableGamificationWorkspace.loyalty_summary;
    const pointsBalance = Math.max(0, base.points_balance + signedAmount);
    const loyaltySummary = {
      ...base,
      average_points_per_user:
        base.active_members > 0 ? Math.round(pointsBalance / base.active_members) : pointsBalance,
      points_balance: pointsBalance,
      points_earned_month:
        request.action === "grant"
          ? base.points_earned_month + request.amount
          : base.points_earned_month,
      points_spent_month:
        request.action === "revoke"
          ? base.points_spent_month + request.amount
          : base.points_spent_month,
    };
    mutableGamificationWorkspace = {
      ...mutableGamificationWorkspace,
      loyalty_events: [event, ...mutableGamificationWorkspace.loyalty_events],
      loyalty_summary: loyaltySummary,
    };

    return apiResponse({
      event: { ...event },
      loyalty_summary: { ...loyaltySummary },
    });
  },

  async updateGamificationReview(
    reviewId: string,
    request: GamificationReviewPatchRequest,
  ): Promise<ApiResponse<GamificationReview>> {
    const existing = mutableGamificationWorkspace.reviews.find((review) => review.id === reviewId);
    if (!existing) {
      notFound(reviewId);
    }

    const updated: GamificationReview = { ...existing, status: request.status };
    mutableGamificationWorkspace = {
      ...mutableGamificationWorkspace,
      reviews: mutableGamificationWorkspace.reviews.map((review) =>
        review.id === reviewId ? updated : review,
      ),
    };

    return apiResponse({ ...updated, tags: [...updated.tags] });
  },

  async replyToGamificationReview(
    reviewId: string,
    request: GamificationReviewReplyRequest,
  ): Promise<ApiResponse<GamificationReview>> {
    const existing = mutableGamificationWorkspace.reviews.find((review) => review.id === reviewId);
    if (!existing) {
      notFound(reviewId);
    }

    const updated: GamificationReview = {
      ...existing,
      response: request.response,
      status: "resolved",
    };
    mutableGamificationWorkspace = {
      ...mutableGamificationWorkspace,
      reviews: mutableGamificationWorkspace.reviews.map((review) =>
        review.id === reviewId ? updated : review,
      ),
    };

    return apiResponse({ ...updated, tags: [...updated.tags] });
  },

  async getSmartAnalyticsWorkspace(): Promise<ApiResponse<SmartAnalyticsWorkspace>> {
    return apiResponse(cloneSmartAnalyticsWorkspace(smartAnalyticsWorkspace));
  },

  async runSmartAutomation(
    automationId: string,
  ): Promise<ApiResponse<SmartAutomationRunResult>> {
    const automation = smartAnalyticsWorkspace.automations.find((item) => item.id === automationId);

    return apiResponse({
      actions: automation ? [{ queued: true, type: automation.channel }] : [],
      automation_id: automationId,
      matched: automation ? 25 : 0,
    });
  },

  async getSecurityWorkspace(): Promise<ApiResponse<SecurityWorkspace>> {
    return apiResponse(cloneSecurityWorkspace(mutableSecurityWorkspace));
  },

  async updateSecurityPolicies(
    request: SecurityPoliciesPatchRequest,
  ): Promise<ApiResponse<SecurityWorkspace>> {
    mutableSecurityWorkspace = {
      ...mutableSecurityWorkspace,
      header_policies: request.header_policies
        ? request.header_policies.map((policy) => ({ ...policy }))
        : mutableSecurityWorkspace.header_policies,
      mfa_policy: request.mfa_policy
        ? {
            ...request.mfa_policy,
            required_for_roles: [...request.mfa_policy.required_for_roles],
          }
        : mutableSecurityWorkspace.mfa_policy,
      rate_limit_rules: request.rate_limit_rules
        ? request.rate_limit_rules.map((rule) => ({ ...rule }))
        : mutableSecurityWorkspace.rate_limit_rules,
    };

    return apiResponse(cloneSecurityWorkspace(mutableSecurityWorkspace));
  },

  async assignSecurityRole(
    request: SecurityRoleAssignmentRequest,
  ): Promise<ApiResponse<SecurityWorkspace>> {
    const normalizedUser = request.user.trim().toLocaleLowerCase("ru-RU");
    const existing = mutableSecurityWorkspace.role_assignments.find(
      (assignment) =>
        assignment.id.toLocaleLowerCase("ru-RU") === normalizedUser ||
        assignment.user.toLocaleLowerCase("ru-RU") === normalizedUser,
    );
    const assignment = {
      changed_by: "Mock admin",
      id: existing?.id ?? `assign-mock-${Date.now()}`,
      reason: request.reason.trim(),
      role: request.role,
      status: "active" as const,
      user: request.user.trim(),
    };
    const roleAssignments = existing
      ? mutableSecurityWorkspace.role_assignments.map((item) =>
          item.id === existing.id ? assignment : item,
        )
      : [assignment, ...mutableSecurityWorkspace.role_assignments];

    mutableSecurityWorkspace = {
      ...mutableSecurityWorkspace,
      role_assignments: roleAssignments,
      roles: mutableSecurityWorkspace.roles.map((role) => ({
        ...role,
        users: roleAssignments.filter(
          (item) => item.role === role.id && item.status === "active",
        ).length,
      })),
    };

    return apiResponse(cloneSecurityWorkspace(mutableSecurityWorkspace));
  },

  async getNotifications(): Promise<ApiResponse<PaginatedResponse<AdminNotification>>> {
    const items = mutableNotifications
      .filter((notification) => notification.status !== "archived")
      .map((notification) => ({ ...notification }));

    return apiResponse({
      items,
      page: 1,
      per_page: 25,
      total: items.length,
      total_pages: 1,
    });
  },

  async updateNotificationStatus(
    notificationId: string,
    request: NotificationStatusPatchRequest,
  ): Promise<ApiResponse<AdminNotification>> {
    const existing = mutableNotifications.find((notification) => notification.id === notificationId);
    if (!existing) {
      notFound(notificationId);
    }

    const updated: AdminNotification = {
      ...existing,
      isRead: request.status === "read" || request.status === "archived",
      status: request.status,
    };
    mutableNotifications = mutableNotifications.map((notification) =>
      notification.id === notificationId ? updated : notification,
    );

    return apiResponse({ ...updated });
  },

  async terminateAdminSession(sessionId: string): Promise<ApiResponse<{ success: boolean }>> {
    mutableSecurityWorkspace = {
      ...mutableSecurityWorkspace,
      session_history: [
        {
          action: "Session terminated",
          actor: "Mock admin",
          created_at: "Now",
          id: `session-history-mock-${mutableSecurityWorkspace.session_history.length + 1}`,
          reason: "Mock session termination",
          session_id: sessionId,
        },
        ...mutableSecurityWorkspace.session_history,
      ],
      sessions: mutableSecurityWorkspace.sessions.map((session) =>
        session.id === sessionId ? { ...session, status: "terminated" } : session,
      ),
    };

    return apiResponse({ success: true });
  },

  async getSettingsWorkspace(): Promise<ApiResponse<SettingsWorkspace>> {
    return apiResponse(cloneSettingsWorkspace(mutableSettingsWorkspace));
  },

  async updateSettings(request: SettingsPatchRequest): Promise<ApiResponse<SettingsWorkspace>> {
    const publishedSettings = [
      typeof request.report_currency === "string"
        ? {
            environment: request.config_environment ?? "live",
            id: `settings-report-currency-${Date.now()}`,
            owner: "backend",
            section: "Валюта отчётов",
            status: "published" as const,
            value: request.report_currency,
          }
        : null,
      typeof request.support_sla_hours === "number"
        ? {
            environment: request.config_environment ?? "live",
            id: `settings-support-sla-${Date.now()}`,
            owner: "backend",
            section: "SLA поддержки",
            status: "published" as const,
            value: `${request.support_sla_hours} ч.`,
          }
        : null,
      typeof request.report_timezone === "string"
        ? {
            environment: request.config_environment ?? "live",
            id: `settings-report-timezone-${Date.now()}`,
            owner: "backend",
            section: "Часовой пояс",
            status: "published" as const,
            value: request.report_timezone,
          }
        : null,
    ].filter((item): item is NonNullable<typeof item> => item !== null);

    if (publishedSettings.length > 0) {
      const replacedSections = new Set(publishedSettings.map((item) => item.section));
      mutableSettingsWorkspace = {
        ...mutableSettingsWorkspace,
        config_drafts: [
          ...publishedSettings,
          ...mutableSettingsWorkspace.config_drafts.filter(
            (item) =>
              item.environment !== (request.config_environment ?? "live") ||
              !replacedSections.has(item.section),
          ),
        ],
        last_published_at: new Date().toISOString(),
      };
    }

    if (typeof request.alert_churn_rate_threshold === "number") {
      const formattedThreshold = `${request.alert_churn_rate_threshold}%`;
      mutableSettingsWorkspace = {
        ...mutableSettingsWorkspace,
        alert_rules: mutableSettingsWorkspace.alert_rules.map((alert) =>
          alert.id === "alert-churn" || alert.name.includes("оттока")
            ? { ...alert, status: "active", threshold: formattedThreshold }
            : alert,
        ),
        config_drafts: [
          {
            environment: "live",
            id: `settings-churn-threshold-${Date.now()}`,
            owner: "backend",
            section: "alert_churn_rate_threshold",
            status: "published",
            value: String(request.alert_churn_rate_threshold),
          },
          ...mutableSettingsWorkspace.config_drafts,
        ],
        last_published_at: new Date().toISOString(),
      };
    }

    return apiResponse(cloneSettingsWorkspace(mutableSettingsWorkspace));
  },

  async getUsers(
    params: UserFilterParams = {},
  ): Promise<ApiResponse<PaginatedResponse<UserRow>>> {
    const { page, perPage } = validatePagination(params);
    const statuses = asArray<UserStatus>(params.status);
    const risks = asArray<ChurnRisk>(params.risk ?? params.churn_risk);
    const tariffIds = asArray<string>(params.tariff_id);
    const search = params.search?.trim();
    const registeredFrom = params.registered_from
      ? parseIsoDateBound(params.registered_from, "from")
      : undefined;
    const registeredTo = params.registered_to
      ? parseIsoDateBound(params.registered_to, "to")
      : undefined;

    const filtered = mutableUsers
      .filter((user) => {
        if (!search) {
          return true;
        }

        return [user.name, user.email, user.phone ?? "", user.id].some((value) =>
          includesNormalized(value, search),
        );
      })
      .filter((user) => statuses.length === 0 || statuses.includes(user.status))
      .filter((user) => risks.length === 0 || risks.includes(user.churn_risk))
      .filter((user) => tariffIds.length === 0 || tariffIds.includes(user.tariff_id))
      .filter((user) => {
        const registeredAt = Date.parse(user.registered_at);

        if (registeredFrom !== undefined && registeredAt < registeredFrom) {
          return false;
        }

        if (registeredTo !== undefined && registeredAt > registeredTo) {
          return false;
        }

        return true;
      });

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const start = (page - 1) * perPage;
    const items = filtered.slice(start, start + perPage).map(toUserRow);

    return apiResponse({
      items,
      page,
      per_page: perPage,
      total,
      total_pages: totalPages,
    });
  },

  async exportUsers(): Promise<ApiResponse<ExportJob>> {
    return apiResponse({
      job_id: `mock_users_export_${Date.now()}`,
      status: "queued",
    });
  },

  async bulkUserAction(
    request: UserBulkActionRequest,
  ): Promise<ApiResponse<UserBulkActionResult>> {
    const selectedIds = new Set(request.user_ids);
    let updated = 0;

    mutableUsers = mutableUsers.map((user) => {
      if (!selectedIds.has(user.id)) {
        return user;
      }

      updated += 1;
      return {
        ...user,
        block_reason: request.action === "block" ? "Bulk action" : undefined,
        status: request.action === "block" ? "blocked" : "active",
      };
    });

    return apiResponse({
      job_id: `mock_users_bulk_${Date.now()}`,
      status: "queued",
      updated,
    });
  },

  async getUser(id: string): Promise<ApiResponse<UserProfile>> {
    const user = mutableUsers.find((item) => item.id === id);
    if (!user) {
      notFound(id);
    }

    return apiResponse(cloneUser(user));
  },

  async blockUser(id: string, request: BlockUserRequest): Promise<ApiResponse<null>> {
    const reason = request.reason.trim();
    if (reason.length < 10) {
      throw new ApiError({
        code: "VALIDATION_ERROR",
        details: {
          reason: ["Причина блокировки должна быть не короче 10 символов"],
        },
        message: "Некорректная причина блокировки",
        request_id: requestId("VALIDATION_ERROR"),
        status: 422,
      });
    }

    const user = mutableUsers.find((item) => item.id === id);
    if (!user) {
      notFound(id);
    }

    user.status = "blocked";
    user.block_reason = reason;

    return apiResponse(null);
  },

  async unblockUser(id: string): Promise<ApiResponse<null>> {
    const user = mutableUsers.find((item) => item.id === id);
    if (!user) {
      notFound(id);
    }

    user.status = "active";
    user.block_reason = undefined;

    return apiResponse(null);
  },

  async grantPoints(id: string, request: GrantPointsRequest): Promise<ApiResponse<null>> {
    if (!Number.isFinite(request.amount) || request.amount <= 0) {
      throw new ApiError({
        code: "VALIDATION_ERROR",
        details: {
          amount: ["Количество баллов должно быть положительным числом"],
        },
        message: "Некорректное количество баллов",
        request_id: requestId("VALIDATION_ERROR"),
        status: 422,
      });
    }

    const user = mutableUsers.find((item) => item.id === id);
    if (!user) {
      notFound(id);
    }

    user.points_balance += request.amount;

    return apiResponse(null);
  },

  async deductPoints(id: string, request: GrantPointsRequest): Promise<ApiResponse<null>> {
    if (!Number.isFinite(request.amount) || request.amount <= 0) {
      throw new ApiError({
        code: "VALIDATION_ERROR",
        details: {
          amount: ["Количество баллов должно быть положительным числом"],
        },
        message: "Некорректное количество баллов",
        request_id: requestId("VALIDATION_ERROR"),
        status: 422,
      });
    }

    const user = mutableUsers.find((item) => item.id === id);
    if (!user) {
      notFound(id);
    }

    user.points_balance = Math.max(0, user.points_balance - request.amount);

    return apiResponse(null);
  },

  async addUserNote(id: string, request: UserNoteRequest): Promise<ApiResponse<string[]>> {
    const note = request.note.trim();
    if (note.length === 0) {
      throw new ApiError({
        code: "VALIDATION_ERROR",
        details: {
          note: ["Заметка не может быть пустой"],
        },
        message: "Некорректная заметка",
        request_id: requestId("VALIDATION_ERROR"),
        status: 422,
      });
    }

    const user = mutableUsers.find((item) => item.id === id);
    if (!user) {
      notFound(id);
    }

    user.notes = [...user.notes, note];

    return apiResponse([...user.notes]);
  },

  async getTariffs(): Promise<ApiResponse<Tariff[]>> {
    return apiResponse(mutableTariffs.map((tariff) => cloneTariff(tariff)));
  },

  async createTariff(request: TariffMutationRequest): Promise<ApiResponse<Tariff>> {
    const created = tariffFromRequest(`tariff-${Date.now()}`, request);
    mutableTariffs = [created, ...mutableTariffs];
    return apiResponse(cloneTariff(created));
  },

  async updateTariff(
    tariffId: string,
    request: TariffMutationRequest,
  ): Promise<ApiResponse<Tariff>> {
    const existing = mutableTariffs.find((tariff) => tariff.id === tariffId);

    if (!existing) {
      notFound(tariffId);
    }

    const updated = {
      ...tariffFromRequest(tariffId, request),
      is_public: existing.is_public,
      subscribers: existing.subscribers,
      trial_days: existing.trial_days,
    };
    mutableTariffs = mutableTariffs.map((tariff) =>
      tariff.id === tariffId ? updated : tariff,
    );

    return apiResponse(cloneTariff(updated));
  },

  async archiveTariff(tariffId: string): Promise<ApiResponse<{ success: boolean }>> {
    const existing = mutableTariffs.find((tariff) => tariff.id === tariffId);

    if (!existing) {
      notFound(tariffId);
    }

    mutableTariffs = mutableTariffs.map((tariff) =>
      tariff.id === tariffId ? { ...tariff, is_public: false, status: "archived" } : tariff,
    );

    return apiResponse({ success: true });
  },

  async duplicateTariff(tariffId: string): Promise<ApiResponse<Tariff>> {
    const existing = mutableTariffs.find((tariff) => tariff.id === tariffId);

    if (!existing) {
      notFound(tariffId);
    }

    const duplicated = {
      ...cloneTariff(existing),
      id: `${tariffId}-copy-${Date.now()}`,
      is_public: false,
      name: `${existing.name} Copy`,
      subscribers: 0,
      status: "active" as const,
    };
    mutableTariffs = [duplicated, ...mutableTariffs];

    return apiResponse(cloneTariff(duplicated));
  },

  async getSubscriptions(): Promise<ApiResponse<Subscription[]>> {
    return apiResponse(
      mutableUsers.flatMap((user) =>
        user.active_subscriptions.map((subscription) => ({
          ...subscription,
          service: { ...subscription.service },
        })),
      ),
    );
  },

  async updateSubscription(
    subscriptionId: string,
    request: SubscriptionMutationRequest,
  ): Promise<ApiResponse<Subscription>> {
    let updatedSubscription: Subscription | null = null;

    mutableUsers = mutableUsers.map((user) => ({
      ...user,
      active_subscriptions: user.active_subscriptions.map((subscription) => {
        if (subscription.id !== subscriptionId) {
          return subscription;
        }

        const nextStatus: Subscription["status"] =
          request.action === "cancel"
            ? "cancelled"
            : request.action === "freeze"
              ? "frozen"
              : "active";
        updatedSubscription = {
          ...subscription,
          expires_at: request.action === "renew"
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            : subscription.expires_at,
          status: nextStatus,
          tariff_id: request.tariff_id ?? subscription.tariff_id,
        };
        return updatedSubscription;
      }),
    }));

    if (!updatedSubscription) {
      notFound(subscriptionId);
    }

    const subscription = updatedSubscription as Subscription;
    return apiResponse({
      ...subscription,
      service: { ...subscription.service },
    });
  },

  async applySubscriptionPromo(
    subscriptionId: string,
    request: SubscriptionPromoRequest,
  ): Promise<ApiResponse<Subscription>> {
    const normalizedCode = request.code.trim().toUpperCase();
    let updatedSubscription: Subscription | null = null;

    mutableUsers = mutableUsers.map((user) => ({
      ...user,
      active_subscriptions: user.active_subscriptions.map((subscription) => {
        if (subscription.id !== subscriptionId) {
          return subscription;
        }

        updatedSubscription = {
          ...subscription,
          status: "active",
        };
        return updatedSubscription;
      }),
    }));

    if (!updatedSubscription || normalizedCode.length === 0) {
      notFound(subscriptionId);
    }

    const subscription = updatedSubscription as Subscription;
    return apiResponse({
      ...subscription,
      service: { ...subscription.service },
    });
  },

  async getTransactions(): Promise<ApiResponse<PaymentTransaction[]>> {
    return apiResponse(mockTransactions.map((transaction) => ({ ...transaction })));
  },

  async getPaymentGateways(): Promise<ApiResponse<PaymentGateway[]>> {
    return apiResponse(mockPaymentGateways.map((gateway) => ({ ...gateway })));
  },

  async getBillingReport(): Promise<ApiResponse<BillingReport>> {
    const mrr = mockTransactions
      .filter((transaction) => transaction.status === "success")
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    const churnRevenue = mockTransactions
      .filter((transaction) => transaction.status === "failed" || transaction.status === "refund")
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    return apiResponse({
      arr: mrr * 12,
      churn_revenue: churnRevenue,
      mrr,
      nrr: 0,
    });
  },

  async exportBillingReport(): Promise<ApiResponse<ExportJob>> {
    return apiResponse({
      job_id: `mock_export_${Date.now()}`,
      status: "queued",
    });
  },

  async testPaymentGateway(
    gatewayId: string,
  ): Promise<ApiResponse<PaymentGatewayTestResult>> {
    const gateway = mockPaymentGateways.find((item) => item.id === gatewayId);

    if (!gateway) {
      notFound(gatewayId);
    }

    return apiResponse({
      gateway_id: gatewayId,
      ok: true,
    });
  },

  async updatePaymentGateway(
    gatewayId: string,
    request: PaymentGatewayPatchRequest,
  ): Promise<ApiResponse<PaymentGateway>> {
    const gateway = mockPaymentGateways.find((item) => item.id === gatewayId);

    if (!gateway) {
      notFound(gatewayId);
    }

    const updated = {
      ...gateway,
      priority: request.priority ?? gateway.priority,
      status: request.enabled === undefined
        ? gateway.status
        : request.enabled
          ? "active"
          : "disabled",
    } satisfies PaymentGateway;

    mockPaymentGateways = mockPaymentGateways.map((item) =>
      item.id === gatewayId ? updated : item,
    );

    return apiResponse({ ...updated });
  },
};
