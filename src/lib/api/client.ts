import { mockApiService, resetMockService as resetMockServiceState } from "./mock-service";
import { liveApiService } from "./live-service";
import { getApiMode } from "./http-client";
import type {
  AnalyticsWorkspace,
  Anomaly,
  AdminNotification,
  AdminJob,
  AnalyticsExportJob,
  AnalyticsExportRequest,
  AnalyticsScheduledReport,
  AnalyticsScheduledReportRequest,
  ApiResponse,
  BillingReport,
  BlockUserRequest,
  DashboardKpis,
  DashboardNewUsers,
  DashboardRiskSummary,
  ExportJob,
  GamificationAchievement,
  GamificationAchievementRequest,
  GamificationLoyaltyTier,
  GamificationLoyaltyTierRequest,
  GamificationPointsAdjustmentRequest,
  GamificationPointsAdjustmentResult,
  GamificationRewardItem,
  GamificationRewardRequest,
  GamificationReview,
  GamificationReviewPatchRequest,
  GamificationReviewReplyRequest,
  GamificationWorkspace,
  GrantPointsRequest,
  MarketingCampaign,
  MarketingCampaignJob,
  MarketingCampaignRequest,
  MarketingPromoCodeRequest,
  MarketingPromoBulkRequest,
  MarketingPromoCoupon,
  MarketingReferralConfigRequest,
  MarketingSegment,
  MarketingSegmentRequest,
  MarketingTemplate,
  MarketingTemplateRequest,
  MarketingWorkspace,
  MrrPoint,
  NotificationStatusPatchRequest,
  PaymentGateway,
  PaymentGatewayPatchRequest,
  PaymentGatewayTestResult,
  PaymentTransaction,
  PaginatedResponse,
  SecurityPoliciesPatchRequest,
  SecurityRoleAssignmentRequest,
  SecurityWorkspace,
  SettingsPatchRequest,
  SettingsWorkspace,
  SmartAnalyticsWorkspace,
  SmartAutomationRunResult,
  Subscription,
  SubscriptionMutationRequest,
  SubscriptionPromoRequest,
  Tariff,
  TariffMutationRequest,
  TopService,
  UserBulkActionRequest,
  UserBulkActionResult,
  UserFilterParams,
  UserNoteRequest,
  UserProfile,
  UserRow,
} from "./contracts";

function apiService() {
  return getApiMode() === "live" ? liveApiService : mockApiService;
}

export function getDashboardKpis(): Promise<ApiResponse<DashboardKpis>> {
  return apiService().getDashboard();
}

export function getMrrChart(): Promise<ApiResponse<MrrPoint[]>> {
  return apiService().getMrrChart();
}

export function getDashboardNewUsers(): Promise<ApiResponse<DashboardNewUsers>> {
  return apiService().getDashboardNewUsers();
}

export function getDashboardRiskSummary(): Promise<ApiResponse<DashboardRiskSummary>> {
  return apiService().getDashboardRiskSummary();
}

export function getAnomalies(): Promise<ApiResponse<Anomaly[]>> {
  return apiService().getAnomalies();
}

export function getTopServices(): Promise<ApiResponse<TopService[]>> {
  return apiService().getTopServices();
}

export function getMarketingWorkspace(): Promise<ApiResponse<MarketingWorkspace>> {
  return apiService().getMarketingWorkspace();
}

export function createMarketingCampaign(
  request: MarketingCampaignRequest,
): Promise<ApiResponse<MarketingCampaign>> {
  return apiService().createMarketingCampaign(request);
}

export function updateMarketingCampaign(
  campaignId: string,
  request: MarketingCampaignRequest,
): Promise<ApiResponse<MarketingCampaign>> {
  return apiService().updateMarketingCampaign(campaignId, request);
}

export function sendMarketingCampaign(
  campaignId: string,
): Promise<ApiResponse<MarketingCampaignJob>> {
  return apiService().sendMarketingCampaign(campaignId);
}

