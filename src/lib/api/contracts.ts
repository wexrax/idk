export type ApiResponse<T> = {
  data: T;
  meta?: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
};

export type PaginatedResponse<T> = {
  items: T[];
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
};

export class ApiError extends Error {
  code: string;
  request_id: string;
  status: number;
  details?: Record<string, string[]>;

  constructor(params: {
    code: string;
    message: string;
    request_id: string;
    status: number;
    details?: Record<string, string[]>;
  }) {
    super(params.message);
    this.name = "ApiError";
    this.code = params.code;
    this.request_id = params.request_id;
    this.status = params.status;
    this.details = params.details;
  }
}

export type Trend = "up" | "down" | "flat";
export type ChurnRisk = "high" | "medium" | "low";
export type UserStatus = "active" | "blocked" | "trial" | "frozen";
export type TariffStatus = "active" | "archived";

export type KpiMetric = {
  value: number;
  delta_pct?: number;
  delta_pp?: number;
  trend: Trend;
  currency?: "RUB" | "USD" | "EUR";
  is_alert?: boolean;
};

export type DashboardKpis = {
  active_users: KpiMetric;
  mrr: KpiMetric & { arr: number; currency: "RUB" | "USD" | "EUR" };
  churn_rate: KpiMetric & { delta_pp: number; is_alert: boolean };
  ltv_cac_ratio: KpiMetric & { romi_pct: number };
  updated_at: string;
};

export type MrrPoint = {
  date: string;
  mrr: number;
  new_users: number;
};

export type DashboardNewUsers = {
  count: number;
  items: UserRow[];
};

export type DashboardRiskSummary = {
  high: number;
  medium: number;
  low: number;
  expected_loss: number;
  currency: "RUB" | "USD" | "EUR";
};

export type Anomaly = {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  created_at: string;
  is_read: boolean;
};

export type ServiceRef = {
  id: string;
  name: string;
  icon_url: string | null;
};

export type TopService = ServiceRef & {
  subscribers: number;
};

export type UserRow = {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  status: UserStatus;
  tariff: string;
  tariff_id: string;
  mrr: number;
  registered_at: string;
  last_seen_at: string;
  churn_risk: ChurnRisk;
};

export type Device = {
  id: string;
  platform: "ios" | "android" | "web";
  model: string;
  app_version: string;
  last_seen_at: string;
};

export type Subscription = {
  id: string;
  tariff_id: string;
  tariff: string;
  service: ServiceRef;
  price: number;
  currency: "RUB" | "USD" | "EUR";
  started_at: string;
  expires_at: string;
  auto_renew: boolean;
  status: "active" | "cancelled" | "expired" | "frozen";
};

export type UserProfile = UserRow & {
  phone: string | null;
  country: string;
  devices: Device[];
  active_subscriptions: Subscription[];
  subscriptions: Subscription[];
  points_balance: number;
  churn_probability: number;
  block_reason?: string;
  notes: string[];
};

export type UserFilterParams = {
  page?: number;
  per_page?: number;
  search?: string;
  status?: UserStatus | UserStatus[];
  risk?: ChurnRisk | ChurnRisk[];
  churn_risk?: ChurnRisk | ChurnRisk[];
  tariff_id?: string | string[];
  registered_from?: string;
  registered_to?: string;
};

export type BlockUserRequest = {
  reason: string;
};

export type GrantPointsRequest = {
  amount: number;
  comment: string;
};

export type UserNoteRequest = {
  note: string;
};

export type UserBulkActionRequest = {
  user_ids: string[];
  action: "block" | "unblock";
};

export type UserBulkActionResult = {
  status: string;
  updated: number;
  job_id?: string;
};

export type AdminNotificationTone = "danger" | "info" | "success" | "warning";
export type AdminNotificationStatus = "unread" | "read" | "archived";

export type AdminNotification = {
  description: string;
  href: string;
  id: string;
  isRead: boolean;
  status: AdminNotificationStatus;
  time: string;
  title: string;
  tone: AdminNotificationTone;
};

export type NotificationStatusPatchRequest = {
  status: AdminNotificationStatus;
};

export type Tariff = {
  id: string;
  name: string;
  price: number;
  currency: "RUB" | "USD" | "EUR";
  period: "month" | "year" | "once";
  trial_days: number;
  services: ServiceRef[];
  is_public: boolean;
  status: TariffStatus;
  subscribers: number;
};

