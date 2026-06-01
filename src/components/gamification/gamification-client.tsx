"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Coins,
  MessageSquareText,
  PackageCheck,
  Plus,
  Send,
  ShieldCheck,
  Star,
  Trash2,
  Trophy,
} from "lucide-react";
import { z } from "zod";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import {
  adjustGamificationPoints,
  createGamificationAchievement,
  createGamificationReward,
  deleteGamificationAchievement,
  deleteGamificationLoyaltyTier,
  deleteGamificationReward,
  getGamificationWorkspace,
  replyToGamificationReview,
  updateGamificationAchievement,
  updateGamificationReview,
  updateGamificationReward,
} from "@/lib/api/client";
import type {
  GamificationAchievement,
  GamificationAchievementRequest,
  GamificationLoyaltyEvent,
  GamificationLoyaltyEventType,
  GamificationLoyaltySummary,
  GamificationLoyaltyTier,
  GamificationRewardItem,
  GamificationRewardRequest,
  GamificationRewardType,
  GamificationReview,
  GamificationReviewReplyRequest,
  GamificationReviewStatus,
  GamificationSentiment,
} from "@/lib/api/contracts";
import { cn } from "@/lib/utils";

type GamificationTab = "loyalty" | "achievements" | "shop" | "reviews";
type AchievementErrors = Partial<
  Record<"description" | "rewardValue" | "title" | "triggerCount", string>
>;
type LoyaltyErrors = Partial<Record<"amount" | "comment" | "user", string>>;
type ReviewErrors = Partial<Record<"response", string>>;

const emptyAchievements: GamificationAchievement[] = [];
const emptyRewards: GamificationRewardItem[] = [];
const emptyReviews: GamificationReview[] = [];
const emptyLoyaltyEvents: GamificationLoyaltyEvent[] = [];
const emptyLoyaltyTiers: GamificationLoyaltyTier[] = [];
const emptyLoyaltySummary: GamificationLoyaltySummary = {
  active_members: 0,
  average_points_per_user: 0,
  points_balance: 0,
  points_earned_month: 0,
  points_spent_month: 0,
};

const tabLabel: Record<GamificationTab, string> = {
  achievements: "Достижения",
  loyalty: "Лояльность",
  reviews: "Отзывы",
  shop: "Магазин наград",
};

const rewardTypeLabel: Record<GamificationRewardType, string> = {
  badge: "Бейдж",
  points: "Баллы",
  tariff: "Тариф",
};

const sentimentLabel: Record<GamificationSentiment, string> = {
  negative: "Негативный",
  neutral: "Нейтральный",
  positive: "Позитивный",
};

const reviewStatusLabel: Record<GamificationReviewStatus, string> = {
  new: "Новый",
  progress: "В работе",
  resolved: "Закрыт",
};

const loyaltyEventLabel: Record<GamificationLoyaltyEventType, string> = {
  adjusted: "Корректировка",
  earned: "Начисление",
  redeemed: "Списание",
};

const achievementSchema = z.object({
  description: z.string().trim().min(10, "Описание должно быть не короче 10 символов"),
  rewardValue: z.string().trim().min(1, "Укажите награду"),
  title: z.string().trim().min(3, "Название должно быть не короче 3 символов"),
  triggerCount: z
    .number()
    .int("Количество должно быть целым числом")
    .min(1, "Количество должно быть не меньше 1"),
});

const loyaltyGrantSchema = z.object({
  amount: z
    .number()
    .int("Баллы должны быть целым числом")
    .min(1, "Начислите минимум 1 балл"),
  comment: z.string().trim().min(10, "Комментарий должен быть не короче 10 символов"),
  user: z.string().trim().min(3, "Укажите пользователя"),
});

const reviewResponseSchema = z.object({
  response: z.string().trim().min(10, "Ответ должен быть не короче 10 символов"),
});

function sentimentClass(sentiment: GamificationSentiment) {
  if (sentiment === "positive") {
    return "bg-success/10 text-success";
  }

  if (sentiment === "negative") {
    return "bg-danger/10 text-danger";
  }

  return "bg-warning/10 text-warning";
}

function statusClass(status: GamificationReviewStatus) {
  if (status === "resolved") {
    return "bg-success/10 text-success";
  }

  if (status === "progress") {
    return "bg-info/10 text-info";
  }

  return "bg-muted/20 text-text-secondary";
}

function formatNumber(value: number) {
  return value.toLocaleString("ru-RU");
}