export function cancelMarketingCampaign(
  campaignId: string,
): Promise<ApiResponse<{ success: boolean }>> {
  return apiService().cancelMarketingCampaign(campaignId);
}

export function deleteMarketingCampaign(
  campaignId: string,
): Promise<ApiResponse<{ success: boolean }>> {
  return apiService().deleteMarketingCampaign(campaignId);
}

export function createMarketingPromoCode(
  request: MarketingPromoCodeRequest,
): Promise<ApiResponse<MarketingPromoCoupon>> {
  return apiService().createMarketingPromoCode(request);
}

export function deactivateMarketingPromoCode(
  promoId: string,
): Promise<ApiResponse<{ success: boolean }>> {
  return apiService().deactivateMarketingPromoCode(promoId);
}

export function createMarketingPromoCodesBulk(
  request: MarketingPromoBulkRequest,
): Promise<ApiResponse<MarketingPromoCoupon[]>> {
  return apiService().createMarketingPromoCodesBulk(request);
}

export function updateMarketingPromoCode(
  promoId: string,
  request: Partial<MarketingPromoCodeRequest>,
): Promise<ApiResponse<MarketingPromoCoupon>> {
  return apiService().updateMarketingPromoCode(promoId, request);
}

export function createMarketingSegment(
  request: MarketingSegmentRequest,
): Promise<ApiResponse<MarketingSegment>> {
  return apiService().createMarketingSegment(request);
}

export function updateMarketingSegment(
  segmentId: string,
  request: MarketingSegmentRequest,
): Promise<ApiResponse<MarketingSegment>> {
  return apiService().updateMarketingSegment(segmentId, request);
}

export function refreshMarketingSegment(
  segmentId: string,
): Promise<ApiResponse<MarketingSegment>> {
  return apiService().refreshMarketingSegment(segmentId);
}

export function createMarketingTemplate(
  request: MarketingTemplateRequest,
): Promise<ApiResponse<MarketingTemplate>> {
  return apiService().createMarketingTemplate(request);
}

export function updateMarketingTemplate(
  templateId: string,
  request: Partial<MarketingTemplateRequest>,
): Promise<ApiResponse<MarketingTemplate>> {
  return apiService().updateMarketingTemplate(templateId, request);
}

export function deleteMarketingTemplate(
  templateId: string,
): Promise<ApiResponse<{ success: boolean }>> {
  return apiService().deleteMarketingTemplate(templateId);
}

export function updateReferralConfig(
  request: MarketingReferralConfigRequest,
): Promise<ApiResponse<{ success: boolean }>> {
  return apiService().updateReferralConfig(request);
}

export function getAnalyticsWorkspace(): Promise<ApiResponse<AnalyticsWorkspace>> {
  return apiService().getAnalyticsWorkspace();
}

export function createAnalyticsExport(
  request: AnalyticsExportRequest,
): Promise<ApiResponse<AnalyticsExportJob>> {
  return apiService().createAnalyticsExport(request);
}

export function createAnalyticsScheduledReport(
  request: AnalyticsScheduledReportRequest,
): Promise<ApiResponse<AnalyticsScheduledReport>> {
  return apiService().createAnalyticsScheduledReport(request);
}

export function getJobs(): Promise<ApiResponse<PaginatedResponse<AdminJob>>> {
  return apiService().getJobs();
}

export function getJob(jobId: string): Promise<ApiResponse<AdminJob>> {
  return apiService().getJob(jobId);
}

export function cancelJob(jobId: string): Promise<ApiResponse<{ success: boolean }>> {
  return apiService().cancelJob(jobId);
}

export function getGamificationWorkspace(): Promise<ApiResponse<GamificationWorkspace>> {
  return apiService().getGamificationWorkspace();
}

export function createGamificationAchievement(
  request: GamificationAchievementRequest,
): Promise<ApiResponse<GamificationAchievement>> {
  return apiService().createGamificationAchievement(request);
}