export type TariffMutationRequest = {
  billing_period: "month" | "year";
  description?: string | null;
  name: string;
  price: {
    amount: number;
    currency: "RUB" | "USD" | "EUR";
  };
  service_ids: string[];
  status: TariffStatus;
};

export type SubscriptionMutationRequest = {
  action: "renew" | "cancel" | "freeze" | "change_tariff";
  cancel_reason?: string;
  frozen_until?: string;
  tariff_id?: string;
};

export type SubscriptionPromoRequest = {
  code: string;
};

export type PaymentTransactionStatus = "success" | "failed" | "refund" | "disputed";

export type PaymentTransaction = {
  id: string;
  user: string;
  amount: number;
  status: PaymentTransactionStatus;
  gateway: string;
  date: string;
};

export type PaymentGatewayStatus = "active" | "test" | "disabled";

export type PaymentGateway = {
  id: string;
  name: string;
  status: PaymentGatewayStatus;
  priority: number;
  declineRate: number;
  methods: string;
};

export type PaymentGatewayPatchRequest = {
  enabled?: boolean;
  priority?: number;
};

export type PaymentGatewayTestResult = {
  gateway_id: string;
  ok: boolean;
};

export type BillingReport = {
  mrr: number;
  arr: number;
  nrr: number;
  churn_revenue: number;
};

export type ExportJob = {
  job_id: string;
  status: string;
};

export type AdminJobStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

export type AdminJob = {
  job_id: string;
  type: string;
  status: AdminJobStatus;
  progress_pct: number;
  requested_by: string;
  input_data: Record<string, unknown>;
  result: Record<string, unknown> | null;
  error: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
};

export type MarketingCampaignChannel = "email" | "push" | "sms";
export type MarketingCampaignStatus = "draft" | "scheduled" | "sending" | "completed" | "cancelled";
export type MarketingExperimentStatus = "draft" | "running" | "completed";
export type MarketingExperimentVariantKey = "A" | "B";
export type MarketingTemplateStatus = "active" | "draft" | "archived";
export type MarketingAutomationStatus = "active" | "paused" | "draft";
export type MarketingReferralStatus = "active" | "pending" | "rewarded";
export type MarketingCouponStatus = "active" | "scheduled" | "expired" | "draft";
export type MarketingCouponDiscountType = "fixed" | "percent";

export type MarketingCampaign = {
  id: string;
  name: string;
  channel: MarketingCampaignChannel;
  segment: string;
  status: MarketingCampaignStatus;
  audience_size: number;
  conversion_rate: number;
  ctr: number;
  starts_at: string;
};

export type MarketingCampaignRequest = {
  body: string;
  channel: MarketingCampaignChannel;
  name: string;
  scheduled_at?: string | null;
  segment_id?: string | null;
  subject?: string | null;
  template_id?: string | null;
};

export type MarketingCampaignJob = {
  campaign_id: string;
  job_id?: string;
  status: string;
};

export type MarketingExperimentVariant = {
  key: MarketingExperimentVariantKey;
  title: string;
  audience_pct: number;
  conversion_rate: number;
  ctr: number;
};

export type MarketingExperiment = {
  id: string;
  name: string;
  hypothesis: string;
  segment: string;
  channel: MarketingCampaignChannel;
  status: MarketingExperimentStatus;
  audience_size: number;
  starts_at: string;
  winner: MarketingExperimentVariantKey | null;
  variants: MarketingExperimentVariant[];
};

export type MarketingMessageDraft = {
  id: string;
  name: string;
  channel: MarketingCampaignChannel;
  segment: string;
  title: string;
  body: string;
  cta: string;
  scheduled_at: string;
  status: MarketingCampaignStatus;
};

export type MarketingTemplate = {
  id: string;
  name: string;
  channel: MarketingCampaignChannel;
  category: string;
  subject: string;
  body: string;
  cta: string;
  usage_count: number;
  status: MarketingTemplateStatus;
};

export type MarketingAutomationRule = {
  id: string;
  name: string;
  trigger: string;
  channel: MarketingCampaignChannel;
  template_id: string;
  segment: string;
  delay_hours: number;
  status: MarketingAutomationStatus;
};

export type MarketingReferralSummary = {
  active_advocates: number;
  invites_month: number;
  conversions_month: number;
  reward_budget: number;
  conversion_rate: number;
};

export type MarketingReferralTier = {
  id: string;
  name: string;
  invite_goal: number;
  advocate_reward: string;
  friend_reward: string;
  status: MarketingAutomationStatus;
};