export function GamificationClient() {
  const workspaceQuery = useQuery({
    queryFn: getGamificationWorkspace,
    queryKey: ["gamification-workspace"],
  });
  const [activeTab, setActiveTab] = useState<GamificationTab>("loyalty");
  const [localAchievements, setLocalAchievements] =
    useState<GamificationAchievement[] | null>(null);
  const [localRewards, setLocalRewards] = useState<GamificationRewardItem[] | null>(null);
  const [localReviews, setLocalReviews] = useState<GamificationReview[] | null>(null);
  const [localLoyaltySummary, setLocalLoyaltySummary] =
    useState<GamificationLoyaltySummary | null>(null);
  const [localLoyaltyEvents, setLocalLoyaltyEvents] =
    useState<GamificationLoyaltyEvent[] | null>(null);
  const [localLoyaltyTiers, setLocalLoyaltyTiers] =
    useState<GamificationLoyaltyTier[] | null>(null);
  const [achievementTitle, setAchievementTitle] = useState("Серия активности");
  const [achievementDescription, setAchievementDescription] = useState(
    "Пользователь открывает приложение несколько дней подряд.",
  );
  const [achievementIcon, setAchievementIcon] = useState("STREAK");
  const [triggerEvent, setTriggerEvent] = useState("daily_open");
  const [triggerCount, setTriggerCount] = useState(3);
  const [rewardType, setRewardType] = useState<GamificationRewardType>("points");
  const [rewardValue, setRewardValue] = useState("100");
  const [achievementEnabled, setAchievementEnabled] = useState(true);
  const [editingAchievementId, setEditingAchievementId] = useState<string | null>(null);
  const [achievementMessage, setAchievementMessage] = useState("");
  const [achievementErrors, setAchievementErrors] = useState<AchievementErrors>({});
  const [loyaltyUser, setLoyaltyUser] = useState("Анна Морозова");
  const [loyaltyAmount, setLoyaltyAmount] = useState(100);
  const [loyaltyComment, setLoyaltyComment] = useState("Компенсация за обращение в поддержку");
  const [loyaltyMessage, setLoyaltyMessage] = useState("");
  const [loyaltyErrors, setLoyaltyErrors] = useState<LoyaltyErrors>({});
  const [rewardName, setRewardName] = useState("Premium 7 дней");
  const [rewardCategory, setRewardCategory] = useState("Доступ");
  const [rewardCost, setRewardCost] = useState(800);
  const [rewardStock, setRewardStock] = useState(50);
  const [stockMessage, setStockMessage] = useState("");
  const [rewardCategoryFilter, setRewardCategoryFilter] = useState("all");
  const [reviewStatusFilter, setReviewStatusFilter] = useState<GamificationReviewStatus | "all">(
    "all",
  );
  const [reviewSentimentFilter, setReviewSentimentFilter] = useState<
    GamificationSentiment | "all"
  >("all");
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [draftResponse, setDraftResponse] = useState("");
  const [reviewErrors, setReviewErrors] = useState<ReviewErrors>({});

  const workspace = workspaceQuery.data?.data;
  const workspaceAchievements = workspace?.achievements ?? emptyAchievements;
  const workspaceRewards = workspace?.rewards ?? emptyRewards;
  const workspaceReviews = workspace?.reviews ?? emptyReviews;
  const workspaceLoyaltyEvents = workspace?.loyalty_events ?? emptyLoyaltyEvents;
  const workspaceLoyaltySummary = workspace?.loyalty_summary ?? emptyLoyaltySummary;
  const workspaceLoyaltyTiers = workspace?.loyalty_tiers ?? emptyLoyaltyTiers;
  const achievements = useMemo(
    () => localAchievements ?? workspaceAchievements,
    [localAchievements, workspaceAchievements],
  );
  const rewards = useMemo(
    () => localRewards ?? workspaceRewards,
    [localRewards, workspaceRewards],
  );
  const reviews = useMemo(
    () => localReviews ?? workspaceReviews,
    [localReviews, workspaceReviews],
  );
  const loyaltyEvents = useMemo(
    () => localLoyaltyEvents ?? workspaceLoyaltyEvents,
    [localLoyaltyEvents, workspaceLoyaltyEvents],
  );
  const loyaltyTiers = useMemo(
    () => localLoyaltyTiers ?? workspaceLoyaltyTiers,
    [localLoyaltyTiers, workspaceLoyaltyTiers],
  );
  const loyaltySummary = localLoyaltySummary ?? workspaceLoyaltySummary;
  const selectedReview = useMemo(
    () => reviews.find((review) => review.id === selectedReviewId) ?? reviews[0],
    [reviews, selectedReviewId],
  );
  const rewardCategories = useMemo(
    () => Array.from(new Set(rewards.map((reward) => reward.category))),
    [rewards],
  );
  const filteredRewards = useMemo(
    () =>
      rewards.filter(
        (reward) => rewardCategoryFilter === "all" || reward.category === rewardCategoryFilter,
      ),
    [rewardCategoryFilter, rewards],
  );
  const filteredReviews = useMemo(
    () =>
      reviews.filter(
        (review) =>
          (reviewStatusFilter === "all" || review.status === reviewStatusFilter) &&
          (reviewSentimentFilter === "all" || review.sentiment === reviewSentimentFilter),
      ),
    [reviewSentimentFilter, reviewStatusFilter, reviews],
  );
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;
  const negativeReviews = reviews.filter((review) => review.sentiment === "negative").length;
  const nextTier = loyaltyTiers
    .slice()
    .sort((first, second) => first.threshold - second.threshold)
    .find((tier) => tier.threshold > loyaltySummary.average_points_per_user);
  const createAchievementMutation = useMutation({
    mutationFn: createGamificationAchievement,
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Не удалось сохранить достижение";
      setAchievementMessage(message);
    },
    onSuccess: async ({ data }) => {
      setLocalAchievements((current) => [
        data,
        ...(current ?? achievements).filter((achievement) => achievement.id !== data.id),
      ]);
      setAchievementErrors({});
      setAchievementMessage(`Достижение "${data.title}" сохранено`);
      await workspaceQuery.refetch();
    },
  });
  const updateAchievementMutation = useMutation({
    mutationFn: ({
      achievementId,
      request,
    }: {
      achievementId: string;
      request: Partial<GamificationAchievementRequest>;
    }) => updateGamificationAchievement(achievementId, request),
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Не удалось обновить достижение";
      setAchievementMessage(message);
    },
    onSuccess: async ({ data }) => {
      setLocalAchievements((current) =>
        (current ?? achievements).map((achievement) =>
          achievement.id === data.id ? data : achievement,
        ),
      );
      setAchievementErrors({});
      setEditingAchievementId(null);
      setAchievementMessage(`Достижение "${data.title}" обновлено`);
      await workspaceQuery.refetch();
    },
  });
  const deleteAchievementMutation = useMutation({
    mutationFn: deleteGamificationAchievement,
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Не удалось удалить достижение";
      setAchievementMessage(message);
    },
    onSuccess: async (_result, achievementId) => {
      setLocalAchievements((current) =>
        (current ?? achievements).filter((achievement) => achievement.id !== achievementId),
      );
      if (editingAchievementId === achievementId) {
        setEditingAchievementId(null);
      }
      setAchievementMessage("Достижение удалено");
      await workspaceQuery.refetch();
    },
  });
  const adjustPointsMutation = useMutation({
    mutationFn: adjustGamificationPoints,
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Failed to update loyalty points";
      setLoyaltyMessage(message);
    },
    onSuccess: async ({ data }) => {
      setLocalLoyaltyEvents((current) => [data.event, ...(current ?? loyaltyEvents)]);
      setLocalLoyaltySummary(data.loyalty_summary);
      setLoyaltyErrors({});
      setLoyaltyMessage(
        `${formatNumber(Math.abs(data.event.amount))} баллов начислено пользователю ${data.event.user}`,
      );
      await workspaceQuery.refetch();
    },
  });
  const deleteLoyaltyTierMutation = useMutation({
    mutationFn: deleteGamificationLoyaltyTier,
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Не удалось удалить уровень лояльности";
      setLoyaltyMessage(message);
    },
    onSuccess: async (_result, tierId) => {
      setLocalLoyaltyTiers((current) =>
        (current ?? loyaltyTiers).filter((tier) => tier.id !== tierId),
      );
      setLoyaltyMessage("Уровень лояльности удалён");
      await workspaceQuery.refetch();
    },
  });
  const createRewardMutation = useMutation({
    mutationFn: createGamificationReward,
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Не удалось создать награду";
      setStockMessage(message);
    },
    onSuccess: async ({ data }) => {
      setLocalRewards((current) => [data, ...(current ?? rewards)]);
      setStockMessage(`Награда "${data.name}" создана`);
      await workspaceQuery.refetch();
    },
  });
  const updateRewardMutation = useMutation({
    mutationFn: ({
      request,
      rewardId,
    }: {
      request: Partial<GamificationRewardRequest>;
      rewardId: string;
      successMessage?: string;
    }) => updateGamificationReward(rewardId, request),
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Не удалось обновить награду";
      setStockMessage(message);
    },
    onSuccess: async ({ data }, variables) => {
      setLocalRewards((current) =>
        (current ?? rewards).map((reward) => (reward.id === data.id ? data : reward)),
      );
      setStockMessage(variables.successMessage ?? `Награда "${data.name}" обновлена`);
      await workspaceQuery.refetch();
    },
  });
  const deleteRewardMutation = useMutation({
    mutationFn: deleteGamificationReward,
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Не удалось удалить награду";
      setStockMessage(message);
    },
    onSuccess: async (_result, rewardId) => {
      setLocalRewards((current) =>
        (current ?? rewards).filter((reward) => reward.id !== rewardId),
      );
      setStockMessage("Награда удалена");
      await workspaceQuery.refetch();
    },
  });
  const updateReviewMutation = useMutation({
    mutationFn: ({
      reviewId,
      status,
    }: {
      reviewId: string;
      status: GamificationReviewStatus;
    }) => updateGamificationReview(reviewId, { status }),
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Не удалось обновить статус";
      setReviewErrors({ response: message });
    },
    onSuccess: async ({ data }) => {
      setLocalReviews((current) =>
        (current ?? reviews).map((review) => (review.id === data.id ? data : review)),
      );
      setReviewErrors({});
      await workspaceQuery.refetch();
    },
  });
  const replyReviewMutation = useMutation({
    mutationFn: ({
      request,
      reviewId,
    }: {
      request: GamificationReviewReplyRequest;
      reviewId: string;
    }) => replyToGamificationReview(reviewId, request),
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Не удалось отправить ответ";
      setReviewErrors({ response: message });
    },
    onSuccess: async ({ data }) => {
      setLocalReviews((current) =>
        (current ?? reviews).map((review) => (review.id === data.id ? data : review)),
      );
      setDraftResponse(data.response);
      setReviewErrors({});
      await workspaceQuery.refetch();
    },
  });

  function updateAchievementTitle(value: string) {
    setAchievementTitle(value);
    setAchievementErrors((current) => ({ ...current, title: undefined }));
  }

  function updateAchievementDescription(value: string) {
    setAchievementDescription(value);
    setAchievementErrors((current) => ({ ...current, description: undefined }));
  }

  function updateTriggerCount(value: number) {
    setTriggerCount(value);
    setAchievementErrors((current) => ({ ...current, triggerCount: undefined }));
  }

  function updateRewardValue(value: string) {
    setRewardValue(value);
    setAchievementErrors((current) => ({ ...current, rewardValue: undefined }));
  }

  function editAchievement(achievement: GamificationAchievement) {
    setEditingAchievementId(achievement.id);
    setAchievementTitle(achievement.title);
    setAchievementDescription(achievement.description);
    setAchievementIcon(achievement.icon);
    setTriggerEvent(achievement.trigger_event);
    setTriggerCount(achievement.trigger_count);
    setRewardType(achievement.reward_type);
    setRewardValue(achievement.reward_value);
    setAchievementEnabled(achievement.status === "active");
    setAchievementErrors({});
    setAchievementMessage("");
  }

  function resetAchievementForm() {
    setEditingAchievementId(null);
    setAchievementErrors({});
    setAchievementMessage("");
  }

  function updateLoyaltyUser(value: string) {
    setLoyaltyUser(value);
    setLoyaltyErrors((current) => ({ ...current, user: undefined }));
    setLoyaltyMessage("");
  }

  function updateLoyaltyAmount(value: number) {
    setLoyaltyAmount(value);
    setLoyaltyErrors((current) => ({ ...current, amount: undefined }));
    setLoyaltyMessage("");
  }

  function updateLoyaltyComment(value: string) {
    setLoyaltyComment(value);
    setLoyaltyErrors((current) => ({ ...current, comment: undefined }));
    setLoyaltyMessage("");
  }

  function saveAchievement() {
    const parsed = achievementSchema.safeParse({
      description: achievementDescription,
      rewardValue,
      title: achievementTitle,
      triggerCount,
    });

    if (!parsed.success) {
      const nextErrors: AchievementErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof AchievementErrors;
        nextErrors[field] = issue.message;
      }
      setAchievementErrors(nextErrors);
      setAchievementMessage("");
      return;
    }

    const nextAchievement: GamificationAchievementRequest = {
      description: parsed.data.description.trim(),
      icon: achievementIcon.trim() || "TROPHY",
      reward_type: rewardType,
      reward_value: parsed.data.rewardValue.trim(),
      status: achievementEnabled ? "active" : "inactive",
      title: parsed.data.title.trim(),
      trigger_count: parsed.data.triggerCount,
      trigger_event: triggerEvent,
    };

    if (editingAchievementId) {
      updateAchievementMutation.mutate({
        achievementId: editingAchievementId,
        request: nextAchievement,
      });
      return;
    }

    createAchievementMutation.mutate(nextAchievement);
  }

  function deleteAchievement(achievementId: string) {
    deleteAchievementMutation.mutate(achievementId);
  }

  function grantLoyaltyPoints() {
    const parsed = loyaltyGrantSchema.safeParse({
      amount: loyaltyAmount,
      comment: loyaltyComment,
      user: loyaltyUser,
    });

    if (!parsed.success) {
      const nextErrors: LoyaltyErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof LoyaltyErrors;
        nextErrors[field] = issue.message;
      }
      setLoyaltyErrors(nextErrors);
      setLoyaltyMessage("");
      return;
    }

    const loyaltyGrant = parsed.data;
    adjustPointsMutation.mutate({
      action: "grant",
      amount: loyaltyGrant.amount,
      comment: loyaltyGrant.comment.trim(),
      user: loyaltyGrant.user.trim(),
    });
  }

  function deleteLoyaltyTier(tierId: string) {
    deleteLoyaltyTierMutation.mutate(tierId);
  }

  function redeemReward(rewardId: string) {
    const reward = rewards.find((item) => item.id === rewardId);

    if (!reward || reward.stock <= 0) {
      return;
    }

    const updatedReward: GamificationRewardItem = {
      ...reward,
      redemptions: reward.redemptions + 1,
      stock: reward.stock - 1,
    };

    setLocalRewards((current) =>
      (current ?? rewards).map((item) => (item.id === rewardId ? updatedReward : item)),
    );
    setLocalLoyaltySummary((current) => {
      const base = current ?? loyaltySummary;

      return {
        ...base,
        points_balance: Math.max(0, base.points_balance - reward.cost),
        points_spent_month: base.points_spent_month + reward.cost,
      };
    });
    setStockMessage(`Награда "${reward.name}" списана, остаток уменьшен`);
    updateRewardMutation.mutate({
      request: {
        redemptions: updatedReward.redemptions,
        stock: updatedReward.stock,
      },
      rewardId,
      successMessage: `Награда "${reward.name}" списана, остаток уменьшен`,
    });
  }

  function createReward() {
    const trimmedName = rewardName.trim();
    const trimmedCategory = rewardCategory.trim();

    if (!trimmedName || !trimmedCategory || rewardCost <= 0 || rewardStock < 0) {
      setStockMessage("Заполните название, категорию, цену и остаток награды");
      return;
    }

    createRewardMutation.mutate({
      category: trimmedCategory,
      cost: rewardCost,
      name: trimmedName,
      stock: rewardStock,
    });
  }

  function deleteReward(rewardId: string) {
    deleteRewardMutation.mutate(rewardId);
  }

  function selectReview(review: GamificationReview) {
    setSelectedReviewId(review.id);
    setDraftResponse(review.response);
    setReviewErrors({});
  }

  function updateReviewStatus(review: GamificationReview, status: GamificationReviewStatus) {
    setSelectedReviewId(review.id);
    setLocalReviews((current) =>
      (current ?? reviews).map((item) => (item.id === review.id ? { ...item, status } : item)),
    );
    updateReviewMutation.mutate({ reviewId: review.id, status });
  }

  function sendReviewResponse() {
    if (!selectedReview) {
      return;
    }

    const parsed = reviewResponseSchema.safeParse({ response: draftResponse });

    if (!parsed.success) {
      setReviewErrors({ response: parsed.error.issues[0]?.message });
      return;
    }

    const response = parsed.data.response.trim();
    setLocalReviews((current) =>
      (current ?? reviews).map((review) =>
        review.id === selectedReview.id
          ? { ...review, response, status: "resolved" }
          : review,
      ),
    );
    setReviewErrors({});
    replyReviewMutation.mutate({
      request: { response },
      reviewId: selectedReview.id,
    });
  }

  if (workspaceQuery.isPending) {
    return (
      <main className="px-4 py-6 lg:px-6">
        <LoadingState />
      </main>
    );
  }

  if (workspaceQuery.isError) {
    return (
      <main className="px-4 py-6 lg:px-6">
        <ErrorState onRetry={() => void workspaceQuery.refetch()} />
      </main>
    );
  }

  if (!workspace) {
    return (
      <main className="px-4 py-6 lg:px-6">
        <section className="admin-panel p-6">
          <h1 className="text-[22px] font-bold tracking-normal text-white">Геймификация</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Пока нет данных по лояльности, достижениям, наградам или отзывам.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="px-4 py-6 lg:px-6">
      <header className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-disabled">
            Лояльность и удержание
          </p>
          <h1 className="mt-2 text-[22px] font-bold tracking-normal text-white">Геймификация</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-text-secondary">
            Баллы лояльности, достижения, магазин наград и ответы на отзывы в contract-first UI.
          </p>
        </div>
        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md admin-gradient px-4 text-sm font-medium text-white shadow-lg shadow-brand-primary/20 transition hover:-translate-y-0.5"
          onClick={() => setActiveTab("loyalty")}
          type="button"
        >
          <Plus aria-hidden="true" size={16} />
          Открыть начисление
        </button>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <article className="admin-panel p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">Баланс баллов</p>
            <Coins aria-hidden="true" className="text-brand-primary" size={18} />
          </div>
          <p className="mt-3 text-[22px] font-bold tracking-normal text-white">
            {formatNumber(loyaltySummary.points_balance)}
          </p>
          <p className="mt-2 text-sm text-text-secondary">
            {formatNumber(loyaltySummary.active_members)} участников
          </p>
        </article>
        <article className="admin-panel p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">Достижения</p>
            <Trophy aria-hidden="true" className="text-warning" size={18} />
          </div>
          <p className="mt-3 text-[22px] font-bold tracking-normal text-white">{achievements.length}</p>
          <p className="mt-2 text-sm text-text-secondary">Активные правила</p>
        </article>
        <article className="admin-panel p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">Средняя оценка</p>
            <Star aria-hidden="true" className="text-success" size={18} />
          </div>
          <p className="mt-3 text-[22px] font-bold tracking-normal text-white">{averageRating.toFixed(1)}</p>
          <p className="mt-2 text-sm text-text-secondary">По всем источникам отзывов</p>
        </article>
        <article className="rounded-md border border-danger/30 bg-danger/10 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-danger">Негативные</p>
            <MessageSquareText aria-hidden="true" className="text-danger" size={18} />
          </div>
          <p className="mt-3 text-[22px] font-bold tracking-normal text-white">{negativeReviews}</p>
          <p className="mt-2 text-sm text-text-secondary">Требуют ответа</p>
        </article>
      </section>

      <section className="mt-6 admin-panel">
        <div className="flex flex-wrap gap-2 border-b border-white/10 p-4">
          {(Object.keys(tabLabel) as GamificationTab[]).map((tab) => (
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

        {activeTab === "loyalty" ? (
          <div className="grid gap-6 p-4 xl:grid-cols-[24rem_minmax(0,1fr)]">
            <section className="admin-panel-elevated p-4">
              <h2 className="text-base font-semibold">Начисление баллов</h2>
              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className="text-xs text-text-secondary">Пользователь</span>
                  <input
                    aria-label="Пользователь"
                    className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                    onChange={(event) => updateLoyaltyUser(event.target.value)}
                    value={loyaltyUser}
                  />
                  {loyaltyErrors.user ? (
                    <span className="mt-1 block text-xs text-danger">{loyaltyErrors.user}</span>
                  ) : null}
                </label>
                <label className="block">
                  <span className="text-xs text-text-secondary">Количество баллов</span>
                  <input
                    aria-label="Количество баллов"
                    className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                    min={1}
                    onChange={(event) => updateLoyaltyAmount(Number(event.target.value))}
                    type="number"
                    value={loyaltyAmount}
                  />
                  {loyaltyErrors.amount ? (
                    <span className="mt-1 block text-xs text-danger">{loyaltyErrors.amount}</span>
                  ) : null}
                </label>
                <label className="block">
                  <span className="text-xs text-text-secondary">Комментарий</span>
                  <textarea
                    aria-label="Комментарий"
                    className="mt-1 min-h-24 w-full admin-panel px-3 py-2 text-sm outline-none focus:border-brand-primary"
                    onChange={(event) => updateLoyaltyComment(event.target.value)}
                    value={loyaltyComment}
                  />
                  {loyaltyErrors.comment ? (
                    <span className="mt-1 block text-xs text-danger">
                      {loyaltyErrors.comment}
                    </span>
                  ) : null}
                </label>
              </div>
              <button
                className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md admin-gradient px-3 text-sm font-medium text-white shadow-lg shadow-brand-primary/20 transition hover:-translate-y-0.5"
                onClick={grantLoyaltyPoints}
                type="button"
              >
                <Coins aria-hidden="true" size={16} />
                Начислить баллы
              </button>
              {loyaltyMessage ? (
                <p className="mt-3 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
                  {loyaltyMessage}
                </p>
              ) : null}
            </section>

            <div className="space-y-4">
              <section className="grid gap-3 md:grid-cols-3">
                <article className="admin-panel-elevated p-4">
                  <p className="text-sm text-text-secondary">Начислено за месяц</p>
                  <p className="mt-2 text-xl font-semibold">
                    {formatNumber(loyaltySummary.points_earned_month)}
                  </p>
                </article>
                <article className="admin-panel-elevated p-4">
                  <p className="text-sm text-text-secondary">Списано за месяц</p>
                  <p className="mt-2 text-xl font-semibold">
                    {formatNumber(loyaltySummary.points_spent_month)}
                  </p>
                </article>
                <article className="admin-panel-elevated p-4">
                  <p className="text-sm text-text-secondary">Средний баланс</p>
                  <p className="mt-2 text-xl font-semibold">
                    {formatNumber(loyaltySummary.average_points_per_user)}
                  </p>
                  <p className="mt-1 text-xs text-text-secondary">
                    {nextTier
                      ? `До уровня ${nextTier.name}: ${formatNumber(
                          nextTier.threshold - loyaltySummary.average_points_per_user,
                        )}`
                      : "Максимальный уровень"}
                  </p>
                </article>
              </section>

              <section className="rounded-lg border border-white/[0.06]">
                <div className="border-b border-white/10 bg-bg-elevated px-3 py-2">
                  <h2 className="text-sm font-semibold">Уровни лояльности</h2>
                </div>
                <div className="grid gap-3 p-3 lg:grid-cols-3">
                  {loyaltyTiers.map((tier) => (
                    <article className="admin-panel-elevated p-3" key={tier.id}>
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-medium">{tier.name}</h3>
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-success/10 px-2 py-1 text-xs text-success">
                            {tier.status === "active" ? "Активен" : "Отключен"}
                          </span>
                          <button
                            aria-label={`Удалить уровень ${tier.name}`}
                            className="inline-flex size-8 items-center justify-center rounded-md border border-danger/30 text-danger transition hover:bg-danger/10"
                            disabled={deleteLoyaltyTierMutation.isPending}
                            onClick={() => deleteLoyaltyTier(tier.id)}
                            type="button"
                          >
                            <Trash2 aria-hidden="true" size={15} />
                          </button>
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-text-secondary">{tier.benefit}</p>
                      <p className="mt-3 text-sm">
                        Порог: <span className="font-medium">{formatNumber(tier.threshold)}</span>
                      </p>
                      <p className="mt-1 text-sm text-text-secondary">
                        Участников: {formatNumber(tier.members)}
                      </p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="overflow-x-auto rounded-lg border border-white/[0.06]">
                <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                  <thead className="bg-bg-elevated text-xs uppercase tracking-[0.05em] text-text-disabled">
                    <tr>
                      <th className="p-3" scope="col">Пользователь</th>
                      <th className="p-3" scope="col">Операция</th>
                      <th className="p-3" scope="col">Баллы</th>
                      <th className="p-3" scope="col">Источник</th>
                      <th className="p-3" scope="col">Дата</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loyaltyEvents.map((event) => (
                      <tr className="border-t border-white/[0.06]" key={event.id}>
                        <td className="p-3 font-medium">{event.user}</td>
                        <td className="p-3">
                          <p>{loyaltyEventLabel[event.event_type]}</p>
                          <p className="mt-1 text-xs text-text-secondary">{event.reason}</p>
                        </td>
                        <td
                          className={cn(
                            "p-3 font-medium",
                            event.amount >= 0 ? "text-success" : "text-danger",
                          )}
                        >
                          {event.amount >= 0 ? "+" : ""}
                          {formatNumber(event.amount)}
                        </td>
                        <td className="p-3 text-text-secondary">{event.source}</td>
                        <td className="p-3 text-text-secondary">{event.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            </div>
          </div>
        ) : null}

        {activeTab === "achievements" ? (
          <div className="grid gap-6 p-4 xl:grid-cols-[24rem_minmax(0,1fr)]">
            <section className="admin-panel-elevated p-4">
              <h2 className="text-base font-semibold">Конструктор достижений</h2>
              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className="text-xs text-text-secondary">Название достижения</span>
                  <input
                    aria-label="Название достижения"
                    className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                    onChange={(event) => updateAchievementTitle(event.target.value)}
                    value={achievementTitle}
                  />
                  {achievementErrors.title ? (
                    <span className="mt-1 block text-xs text-danger">
                      {achievementErrors.title}
                    </span>
                  ) : null}
                </label>
                <label className="block">
                  <span className="text-xs text-text-secondary">Описание достижения</span>
                  <textarea
                    aria-label="Описание достижения"
                    className="mt-1 min-h-20 w-full admin-panel px-3 py-2 text-sm outline-none focus:border-brand-primary"
                    onChange={(event) => updateAchievementDescription(event.target.value)}
                    value={achievementDescription}
                  />
                  {achievementErrors.description ? (
                    <span className="mt-1 block text-xs text-danger">
                      {achievementErrors.description}
                    </span>
                  ) : null}
                </label>
                <div className="grid grid-cols-[5rem_minmax(0,1fr)] gap-3">
                  <label className="block">
                    <span className="text-xs text-text-secondary">Иконка</span>
                    <input
                      aria-label="Иконка достижения"
                      className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                      onChange={(event) => setAchievementIcon(event.target.value)}
                      value={achievementIcon}
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs text-text-secondary">Событие</span>
                    <select
                      aria-label="Событие достижения"
                      className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                      onChange={(event) => setTriggerEvent(event.target.value)}
                      value={triggerEvent}
                    >
                      <option value="daily_open">daily_open</option>
                      <option value="payment_success">payment_success</option>
                      <option value="subscription_added">subscription_added</option>
                    </select>
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs text-text-secondary">Количество условий</span>
                    <input
                      aria-label="Количество условий"
                      className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                      min={1}
                      onChange={(event) => updateTriggerCount(Number(event.target.value))}
                      type="number"
                      value={triggerCount}
                    />
                    {achievementErrors.triggerCount ? (
                      <span className="mt-1 block text-xs text-danger">
                        {achievementErrors.triggerCount}
                      </span>
                    ) : null}
                  </label>
                  <label className="block">
                    <span className="text-xs text-text-secondary">Тип награды</span>
                    <select
                      aria-label="Тип награды"
                      className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                      onChange={(event) =>
                        setRewardType(event.target.value as GamificationRewardType)
                      }
                      value={rewardType}
                    >
                      <option value="points">Баллы</option>
                      <option value="badge">Бейдж</option>
                      <option value="tariff">Тариф</option>
                    </select>
                  </label>
                </div>
                <label className="block">
                  <span className="text-xs text-text-secondary">Значение награды</span>
                  <input
                    aria-label="Значение награды"
                    className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                    onChange={(event) => updateRewardValue(event.target.value)}
                    value={rewardValue}
                  />
                  {achievementErrors.rewardValue ? (
                    <span className="mt-1 block text-xs text-danger">
                      {achievementErrors.rewardValue}
                    </span>
                  ) : null}
                </label>
                <label className="flex items-center gap-2 text-sm text-text-secondary">
                  <input
                    checked={achievementEnabled}
                    onChange={(event) => setAchievementEnabled(event.target.checked)}
                    type="checkbox"
                  />
                  Достижение активно
                </label>
              </div>
              <button
                className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md admin-gradient px-3 text-sm font-medium text-white shadow-lg shadow-brand-primary/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={
                  createAchievementMutation.isPending || updateAchievementMutation.isPending
                }
                onClick={saveAchievement}
                type="button"
              >
                <ShieldCheck aria-hidden="true" size={16} />
                {editingAchievementId ? "Обновить достижение" : "Сохранить достижение"}
              </button>
              {editingAchievementId ? (
                <button
                  className="mt-2 h-10 w-full rounded-md admin-panel text-sm text-text-secondary transition hover:text-white"
                  onClick={resetAchievementForm}
                  type="button"
                >
                  Сбросить редактирование
                </button>
              ) : null}
              {achievementMessage ? (
                <p className="mt-3 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
                  {achievementMessage}
                </p>
              ) : null}
            </section>

            <div className="overflow-x-auto rounded-lg border border-white/[0.06]">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead className="bg-bg-elevated text-xs uppercase tracking-[0.05em] text-text-disabled">
                  <tr>
                    <th className="p-3" scope="col">Достижение</th>
                    <th className="p-3" scope="col">Условие</th>
                    <th className="p-3" scope="col">Награда</th>
                    <th className="p-3" scope="col">Статус</th>
                    <th className="p-3" scope="col">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {achievements.map((achievement) => (
                    <tr className="border-t border-white/[0.06]" key={achievement.id}>
                      <td className="p-3">
                        <span className="mr-2 text-xs text-text-secondary">
                          {achievement.icon}
                        </span>
                        <span className="font-medium">{achievement.title}</span>
                        <p className="mt-1 text-xs text-text-secondary">
                          {achievement.description}
                        </p>
                      </td>
                      <td className="p-3 text-text-secondary">
                        {achievement.trigger_count} x {achievement.trigger_event}
                      </td>
                      <td className="p-3">
                        {rewardTypeLabel[achievement.reward_type]} - {achievement.reward_value}
                      </td>
                      <td className="p-3">
                        <span
                          className={cn(
                            "rounded-md px-2 py-1 text-xs",
                            achievement.status === "active"
                              ? "bg-success/10 text-success"
                              : "bg-muted/20 text-text-secondary",
                          )}
                        >
                          {achievement.status === "active" ? "Активно" : "Отключено"}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="rounded-md admin-panel px-3 py-1 text-xs text-text-secondary transition hover:text-white"
                            onClick={() => editAchievement(achievement)}
                            type="button"
                          >
                            Изменить
                          </button>
                          <button
                            className="rounded-md border border-danger/30 px-3 py-1 text-xs text-danger transition hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={deleteAchievementMutation.isPending}
                            onClick={() => deleteAchievement(achievement.id)}
                            type="button"
                          >
                            Удалить
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {activeTab === "shop" ? (
          <div className="p-4">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-base font-semibold">Магазин наград</h2>
              <label className="block sm:w-64">
                <span className="sr-only">Категория наград</span>
                <select
                  aria-label="Категория наград"
                  className="h-10 w-full admin-panel-elevated px-3 text-sm outline-none focus:border-brand-primary"
                  onChange={(event) => setRewardCategoryFilter(event.target.value)}
                  value={rewardCategoryFilter}
                >
                  <option value="all">Все категории</option>
                  {rewardCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <section className="mb-4 grid gap-3 rounded-lg border border-white/[0.06] bg-bg-elevated/40 p-4 md:grid-cols-[minmax(0,1fr)_10rem_8rem_8rem_auto]">
              <label className="block">
                <span className="text-xs text-text-secondary">Название награды</span>
                <input
                  aria-label="Название награды"
                  className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                  onChange={(event) => setRewardName(event.target.value)}
                  value={rewardName}
                />
              </label>
              <label className="block">
                <span className="text-xs text-text-secondary">Категория</span>
                <input
                  aria-label="Категория награды"
                  className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                  onChange={(event) => setRewardCategory(event.target.value)}
                  value={rewardCategory}
                />
              </label>
              <label className="block">
                <span className="text-xs text-text-secondary">Стоимость</span>
                <input
                  aria-label="Стоимость награды"
                  className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                  min={1}
                  onChange={(event) => setRewardCost(Number(event.target.value))}
                  type="number"
                  value={rewardCost}
                />
              </label>
              <label className="block">
                <span className="text-xs text-text-secondary">Остаток</span>
                <input
                  aria-label="Остаток награды"
                  className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                  min={0}
                  onChange={(event) => setRewardStock(Number(event.target.value))}
                  type="number"
                  value={rewardStock}
                />
              </label>
              <button
                className="mt-5 h-10 rounded-md admin-gradient px-4 text-sm font-medium text-white shadow-lg shadow-brand-primary/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 md:mt-5"
                disabled={createRewardMutation.isPending}
                onClick={createReward}
                type="button"
              >
                Создать
              </button>
            </section>
            {stockMessage ? (
              <p className="mb-4 rounded-md border border-info/30 bg-info/10 px-3 py-2 text-sm text-info">
                {stockMessage}
              </p>
            ) : null}
            <div className="grid gap-3 lg:grid-cols-3">
              {filteredRewards.map((reward) => (
                <article
                  className="admin-panel-elevated p-4"
                  key={reward.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-medium text-text-primary">{reward.name}</h3>
                      <p className="mt-1 text-sm text-text-secondary">{reward.category}</p>
                    </div>
                    <PackageCheck aria-hidden="true" className="text-brand-primary" size={18} />
                  </div>
                  <p className="mt-4 text-sm text-text-secondary">Стоимость</p>
                  <p className="mt-1 text-[22px] font-bold tracking-normal text-white">
                    {formatNumber(reward.cost)} баллов
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-text-secondary">Остаток</p>
                      <p className="mt-1 font-medium">{formatNumber(reward.stock)}</p>
                    </div>
                    <div>
                      <p className="text-text-secondary">Списания</p>
                      <p className="mt-1 font-medium">{formatNumber(reward.redemptions)}</p>
                    </div>
                  </div>
                  <button
                    className="mt-4 h-10 w-full admin-panel text-sm text-text-secondary transition hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={updateRewardMutation.isPending || reward.stock <= 0}
                    onClick={() => redeemReward(reward.id)}
                    type="button"
                  >
                    Списать {reward.name}
                  </button>
                  <button
                    className="mt-2 h-10 w-full rounded-md border border-danger/30 text-sm text-danger transition hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={deleteRewardMutation.isPending}
                    onClick={() => deleteReward(reward.id)}
                    type="button"
                  >
                    Удалить награду
                  </button>
                </article>
              ))}
            </div>
          </div>
        ) : null}

        {activeTab === "reviews" ? (
          <div className="grid gap-6 p-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
            <div>
              <div className="mb-4 grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs text-text-secondary">Статус модерации</span>
                  <select
                    aria-label="Статус модерации"
                    className="mt-1 h-10 w-full admin-panel-elevated px-3 text-sm outline-none focus:border-brand-primary"
                    onChange={(event) =>
                      setReviewStatusFilter(event.target.value as GamificationReviewStatus | "all")
                    }
                    value={reviewStatusFilter}
                  >
                    <option value="all">Все статусы</option>
                    <option value="new">Новые</option>
                    <option value="progress">В работе</option>
                    <option value="resolved">Закрытые</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs text-text-secondary">Тональность</span>
                  <select
                    aria-label="Тональность отзыва"
                    className="mt-1 h-10 w-full admin-panel-elevated px-3 text-sm outline-none focus:border-brand-primary"
                    onChange={(event) =>
                      setReviewSentimentFilter(event.target.value as GamificationSentiment | "all")
                    }
                    value={reviewSentimentFilter}
                  >
                    <option value="all">Все тональности</option>
                    <option value="negative">Негативные</option>
                    <option value="neutral">Нейтральные</option>
                    <option value="positive">Позитивные</option>
                  </select>
                </label>
              </div>
              <div className="overflow-x-auto rounded-lg border border-white/[0.06]">
              <table className="w-full min-w-[780px] border-collapse text-left text-sm">
                <thead className="bg-bg-elevated text-xs uppercase tracking-[0.05em] text-text-disabled">
                  <tr>
                    <th className="p-3" scope="col">Источник</th>
                    <th className="p-3" scope="col">Оценка</th>
                    <th className="p-3" scope="col">Текст</th>
                    <th className="p-3" scope="col">Тональность</th>
                    <th className="p-3" scope="col">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReviews.map((review) => (
                    <tr
                      className={cn(
                        "cursor-pointer border-t border-white/[0.06] transition hover:bg-bg-elevated/70",
                        selectedReview?.id === review.id ? "bg-bg-elevated" : "",
                      )}
                      key={review.id}
                      onClick={() => selectReview(review)}
                    >
                      <td className="p-3">
                        <p className="font-medium">{review.source}</p>
                        <p className="mt-1 text-xs text-text-secondary">
                          {review.user} - {review.date}
                        </p>
                      </td>
                      <td className="p-3">{review.rating}/5</td>
                      <td className="p-3">{review.text}</td>
                      <td className="p-3">
                        <span
                          className={cn(
                            "rounded-md px-2 py-1 text-xs",
                            sentimentClass(review.sentiment),
                          )}
                        >
                          {sentimentLabel[review.sentiment]}
                        </span>
                        <p className="mt-2 text-xs text-text-secondary">
                          {review.tags.join(", ")}
                        </p>
                      </td>
                      <td className="p-3">
                        <span
                          className={cn("rounded-md px-2 py-1 text-xs", statusClass(review.status))}
                        >
                          {reviewStatusLabel[review.status]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>

            {selectedReview ? (
              <aside
                className="admin-panel-elevated p-4"
                data-testid="review-response-panel"
              >
                <h2 className="text-base font-semibold">Ответ на отзыв</h2>
                <p className="mt-2 text-sm text-text-secondary">{selectedReview.text}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedReview.tags.map((tag) => (
                    <span
                      className="rounded-lg bg-bg-card px-2 py-1 text-xs text-text-secondary"
                      key={tag}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <label className="mt-4 block">
                  <span className="text-xs text-text-secondary">Ответ компании</span>
                  <textarea
                    aria-label="Ответ компании"
                    className="mt-1 min-h-28 w-full admin-panel px-3 py-2 text-sm outline-none focus:border-brand-primary"
                    onChange={(event) => setDraftResponse(event.target.value)}
                    value={draftResponse}
                  />
                  {reviewErrors.response ? (
                    <span className="mt-1 block text-xs text-danger">
                      {reviewErrors.response}
                    </span>
                  ) : null}
                </label>
                <button
                  className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md admin-gradient px-3 text-sm font-medium text-white shadow-lg shadow-brand-primary/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={replyReviewMutation.isPending}
                  onClick={sendReviewResponse}
                  type="button"
                >
                  <Send aria-hidden="true" size={16} />
                  Отправить ответ
                </button>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    className="h-9 rounded-md admin-panel text-xs text-text-secondary transition hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={
                      selectedReview.status === "progress" || updateReviewMutation.isPending
                    }
                    onClick={() => updateReviewStatus(selectedReview, "progress")}
                    type="button"
                  >
                    В работу
                  </button>
                  <button
                    className="h-9 rounded-md admin-panel text-xs text-text-secondary transition hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={
                      selectedReview.status === "resolved" || updateReviewMutation.isPending
                    }
                    onClick={() => updateReviewStatus(selectedReview, "resolved")}
                    type="button"
                  >
                    Закрыть
                  </button>
                </div>
                <p className="mt-3 text-sm text-success">
                  Статус: {reviewStatusLabel[selectedReview.status]}
                </p>
                {selectedReview.response ? (
                  <p className="mt-2 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
                    {selectedReview.response}
                  </p>
                ) : null}
              </aside>
            ) : null}
          </div>
        ) : null}
      </section>
    </main>
  );
}