export function updateGamificationAchievement(
  achievementId: string,
  request: Partial<GamificationAchievementRequest>,
): Promise<ApiResponse<GamificationAchievement>> {
  return apiService().updateGamificationAchievement(achievementId, request);
}

export function deleteGamificationAchievement(
  achievementId: string,
): Promise<ApiResponse<{ success: boolean }>> {
  return apiService().deleteGamificationAchievement(achievementId);
}

export function createGamificationReward(
  request: GamificationRewardRequest,
): Promise<ApiResponse<GamificationRewardItem>> {
  return apiService().createGamificationReward(request);
}

export function updateGamificationReward(
  rewardId: string,
  request: Partial<GamificationRewardRequest>,
): Promise<ApiResponse<GamificationRewardItem>> {
  return apiService().updateGamificationReward(rewardId, request);
}

export function deleteGamificationReward(
  rewardId: string,
): Promise<ApiResponse<{ success: boolean }>> {
  return apiService().deleteGamificationReward(rewardId);
}

export function createGamificationLoyaltyTier(
  request: GamificationLoyaltyTierRequest,
): Promise<ApiResponse<GamificationLoyaltyTier>> {
  return apiService().createGamificationLoyaltyTier(request);
}

export function updateGamificationLoyaltyTier(
  tierId: string,
  request: Partial<GamificationLoyaltyTierRequest>,
): Promise<ApiResponse<GamificationLoyaltyTier>> {
  return apiService().updateGamificationLoyaltyTier(tierId, request);
}

export function deleteGamificationLoyaltyTier(
  tierId: string,
): Promise<ApiResponse<{ success: boolean }>> {
  return apiService().deleteGamificationLoyaltyTier(tierId);
}

export function adjustGamificationPoints(
  request: GamificationPointsAdjustmentRequest,
): Promise<ApiResponse<GamificationPointsAdjustmentResult>> {
  return apiService().adjustGamificationPoints(request);
}

export function updateGamificationReview(
  reviewId: string,
  request: GamificationReviewPatchRequest,
): Promise<ApiResponse<GamificationReview>> {
  return apiService().updateGamificationReview(reviewId, request);
}

export function replyToGamificationReview(
  reviewId: string,
  request: GamificationReviewReplyRequest,
): Promise<ApiResponse<GamificationReview>> {
  return apiService().replyToGamificationReview(reviewId, request);
}

export function getSmartAnalyticsWorkspace(): Promise<
  ApiResponse<SmartAnalyticsWorkspace>
> {
  return apiService().getSmartAnalyticsWorkspace();
}

export function runSmartAutomation(
  automationId: string,
): Promise<ApiResponse<SmartAutomationRunResult>> {
  return apiService().runSmartAutomation(automationId);
}

export function getSecurityWorkspace(): Promise<ApiResponse<SecurityWorkspace>> {
  return apiService().getSecurityWorkspace();
}

export function updateSecurityPolicies(
  request: SecurityPoliciesPatchRequest,
): Promise<ApiResponse<SecurityWorkspace>> {
  return apiService().updateSecurityPolicies(request);
}

export function assignSecurityRole(
  request: SecurityRoleAssignmentRequest,
): Promise<ApiResponse<SecurityWorkspace>> {
  return apiService().assignSecurityRole(request);
}

export function getNotifications(): Promise<ApiResponse<PaginatedResponse<AdminNotification>>> {
  return apiService().getNotifications();
}

export function updateNotificationStatus(
  notificationId: string,
  request: NotificationStatusPatchRequest,
): Promise<ApiResponse<AdminNotification>> {
  return apiService().updateNotificationStatus(notificationId, request);
}

export function terminateAdminSession(
  sessionId: string,
): Promise<ApiResponse<{ success: boolean }>> {
  return apiService().terminateAdminSession(sessionId);
}

