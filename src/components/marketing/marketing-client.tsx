"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  FlaskConical,
  Layers3,
  Percent,
  Plus,
  Search,
  Send,
  TicketPercent,
  Trophy,
  Users,
} from "lucide-react";
import { z } from "zod";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import {
  cancelMarketingCampaign,
  createMarketingCampaign,
  createMarketingPromoCode,
  createMarketingPromoCodesBulk,
  createMarketingSegment,
  deactivateMarketingPromoCode,
  deleteMarketingTemplate,
  deleteMarketingCampaign,
  getMarketingWorkspace,
  refreshMarketingSegment,
  sendMarketingCampaign,
  updateMarketingCampaign,
  updateMarketingPromoCode,
  updateMarketingTemplate,
  updateReferralConfig,
} from "@/lib/api/client";
import type {
  MarketingCampaign,
  MarketingCampaignChannel,
  MarketingCampaignRequest,
  MarketingCampaignStatus,
  MarketingAutomationRule,
  MarketingAutomationStatus,
  MarketingExperiment,
  MarketingExperimentStatus,
  MarketingExperimentVariantKey,
  MarketingMessageDraft,
  MarketingCouponDiscountType,
  MarketingCouponStatus,
  MarketingPromoCodeRequest,
  MarketingPromoCoupon,
  MarketingReferralEvent,
  MarketingReferralStatus,
  MarketingReferralTier,
  MarketingSegment,
  MarketingTemplate,
  MarketingTemplateRequest,
  MarketingTemplateStatus,
} from "@/lib/api/contracts";
import { cn } from "@/lib/utils";

type MarketingTab =
  | "campaigns"
  | "experiments"
  | "messages"
  | "segments"
  | "templates"
  | "automation"
  | "referrals"
  | "promos";
type StatusFilter = "all" | MarketingCampaignStatus;
type ChannelFilter = "all" | MarketingCampaignChannel;
type TemplateStatusFilter = "all" | MarketingTemplateStatus;
type AutomationStatusFilter = "all" | MarketingAutomationStatus;
type CouponStatusFilter = "all" | MarketingCouponStatus;

type DraftCampaignForm = {
  audienceSize: string;
  channel: MarketingCampaignChannel;
  conversionRate: string;
  name: string;
  segment: string;
};

type ExperimentForm = {
  audienceSize: string;
  channel: MarketingCampaignChannel;
  hypothesis: string;
  name: string;
  segment: string;
  splitA: string;
  variantA: string;
  variantB: string;
};

type MessageForm = {
  body: string;
  channel: MarketingCampaignChannel;
  cta: string;
  name: string;
  scheduledAt: string;
  segment: string;
  title: string;
};

type AutomationForm = {
  channel: MarketingCampaignChannel;
  delayHours: string;
  name: string;
  segment: string;
  templateId: string;
  trigger: string;
};

type ReferralForm = {
  advocateReward: string;
  campaignName: string;
  channel: MarketingCampaignChannel;
  friendReward: string;
  inviteGoal: string;
};

type CouponForm = {
  code: string;
  discountType: MarketingCouponDiscountType;
  discountValue: string;
  expiresAt: string;
  segment: string;
  title: string;
  usageLimit: string;
};

type SegmentForm = {
  name: string;
  risk: "all" | "high" | "medium" | "low";
  status: "all" | "active" | "trial" | "blocked";
};

const emptyCampaigns: MarketingCampaign[] = [];
const emptyExperiments: MarketingExperiment[] = [];
const emptyMessageDrafts: MarketingMessageDraft[] = [];
const emptySegments: MarketingSegment[] = [];
const emptyTemplates: MarketingTemplate[] = [];
const emptyAutomationRules: MarketingAutomationRule[] = [];
const emptyReferralEvents: MarketingReferralEvent[] = [];
const emptyReferralTiers: MarketingReferralTier[] = [];
const emptyPromoCoupons: MarketingPromoCoupon[] = [];

const tabLabel: Record<MarketingTab, string> = {
  automation: "Автоматизация",
  campaigns: "Кампании",
  experiments: "A/B-тесты",
  messages: "Сообщения",
  promos: "Промо-коды",
  referrals: "Рефералы",
  segments: "Сегменты",
  templates: "Шаблоны",
};

const statusLabel: Record<MarketingCampaignStatus, string> = {
  cancelled: "Отменена",
  completed: "Завершена",
  draft: "Черновик",
  scheduled: "Запланирована",
  sending: "Активна",
};

const experimentStatusLabel: Record<MarketingExperimentStatus, string> = {
  completed: "Завершен",
  draft: "Черновик",
  running: "Запущен",
};

const channelLabel: Record<MarketingCampaignChannel, string> = {
  email: "Email",
  push: "Push",
  sms: "SMS",
};

const templateStatusLabel: Record<MarketingTemplateStatus, string> = {
  active: "Активен",
  archived: "Архив",
  draft: "Черновик",
};

const automationStatusLabel: Record<MarketingAutomationStatus, string> = {
  active: "Активно",
  draft: "Черновик",
  paused: "Пауза",
};

const referralStatusLabel: Record<MarketingReferralStatus, string> = {
  active: "Активен",
  pending: "Ожидает",
  rewarded: "Награда выдана",
};

const couponStatusLabel: Record<MarketingCouponStatus, string> = {
  active: "Активен",
  draft: "Черновик",
  expired: "Истёк",
  scheduled: "Запланирован",
};

const draftCampaignSchema = z.object({
  audienceSize: z.coerce
    .number({ error: "Укажите размер аудитории" })
    .int("Аудитория должна быть целым числом")
    .min(1, "Аудитория должна быть больше 0"),
  channel: z.enum(["email", "push", "sms"]),
  conversionRate: z.coerce
    .number({ error: "Укажите конверсию" })
    .min(0, "Конверсия не может быть ниже 0")
    .max(100, "Конверсия не может быть выше 100"),
  name: z.string().trim().min(3, "Название должно быть не короче 3 символов"),
  segment: z.string().trim().min(3, "Сегмент должен быть не короче 3 символов"),
});

const experimentSchema = z
  .object({
    audienceSize: z.coerce
      .number({ error: "Укажите размер аудитории теста" })
      .int("Аудитория теста должна быть целым числом")
      .min(100, "Аудитория теста должна быть не меньше 100"),
    channel: z.enum(["email", "push", "sms"]),
    hypothesis: z.string().trim().min(10, "Гипотеза должна быть не короче 10 символов"),
    name: z.string().trim().min(3, "Название теста должно быть не короче 3 символов"),
    segment: z.string().trim().min(3, "Сегмент теста должен быть не короче 3 символов"),
    splitA: z.coerce
      .number({ error: "Укажите долю варианта A" })
      .int("Доля варианта A должна быть целым числом")
      .min(10, "Доля варианта A должна быть не меньше 10%")
      .max(90, "Доля варианта A должна быть не больше 90%"),
    variantA: z.string().trim().min(3, "Вариант A должен быть не короче 3 символов"),
    variantB: z.string().trim().min(3, "Вариант B должен быть не короче 3 символов"),
  })
  .refine((value) => value.variantA.trim() !== value.variantB.trim(), {
    message: "Варианты A и B должны отличаться",
    path: ["variantB"],
  });

const messageSchema = z.object({
  body: z.string().trim().min(12, "Текст сообщения должен быть не короче 12 символов"),
  channel: z.enum(["push", "sms"]),
  cta: z.string().trim().min(3, "CTA должен быть не короче 3 символов"),
  name: z.string().trim().min(3, "Название сообщения должно быть не короче 3 символов"),
  scheduledAt: z.string().trim().min(3, "Укажите время отправки"),
  segment: z.string().trim().min(3, "Сегмент должен быть не короче 3 символов"),
  title: z.string().trim().min(3, "Заголовок должен быть не короче 3 символов"),
});

const automationSchema = z.object({
  channel: z.enum(["email", "push", "sms"]),
  delayHours: z.coerce
    .number({ error: "Укажите задержку" })
    .int("Задержка должна быть целым числом")
    .min(0, "Задержка не может быть ниже 0")
    .max(168, "Задержка не может быть больше 168 часов"),
  name: z.string().trim().min(3, "Название правила должно быть не короче 3 символов"),
  segment: z.string().trim().min(3, "Сегмент должен быть не короче 3 символов"),
  templateId: z.string().trim().min(1, "Выберите шаблон"),
  trigger: z.string().trim().min(3, "Триггер должен быть не короче 3 символов"),
});

const referralSchema = z.object({
  advocateReward: z.string().trim().min(3, "Укажите награду рекомендателю"),
  campaignName: z.string().trim().min(3, "Название должно быть не короче 3 символов"),
  channel: z.enum(["email", "push", "sms"]),
  friendReward: z.string().trim().min(3, "Укажите награду другу"),
  inviteGoal: z.coerce
    .number({ error: "Укажите цель приглашений" })
    .int("Цель должна быть целым числом")
    .min(1, "Цель должна быть не меньше 1"),
});

const couponSchema = z.object({
  code: z
    .string()
    .trim()
    .min(4, "Код должен быть не короче 4 символов")
    .regex(/^[A-Z0-9_-]+$/, "Код должен содержать латинские буквы, цифры, _ или -"),
  discountType: z.enum(["fixed", "percent"]),
  discountValue: z.coerce
    .number({ error: "Укажите скидку" })
    .min(1, "Скидка должна быть не меньше 1"),
  expiresAt: z.string().trim().min(3, "Укажите срок действия"),
  segment: z.string().trim().min(3, "Сегмент должен быть не короче 3 символов"),
  title: z.string().trim().min(3, "Название должно быть не короче 3 символов"),
  usageLimit: z.coerce
    .number({ error: "Укажите лимит" })
    .int("Лимит должен быть целым числом")
    .min(1, "Лимит должен быть не меньше 1"),
});

const segmentSchema = z.object({
  name: z.string().trim().min(3, "Название сегмента должно быть не короче 3 символов"),
  risk: z.enum(["all", "high", "medium", "low"]),
  status: z.enum(["all", "active", "trial", "blocked"]),
});

const initialCampaignForm: DraftCampaignForm = {
  audienceSize: "25000",
  channel: "push",
  conversionRate: "4.5",
  name: "",
  segment: "Premium без годового тарифа",
};

const initialMessageForm: MessageForm = {
  body: "",
  channel: "push",
  cta: "",
  name: "",
  scheduledAt: "Сегодня 18:00",
  segment: "Истекают через 3 дня",
  title: "",
};

const initialExperimentForm: ExperimentForm = {
  audienceSize: "20000",
  channel: "push",
  hypothesis: "Более короткий оффер повысит конверсию продления.",
  name: "",
  segment: "Истекают через 3 дня",
  splitA: "50",
  variantA: "Скидка 10% на год",
  variantB: "Сохраните подписки без перерыва",
};

const initialReferralForm: ReferralForm = {
  advocateReward: "500 баллов",
  campaignName: "",
  channel: "push",
  friendReward: "500 RUB скидка",
  inviteGoal: "3",
};