export type MarketingReferralEvent = {
  id: string;
  advocate: string;
  friend: string;
  channel: MarketingCampaignChannel;
  status: MarketingReferralStatus;
  reward: string;
  invited_at: string;
};

export type MarketingPromoCoupon = {
  id: string;
  code: string;
  title: string;
  discount_type: MarketingCouponDiscountType;
  discount_value: number;
  segment: string;
  usage_limit: number;
  used_count: number;
  expires_at: string;
  status: MarketingCouponStatus;
};

export type MarketingPromoCodeRequest = {
  code: string;
  discount_type: MarketingCouponDiscountType;
  discount_value: number;
  expires_at?: string | null;
  max_uses?: number | null;
};

export type MarketingPromoBulkRequest = {
  count: number;
  discount_type: MarketingCouponDiscountType;
  discount_value: number;
  expires_at?: string | null;
  max_uses?: number | null;
  prefix: string;
};

export type MarketingSegment = {
  id: string;
  name: string;
  filters: Record<string, unknown>;
  audience_size: number;
  updated_at: string;
};

export type MarketingSegmentRequest = {
  filters: Record<string, unknown>;
  name: string;
};

export type MarketingTemplateRequest = {
  body: string;
  category?: string | null;
  channel: MarketingCampaignChannel;
  cta?: string | null;
  name: string;
  status?: MarketingTemplateStatus;
  subject?: string | null;
};

export type MarketingReferralConfigRequest = {
  advocate_reward: string;
  friend_reward: string;
  invite_goal: number;
};

export type MarketingWorkspace = {
  campaigns: MarketingCampaign[];
  automation_rules: MarketingAutomationRule[];
  experiments: MarketingExperiment[];
  message_drafts: MarketingMessageDraft[];
  promo_coupons: MarketingPromoCoupon[];
  referral_events: MarketingReferralEvent[];
  referral_summary: MarketingReferralSummary;
  referral_tiers: MarketingReferralTier[];
  segments: MarketingSegment[];
  templates: MarketingTemplate[];
};

export type AnalyticsReportStatus = "ready" | "review" | "queued";
export type AnalyticsReportType = "Revenue" | "Retention" | "Services" | "Churn";
export type AnalyticsExportFormat = "CSV" | "XLSX" | "PDF";
export type AnalyticsScheduleFrequency = "daily" | "weekly" | "monthly";
export type AnalyticsDashboardTemplate = "revenue" | "retention" | "operations";

export type AnalyticsSummary = {
  mrr: string;
  mrr_delta: string;
  churn: string;
  churn_delta: string;
};

export type AnalyticsReport = {
  id: string;
  name: string;
  owner: string;
  period: string;
  segment: string;
  mrr: string;
  churn: string;
  arpu: string;
  status: AnalyticsReportStatus;
};

export type AnalyticsCohort = {
  id: string;
  name: string;
  users: number;
  retention: string;
  churn: string;
  arpu: string;
  recommendation: string;
};

export type AnalyticsExportJob = {
  id: string;
  name: string;
  format: AnalyticsExportFormat;
  rows: string;
  status: string;
};

export type AnalyticsScheduledReport = {
  id: string;
  name: string;
  owner_email: string;
  frequency: AnalyticsScheduleFrequency;
  format: AnalyticsExportFormat;
  next_run_at: string;
  status: string;
};

export type AnalyticsDashboardWidget = {
  id: string;
  title: string;
  metric: string;
  value: string;
  trend: string;
};

export type AnalyticsCustomDashboard = {
  id: string;
  name: string;
  owner: string;
  period: string;
  template: AnalyticsDashboardTemplate;
  updated_at: string;
  widgets: AnalyticsDashboardWidget[];
};

export type AnalyticsWorkspace = {
  summary: AnalyticsSummary;
  reports: AnalyticsReport[];
  cohorts: AnalyticsCohort[];
  exports: AnalyticsExportJob[];
  scheduled_reports: AnalyticsScheduledReport[];
  custom_dashboards: AnalyticsCustomDashboard[];
};

export type AnalyticsExportRequest = {
  format: AnalyticsExportFormat;
  period: string;
  report_type: AnalyticsReportType;
  segment: string;
};

export type AnalyticsScheduledReportRequest = {
  format: AnalyticsExportFormat;
  frequency: AnalyticsScheduleFrequency;
  name: string;
  owner_email: string;
};