export function getSettingsWorkspace(): Promise<ApiResponse<SettingsWorkspace>> {
  return apiService().getSettingsWorkspace();
}

export function updateSettings(
  request: SettingsPatchRequest,
): Promise<ApiResponse<SettingsWorkspace>> {
  return apiService().updateSettings(request);
}

export function getUsers(
  params?: UserFilterParams,
): Promise<ApiResponse<PaginatedResponse<UserRow>>> {
  return apiService().getUsers(params);
}

export function exportUsers(): Promise<ApiResponse<ExportJob>> {
  return apiService().exportUsers();
}

export function bulkUserAction(
  request: UserBulkActionRequest,
): Promise<ApiResponse<UserBulkActionResult>> {
  return apiService().bulkUserAction(request);
}

export function getUser(id: string): Promise<ApiResponse<UserProfile>> {
  return apiService().getUser(id);
}

export function blockUser(
  id: string,
  request: BlockUserRequest,
): Promise<ApiResponse<null>> {
  return apiService().blockUser(id, request);
}

export function unblockUser(id: string): Promise<ApiResponse<null>> {
  return apiService().unblockUser(id);
}

export function grantPoints(
  id: string,
  request: GrantPointsRequest,
): Promise<ApiResponse<null>> {
  return apiService().grantPoints(id, request);
}

export function deductPoints(
  id: string,
  request: GrantPointsRequest,
): Promise<ApiResponse<null>> {
  return apiService().deductPoints(id, request);
}

export function addUserNote(
  id: string,
  request: UserNoteRequest,
): Promise<ApiResponse<string[]>> {
  return apiService().addUserNote(id, request);
}

export function getTariffs(): Promise<ApiResponse<Tariff[]>> {
  return apiService().getTariffs();
}

export function createTariff(request: TariffMutationRequest): Promise<ApiResponse<Tariff>> {
  return apiService().createTariff(request);
}

export function updateTariff(
  tariffId: string,
  request: TariffMutationRequest,
): Promise<ApiResponse<Tariff>> {
  return apiService().updateTariff(tariffId, request);
}

export function archiveTariff(tariffId: string): Promise<ApiResponse<{ success: boolean }>> {
  return apiService().archiveTariff(tariffId);
}

export function duplicateTariff(tariffId: string): Promise<ApiResponse<Tariff>> {
  return apiService().duplicateTariff(tariffId);
}

export function getSubscriptions(): Promise<ApiResponse<Subscription[]>> {
  return apiService().getSubscriptions();
}

export function updateSubscription(
  subscriptionId: string,
  request: SubscriptionMutationRequest,
): Promise<ApiResponse<Subscription>> {
  return apiService().updateSubscription(subscriptionId, request);
}

export function applySubscriptionPromo(
  subscriptionId: string,
  request: SubscriptionPromoRequest,
): Promise<ApiResponse<Subscription>> {
  return apiService().applySubscriptionPromo(subscriptionId, request);
}

export function getTransactions(): Promise<ApiResponse<PaymentTransaction[]>> {
  return apiService().getTransactions();
}

export function getPaymentGateways(): Promise<ApiResponse<PaymentGateway[]>> {
  return apiService().getPaymentGateways();
}

export function getBillingReport(): Promise<ApiResponse<BillingReport>> {
  return apiService().getBillingReport();
}

export function exportBillingReport(): Promise<ApiResponse<ExportJob>> {
  return apiService().exportBillingReport();
}

export function testPaymentGateway(
  gatewayId: string,
): Promise<ApiResponse<PaymentGatewayTestResult>> {
  return apiService().testPaymentGateway(gatewayId);
}

export function updatePaymentGateway(
  gatewayId: string,
  request: PaymentGatewayPatchRequest,
): Promise<ApiResponse<PaymentGateway>> {
  return apiService().updatePaymentGateway(gatewayId, request);
}

export function resetMockService(): void {
  resetMockServiceState();
}