const initialCouponForm: CouponForm = {
  code: "",
  discountType: "percent",
  discountValue: "15",
  expiresAt: "2026-06-30",
  segment: "Новые по рефералам",
  title: "",
  usageLimit: "1000",
};

const initialSegmentForm: SegmentForm = {
  name: "",
  risk: "all",
  status: "active",
};

function statusClass(status: MarketingCampaignStatus | MarketingExperimentStatus) {
  if (status === "completed") {
    return "bg-success/10 text-success";
  }

  if (status === "sending" || status === "running") {
    return "bg-brand-primary/10 text-brand-primary";
  }

  if (status === "scheduled") {
    return "bg-info/10 text-info";
  }

  return "bg-muted/20 text-text-secondary";
}

function isActiveCampaign(campaign: MarketingCampaign) {
  return campaign.status === "scheduled" || campaign.status === "sending";
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  });
}

export function MarketingClient() {
  const marketingQuery = useQuery({
    queryFn: getMarketingWorkspace,
    queryKey: ["marketing-workspace"],
  });
  const [activeTab, setActiveTab] = useState<MarketingTab>("campaigns");
  const [localCampaigns, setLocalCampaigns] = useState<MarketingCampaign[] | null>(null);
  const [localExperiments, setLocalExperiments] = useState<MarketingExperiment[] | null>(null);
  const [localMessageDrafts, setLocalMessageDrafts] =
    useState<MarketingMessageDraft[] | null>(null);
  const [localSegments, setLocalSegments] = useState<MarketingSegment[] | null>(null);
  const [localTemplates, setLocalTemplates] = useState<MarketingTemplate[] | null>(null);
  const [localAutomationRules, setLocalAutomationRules] = useState<MarketingAutomationRule[] | null>(null);
  const [localReferralTiers, setLocalReferralTiers] = useState<MarketingReferralTier[] | null>(null);
  const [localPromoCoupons, setLocalPromoCoupons] = useState<MarketingPromoCoupon[] | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("all");
  const [templateStatusFilter, setTemplateStatusFilter] = useState<TemplateStatusFilter>("all");
  const [automationStatusFilter, setAutomationStatusFilter] = useState<AutomationStatusFilter>("all");
  const [couponStatusFilter, setCouponStatusFilter] = useState<CouponStatusFilter>("all");
  const [search, setSearch] = useState("");
  const [templateSearch, setTemplateSearch] = useState("");
  const [campaignForm, setCampaignForm] = useState<DraftCampaignForm>(initialCampaignForm);
  const [messageForm, setMessageForm] = useState<MessageForm>(initialMessageForm);
  const [referralForm, setReferralForm] = useState<ReferralForm>(initialReferralForm);
  const [couponForm, setCouponForm] = useState<CouponForm>(initialCouponForm);
  const [segmentForm, setSegmentForm] = useState<SegmentForm>(initialSegmentForm);
  const [experimentForm, setExperimentForm] =
    useState<ExperimentForm>(initialExperimentForm);
  const [automationForm, setAutomationForm] = useState<AutomationForm>({
    channel: "push",
    delayHours: "2",
    name: "",
    segment: "Истекают через 3 дня",
    templateId: "",
    trigger: "subscription_expires_soon",
  });
  const [campaignErrors, setCampaignErrors] =
    useState<Partial<Record<keyof DraftCampaignForm, string>>>({});
  const [messageErrors, setMessageErrors] =
    useState<Partial<Record<keyof MessageForm, string>>>({});
  const [experimentErrors, setExperimentErrors] =
    useState<Partial<Record<keyof ExperimentForm, string>>>({});
  const [automationErrors, setAutomationErrors] =
    useState<Partial<Record<keyof AutomationForm, string>>>({});
  const [referralErrors, setReferralErrors] =
    useState<Partial<Record<keyof ReferralForm, string>>>({});
  const [couponErrors, setCouponErrors] =
    useState<Partial<Record<keyof CouponForm, string>>>({});
  const [segmentErrors, setSegmentErrors] =
    useState<Partial<Record<keyof SegmentForm, string>>>({});
  const [campaignMessage, setCampaignMessage] = useState("");
  const [messageDraftMessage, setMessageDraftMessage] = useState("");
  const [experimentMessage, setExperimentMessage] = useState("");
  const [automationMessage, setAutomationMessage] = useState("");
  const [referralMessage, setReferralMessage] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [segmentMessage, setSegmentMessage] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const remoteCampaigns = marketingQuery.data?.data.campaigns ?? emptyCampaigns;
  const remoteExperiments = marketingQuery.data?.data.experiments ?? emptyExperiments;
  const remoteMessageDrafts = marketingQuery.data?.data.message_drafts ?? emptyMessageDrafts;
  const remoteSegments = marketingQuery.data?.data.segments ?? emptySegments;
  const remoteTemplates = marketingQuery.data?.data.templates ?? emptyTemplates;
  const remoteAutomationRules =
    marketingQuery.data?.data.automation_rules ?? emptyAutomationRules;
  const remoteReferralEvents = marketingQuery.data?.data.referral_events ?? emptyReferralEvents;
  const remoteReferralTiers = marketingQuery.data?.data.referral_tiers ?? emptyReferralTiers;
  const referralSummary = marketingQuery.data?.data.referral_summary;
  const remotePromoCoupons = marketingQuery.data?.data.promo_coupons ?? emptyPromoCoupons;
  const campaigns = useMemo(
    () => localCampaigns ?? remoteCampaigns,
    [localCampaigns, remoteCampaigns],
  );
  const createCampaignMutation = useMutation({
    mutationFn: createMarketingCampaign,
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Не удалось создать кампанию";
      setCampaignMessage(message);
    },
    onSuccess: async ({ data }, request) => {
      const audienceSize = Number(
        request.body.match(/Audience:\s*([\d.]+)/)?.[1] ?? 0,
      );
      const conversionRate = Number(
        request.body.match(/Expected conversion:\s*([\d.]+)/)?.[1] ?? 0,
      );
      const campaign = {
        ...data,
        audience_size: audienceSize,
        conversion_rate: conversionRate,
      };
      setLocalCampaigns((current) => [
        campaign,
        ...(current ?? remoteCampaigns),
      ]);
      setCampaignForm(initialCampaignForm);
      setCampaignErrors({});
      setCampaignMessage(`Черновик "${campaign.name}" создан`);
      setStatusFilter("all");
      setChannelFilter("all");
      setSearch("");
      await marketingQuery.refetch();
    },
  });
  const sendCampaignMutation = useMutation({
    mutationFn: sendMarketingCampaign,
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Не удалось запустить кампанию";
      setCampaignMessage(message);
    },
    onSuccess: async ({ data }) => {
      setLocalCampaigns((current) =>
        (current ?? remoteCampaigns).map((campaign) =>
          campaign.id === data.campaign_id ? { ...campaign, status: "sending" } : campaign,
        ),
      );
      setCampaignMessage(`Кампания поставлена в очередь: ${data.job_id || data.status}`);
      await marketingQuery.refetch();
    },
  });
  const cancelCampaignMutation = useMutation({
    mutationFn: cancelMarketingCampaign,
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Не удалось отменить кампанию";
      setCampaignMessage(message);
    },
    onSuccess: async (_response, campaignId) => {
      setLocalCampaigns((current) =>
        (current ?? remoteCampaigns).map((campaign) =>
          campaign.id === campaignId ? { ...campaign, status: "cancelled" } : campaign,
        ),
      );
      setCampaignMessage("Кампания отменена");
      await marketingQuery.refetch();
    },
  });
  const deleteCampaignMutation = useMutation({
    mutationFn: deleteMarketingCampaign,
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Не удалось удалить кампанию";
      setCampaignMessage(message);
    },
    onSuccess: async (_response, campaignId) => {
      setLocalCampaigns((current) =>
        (current ?? remoteCampaigns).filter((campaign) => campaign.id !== campaignId),
      );
      setCampaignMessage("Кампания удалена");
      await marketingQuery.refetch();
    },
  });
  const updateCampaignMutation = useMutation({
    mutationFn: ({
      campaign,
      campaignId,
    }: {
      campaign: MarketingCampaignRequest;
      campaignId: string;
    }) => updateMarketingCampaign(campaignId, campaign),
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Не удалось обновить кампанию";
      setCampaignMessage(message);
    },
    onSuccess: async ({ data }) => {
      setLocalCampaigns((current) =>
        (current ?? remoteCampaigns).map((campaign) =>
          campaign.id === data.id ? data : campaign,
        ),
      );
      setCampaignMessage(`Кампания "${data.name}" обновлена`);
      await marketingQuery.refetch();
    },
  });
  const createPromoCodeMutation = useMutation({
    mutationFn: createMarketingPromoCode,
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Не удалось создать промо-код";
      setCouponMessage(message);
    },
    onSuccess: async ({ data }) => {
      setLocalPromoCoupons((current) => [data, ...(current ?? remotePromoCoupons)]);
      setCouponForm(initialCouponForm);
      setCouponErrors({});
      setCouponMessage(`Промо-код "${data.code}" создан`);
      setCouponStatusFilter("all");
      await marketingQuery.refetch();
    },
  });
  const deactivatePromoCodeMutation = useMutation({
    mutationFn: deactivateMarketingPromoCode,
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Не удалось деактивировать промо-код";
      setCouponMessage(message);
    },
    onSuccess: async (_response, promoId) => {
      setLocalPromoCoupons((current) =>
        (current ?? remotePromoCoupons).map((coupon) =>
          coupon.id === promoId ? { ...coupon, status: "expired" } : coupon,
        ),
      );
      setCouponMessage("Промо-код деактивирован");
      await marketingQuery.refetch();
    },
  });
  const updatePromoCodeMutation = useMutation({
    mutationFn: ({
      promo,
      promoId,
    }: {
      promo: Partial<MarketingPromoCodeRequest>;
      promoId: string;
    }) => updateMarketingPromoCode(promoId, promo),
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Не удалось обновить промо-код";
      setCouponMessage(message);
    },
    onSuccess: async ({ data }) => {
      setLocalPromoCoupons((current) =>
        (current ?? remotePromoCoupons).map((coupon) =>
          coupon.id === data.id ? data : coupon,
        ),
      );
      setCouponMessage(`Промо-код "${data.code}" обновлен`);
      await marketingQuery.refetch();
    },
  });
  const createPromoCodesBulkMutation = useMutation({
    mutationFn: createMarketingPromoCodesBulk,
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Не удалось создать пачку промо-кодов";
      setCouponMessage(message);
    },
    onSuccess: async ({ data }) => {
      setLocalPromoCoupons((current) => [...data, ...(current ?? remotePromoCoupons)]);
      setCouponForm(initialCouponForm);
      setCouponErrors({});
      setCouponMessage(`Создано промо-кодов: ${data.length}`);
      setCouponStatusFilter("all");
      await marketingQuery.refetch();
    },
  });
  const deleteTemplateMutation = useMutation({
    mutationFn: deleteMarketingTemplate,
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Не удалось архивировать шаблон";
      setMessageDraftMessage(message);
    },
    onSuccess: async (_response, templateId) => {
      setLocalTemplates((current) =>
        (current ?? remoteTemplates).map((template) =>
          template.id === templateId ? { ...template, status: "archived" } : template,
        ),
      );
      setMessageDraftMessage("Шаблон архивирован");
      await marketingQuery.refetch();
    },
  });
  const updateTemplateMutation = useMutation({
    mutationFn: ({
      template,
      templateId,
    }: {
      template: Partial<MarketingTemplateRequest>;
      templateId: string;
    }) => updateMarketingTemplate(templateId, template),
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Не удалось обновить шаблон";
      setMessageDraftMessage(message);
    },
    onSuccess: async ({ data }) => {
      setLocalTemplates((current) =>
        (current ?? remoteTemplates).map((template) =>
          template.id === data.id ? data : template,
        ),
      );
      setMessageDraftMessage(`Шаблон "${data.name}" обновлен`);
      await marketingQuery.refetch();
    },
  });
  const updateReferralConfigMutation = useMutation({
    mutationFn: updateReferralConfig,
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Не удалось обновить реферальные настройки";
      setReferralMessage(message);
    },
    onSuccess: async () => {
      await marketingQuery.refetch();
    },
  });
  const createSegmentMutation = useMutation({
    mutationFn: createMarketingSegment,
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Не удалось создать сегмент";
      setSegmentMessage(message);
    },
    onSuccess: async ({ data }) => {
      setLocalSegments((current) => [data, ...(current ?? remoteSegments)]);
      setSegmentForm(initialSegmentForm);
      setSegmentErrors({});
      setSegmentMessage(`Сегмент "${data.name}" создан`);
      await marketingQuery.refetch();
    },
  });
  const refreshSegmentMutation = useMutation({
    mutationFn: refreshMarketingSegment,
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Не удалось пересчитать сегмент";
      setSegmentMessage(message);
    },
    onSuccess: async ({ data }) => {
      setLocalSegments((current) =>
        (current ?? remoteSegments).map((segment) =>
          segment.id === data.id ? data : segment,
        ),
      );
      setSegmentMessage(`Сегмент "${data.name}" пересчитан`);
      await marketingQuery.refetch();
    },
  });
  const experiments = useMemo(
    () => localExperiments ?? remoteExperiments,
    [localExperiments, remoteExperiments],
  );
  const messageDrafts = localMessageDrafts ?? remoteMessageDrafts;
  const segments = useMemo(
    () => localSegments ?? remoteSegments,
    [localSegments, remoteSegments],
  );
  const templates = useMemo(
    () => localTemplates ?? remoteTemplates,
    [localTemplates, remoteTemplates],
  );
  const automationRules = useMemo(
    () => localAutomationRules ?? remoteAutomationRules,
    [localAutomationRules, remoteAutomationRules],
  );
  const referralTiers = useMemo(
    () => localReferralTiers ?? remoteReferralTiers,
    [localReferralTiers, remoteReferralTiers],
  );
  const promoCoupons = useMemo(
    () => localPromoCoupons ?? remotePromoCoupons,
    [localPromoCoupons, remotePromoCoupons],
  );
  const filteredTemplates = useMemo(() => {
    const normalizedSearch = templateSearch.trim().toLocaleLowerCase("ru-RU");

    return templates
      .filter((template) => templateStatusFilter === "all" || template.status === templateStatusFilter)
      .filter((template) =>
        normalizedSearch
          ? [template.name, template.category, template.subject]
              .join(" ")
              .toLocaleLowerCase("ru-RU")
              .includes(normalizedSearch)
          : true,
      );
  }, [templateSearch, templateStatusFilter, templates]);
  const selectedTemplate = useMemo(
    () =>
      filteredTemplates.find((template) => template.id === selectedTemplateId) ??
      filteredTemplates[0] ??
      templates[0],
    [filteredTemplates, selectedTemplateId, templates],
  );
  const filteredAutomationRules = useMemo(
    () =>
      automationRules.filter(
        (rule) => automationStatusFilter === "all" || rule.status === automationStatusFilter,
      ),
    [automationRules, automationStatusFilter],
  );
  const filteredPromoCoupons = useMemo(
    () =>
      promoCoupons.filter(
        (coupon) => couponStatusFilter === "all" || coupon.status === couponStatusFilter,
      ),
    [couponStatusFilter, promoCoupons],
  );
  const filteredCampaigns = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("ru-RU");

    return campaigns
      .filter((campaign) => statusFilter === "all" || campaign.status === statusFilter)
      .filter((campaign) => channelFilter === "all" || campaign.channel === channelFilter)
      .filter((campaign) =>
        normalizedSearch
          ? campaign.name.toLocaleLowerCase("ru-RU").includes(normalizedSearch)
          : true,
      );
  }, [campaigns, channelFilter, search, statusFilter]);

  const activeCampaigns = campaigns.filter(isActiveCampaign).length;
  const runningExperiments = experiments.filter((experiment) => experiment.status === "running").length;
  const activeAutomations = automationRules.filter((rule) => rule.status === "active").length;
  const activeCoupons = promoCoupons.filter((coupon) => coupon.status === "active").length;
  const averageConversion =
    campaigns.length > 0
      ? campaigns.reduce((sum, campaign) => sum + campaign.conversion_rate, 0) / campaigns.length
      : 0;

  function updateCampaignForm<Key extends keyof DraftCampaignForm>(
    key: Key,
    value: DraftCampaignForm[Key],
  ) {
    setCampaignForm((current) => ({ ...current, [key]: value }));
    setCampaignErrors((current) => ({ ...current, [key]: undefined }));
    setCampaignMessage("");
  }

  function updateExperimentForm<Key extends keyof ExperimentForm>(
    key: Key,
    value: ExperimentForm[Key],
  ) {
    setExperimentForm((current) => ({ ...current, [key]: value }));
    setExperimentErrors((current) => ({ ...current, [key]: undefined }));
    setExperimentMessage("");
  }

  function updateMessageForm<Key extends keyof MessageForm>(
    key: Key,
    value: MessageForm[Key],
  ) {
    setMessageForm((current) => ({ ...current, [key]: value }));
    setMessageErrors((current) => ({ ...current, [key]: undefined }));
    setMessageDraftMessage("");
  }

  function updateAutomationForm<Key extends keyof AutomationForm>(
    key: Key,
    value: AutomationForm[Key],
  ) {
    setAutomationForm((current) => ({ ...current, [key]: value }));
    setAutomationErrors((current) => ({ ...current, [key]: undefined }));
    setAutomationMessage("");
  }

  function updateReferralForm<Key extends keyof ReferralForm>(
    key: Key,
    value: ReferralForm[Key],
  ) {
    setReferralForm((current) => ({ ...current, [key]: value }));
    setReferralErrors((current) => ({ ...current, [key]: undefined }));
    setReferralMessage("");
  }

  function updateCouponForm<Key extends keyof CouponForm>(key: Key, value: CouponForm[Key]) {
    setCouponForm((current) => ({ ...current, [key]: value }));
    setCouponErrors((current) => ({ ...current, [key]: undefined }));
    setCouponMessage("");
  }

  function updateSegmentForm<Key extends keyof SegmentForm>(key: Key, value: SegmentForm[Key]) {
    setSegmentForm((current) => ({ ...current, [key]: value }));
    setSegmentErrors((current) => ({ ...current, [key]: undefined }));
    setSegmentMessage("");
  }

  function applyTemplate(template: MarketingTemplate) {
    setSelectedTemplateId(template.id);
    setMessageForm((current) => ({
      ...current,
      body: template.body,
      channel: template.channel === "email" ? "push" : template.channel,
      cta: template.cta,
      name: template.name,
      title: template.subject,
    }));
    setMessageErrors({});
    setMessageDraftMessage(`Шаблон "${template.name}" применён`);
  }

  function createDraftCampaign() {
    const parsed = draftCampaignSchema.safeParse(campaignForm);

    if (!parsed.success) {
      const nextErrors: Partial<Record<keyof DraftCampaignForm, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof DraftCampaignForm | undefined;
        if (key) {
          nextErrors[key] = issue.message;
        }
      }
      setCampaignErrors(nextErrors);
      setCampaignMessage("");
      return;
    }

    setCampaignErrors({});
    setCampaignMessage("");
    createCampaignMutation.mutate({
      body: `Audience: ${parsed.data.audienceSize}. Expected conversion: ${parsed.data.conversionRate}%.`,
      channel: parsed.data.channel,
      name: parsed.data.name.trim(),
      segment_id: parsed.data.segment.trim(),
      subject: parsed.data.name.trim(),
    });
  }

  function sendCampaign(campaign: MarketingCampaign) {
    setCampaignMessage("");
    sendCampaignMutation.mutate(campaign.id);
  }

  function cancelCampaign(campaign: MarketingCampaign) {
    setCampaignMessage("");
    cancelCampaignMutation.mutate(campaign.id);
  }

  function deleteCampaign(campaign: MarketingCampaign) {
    setCampaignMessage("");
    deleteCampaignMutation.mutate(campaign.id);
  }

  function updateCampaign(campaign: MarketingCampaign) {
    setCampaignMessage("");
    updateCampaignMutation.mutate({
      campaign: {
        body: `Campaign "${campaign.name}" for ${campaign.segment}.`,
        channel: campaign.channel,
        name: campaign.name,
        scheduled_at: campaign.starts_at,
        segment_id: campaign.segment,
        subject: campaign.name,
      },
      campaignId: campaign.id,
    });
  }

  function createExperiment() {
    const parsed = experimentSchema.safeParse(experimentForm);

    if (!parsed.success) {
      const nextErrors: Partial<Record<keyof ExperimentForm, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof ExperimentForm | undefined;
        if (key) {
          nextErrors[key] = issue.message;
        }
      }
      setExperimentErrors(nextErrors);
      setExperimentMessage("");
      return;
    }

    const splitA = parsed.data.splitA;
    const experiment: MarketingExperiment = {
      audience_size: parsed.data.audienceSize,
      channel: parsed.data.channel,
      hypothesis: parsed.data.hypothesis.trim(),
      id: `exp-${Date.now()}`,
      name: parsed.data.name.trim(),
      segment: parsed.data.segment.trim(),
      starts_at: new Date().toISOString(),
      status: "draft",
      variants: [
        {
          audience_pct: splitA,
          conversion_rate: 0,
          ctr: 0,
          key: "A",
          title: parsed.data.variantA.trim(),
        },
        {
          audience_pct: 100 - splitA,
          conversion_rate: 0,
          ctr: 0,
          key: "B",
          title: parsed.data.variantB.trim(),
        },
      ],
      winner: null,
    };

    setLocalExperiments((current) => [experiment, ...(current ?? experiments)]);
    setExperimentForm(initialExperimentForm);
    setExperimentErrors({});
    setExperimentMessage(`A/B-тест "${experiment.name}" создан`);
  }

  function createMessageDraft() {
    const parsed = messageSchema.safeParse(messageForm);

    if (!parsed.success) {
      const nextErrors: Partial<Record<keyof MessageForm, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof MessageForm | undefined;
        if (key) {
          nextErrors[key] = issue.message;
        }
      }
      setMessageErrors(nextErrors);
      setMessageDraftMessage("");
      return;
    }

    setMessageErrors({});
    setMessageDraftMessage("");
    const draft: MarketingMessageDraft = {
      body: parsed.data.body.trim(),
      channel: parsed.data.channel,
      cta: parsed.data.cta.trim(),
      id: `message-local-${Date.now()}`,
      name: parsed.data.name.trim(),
      scheduled_at: parsed.data.scheduledAt,
      segment: parsed.data.segment.trim(),
      status: "draft",
      title: parsed.data.title.trim(),
    };
    setLocalMessageDrafts((current) => [draft, ...(current ?? remoteMessageDrafts)]);
    setMessageDraftMessage(`Черновик сообщения "${draft.name}" создан`);
  }

  function createAutomationRule() {
    const parsed = automationSchema.safeParse({
      ...automationForm,
      templateId: automationForm.templateId || selectedTemplate?.id || "",
    });

    if (!parsed.success) {
      const nextErrors: Partial<Record<keyof AutomationForm, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof AutomationForm | undefined;
        if (key) {
          nextErrors[key] = issue.message;
        }
      }
      setAutomationErrors(nextErrors);
      setAutomationMessage("");
      return;
    }

    const rule: MarketingAutomationRule = {
      channel: parsed.data.channel,
      delay_hours: parsed.data.delayHours,
      id: `auto-local-${automationRules.length + 1}`,
      name: parsed.data.name.trim(),
      segment: parsed.data.segment.trim(),
      status: "draft",
      template_id: parsed.data.templateId,
      trigger: parsed.data.trigger.trim(),
    };

    setLocalAutomationRules((current) => [rule, ...(current ?? automationRules)]);
    setAutomationForm({
      channel: "push",
      delayHours: "2",
      name: "",
      segment: "Истекают через 3 дня",
      templateId: selectedTemplate?.id ?? "",
      trigger: "subscription_expires_soon",
    });
    setAutomationErrors({});
    setAutomationMessage(`Правило "${rule.name}" создано`);
  }

  function createReferralTier() {
    const parsed = referralSchema.safeParse(referralForm);

    if (!parsed.success) {
      const nextErrors: Partial<Record<keyof ReferralForm, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof ReferralForm | undefined;
        if (key) {
          nextErrors[key] = issue.message;
        }
      }
      setReferralErrors(nextErrors);
      setReferralMessage("");
      return;
    }

    const tier: MarketingReferralTier = {
      advocate_reward: parsed.data.advocateReward.trim(),
      friend_reward: parsed.data.friendReward.trim(),
      id: `ref-tier-local-${referralTiers.length + 1}`,
      invite_goal: parsed.data.inviteGoal,
      name: parsed.data.campaignName.trim(),
      status: "draft",
    };

    setLocalReferralTiers((current) => [tier, ...(current ?? referralTiers)]);
    setReferralForm(initialReferralForm);
    setReferralErrors({});
    setReferralMessage(`Реферальная кампания "${tier.name}" создана`);
    updateReferralConfigMutation.mutate({
      advocate_reward: tier.advocate_reward,
      friend_reward: tier.friend_reward,
      invite_goal: tier.invite_goal,
    });
  }

  function createSegment() {
    const parsed = segmentSchema.safeParse(segmentForm);

    if (!parsed.success) {
      const nextErrors: Partial<Record<keyof SegmentForm, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof SegmentForm | undefined;
        if (key) {
          nextErrors[key] = issue.message;
        }
      }
      setSegmentErrors(nextErrors);
      setSegmentMessage("");
      return;
    }

    const filters: Record<string, unknown> = {};
    if (parsed.data.risk !== "all") {
      filters.churn_risk = parsed.data.risk;
    }
    if (parsed.data.status !== "all") {
      filters.status = parsed.data.status;
    }

    setSegmentErrors({});
    setSegmentMessage("");
    createSegmentMutation.mutate({
      filters,
      name: parsed.data.name.trim(),
    });
  }

  function createPromoCoupon() {
    const parsed = couponSchema.safeParse(couponForm);

    if (!parsed.success) {
      const nextErrors: Partial<Record<keyof CouponForm, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof CouponForm | undefined;
        if (key) {
          nextErrors[key] = issue.message;
        }
      }
      setCouponErrors(nextErrors);
      setCouponMessage("");
      return;
    }

    setCouponErrors({});
    setCouponMessage("");
    createPromoCodeMutation.mutate({
      code: parsed.data.code.trim().toUpperCase(),
      discount_type: parsed.data.discountType,
      discount_value: parsed.data.discountValue,
      expires_at: parsed.data.expiresAt.trim() || null,
      max_uses: parsed.data.usageLimit,
    });
  }

  function createPromoCouponBulk() {
    const parsed = couponSchema.safeParse(couponForm);

    if (!parsed.success) {
      const nextErrors: Partial<Record<keyof CouponForm, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof CouponForm | undefined;
        if (key) {
          nextErrors[key] = issue.message;
        }
      }
      setCouponErrors(nextErrors);
      setCouponMessage("");
      return;
    }

    setCouponErrors({});
    setCouponMessage("");
    createPromoCodesBulkMutation.mutate({
      count: parsed.data.usageLimit,
      discount_type: parsed.data.discountType,
      discount_value: parsed.data.discountValue,
      expires_at: parsed.data.expiresAt.trim() || null,
      max_uses: 1,
      prefix: parsed.data.code.trim().toUpperCase(),
    });
  }

  function deactivatePromoCoupon(coupon: MarketingPromoCoupon) {
    setCouponMessage("");
    deactivatePromoCodeMutation.mutate(coupon.id);
  }

  function updatePromoCoupon(coupon: MarketingPromoCoupon) {
    setCouponMessage("");
    updatePromoCodeMutation.mutate({
      promo: {
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        expires_at: coupon.expires_at,
        max_uses: coupon.usage_limit + 100,
      },
      promoId: coupon.id,
    });
  }

  function chooseWinner(experimentId: string, winner: MarketingExperimentVariantKey) {
    setLocalExperiments((current) =>
      (current ?? experiments).map((experiment) =>
        experiment.id === experimentId
          ? { ...experiment, status: "completed", winner }
          : experiment,
      ),
    );
    setExperimentMessage(`Победитель варианта ${winner} выбран`);
  }

  if (marketingQuery.isPending) {
    return <LoadingState label="Загрузка маркетингового раздела" />;
  }

  if (marketingQuery.isError) {
    return (
      <ErrorState
        message="Кампании временно недоступны. Повторите загрузку мок-данных."
        onRetry={() => void marketingQuery.refetch()}
        title="Не удалось загрузить маркетинговый раздел"
      />
    );
  }

  return (
    <main className="px-4 py-6 lg:px-6">
      <header className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-disabled">
            Жизненный цикл клиентов
          </p>
          <h1 className="mt-2 text-[22px] font-bold tracking-normal text-white">Маркетинг</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-text-secondary">
            Управление кампаниями, черновиками и A/B-тестами на типизированных мок-данных.
          </p>
        </div>
        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md admin-gradient px-4 text-sm font-medium text-white shadow-lg shadow-brand-primary/20 transition hover:-translate-y-0.5"
          onClick={() => setActiveTab("experiments")}
          type="button"
        >
          <FlaskConical aria-hidden="true" size={16} />
          Новый A/B-тест
        </button>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <article className="admin-panel p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">Всего кампаний</p>
            <Layers3 aria-hidden="true" className="text-brand-primary" size={18} />
          </div>
          <p className="mt-3 text-[22px] font-bold tracking-normal text-white">{campaigns.length}</p>
          <p className="mt-2 text-sm text-text-secondary">В мок-данных</p>
        </article>
        <article className="admin-panel p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">Активные</p>
            <Send aria-hidden="true" className="text-success" size={18} />
          </div>
          <p className="mt-3 text-[22px] font-bold tracking-normal text-white">{activeCampaigns}</p>
          <p className="mt-2 text-sm text-text-secondary">Запланированы или отправляются</p>
        </article>
        <article className="admin-panel p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">A/B-тесты</p>
            <FlaskConical aria-hidden="true" className="text-warning" size={18} />
          </div>
          <p className="mt-3 text-[22px] font-bold tracking-normal text-white">{experiments.length}</p>
          <p className="mt-2 text-sm text-text-secondary">{runningExperiments} запущено</p>
        </article>
        <article className="admin-panel p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">Автоматизации</p>
            <Send aria-hidden="true" className="text-info" size={18} />
          </div>
          <p className="mt-3 text-[22px] font-bold tracking-normal text-white">{activeAutomations}</p>
          <p className="mt-2 text-sm text-text-secondary">Активные правила</p>
        </article>
        <article className="admin-panel p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">Рефералы</p>
            <Users aria-hidden="true" className="text-success" size={18} />
          </div>
          <p className="mt-3 text-[22px] font-bold tracking-normal text-white">
            {referralSummary?.conversions_month ?? remoteReferralEvents.length}
          </p>
          <p className="mt-2 text-sm text-text-secondary">Конверсии за месяц</p>
        </article>
        <article className="admin-panel p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">Промо-коды</p>
            <TicketPercent aria-hidden="true" className="text-warning" size={18} />
          </div>
          <p className="mt-3 text-[22px] font-bold tracking-normal text-white">{activeCoupons}</p>
          <p className="mt-2 text-sm text-text-secondary">Активные купоны</p>
        </article>
        <article className="admin-panel p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">Конверсия</p>
            <Percent aria-hidden="true" className="text-info" size={18} />
          </div>
          <p className="mt-3 text-[22px] font-bold tracking-normal text-white">{averageConversion.toFixed(1)}%</p>
          <p className="mt-2 text-sm text-text-secondary">Среднее по кампаниям</p>
        </article>
      </section>

      <section className="mt-6 admin-panel">
        <div className="flex flex-wrap gap-2 border-b border-white/10 p-4">
          {(Object.keys(tabLabel) as MarketingTab[]).map((tab) => (
            <button
              className={cn(
                "h-9 rounded-md border px-3 text-sm transition",
                activeTab === tab
                  ? "border-brand-primary bg-brand-primary/10 text-text-primary"
                  : "border-white/10 bg-bg-elevated text-text-secondary hover:text-white",
              )}
              key={tab}
              onClick={() => setActiveTab(tab)}
              type="button"
            >
              {tabLabel[tab]}
            </button>
          ))}
        </div>

        {activeTab === "campaigns" ? (
          <div className="grid gap-6 p-4 xl:grid-cols-[24rem_minmax(0,1fr)]">
            <form
              className="admin-panel-elevated p-4"
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                createDraftCampaign();
              }}
            >
              <h2 className="text-base font-semibold">Новый черновик</h2>
              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className="text-xs text-text-secondary">Название кампании</span>
                  <input
                    aria-label="Название кампании"
                    className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                    onChange={(event) => updateCampaignForm("name", event.target.value)}
                    value={campaignForm.name}
                  />
                  {campaignErrors.name ? (
                    <span className="mt-1 block text-xs text-danger">{campaignErrors.name}</span>
                  ) : null}
                </label>
                <label className="block">
                  <span className="text-xs text-text-secondary">Сегмент</span>
                  <input
                    aria-label="Сегмент кампании"
                    className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                    onChange={(event) => updateCampaignForm("segment", event.target.value)}
                    value={campaignForm.segment}
                  />
                  {campaignErrors.segment ? (
                    <span className="mt-1 block text-xs text-danger">
                      {campaignErrors.segment}
                    </span>
                  ) : null}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs text-text-secondary">Канал</span>
                    <select
                      aria-label="Канал кампании"
                      className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                      onChange={(event) =>
                        updateCampaignForm("channel", event.target.value as MarketingCampaignChannel)
                      }
                      value={campaignForm.channel}
                    >
                      <option value="push">Push</option>
                      <option value="email">Email</option>
                      <option value="sms">SMS</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs text-text-secondary">Аудитория</span>
                    <input
                      aria-label="Аудитория"
                      className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                      min={1}
                      onChange={(event) => updateCampaignForm("audienceSize", event.target.value)}
                      type="number"
                      value={campaignForm.audienceSize}
                    />
                    {campaignErrors.audienceSize ? (
                      <span className="mt-1 block text-xs text-danger">
                        {campaignErrors.audienceSize}
                      </span>
                    ) : null}
                  </label>
                </div>
                <label className="block">
                  <span className="text-xs text-text-secondary">Конверсия, %</span>
                  <input
                    aria-label="Конверсия"
                    className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                    max={100}
                    min={0}
                    onChange={(event) => updateCampaignForm("conversionRate", event.target.value)}
                    step="0.1"
                    type="number"
                    value={campaignForm.conversionRate}
                  />
                  {campaignErrors.conversionRate ? (
                    <span className="mt-1 block text-xs text-danger">
                      {campaignErrors.conversionRate}
                    </span>
                  ) : null}
                </label>
              </div>
              <button
                className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md admin-gradient px-3 text-sm font-medium text-white shadow-lg shadow-brand-primary/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={createCampaignMutation.isPending}
                type="submit"
              >
                <Plus aria-hidden="true" size={16} />
                Создать черновик
              </button>
              {campaignMessage ? (
                <p className="mt-3 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
                  {campaignMessage}
                </p>
              ) : null}
            </form>

            <section className="admin-panel-elevated">
              <div className="flex flex-col gap-3 border-b border-white/10 p-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="text-base font-semibold">Кампании</h2>
                  <p className="mt-1 text-sm text-text-secondary">
                    {filteredCampaigns.length} из {campaigns.length} кампаний в фильтре
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[38rem]">
                  <label className="block">
                    <span className="text-xs text-text-secondary">Поиск</span>
                    <div className="relative mt-1">
                      <Search
                        aria-hidden="true"
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
                        size={15}
                      />
                      <input
                        aria-label="Поиск кампании"
                        className="h-10 w-full admin-panel pl-9 pr-3 text-sm outline-none focus:border-brand-primary"
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Название"
                        value={search}
                      />
                    </div>
                  </label>
                  <label className="block">
                    <span className="text-xs text-text-secondary">Статус</span>
                    <select
                      aria-label="Фильтр статуса"
                      className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                      onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                      value={statusFilter}
                    >
                      <option value="all">Все статусы</option>
                      <option value="draft">Черновик</option>
                      <option value="scheduled">Запланирована</option>
                      <option value="sending">Активна</option>
                      <option value="completed">Завершена</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs text-text-secondary">Канал</span>
                    <select
                      aria-label="Фильтр канала"
                      className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                      onChange={(event) => setChannelFilter(event.target.value as ChannelFilter)}
                      value={channelFilter}
                    >
                      <option value="all">Все каналы</option>
                      <option value="push">Push</option>
                      <option value="email">Email</option>
                      <option value="sms">SMS</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] border-collapse text-left text-sm">
                  <thead className="bg-bg-card text-text-secondary">
                    <tr>
                      <th className="p-3" scope="col">Кампания</th>
                      <th className="p-3" scope="col">Канал</th>
                      <th className="p-3" scope="col">Статус</th>
                      <th className="p-3" scope="col">Сегмент</th>
                      <th className="p-3" scope="col">Аудитория</th>
                      <th className="p-3" scope="col">Конверсия</th>
                      <th className="p-3" scope="col">CTR</th>
                      <th className="p-3" scope="col">Старт</th>
                      <th className="p-3" scope="col">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCampaigns.map((campaign) => (
                      <tr className="border-t border-white/[0.06]" key={campaign.id}>
                        <td className="p-3 font-medium text-text-primary">{campaign.name}</td>
                        <td className="p-3">{channelLabel[campaign.channel]}</td>
                        <td className="p-3">
                          <span className={cn("rounded-md px-2 py-1 text-xs", statusClass(campaign.status))}>
                            {statusLabel[campaign.status]}
                          </span>
                        </td>
                        <td className="max-w-[260px] truncate p-3 text-text-secondary">
                          {campaign.segment}
                        </td>
                        <td className="p-3">{campaign.audience_size.toLocaleString("ru-RU")}</td>
                        <td className="p-3">{campaign.conversion_rate.toLocaleString("ru-RU")}%</td>
                        <td className="p-3">{campaign.ctr.toLocaleString("ru-RU")}%</td>
                        <td className="p-3 text-text-secondary">{formatDate(campaign.starts_at)}</td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-brand-primary/30 bg-brand-primary/10 px-2 text-xs text-brand-primary transition hover:bg-brand-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                              disabled={
                                sendCampaignMutation.isPending ||
                                !["draft", "scheduled"].includes(campaign.status)
                              }
                              onClick={() => sendCampaign(campaign)}
                              type="button"
                            >
                              <Send aria-hidden="true" size={14} />
                              Запуск
                            </button>
                            <button
                              className="inline-flex h-8 items-center justify-center rounded-md border border-info/30 bg-info/10 px-2 text-xs text-info transition hover:bg-info/20 disabled:cursor-not-allowed disabled:opacity-50"
                              disabled={updateCampaignMutation.isPending}
                              onClick={() => updateCampaign(campaign)}
                              type="button"
                            >
                              Сохранить
                            </button>
                            <button
                              className="inline-flex h-8 items-center justify-center rounded-md border border-danger/30 bg-danger/10 px-2 text-xs text-danger transition hover:bg-danger/20 disabled:cursor-not-allowed disabled:opacity-50"
                              disabled={
                                cancelCampaignMutation.isPending ||
                                !["draft", "scheduled", "sending"].includes(campaign.status)
                              }
                              onClick={() => cancelCampaign(campaign)}
                              type="button"
                            >
                              Отмена
                            </button>
                            <button
                              className="inline-flex h-8 items-center justify-center rounded-md border border-white/[0.08] bg-bg-elevated px-2 text-xs text-text-secondary transition hover:bg-bg-overlay hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                              disabled={deleteCampaignMutation.isPending}
                              onClick={() => deleteCampaign(campaign)}
                              type="button"
                            >
                              Удалить
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredCampaigns.length === 0 ? (
                      <tr className="border-t border-white/[0.06]">
                        <td className="p-6 text-sm text-text-secondary" colSpan={9}>
                          Кампании не найдены. Измените фильтры или создайте черновик.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        ) : null}

        {activeTab === "segments" ? (
          <div className="grid gap-6 p-4 xl:grid-cols-[24rem_minmax(0,1fr)]">
            <form
              className="admin-panel-elevated p-4"
              id="new-campaign"
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                createSegment();
              }}
            >
              <h2 className="text-base font-semibold">Конструктор сегмента</h2>
              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className="text-xs text-text-secondary">Название сегмента</span>
                  <input
                    aria-label="Название сегмента"
                    className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                    onChange={(event) => updateSegmentForm("name", event.target.value)}
                    value={segmentForm.name}
                  />
                  {segmentErrors.name ? (
                    <span className="mt-1 block text-xs text-danger">{segmentErrors.name}</span>
                  ) : null}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs text-text-secondary">Риск оттока</span>
                    <select
                      aria-label="Риск оттока сегмента"
                      className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                      onChange={(event) =>
                        updateSegmentForm("risk", event.target.value as SegmentForm["risk"])
                      }
                      value={segmentForm.risk}
                    >
                      <option value="all">Любой</option>
                      <option value="high">Высокий</option>
                      <option value="medium">Средний</option>
                      <option value="low">Низкий</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs text-text-secondary">Статус</span>
                    <select
                      aria-label="Статус сегмента"
                      className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                      onChange={(event) =>
                        updateSegmentForm("status", event.target.value as SegmentForm["status"])
                      }
                      value={segmentForm.status}
                    >
                      <option value="all">Любой</option>
                      <option value="active">Активный</option>
                      <option value="trial">Триал</option>
                      <option value="blocked">Заблокирован</option>
                    </select>
                  </label>
                </div>
              </div>
              <button
                className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md admin-gradient px-3 text-sm font-medium text-white shadow-lg shadow-brand-primary/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={createSegmentMutation.isPending}
                type="submit"
              >
                <Layers3 aria-hidden="true" size={16} />
                Создать сегмент
              </button>
              {segmentMessage ? (
                <p className="mt-3 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
                  {segmentMessage}
                </p>
              ) : null}
            </form>

            <section className="admin-panel-elevated">
              <div className="border-b border-white/10 p-4">
                <h2 className="text-base font-semibold">Сегменты аудитории</h2>
                <p className="mt-1 text-sm text-text-secondary">
                  {segments.length} сегментов из backend API
                </p>
              </div>
              <div className="grid gap-3 p-4 lg:grid-cols-2">
                {segments.map((segment) => (
                  <article className="admin-panel p-4" key={segment.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-medium">{segment.name}</h3>
                        <p className="mt-1 text-sm text-text-secondary">
                          {segment.audience_size.toLocaleString("ru-RU")} пользователей
                        </p>
                      </div>
                      <button
                        className="h-8 rounded-md border border-white/10 bg-bg-elevated px-3 text-xs text-text-secondary transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={refreshSegmentMutation.isPending}
                        onClick={() => refreshSegmentMutation.mutate(segment.id)}
                        type="button"
                      >
                        Пересчитать
                      </button>
                    </div>
                    <p className="mt-3 rounded-md bg-bg-card px-3 py-2 font-mono text-xs text-text-secondary">
                      {JSON.stringify(segment.filters)}
                    </p>
                    <p className="mt-3 text-xs text-text-secondary">
                      Обновлен: {formatDate(segment.updated_at)}
                    </p>
                  </article>
                ))}
                {segments.length === 0 ? (
                  <p className="text-sm text-text-secondary">Сегменты пока не найдены.</p>
                ) : null}
              </div>
            </section>
          </div>
        ) : null}

        {activeTab === "messages" ? (
          <div className="grid gap-6 p-4 xl:grid-cols-[24rem_minmax(0,1fr)]">
            <form
              className="admin-panel-elevated p-4"
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                createMessageDraft();
              }}
            >
              <h2 className="text-base font-semibold">Конструктор SMS/Push</h2>
              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className="text-xs text-text-secondary">Название сообщения</span>
                  <input
                    aria-label="Название сообщения"
                    className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                    onChange={(event) => updateMessageForm("name", event.target.value)}
                    value={messageForm.name}
                  />
                  {messageErrors.name ? (
                    <span className="mt-1 block text-xs text-danger">{messageErrors.name}</span>
                  ) : null}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs text-text-secondary">Канал</span>
                    <select
                      aria-label="Канал сообщения"
                      className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                      onChange={(event) =>
                        updateMessageForm("channel", event.target.value as MarketingCampaignChannel)
                      }
                      value={messageForm.channel}
                    >
                      <option value="push">Push</option>
                      <option value="sms">SMS</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs text-text-secondary">Отправка</span>
                    <input
                      aria-label="Время отправки"
                      className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                      onChange={(event) => updateMessageForm("scheduledAt", event.target.value)}
                      value={messageForm.scheduledAt}
                    />
                    {messageErrors.scheduledAt ? (
                      <span className="mt-1 block text-xs text-danger">
                        {messageErrors.scheduledAt}
                      </span>
                    ) : null}
                  </label>
                </div>
                <label className="block">
                  <span className="text-xs text-text-secondary">Сегмент</span>
                  <input
                    aria-label="Сегмент сообщения"
                    className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                    onChange={(event) => updateMessageForm("segment", event.target.value)}
                    value={messageForm.segment}
                  />
                  {messageErrors.segment ? (
                    <span className="mt-1 block text-xs text-danger">{messageErrors.segment}</span>
                  ) : null}
                </label>
                <label className="block">
                  <span className="text-xs text-text-secondary">Заголовок</span>
                  <input
                    aria-label="Заголовок сообщения"
                    className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                    onChange={(event) => updateMessageForm("title", event.target.value)}
                    value={messageForm.title}
                  />
                  {messageErrors.title ? (
                    <span className="mt-1 block text-xs text-danger">{messageErrors.title}</span>
                  ) : null}
                </label>
                <label className="block">
                  <span className="text-xs text-text-secondary">Текст сообщения</span>
                  <textarea
                    aria-label="Текст сообщения"
                    className="mt-1 min-h-24 w-full admin-panel px-3 py-2 text-sm outline-none focus:border-brand-primary"
                    onChange={(event) => updateMessageForm("body", event.target.value)}
                    value={messageForm.body}
                  />
                  {messageErrors.body ? (
                    <span className="mt-1 block text-xs text-danger">{messageErrors.body}</span>
                  ) : null}
                </label>
                <label className="block">
                  <span className="text-xs text-text-secondary">CTA</span>
                  <input
                    aria-label="CTA сообщения"
                    className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                    onChange={(event) => updateMessageForm("cta", event.target.value)}
                    value={messageForm.cta}
                  />
                  {messageErrors.cta ? (
                    <span className="mt-1 block text-xs text-danger">{messageErrors.cta}</span>
                  ) : null}
                </label>
              </div>
              <button
                className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md admin-gradient px-3 text-sm font-medium text-white shadow-lg shadow-brand-primary/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={createPromoCodeMutation.isPending}
                type="submit"
              >
                <Plus aria-hidden="true" size={16} />
                Создать сообщение
              </button>
              {messageDraftMessage ? (
                <p className="mt-3 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
                  {messageDraftMessage}
                </p>
              ) : null}
            </form>

            <section className="space-y-4">
              <article className="admin-panel-elevated p-4">
                <h2 className="text-base font-semibold">Предпросмотр</h2>
                <div className="mt-4 max-w-md admin-panel p-4">
                  <p className="text-xs uppercase text-text-secondary">
                    {channelLabel[messageForm.channel]} - {messageForm.segment}
                  </p>
                  <h3 className="mt-2 font-medium">{messageForm.title || "Заголовок сообщения"}</h3>
                  <p className="mt-2 text-sm leading-6 text-text-secondary">
                    {messageForm.body || "Текст сообщения появится здесь."}
                  </p>
                  <button
                    className="mt-3 h-9 rounded-md bg-brand-primary px-3 text-sm text-white"
                    type="button"
                  >
                    {messageForm.cta || "CTA"}
                  </button>
                </div>
              </article>

              <section className="admin-panel-elevated">
                <div className="border-b border-white/10 p-4">
                  <h2 className="text-base font-semibold">Черновики сообщений</h2>
                  <p className="mt-1 text-sm text-text-secondary">
                    {messageDrafts.length} SMS/Push сообщений
                  </p>
                </div>
                <div className="grid gap-3 p-4 lg:grid-cols-2">
                  {messageDrafts.map((draft) => (
                    <article className="admin-panel p-4" key={draft.id}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-medium">{draft.name}</h3>
                          <p className="mt-1 text-sm text-text-secondary">
                            {channelLabel[draft.channel]} - {draft.segment}
                          </p>
                        </div>
                        <span className={cn("rounded-md px-2 py-1 text-xs", statusClass(draft.status))}>
                          {statusLabel[draft.status]}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-text-primary">{draft.title}</p>
                      <p className="mt-2 text-sm leading-6 text-text-secondary">{draft.body}</p>
                    </article>
                  ))}
                </div>
              </section>
            </section>
          </div>
        ) : null}

        {activeTab === "templates" ? (
          <div className="grid gap-6 p-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
            <section className="admin-panel-elevated">
              <div className="grid gap-3 border-b border-white/10 p-4 md:grid-cols-[1fr_12rem]">
                <label className="block">
                  <span className="text-xs text-text-secondary">Поиск шаблона</span>
                  <input
                    aria-label="Поиск шаблона"
                    className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                    onChange={(event) => setTemplateSearch(event.target.value)}
                    value={templateSearch}
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-text-secondary">Статус шаблона</span>
                  <select
                    aria-label="Статус шаблона"
                    className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                    onChange={(event) =>
                      setTemplateStatusFilter(event.target.value as TemplateStatusFilter)
                    }
                    value={templateStatusFilter}
                  >
                    <option value="all">Все статусы</option>
                    <option value="active">Активен</option>
                    <option value="draft">Черновик</option>
                    <option value="archived">Архив</option>
                  </select>
                </label>
              </div>
              <div className="grid gap-3 p-4 lg:grid-cols-3">
                {filteredTemplates.map((template) => (
                  <article
                    className={cn(
                      "cursor-pointer rounded-md border p-4 transition",
                      selectedTemplate?.id === template.id
                        ? "border-brand-primary bg-brand-primary/10"
                        : "border-white/10 bg-bg-card hover:border-white/20",
                    )}
                    key={template.id}
                    onClick={() => setSelectedTemplateId(template.id)}
                  >
                    <h2 className="font-medium">{template.name}</h2>
                    <p className="mt-1 text-sm text-text-secondary">
                      {channelLabel[template.channel]} - {template.category}
                    </p>
                    <p className="mt-3 text-sm">{template.subject}</p>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span className="text-xs text-text-secondary">
                        {template.usage_count} использований
                      </span>
                      <span className="rounded-lg bg-bg-elevated px-2 py-1 text-xs text-text-secondary">
                        {templateStatusLabel[template.status]}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <aside className="admin-panel-elevated p-4">
              <h2 className="text-base font-semibold">Детали шаблона</h2>
              {selectedTemplate ? (
                <>
                  <div className="mt-3 space-y-2 text-sm">
                    <p><span className="text-text-secondary">Название:</span> {selectedTemplate.name}</p>
                    <p><span className="text-text-secondary">Канал:</span> {channelLabel[selectedTemplate.channel]}</p>
                    <p><span className="text-text-secondary">Категория:</span> {selectedTemplate.category}</p>
                    <p><span className="text-text-secondary">Тема:</span> {selectedTemplate.subject}</p>
                  </div>
                  <p className="mt-4 admin-panel p-3 text-sm leading-6 text-text-secondary">
                    {selectedTemplate.body}
                  </p>
                  <button
                    className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md admin-gradient px-3 text-sm font-medium text-white shadow-lg shadow-brand-primary/20 transition hover:-translate-y-0.5"
                    onClick={() => applyTemplate(selectedTemplate)}
                    type="button"
                  >
                    <Send aria-hidden="true" size={16} />
                    Использовать шаблон
                  </button>
                  <button
                    className="mt-2 inline-flex h-10 w-full items-center justify-center rounded-md admin-panel text-sm text-text-secondary transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={
                      updateTemplateMutation.isPending ||
                      selectedTemplate.status === "archived"
                    }
                    onClick={() =>
                      updateTemplateMutation.mutate({
                        template: {
                          status: selectedTemplate.status === "active" ? "draft" : "active",
                        },
                        templateId: selectedTemplate.id,
                      })
                    }
                    type="button"
                  >
                    {selectedTemplate.status === "active" ? "Сделать черновиком" : "Активировать"}
                  </button>
                  <button
                    className="mt-2 inline-flex h-10 w-full items-center justify-center rounded-md border border-danger/30 bg-danger/10 px-3 text-sm text-danger transition hover:bg-danger/20 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={
                      deleteTemplateMutation.isPending ||
                      selectedTemplate.status === "archived"
                    }
                    onClick={() => deleteTemplateMutation.mutate(selectedTemplate.id)}
                    type="button"
                  >
                    Архивировать шаблон
                  </button>
                  {messageDraftMessage ? (
                    <p className="mt-3 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
                      {messageDraftMessage}
                    </p>
                  ) : null}
                </>
              ) : null}
            </aside>
          </div>
        ) : null}

        {activeTab === "automation" ? (
          <div className="grid gap-6 p-4 xl:grid-cols-[24rem_minmax(0,1fr)]">
            <form
              className="admin-panel-elevated p-4"
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                createAutomationRule();
              }}
            >
              <h2 className="text-base font-semibold">Правило автоматизации</h2>
              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className="text-xs text-text-secondary">Название правила</span>
                  <input
                    aria-label="Название правила"
                    className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                    onChange={(event) => updateAutomationForm("name", event.target.value)}
                    value={automationForm.name}
                  />
                  {automationErrors.name ? (
                    <span className="mt-1 block text-xs text-danger">{automationErrors.name}</span>
                  ) : null}
                </label>
                <label className="block">
                  <span className="text-xs text-text-secondary">Триггер</span>
                  <input
                    aria-label="Триггер автоматизации"
                    className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                    onChange={(event) => updateAutomationForm("trigger", event.target.value)}
                    value={automationForm.trigger}
                  />
                  {automationErrors.trigger ? (
                    <span className="mt-1 block text-xs text-danger">{automationErrors.trigger}</span>
                  ) : null}
                </label>
                <label className="block">
                  <span className="text-xs text-text-secondary">Сегмент</span>
                  <input
                    aria-label="Сегмент автоматизации"
                    className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                    onChange={(event) => updateAutomationForm("segment", event.target.value)}
                    value={automationForm.segment}
                  />
                  {automationErrors.segment ? (
                    <span className="mt-1 block text-xs text-danger">{automationErrors.segment}</span>
                  ) : null}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs text-text-secondary">Канал</span>
                    <select
                      aria-label="Канал автоматизации"
                      className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                      onChange={(event) =>
                        updateAutomationForm("channel", event.target.value as MarketingCampaignChannel)
                      }
                      value={automationForm.channel}
                    >
                      <option value="push">Push</option>
                      <option value="sms">SMS</option>
                      <option value="email">Email</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs text-text-secondary">Задержка, часов</span>
                    <input
                      aria-label="Задержка автоматизации"
                      className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                      onChange={(event) => updateAutomationForm("delayHours", event.target.value)}
                      type="number"
                      value={automationForm.delayHours}
                    />
                    {automationErrors.delayHours ? (
                      <span className="mt-1 block text-xs text-danger">
                        {automationErrors.delayHours}
                      </span>
                    ) : null}
                  </label>
                </div>
                <label className="block">
                  <span className="text-xs text-text-secondary">Шаблон</span>
                  <select
                    aria-label="Шаблон автоматизации"
                    className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                    onChange={(event) => updateAutomationForm("templateId", event.target.value)}
                    value={automationForm.templateId || selectedTemplate?.id || ""}
                  >
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                  {automationErrors.templateId ? (
                    <span className="mt-1 block text-xs text-danger">
                      {automationErrors.templateId}
                    </span>
                  ) : null}
                </label>
              </div>
              <button
                className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md admin-gradient px-3 text-sm font-medium text-white shadow-lg shadow-brand-primary/20 transition hover:-translate-y-0.5"
                type="submit"
              >
                <Plus aria-hidden="true" size={16} />
                Создать правило
              </button>
              {automationMessage ? (
                <p className="mt-3 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
                  {automationMessage}
                </p>
              ) : null}
            </form>

            <section className="admin-panel-elevated">
              <div className="flex flex-col gap-3 border-b border-white/10 p-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-base font-semibold">Automation rules</h2>
                  <p className="mt-1 text-sm text-text-secondary">
                    {filteredAutomationRules.length} из {automationRules.length} правил
                  </p>
                </div>
                <label className="block md:w-48">
                  <span className="text-xs text-text-secondary">Статус правила</span>
                  <select
                    aria-label="Статус автоматизации"
                    className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                    onChange={(event) =>
                      setAutomationStatusFilter(event.target.value as AutomationStatusFilter)
                    }
                    value={automationStatusFilter}
                  >
                    <option value="all">Все статусы</option>
                    <option value="active">Активно</option>
                    <option value="paused">Пауза</option>
                    <option value="draft">Черновик</option>
                  </select>
                </label>
              </div>
              <div className="grid gap-3 p-4 lg:grid-cols-2">
                {filteredAutomationRules.map((rule) => {
                  const template = templates.find((item) => item.id === rule.template_id);

                  return (
                    <article className="admin-panel p-4" key={rule.id}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-medium">{rule.name}</h3>
                          <p className="mt-1 text-sm text-text-secondary">{rule.trigger}</p>
                        </div>
                        <span className="rounded-lg bg-bg-elevated px-2 py-1 text-xs text-text-secondary">
                          {automationStatusLabel[rule.status]}
                        </span>
                      </div>
                      <div className="mt-3 grid gap-2 text-sm text-text-secondary md:grid-cols-2">
                        <p>Канал: {channelLabel[rule.channel]}</p>
                        <p>Задержка: {rule.delay_hours} ч.</p>
                        <p>Сегмент: {rule.segment}</p>
                        <p>Шаблон: {template?.name ?? "Не найден"}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </div>
        ) : null}

        {activeTab === "referrals" ? (
          <div className="grid gap-6 p-4 xl:grid-cols-[24rem_minmax(0,1fr)]">
            <form
              className="admin-panel-elevated p-4"
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                createReferralTier();
              }}
            >
              <h2 className="text-base font-semibold">Реферальная кампания</h2>
              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className="text-xs text-text-secondary">Название кампании</span>
                  <input
                    aria-label="Название реферальной кампании"
                    className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                    onChange={(event) => updateReferralForm("campaignName", event.target.value)}
                    value={referralForm.campaignName}
                  />
                  {referralErrors.campaignName ? (
                    <span className="mt-1 block text-xs text-danger">
                      {referralErrors.campaignName}
                    </span>
                  ) : null}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs text-text-secondary">Канал</span>
                    <select
                      aria-label="Канал реферальной кампании"
                      className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                      onChange={(event) =>
                        updateReferralForm("channel", event.target.value as MarketingCampaignChannel)
                      }
                      value={referralForm.channel}
                    >
                      <option value="push">Push</option>
                      <option value="sms">SMS</option>
                      <option value="email">Email</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs text-text-secondary">Цель приглашений</span>
                    <input
                      aria-label="Цель приглашений"
                      className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                      onChange={(event) => updateReferralForm("inviteGoal", event.target.value)}
                      type="number"
                      value={referralForm.inviteGoal}
                    />
                    {referralErrors.inviteGoal ? (
                      <span className="mt-1 block text-xs text-danger">
                        {referralErrors.inviteGoal}
                      </span>
                    ) : null}
                  </label>
                </div>
                <label className="block">
                  <span className="text-xs text-text-secondary">Награда рекомендателю</span>
                  <input
                    aria-label="Награда рекомендателю"
                    className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                    onChange={(event) => updateReferralForm("advocateReward", event.target.value)}
                    value={referralForm.advocateReward}
                  />
                  {referralErrors.advocateReward ? (
                    <span className="mt-1 block text-xs text-danger">
                      {referralErrors.advocateReward}
                    </span>
                  ) : null}
                </label>
                <label className="block">
                  <span className="text-xs text-text-secondary">Награда другу</span>
                  <input
                    aria-label="Награда другу"
                    className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                    onChange={(event) => updateReferralForm("friendReward", event.target.value)}
                    value={referralForm.friendReward}
                  />
                  {referralErrors.friendReward ? (
                    <span className="mt-1 block text-xs text-danger">
                      {referralErrors.friendReward}
                    </span>
                  ) : null}
                </label>
              </div>
              <button
                className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md admin-gradient px-3 text-sm font-medium text-white shadow-lg shadow-brand-primary/20 transition hover:-translate-y-0.5"
                type="submit"
              >
                <Plus aria-hidden="true" size={16} />
                Создать реферальную кампанию
              </button>
              {referralMessage ? (
                <p className="mt-3 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
                  {referralMessage}
                </p>
              ) : null}
            </form>

            <div className="space-y-4">
              <section className="grid gap-3 md:grid-cols-4">
                <article className="admin-panel-elevated p-4">
                  <p className="text-sm text-text-secondary">Амбассадоры</p>
                  <p className="mt-2 text-xl font-semibold">
                    {(referralSummary?.active_advocates ?? 0).toLocaleString("ru-RU")}
                  </p>
                </article>
                <article className="admin-panel-elevated p-4">
                  <p className="text-sm text-text-secondary">Приглашения</p>
                  <p className="mt-2 text-xl font-semibold">
                    {(referralSummary?.invites_month ?? 0).toLocaleString("ru-RU")}
                  </p>
                </article>
                <article className="admin-panel-elevated p-4">
                  <p className="text-sm text-text-secondary">Конверсия</p>
                  <p className="mt-2 text-xl font-semibold">
                    {(referralSummary?.conversion_rate ?? 0).toFixed(1)}%
                  </p>
                </article>
                <article className="admin-panel-elevated p-4">
                  <p className="text-sm text-text-secondary">Бюджет наград</p>
                  <p className="mt-2 text-xl font-semibold">
                    {(referralSummary?.reward_budget ?? 0).toLocaleString("ru-RU")} ₽
                  </p>
                </article>
              </section>

              <section className="grid gap-3 lg:grid-cols-3">
                {referralTiers.map((tier) => (
                  <article className="admin-panel-elevated p-4" key={tier.id}>
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-medium">{tier.name}</h3>
                      <span className="rounded-lg bg-bg-card px-2 py-1 text-xs text-text-secondary">
                        {automationStatusLabel[tier.status]}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-text-secondary">
                      Цель: {tier.invite_goal} приглаш.
                    </p>
                    <p className="mt-2 text-sm">Рекомендатель: {tier.advocate_reward}</p>
                    <p className="mt-1 text-sm">Друг: {tier.friend_reward}</p>
                  </article>
                ))}
              </section>

              <section className="overflow-x-auto rounded-lg border border-white/[0.06]">
                <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                  <thead className="bg-bg-elevated text-xs uppercase tracking-[0.05em] text-text-disabled">
                    <tr>
                      <th className="p-3" scope="col">Рекомендатель</th>
                      <th className="p-3" scope="col">Друг</th>
                      <th className="p-3" scope="col">Канал</th>
                      <th className="p-3" scope="col">Статус</th>
                      <th className="p-3" scope="col">Награда</th>
                    </tr>
                  </thead>
                  <tbody>
                    {remoteReferralEvents.map((event) => (
                      <tr className="border-t border-white/[0.06]" key={event.id}>
                        <td className="p-3 font-medium">{event.advocate}</td>
                        <td className="p-3">{event.friend}</td>
                        <td className="p-3">{channelLabel[event.channel]}</td>
                        <td className="p-3">{referralStatusLabel[event.status]}</td>
                        <td className="p-3 text-text-secondary">{event.reward}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            </div>
          </div>
        ) : null}

        {activeTab === "promos" ? (
          <div className="grid gap-6 p-4 xl:grid-cols-[24rem_minmax(0,1fr)]">
            <form
              className="admin-panel-elevated p-4"
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                createPromoCoupon();
              }}
            >
              <h2 className="text-base font-semibold">Новый промо-код</h2>
              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className="text-xs text-text-secondary">Название купона</span>
                  <input
                    aria-label="Название купона"
                    className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                    onChange={(event) => updateCouponForm("title", event.target.value)}
                    value={couponForm.title}
                  />
                  {couponErrors.title ? (
                    <span className="mt-1 block text-xs text-danger">{couponErrors.title}</span>
                  ) : null}
                </label>
                <label className="block">
                  <span className="text-xs text-text-secondary">Код</span>
                  <input
                    aria-label="Код промо-кода"
                    className="mt-1 h-10 w-full admin-panel px-3 text-sm uppercase outline-none focus:border-brand-primary"
                    onChange={(event) => updateCouponForm("code", event.target.value.toUpperCase())}
                    value={couponForm.code}
                  />
                  {couponErrors.code ? (
                    <span className="mt-1 block text-xs text-danger">{couponErrors.code}</span>
                  ) : null}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs text-text-secondary">Тип скидки</span>
                    <select
                      aria-label="Тип скидки"
                      className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                      onChange={(event) =>
                        updateCouponForm(
                          "discountType",
                          event.target.value as MarketingCouponDiscountType,
                        )
                      }
                      value={couponForm.discountType}
                    >
                      <option value="percent">Процент</option>
                      <option value="fixed">Сумма</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs text-text-secondary">Размер скидки</span>
                    <input
                      aria-label="Размер скидки"
                      className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                      onChange={(event) => updateCouponForm("discountValue", event.target.value)}
                      type="number"
                      value={couponForm.discountValue}
                    />
                    {couponErrors.discountValue ? (
                      <span className="mt-1 block text-xs text-danger">
                        {couponErrors.discountValue}
                      </span>
                    ) : null}
                  </label>
                </div>
                <label className="block">
                  <span className="text-xs text-text-secondary">Сегмент</span>
                  <input
                    aria-label="Сегмент купона"
                    className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                    onChange={(event) => updateCouponForm("segment", event.target.value)}
                    value={couponForm.segment}
                  />
                  {couponErrors.segment ? (
                    <span className="mt-1 block text-xs text-danger">{couponErrors.segment}</span>
                  ) : null}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs text-text-secondary">Лимит</span>
                    <input
                      aria-label="Лимит купона"
                      className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                      onChange={(event) => updateCouponForm("usageLimit", event.target.value)}
                      type="number"
                      value={couponForm.usageLimit}
                    />
                    {couponErrors.usageLimit ? (
                      <span className="mt-1 block text-xs text-danger">
                        {couponErrors.usageLimit}
                      </span>
                    ) : null}
                  </label>
                  <label className="block">
                    <span className="text-xs text-text-secondary">Срок действия</span>
                    <input
                      aria-label="Срок действия купона"
                      className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                      onChange={(event) => updateCouponForm("expiresAt", event.target.value)}
                      value={couponForm.expiresAt}
                    />
                    {couponErrors.expiresAt ? (
                      <span className="mt-1 block text-xs text-danger">
                        {couponErrors.expiresAt}
                      </span>
                    ) : null}
                  </label>
                </div>
              </div>
              <button
                className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md admin-gradient px-3 text-sm font-medium text-white shadow-lg shadow-brand-primary/20 transition hover:-translate-y-0.5"
                disabled={createPromoCodeMutation.isPending}
                type="submit"
              >
                <TicketPercent aria-hidden="true" size={16} />
                Создать промо-код
              </button>
              <button
                className="mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md admin-panel text-sm font-medium text-text-secondary transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                disabled={createPromoCodesBulkMutation.isPending}
                onClick={createPromoCouponBulk}
                type="button"
              >
                <TicketPercent aria-hidden="true" size={16} />
                Сгенерировать пачку
              </button>
              {couponMessage ? (
                <p className="mt-3 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
                  {couponMessage}
                </p>
              ) : null}
            </form>

            <section className="admin-panel-elevated">
              <div className="flex flex-col gap-3 border-b border-white/10 p-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-base font-semibold">Промо-коды и купоны</h2>
                  <p className="mt-1 text-sm text-text-secondary">
                    {filteredPromoCoupons.length} из {promoCoupons.length} купонов
                  </p>
                </div>
                <label className="block md:w-52">
                  <span className="text-xs text-text-secondary">Статус купона</span>
                  <select
                    aria-label="Статус купона"
                    className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                    onChange={(event) =>
                      setCouponStatusFilter(event.target.value as CouponStatusFilter)
                    }
                    value={couponStatusFilter}
                  >
                    <option value="all">Все статусы</option>
                    <option value="active">Активен</option>
                    <option value="scheduled">Запланирован</option>
                    <option value="draft">Черновик</option>
                    <option value="expired">Истёк</option>
                  </select>
                </label>
              </div>
              <div className="grid gap-3 p-4 lg:grid-cols-2">
                {filteredPromoCoupons.map((coupon) => (
                  <article className="admin-panel p-4" key={coupon.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-medium">{coupon.title}</h3>
                        <p className="mt-1 font-mono text-sm text-brand-primary">{coupon.code}</p>
                      </div>
                      <span className="rounded-lg bg-bg-elevated px-2 py-1 text-xs text-text-secondary">
                        {couponStatusLabel[coupon.status]}
                      </span>
                    </div>
                    <div className="mt-4 grid gap-2 text-sm text-text-secondary md:grid-cols-2">
                      <p>
                        Скидка:{" "}
                        {coupon.discount_type === "percent"
                          ? `${coupon.discount_value}%`
                          : `${coupon.discount_value.toLocaleString("ru-RU")} ₽`}
                      </p>
                      <p>
                        Использовано: {coupon.used_count.toLocaleString("ru-RU")} /{" "}
                        {coupon.usage_limit.toLocaleString("ru-RU")}
                      </p>
                      <p>Сегмент: {coupon.segment}</p>
                      <p>До: {formatDate(coupon.expires_at)}</p>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        className="inline-flex h-8 items-center justify-center rounded-md border border-info/30 bg-info/10 px-3 text-xs text-info transition hover:bg-info/20 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={updatePromoCodeMutation.isPending || coupon.status === "expired"}
                        onClick={() => updatePromoCoupon(coupon)}
                        type="button"
                      >
                        +100 лимит
                      </button>
                      <button
                        className="inline-flex h-8 items-center justify-center rounded-md border border-danger/30 bg-danger/10 px-3 text-xs text-danger transition hover:bg-danger/20 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={
                          deactivatePromoCodeMutation.isPending ||
                          coupon.status === "expired"
                        }
                        onClick={() => deactivatePromoCoupon(coupon)}
                        type="button"
                      >
                        Деактивировать
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        ) : null}

        {activeTab === "experiments" ? (
          <div className="grid gap-6 p-4 xl:grid-cols-[24rem_minmax(0,1fr)]">
            <form
              className="admin-panel-elevated p-4"
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                createExperiment();
              }}
            >
              <h2 className="text-base font-semibold">Конструктор A/B-теста</h2>
              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className="text-xs text-text-secondary">Название теста</span>
                  <input
                    aria-label="Название теста"
                    className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                    onChange={(event) => updateExperimentForm("name", event.target.value)}
                    value={experimentForm.name}
                  />
                  {experimentErrors.name ? (
                    <span className="mt-1 block text-xs text-danger">{experimentErrors.name}</span>
                  ) : null}
                </label>
                <label className="block">
                  <span className="text-xs text-text-secondary">Гипотеза</span>
                  <textarea
                    aria-label="Гипотеза"
                    className="mt-1 min-h-20 w-full admin-panel px-3 py-2 text-sm outline-none focus:border-brand-primary"
                    onChange={(event) => updateExperimentForm("hypothesis", event.target.value)}
                    value={experimentForm.hypothesis}
                  />
                  {experimentErrors.hypothesis ? (
                    <span className="mt-1 block text-xs text-danger">
                      {experimentErrors.hypothesis}
                    </span>
                  ) : null}
                </label>
                <label className="block">
                  <span className="text-xs text-text-secondary">Сегмент теста</span>
                  <input
                    aria-label="Сегмент теста"
                    className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                    onChange={(event) => updateExperimentForm("segment", event.target.value)}
                    value={experimentForm.segment}
                  />
                  {experimentErrors.segment ? (
                    <span className="mt-1 block text-xs text-danger">
                      {experimentErrors.segment}
                    </span>
                  ) : null}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs text-text-secondary">Канал</span>
                    <select
                      aria-label="Канал теста"
                      className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                      onChange={(event) =>
                        updateExperimentForm("channel", event.target.value as MarketingCampaignChannel)
                      }
                      value={experimentForm.channel}
                    >
                      <option value="push">Push</option>
                      <option value="email">Email</option>
                      <option value="sms">SMS</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs text-text-secondary">Аудитория теста</span>
                    <input
                      aria-label="Аудитория теста"
                      className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                      onChange={(event) => updateExperimentForm("audienceSize", event.target.value)}
                      type="number"
                      value={experimentForm.audienceSize}
                    />
                    {experimentErrors.audienceSize ? (
                      <span className="mt-1 block text-xs text-danger">
                        {experimentErrors.audienceSize}
                      </span>
                    ) : null}
                  </label>
                </div>
                <label className="block">
                  <span className="text-xs text-text-secondary">Доля варианта A, %</span>
                  <input
                    aria-label="Доля варианта A"
                    className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                    onChange={(event) => updateExperimentForm("splitA", event.target.value)}
                    type="number"
                    value={experimentForm.splitA}
                  />
                  {experimentErrors.splitA ? (
                    <span className="mt-1 block text-xs text-danger">
                      {experimentErrors.splitA}
                    </span>
                  ) : null}
                </label>
                <label className="block">
                  <span className="text-xs text-text-secondary">Вариант A</span>
                  <input
                    aria-label="Вариант A"
                    className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                    onChange={(event) => updateExperimentForm("variantA", event.target.value)}
                    value={experimentForm.variantA}
                  />
                  {experimentErrors.variantA ? (
                    <span className="mt-1 block text-xs text-danger">
                      {experimentErrors.variantA}
                    </span>
                  ) : null}
                </label>
                <label className="block">
                  <span className="text-xs text-text-secondary">Вариант B</span>
                  <input
                    aria-label="Вариант B"
                    className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                    onChange={(event) => updateExperimentForm("variantB", event.target.value)}
                    value={experimentForm.variantB}
                  />
                  {experimentErrors.variantB ? (
                    <span className="mt-1 block text-xs text-danger">
                      {experimentErrors.variantB}
                    </span>
                  ) : null}
                </label>
              </div>
              <button
                className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md admin-gradient px-3 text-sm font-medium text-white shadow-lg shadow-brand-primary/20 transition hover:-translate-y-0.5"
                type="submit"
              >
                <FlaskConical aria-hidden="true" size={16} />
                Создать A/B-тест
              </button>
              {experimentMessage ? (
                <p className="mt-3 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
                  {experimentMessage}
                </p>
              ) : null}
            </form>

            <section className="grid gap-3">
              {experiments.map((experiment) => (
                <article
                  className="admin-panel-elevated p-4"
                  key={experiment.id}
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h2 className="font-medium text-text-primary">{experiment.name}</h2>
                      <p className="mt-1 text-sm leading-6 text-text-secondary">
                        {experiment.hypothesis}
                      </p>
                      <p className="mt-2 text-xs text-text-secondary">
                        {channelLabel[experiment.channel]} - {experiment.segment} -{" "}
                        {experiment.audience_size.toLocaleString("ru-RU")} пользователей
                      </p>
                    </div>
                    <span
                      className={cn(
                        "w-fit rounded-md px-2 py-1 text-xs",
                        statusClass(experiment.status),
                      )}
                    >
                      {experimentStatusLabel[experiment.status]}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {experiment.variants.map((variant) => (
                      <div
                        className={cn(
                          "rounded-md border p-3",
                          experiment.winner === variant.key
                            ? "border-success/40 bg-success/10"
                            : "border-white/10 bg-bg-card",
                        )}
                        key={variant.key}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="font-medium">Вариант {variant.key}</h3>
                          {experiment.winner === variant.key ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-success/10 px-2 py-1 text-xs text-success">
                              <Trophy aria-hidden="true" size={13} />
                              Победитель
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 text-sm text-text-primary">{variant.title}</p>
                        <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-text-secondary">
                          <span>{variant.audience_pct}% аудитории</span>
                          <span>CTR {variant.ctr.toLocaleString("ru-RU")}%</span>
                          <span>CR {variant.conversion_rate.toLocaleString("ru-RU")}%</span>
                        </div>
                        <button
                          className="mt-3 h-9 w-full admin-panel-elevated text-sm text-text-secondary transition hover:text-white"
                          onClick={() => chooseWinner(experiment.id, variant.key)}
                          type="button"
                        >
                          Выбрать вариант {variant.key}
                        </button>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </section>
          </div>
        ) : null}
      </section>
    </main>
  );
}