export type GamificationTabStatus = "active" | "inactive";
export type GamificationRewardType = "badge" | "points" | "tariff";
export type GamificationLoyaltyEventType = "earned" | "redeemed" | "adjusted";
export type GamificationReviewStatus = "new" | "progress" | "resolved";
export type GamificationSentiment = "negative" | "neutral" | "positive";

export type GamificationAchievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
  trigger_event: string;
  trigger_count: number;
  reward_type: GamificationRewardType;
  reward_value: string;
  status: GamificationTabStatus;
};

export type GamificationAchievementRequest = {
  title: string;
  description: string;
  icon: string;
  trigger_event: string;
  trigger_count: number;
  reward_type: GamificationRewardType;
  reward_value: string;
  status: GamificationTabStatus;
};

export type GamificationRewardItem = {
  id: string;
  name: string;
  category: string;
  cost: number;
  stock: number;
  redemptions: number;
};

export type GamificationRewardRequest = {
  name: string;
  category: string;
  cost: number;
  stock: number;
  redemptions?: number;
};

export type GamificationLoyaltySummary = {
  active_members: number;
  points_balance: number;
  points_earned_month: number;
  points_spent_month: number;
  average_points_per_user: number;
};

export type GamificationLoyaltyTier = {
  id: string;
  name: string;
  threshold: number;
  members: number;
  benefit: string;
  status: GamificationTabStatus;
};

export type GamificationLoyaltyTierRequest = {
  name: string;
  threshold: number;
  benefit: string;
  status: GamificationTabStatus;
};

export type GamificationLoyaltyEvent = {
  id: string;
  user: string;
  event_type: GamificationLoyaltyEventType;
  amount: number;
  reason: string;
  date: string;
  source: string;
};

export type GamificationPointsAdjustmentRequest = {
  user: string;
  amount: number;
  comment: string;
  action: "grant" | "revoke";
};

export type GamificationPointsAdjustmentResult = {
  event: GamificationLoyaltyEvent;
  loyalty_summary: GamificationLoyaltySummary;
};

export type GamificationReview = {
  id: string;
  source: string;
  rating: number;
  text: string;
  date: string;
  user: string;
  sentiment: GamificationSentiment;
  tags: string[];
  status: GamificationReviewStatus;
  response: string;
};

export type GamificationReviewPatchRequest = {
  status: GamificationReviewStatus;
};

export type GamificationReviewReplyRequest = {
  response: string;
};

export type GamificationWorkspace = {
  achievements: GamificationAchievement[];
  loyalty_events: GamificationLoyaltyEvent[];
  loyalty_summary: GamificationLoyaltySummary;
  loyalty_tiers: GamificationLoyaltyTier[];
  rewards: GamificationRewardItem[];
  reviews: GamificationReview[];
};

export type SmartScenarioStatus = "ready" | "review" | "draft";
export type SmartAutomationStatus = "active" | "draft" | "review";
export type SmartTariff = "Premium" | "Family" | "Trial";

export type SmartScenario = {
  id: string;
  name: string;
  tariff: SmartTariff;
  price_delta_pct: number;
  churn_delta_pp: number;
  horizon_months: number;
  projected_mrr: number;
  ltv_impact_pct: number;
  status: SmartScenarioStatus;
};

export type ChurnRiskSegment = {
  id: string;
  name: string;
  users: number;
  risk_score: number;
  churn_probability_pct: number;
  confidence_pct: number;
  expected_loss: number;
  owner: string;
  recommended_action: string;
  top_drivers: string[];
};

export type RetentionAutomation = {
  id: string;
  name: string;
  trigger: string;
  channel: string;
  audience: string;
  status: SmartAutomationStatus;
};

export type SmartAutomationRunResult = {
  automation_id: string;
  matched: number;
  actions: unknown[];
};

export type SmartAnalyticsWorkspace = {
  scenarios: SmartScenario[];
  risk_segments: ChurnRiskSegment[];
  automations: RetentionAutomation[];
};

export type SecurityTabStatus = "active" | "review" | "expired";
export type SecuritySeverity = "low" | "medium" | "high";
export type AdminSessionStatus = "active" | "terminated";
export type SecurityRoleKey = "owner" | "security" | "support" | "finance" | "analyst";
export type SecurityMfaStatus = "enabled" | "pending" | "disabled";
export type SecurityMfaFactor = "totp" | "webauthn" | "sms";
export type SecurityPolicyStatus = "active" | "review" | "disabled";

export type SecurityAccessRule = {
  id: string;
  role: string;
  permission: string;
  scope: string;
  expires: string;
  owner: string;
  status: SecurityTabStatus;
};

export type SecurityAuditEvent = {
  id: string;
  action: string;
  actor: string;
  target: string;
  ip: string;
  severity: SecuritySeverity;
  evidence: string;
  time: string;
};

export type SecurityChangeHistory = {
  id: string;
  audit_event_id: string;
  description: string;
  author: string;
  created_at: string;
};

export type AdminSession = {
  id: string;
  admin: string;
  device: string;
  ip: string;
  location: string;
  risk: SecuritySeverity;
  last_seen: string;
  status: AdminSessionStatus;
};

export type SecuritySessionHistory = {
  id: string;
  session_id: string;
  action: string;
  reason: string;
  actor: string;
  created_at: string;
};

export type SecurityMfaUser = {
  id: string;
  admin: string;
  role: SecurityRoleKey;
  status: SecurityMfaStatus;
  primary_factor: SecurityMfaFactor;
  backup_codes_left: number;
  trusted_devices: number;
  last_challenge_at: string;
  risk: SecuritySeverity;
  recommendation: string;
};

export type SecurityMfaPolicy = {
  required_for_roles: SecurityRoleKey[];
  min_coverage_pct: number;
  grace_period_days: number;
  backup_codes_required: number;
  updated_at: string;
};

export type SecurityRateLimitRule = {
  id: string;
  name: string;
  endpoint: string;
  limit: number;
  window_seconds: number;
  burst: number;
  owner: string;
  status: SecurityPolicyStatus;
  risk: SecuritySeverity;
  updated_at: string;
};

export type SecurityHeaderPolicy = {
  id: string;
  header: string;
  value: string;
  coverage_pct: number;
  status: SecurityPolicyStatus;
  risk: SecuritySeverity;
  recommendation: string;
};

export type SecurityPoliciesPatchRequest = {
  header_policies?: SecurityHeaderPolicy[];
  mfa_policy?: SecurityMfaPolicy;
  rate_limit_rules?: SecurityRateLimitRule[];
};

export type SecurityRole = {
  id: SecurityRoleKey;
  name: string;
  description: string;
  users: number;
  risk: SecuritySeverity;
};

export type SecurityPermissionRow = {
  id: string;
  area: string;
  owner: boolean;
  security: boolean;
  support: boolean;
  finance: boolean;
  analyst: boolean;
};

export type SecurityRoleAssignment = {
  id: string;
  user: string;
  role: SecurityRoleKey;
  reason: string;
  changed_by: string;
  status: SecurityTabStatus;
};

export type SecurityRoleAssignmentRequest = {
  user: string;
  role: SecurityRoleKey;
  reason: string;
};

export type SecurityWorkspace = {
  access_rules: SecurityAccessRule[];
  audit_events: SecurityAuditEvent[];
  change_history: SecurityChangeHistory[];
  permission_matrix: SecurityPermissionRow[];
  role_assignments: SecurityRoleAssignment[];
  roles: SecurityRole[];
  sessions: AdminSession[];
  session_history: SecuritySessionHistory[];
  mfa_users: SecurityMfaUser[];
  mfa_policy: SecurityMfaPolicy;
  rate_limit_rules: SecurityRateLimitRule[];
  header_policies: SecurityHeaderPolicy[];
  mfa_coverage_pct: number;
};

export type ConfigDraftStatus = "draft" | "published" | "review";
export type IntegrationStatus = "healthy" | "review" | "disabled";
export type AlertRuleStatus = "active" | "muted" | "review";

export type SettingsConfigDraft = {
  id: string;
  section: string;
  value: string;
  environment: string;
  owner: string;
  status: ConfigDraftStatus;
};

export type SettingsIntegration = {
  id: string;
  name: string;
  description: string;
  status: IntegrationStatus;
  latency: string;
  mode: string;
};

export type SettingsAlertRule = {
  id: string;
  name: string;
  threshold: string;
  channel: string;
  owner: string;
  status: AlertRuleStatus;
};

export type SettingsWorkspace = {
  config_drafts: SettingsConfigDraft[];
  integrations: SettingsIntegration[];
  alert_rules: SettingsAlertRule[];
  last_published_at: string;
};

export type SettingsPatchRequest = {
  alert_api_latency_ms_threshold?: number;
  alert_churn_rate_threshold?: number;
  alert_decline_rate_threshold?: number;
  config_environment?: string;
  report_currency?: string;
  report_timezone?: string;
  support_sla_hours?: number;
};
