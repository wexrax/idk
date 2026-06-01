"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  BadgePercent,
  CalendarClock,
  Copy,
  CreditCard,
  Eye,
  Pencil,
  Plus,
  RefreshCw,
  Snowflake,
  Users,
} from "lucide-react";
import {
  applySubscriptionPromo,
  archiveTariff,
  createTariff,
  duplicateTariff,
  exportBillingReport,
  getBillingReport,
  getPaymentGateways,
  getSubscriptions,
  getTariffs,
  getTransactions,
  testPaymentGateway,
  updateSubscription,
  updateTariff,
  updatePaymentGateway,
} from "@/lib/api/client";
import type {
  BillingReport,
  PaymentGateway,
  PaymentTransactionStatus,
  Subscription,
  SubscriptionMutationRequest,
  SubscriptionPromoRequest,
  Tariff,
  TariffMutationRequest,
} from "@/lib/api/contracts";
import { cn, formatCurrencyRub } from "@/lib/utils";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";

type TariffFilter = "all" | "active" | "archived" | "public" | "internal";
type SubscriptionOperation = "renew" | "cancel" | "freeze" | "change_tariff" | "apply_promo";
type FinanceTab = "transactions" | "reports" | "gateways";
type TransactionStatus = "all" | PaymentTransactionStatus;
type FinancialReport = {
  id: string;
  title: string;
  value: string;
  detail: string;
};
type FinancialEvent = {
  id: string;
  name: string;
  status: string;
  tariff: string;
  tone: "default" | "freeze" | "warning";
  value: string;
};

const periodLabel = {
  month: "Месяц",
  once: "Разово",
  year: "Год",
} as const;

const filterLabel: Record<TariffFilter, string> = {
  active: "Активные",
  all: "Все",
  archived: "Архивные",
  internal: "Внутренние",
  public: "Публичные",
};

const operationLabels: Record<SubscriptionOperation, string> = {
  apply_promo: "Применить промокод",
  cancel: "Отменить",
  change_tariff: "Сменить тариф",
  freeze: "Заморозить",
  renew: "Продлить",
};

const financeTabLabel: Record<FinanceTab, string> = {
  gateways: "Шлюзы",
  reports: "Отчеты",
  transactions: "Транзакции",
};

const transactionStatusLabel: Record<TransactionStatus, string> = {
  all: "Все статусы",
  disputed: "Оспорено",
  failed: "Ошибка",
  refund: "Возврат",
  success: "Успешно",
};

const gatewayStatusLabel: Record<PaymentGateway["status"], string> = {
  active: "Активен",
  disabled: "Отключен",
  test: "Тест",
};

function buildTariffRequest(tariff: Tariff): TariffMutationRequest {
  return {
    billing_period: tariff.period === "year" ? "year" : "month",
    name: tariff.name,
    price: {
      amount: tariff.price,
      currency: tariff.currency,
    },
    service_ids: tariff.services.map((service) => service.id),
    status: tariff.status,
  };
}

function applyFilter(tariff: Tariff, filter: TariffFilter) {
  if (filter === "active") {
    return tariff.status === "active";
  }

  if (filter === "archived") {
    return tariff.status === "archived";
  }

  if (filter === "public") {
    return tariff.is_public;
  }

  if (filter === "internal") {
    return !tariff.is_public;
  }

  return true;
}

function subscriptionEventStatus(subscription: Subscription) {
  if (subscription.status === "frozen") {
    return "Заморожена";
  }

  if (subscription.status === "cancelled") {
    return "Отменена";
  }

  if (subscription.status === "expired") {
    return "Истекла";
  }

  return subscription.expires_at
    ? `Активна до ${new Date(subscription.expires_at).toLocaleDateString("ru-RU")}`
    : "Активна";
}

function buildFinancialReports(report: BillingReport): FinancialReport[] {
  return [
    {
      detail: "Live billing report",
      id: "mrr",
      title: "MRR по периодам",
      value: formatCurrencyRub(report.mrr),
    },
    {
      detail: "MRR x 12",
      id: "arr",
      title: "ARR прогноз",
      value: formatCurrencyRub(report.arr),
    },
    {
      detail: "Отмены, возвраты и неоплаты",
      id: "churn-revenue",
      title: "Выручка от оттока",
      value: formatCurrencyRub(report.churn_revenue),
    },
    {
      detail: "Net revenue retention",
      id: "nrr",
      title: "Чистое удержание выручки",
      value: `${report.nrr.toLocaleString("ru-RU")}%`,
    },
  ];
}

export function SubscriptionsClient() {
  const queryClient = useQueryClient();
  const tariffsQuery = useQuery({
    queryFn: getTariffs,
    queryKey: ["tariffs"],
  });
  const transactionsQuery = useQuery({
    queryFn: getTransactions,
    queryKey: ["transactions"],
  });
  const gatewaysQuery = useQuery({
    queryFn: getPaymentGateways,
    queryKey: ["payment-gateways"],
  });
  const billingReportQuery = useQuery({
    queryFn: getBillingReport,
    queryKey: ["billing-report"],
  });
  const subscriptionsQuery = useQuery({
    queryFn: getSubscriptions,
    queryKey: ["subscriptions"],
  });
  const [localTariffs, setLocalTariffs] = useState<Tariff[] | null>(null);
  const [activeFilter, setActiveFilter] = useState<TariffFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [operation, setOperation] = useState<SubscriptionOperation>("renew");
  const [preview, setPreview] = useState<{
    operation: SubscriptionOperation;
    tariffName: string;
    impact: string;
  } | null>(null);
  const [financeTab, setFinanceTab] = useState<FinanceTab>("transactions");
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>("all");
  const [promoCode, setPromoCode] = useState("WELCOME10");
  const [exportMessage, setExportMessage] = useState("");
  const [gatewayMessage, setGatewayMessage] = useState("");
  const [tariffMessage, setTariffMessage] = useState("");
  const [localGateways, setLocalGateways] = useState<PaymentGateway[] | null>(null);
  const [localSubscriptions, setLocalSubscriptions] = useState<Subscription[] | null>(null);
  const createTariffMutation = useMutation({
    mutationFn: createTariff,
    onError: (error) => {
      setTariffMessage(error instanceof Error ? error.message : "Не удалось создать тариф");
    },
    onSuccess: async ({ data }) => {
      setLocalTariffs((current) => [data, ...(current ?? tariffsQuery.data?.data ?? [])]);
      setSelectedId(data.id);
      setActiveFilter("all");
      setTariffMessage(`Тариф ${data.name} создан`);
      await queryClient.invalidateQueries({ queryKey: ["tariffs"] });
    },
  });
  const updateTariffMutation = useMutation({
    mutationFn: ({ tariff, tariffId }: { tariff: Tariff; tariffId: string }) =>
      updateTariff(tariffId, buildTariffRequest(tariff)),
    onError: (error) => {
      setTariffMessage(error instanceof Error ? error.message : "Не удалось обновить тариф");
    },
    onSuccess: async ({ data }) => {
      setLocalTariffs((current) =>
        (current ?? tariffsQuery.data?.data ?? []).map((tariff) =>
          tariff.id === data.id ? data : tariff,
        ),
      );
      setTariffMessage(`Тариф ${data.name} обновлен`);
      await queryClient.invalidateQueries({ queryKey: ["tariffs"] });
    },
  });
  const archiveTariffMutation = useMutation({
    mutationFn: archiveTariff,
    onError: (error) => {
      setTariffMessage(error instanceof Error ? error.message : "Не удалось архивировать тариф");
    },
    onSuccess: async (_response, tariffId) => {
      setLocalTariffs((current) =>
        (current ?? tariffsQuery.data?.data ?? []).map((tariff) =>
          tariff.id === tariffId ? { ...tariff, is_public: false, status: "archived" } : tariff,
        ),
      );
      setTariffMessage("Тариф архивирован");
      await queryClient.invalidateQueries({ queryKey: ["tariffs"] });
    },
  });
  const duplicateTariffMutation = useMutation({
    mutationFn: duplicateTariff,
    onError: (error) => {
      setTariffMessage(error instanceof Error ? error.message : "Не удалось дублировать тариф");
    },
    onSuccess: async ({ data }) => {
      setLocalTariffs((current) => [data, ...(current ?? tariffsQuery.data?.data ?? [])]);
      setSelectedId(data.id);
      setActiveFilter("all");
      setTariffMessage(`Тариф ${data.name} создан`);
      await queryClient.invalidateQueries({ queryKey: ["tariffs"] });
    },
  });
  const exportReportMutation = useMutation({
    mutationFn: exportBillingReport,
    onError: (error) => {
      setExportMessage(error instanceof Error ? error.message : "Не удалось запустить экспорт");
    },
    onSuccess: ({ data }) => {
      setExportMessage(`Экспорт поставлен в очередь: ${data.job_id || data.status}`);
    },
  });
  const testGatewayMutation = useMutation({
    mutationFn: testPaymentGateway,
    onError: (error) => {
      setGatewayMessage(error instanceof Error ? error.message : "Не удалось проверить шлюз");
    },
    onSuccess: ({ data }) => {
      setGatewayMessage(
        data.ok
          ? `Тест шлюза ${data.gateway_id} выполнен`
          : `Шлюз ${data.gateway_id} вернул ошибку`,
      );
    },
  });
  const updateGatewayMutation = useMutation({
    mutationFn: ({ enabled, gatewayId }: { enabled: boolean; gatewayId: string }) =>
      updatePaymentGateway(gatewayId, { enabled }),
    onError: (error) => {
      setGatewayMessage(error instanceof Error ? error.message : "Не удалось обновить шлюз");
    },
    onSuccess: async ({ data }) => {
      setLocalGateways((current) => {
        const source = current ?? gatewaysQuery.data?.data ?? [];
        return source.map((gateway) => (gateway.id === data.id ? data : gateway));
      });
      setGatewayMessage(`Шлюз ${data.name} обновлен`);
      await queryClient.invalidateQueries({ queryKey: ["payment-gateways"] });
    },
  });

  const remoteTariffs = tariffsQuery.data?.data;
  const transactions = useMemo(
    () => transactionsQuery.data?.data ?? [],
    [transactionsQuery.data?.data],
  );
  const gateways = useMemo(
    () => localGateways ?? gatewaysQuery.data?.data ?? [],
    [gatewaysQuery.data?.data, localGateways],
  );
  const subscriptions = useMemo(
    () => localSubscriptions ?? subscriptionsQuery.data?.data ?? [],
    [localSubscriptions, subscriptionsQuery.data?.data],
  );
  const financialReports = billingReportQuery.data?.data
    ? buildFinancialReports(billingReportQuery.data.data)
    : [];
  const tariffs = useMemo(
    () => localTariffs ?? remoteTariffs ?? [],
    [localTariffs, remoteTariffs],
  );

  const selectedTariff = useMemo(
    () => tariffs.find((tariff) => tariff.id === selectedId) ?? tariffs[0],
    [selectedId, tariffs],
  );
  const selectedSubscription = useMemo(
    () =>
      subscriptions.find(
        (subscription) =>
          subscription.tariff_id === selectedTariff?.id ||
          subscription.tariff === selectedTariff?.name,
      ) ?? subscriptions[0],
    [selectedTariff?.id, selectedTariff?.name, subscriptions],
  );
  const updateSubscriptionMutation = useMutation({
    mutationFn: ({
      request,
      subscriptionId,
    }: {
      request: SubscriptionMutationRequest;
      subscriptionId: string;
    }) => updateSubscription(subscriptionId, request),
    onError: (error) => {
      setPreview({
        impact: error instanceof Error ? error.message : "Subscription operation failed",
        operation,
        tariffName: selectedTariff?.name ?? "Subscription",
      });
    },
    onSuccess: async ({ data }, { request }) => {
      setLocalSubscriptions((current) =>
        (current ?? subscriptionsQuery.data?.data ?? []).map((subscription) =>
          subscription.id === data.id ? data : subscription,
        ),
      );
      setPreview({
        impact: `Backend PATCH /subscriptions/${data.id} completed with action ${request.action}.`,
        operation: request.action,
        tariffName: data.tariff || selectedTariff?.name || data.id,
      });
      await queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    },
  });
  const applyPromoMutation = useMutation({
    mutationFn: ({
      request,
      subscriptionId,
    }: {
      request: SubscriptionPromoRequest;
      subscriptionId: string;
    }) => applySubscriptionPromo(subscriptionId, request),
    onError: (error) => {
      setPreview({
        impact: error instanceof Error ? error.message : "Promo operation failed",
        operation: "apply_promo",
        tariffName: selectedTariff?.name ?? "Subscription",
      });
    },
    onSuccess: async ({ data }, { request }) => {
      setLocalSubscriptions((current) =>
        (current ?? subscriptionsQuery.data?.data ?? []).map((subscription) =>
          subscription.id === data.id ? data : subscription,
        ),
      );
      setPreview({
        impact: `Backend POST /subscriptions/${data.id}/apply-promo completed for code ${request.code}.`,
        operation: "apply_promo",
        tariffName: data.tariff || selectedTariff?.name || data.id,
      });
      await queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    },
  });
  const visibleTariffs = useMemo(
    () => tariffs.filter((tariff) => applyFilter(tariff, activeFilter)),
    [activeFilter, tariffs],
  );
  const visibleTransactions = useMemo(
    () =>
      transactions.filter(
        (transaction) =>
          transactionStatus === "all" || transaction.status === transactionStatus,
      ),
    [transactionStatus, transactions],
  );
  const subscriptionEvents = useMemo<FinancialEvent[]>(
    () =>
      subscriptions.slice(0, 6).map((subscription) => ({
        id: subscription.id,
        name: subscription.service.name || subscription.id,
        status: subscriptionEventStatus(subscription),
        tariff: subscription.tariff,
        tone: subscription.status === "frozen" ? "freeze" : "default",
        value: formatCurrencyRub(subscription.price),
      }) satisfies FinancialEvent),
    [subscriptions],
  );
  const financialEvents = subscriptionEvents.length > 0
    ? subscriptionEvents
    : [];
  const hasSecondaryApiError =
    subscriptionsQuery.isError ||
    transactionsQuery.isError ||
    gatewaysQuery.isError ||
    billingReportQuery.isError;

  const activeTariffs = tariffs.filter((tariff) => tariff.status === "active");
  const publicTariffs = tariffs.filter((tariff) => tariff.is_public);
  const totalSubscribers = tariffs.reduce((sum, tariff) => sum + tariff.subscribers, 0);
  const monthlyMrr = tariffs.reduce((sum, tariff) => {
    if (tariff.status !== "active") {
      return sum;
    }

    const monthlyPrice = tariff.period === "year" ? tariff.price / 12 : tariff.price;
    return sum + monthlyPrice * tariff.subscribers;
  }, 0);

  function updateSelectedTariff(update: Partial<Tariff>) {
    if (!selectedTariff) {
      return;
    }

    const updatedTariff = { ...selectedTariff, ...update };
    setLocalTariffs((current) =>
      (current ?? tariffs).map((tariff) =>
        tariff.id === selectedTariff.id ? updatedTariff : tariff,
      ),
    );

    if (
      update.name !== undefined ||
      update.period !== undefined ||
      update.price !== undefined ||
      update.status !== undefined ||
      update.services !== undefined
    ) {
      setTariffMessage("");
      updateTariffMutation.mutate({ tariff: updatedTariff, tariffId: selectedTariff.id });
    }
  }

  function duplicateSelectedTariff() {
    if (!selectedTariff) {
      return;
    }

    setTariffMessage("");
    duplicateTariffMutation.mutate(selectedTariff.id);
  }

  function archiveSelectedTariff() {
    if (!selectedTariff) {
      return;
    }

    setTariffMessage("");
    archiveTariffMutation.mutate(selectedTariff.id);
  }

  function createNewTariff() {
    const baseTariff = tariffs[0];

    if (!baseTariff) {
      return;
    }

    setTariffMessage("");
    createTariffMutation.mutate(
      buildTariffRequest({
        ...baseTariff,
        name: "Новый тариф",
        subscribers: 0,
        status: "active",
      }),
    );
  }

  function buildOperationPreview() {
    if (!selectedTariff || !selectedSubscription) {
      return;
    }

    if (operation === "apply_promo") {
      applyPromoMutation.mutate({
        request: {
          code: promoCode,
        },
        subscriptionId: selectedSubscription.id,
      });
      return;
    }

    const request: SubscriptionMutationRequest = {
      action: operation,
    };

    if (operation === "cancel") {
      request.cancel_reason = "Admin console operation";
    }

    if (operation === "freeze") {
      request.frozen_until = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    }

    if (operation === "change_tariff") {
      request.tariff_id = selectedTariff.id;
    }

    const impact =
      operation === "freeze"
        ? "Подписка будет остановлена на 14 дней без смены тарифа."
        : operation === "change_tariff"
          ? "Пересчет стоимости выполнится при подтверждении backend action."
          : operation === "cancel"
            ? "Отмена будет применена в конце оплаченного периода."
            : "Продление создаст ручную попытку списания.";

    setPreview({
      impact,
      operation,
      tariffName: selectedTariff.name,
    });
    updateSubscriptionMutation.mutate({
      request,
      subscriptionId: selectedSubscription.id,
    });
  }

  function exportReport(format: "CSV" | "PDF" | "Excel") {
    if (format !== "CSV") {
      setExportMessage("Backend сейчас поддерживает CSV export");
      return;
    }

    setExportMessage("");
    exportReportMutation.mutate();
  }

  function testGateway(gateway: PaymentGateway) {
    setGatewayMessage("");
    testGatewayMutation.mutate(gateway.id);
  }

  function toggleGateway(gateway: PaymentGateway) {
    setGatewayMessage("");
    updateGatewayMutation.mutate({
      enabled: gateway.status === "disabled",
      gatewayId: gateway.id,
    });
  }

  if (tariffsQuery.isPending) {
    return <LoadingState />;
  }

  if (tariffsQuery.isError) {
    return <ErrorState onRetry={() => void tariffsQuery.refetch()} />;
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-4">
        <article className="admin-panel p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">Активные тарифы</p>
            <CreditCard aria-hidden="true" className="text-brand-primary" size={18} />
          </div>
          <p className="mt-3 text-[22px] font-bold tracking-normal text-white">{activeTariffs.length}</p>
          <p className="mt-2 text-sm text-text-secondary">{publicTariffs.length} публичных</p>
        </article>
        <article className="admin-panel p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">Подписчики</p>
            <Users aria-hidden="true" className="text-info" size={18} />
          </div>
          <p className="mt-3 text-[22px] font-bold tracking-normal text-white">{totalSubscribers.toLocaleString("ru-RU")}</p>
          <p className="mt-2 text-sm text-text-secondary">По всем тарифам</p>
        </article>
        <article className="admin-panel p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">Расчетный MRR</p>
            <RefreshCw aria-hidden="true" className="text-success" size={18} />
          </div>
          <p className="mt-3 text-[22px] font-bold tracking-normal text-white">{formatCurrencyRub(monthlyMrr)}</p>
          <p className="mt-2 text-sm text-text-secondary">С учетом годовых тарифов</p>
        </article>
        <article className="rounded-md border border-warning/40 bg-warning/10 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-warning">Истекают скоро</p>
            <CalendarClock aria-hidden="true" className="text-warning" size={18} />
          </div>
          <p className="mt-3 text-[22px] font-bold tracking-normal text-white">3</p>
          <p className="mt-2 text-sm text-text-secondary">Нужна ручная проверка</p>
        </article>
      </section>

      {hasSecondaryApiError ? (
        <ErrorState
          className="min-h-0"
          message="Часть live API для подписок вернула ошибку. Если в консоли 401 Unauthorized, войдите заново админом с правами subscriptions:read и billing:read."
          onRetry={() => {
            void subscriptionsQuery.refetch();
            void transactionsQuery.refetch();
            void gatewaysQuery.refetch();
            void billingReportQuery.refetch();
          }}
          title="Не удалось загрузить часть данных подписок"
        />
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="admin-panel">
          <div className="flex flex-col gap-4 border-b border-white/10 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-semibold">Тарифы и подписки</h2>
              <p className="mt-1 text-sm text-text-secondary">
                CRUD-представление тарифов до подключения FastAPI.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex flex-wrap gap-2">
                {(Object.keys(filterLabel) as TariffFilter[]).map((filter) => (
                  <button
                    className={cn(
                      "h-9 rounded-md border px-3 text-sm transition",
                      activeFilter === filter
                        ? "border-brand-primary bg-brand-primary/10 text-text-primary"
                        : "border-white/10 bg-bg-elevated text-text-secondary hover:text-white",
                    )}
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    type="button"
                  >
                    {filterLabel[filter]}
                  </button>
                ))}
              </div>
              <button
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md admin-gradient px-3 text-sm font-medium text-white shadow-lg shadow-brand-primary/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={createTariffMutation.isPending}
                onClick={createNewTariff}
                type="button"
              >
                <Plus aria-hidden="true" size={16} />
                Новый тариф
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-left text-sm">
              <thead className="bg-bg-elevated text-xs uppercase tracking-[0.05em] text-text-disabled">
                <tr>
                  <th className="p-3" scope="col">Тариф</th>
                  <th className="p-3" scope="col">Цена</th>
                  <th className="p-3" scope="col">Период</th>
                  <th className="p-3" scope="col">Сервисы</th>
                  <th className="p-3" scope="col">Подписчики</th>
                  <th className="p-3" scope="col">Видимость</th>
                  <th className="p-3" scope="col">Статус</th>
                </tr>
              </thead>
              <tbody>
                {visibleTariffs.map((tariff) => (
                  <tr
                    className={cn(
                      "cursor-pointer border-t border-white/[0.06] transition hover:bg-bg-elevated/70",
                      selectedTariff?.id === tariff.id ? "bg-bg-elevated" : "",
                    )}
                    key={tariff.id}
                    onClick={() => setSelectedId(tariff.id)}
                  >
                    <td className="p-3 font-medium">{tariff.name}</td>
                    <td className="p-3">{formatCurrencyRub(tariff.price)}</td>
                    <td className="p-3">{periodLabel[tariff.period]}</td>
                    <td className="max-w-[280px] truncate p-3 text-text-secondary">
                      {tariff.services.map((service) => service.name).join(", ")}
                    </td>
                    <td className="p-3">{tariff.subscribers.toLocaleString("ru-RU")}</td>
                    <td className="p-3">{tariff.is_public ? "Публичный" : "Внутренний"}</td>
                    <td className="p-3">
                      <span
                        className={cn(
                          "rounded-md px-2 py-1 text-xs",
                          tariff.status === "active"
                            ? "bg-success/10 text-success"
                            : "bg-muted/20 text-text-secondary",
                        )}
                      >
                        {tariff.status === "active" ? "Активен" : "Архив"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {selectedTariff ? (
          <aside className="space-y-6">
            <section className="admin-panel p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase text-text-secondary">Выбранный тариф</p>
                  <h2 className="mt-2 text-xl font-semibold">{selectedTariff.name}</h2>
                  <p className="mt-1 text-sm text-text-secondary">
                    {selectedTariff.subscribers.toLocaleString("ru-RU")} подписчиков
                  </p>
                </div>
                <span className="rounded-md bg-brand-primary/10 px-2 py-1 text-xs text-brand-primary">
                  {selectedTariff.currency}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs text-text-secondary">Цена</span>
                  <input
                    className="mt-1 h-10 w-full admin-panel-elevated px-3 text-sm outline-none focus:border-brand-primary"
                    min={0}
                    onChange={(event) =>
                      updateSelectedTariff({ price: Number(event.target.value) })
                    }
                    type="number"
                    value={selectedTariff.price}
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-text-secondary">Trial, дней</span>
                  <input
                    className="mt-1 h-10 w-full admin-panel-elevated px-3 text-sm outline-none focus:border-brand-primary"
                    min={0}
                    onChange={(event) =>
                      updateSelectedTariff({ trial_days: Number(event.target.value) })
                    }
                    type="number"
                    value={selectedTariff.trial_days}
                  />
                </label>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  className="inline-flex h-10 items-center justify-center gap-2 admin-panel-elevated text-sm transition hover:text-white"
                  onClick={() => updateSelectedTariff({ is_public: !selectedTariff.is_public })}
                  type="button"
                >
                  <Eye aria-hidden="true" size={16} />
                  {selectedTariff.is_public ? "Скрыть" : "Опубликовать"}
                </button>
                <button
                  className="inline-flex h-10 items-center justify-center gap-2 admin-panel-elevated text-sm transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={updateTariffMutation.isPending}
                  onClick={() =>
                    updateSelectedTariff({
                      status: selectedTariff.status === "active" ? "archived" : "active",
                    })
                  }
                  type="button"
                >
                  <Pencil aria-hidden="true" size={16} />
                  Сменить статус
                </button>
                <button
                  className="inline-flex h-10 items-center justify-center gap-2 admin-panel-elevated text-sm transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={duplicateTariffMutation.isPending}
                  onClick={duplicateSelectedTariff}
                  type="button"
                >
                  <Copy aria-hidden="true" size={16} />
                  Дублировать
                </button>
                <button
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-danger/40 bg-danger/10 text-sm text-danger transition hover:bg-danger/20 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={archiveTariffMutation.isPending}
                  onClick={archiveSelectedTariff}
                  type="button"
                >
                  <Archive aria-hidden="true" size={16} />
                  Архивировать
                </button>
              </div>
              {tariffMessage ? (
                <p className="mt-3 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
                  {tariffMessage}
                </p>
              ) : null}
            </section>

            <section className="admin-panel p-4">
              <h2 className="text-base font-semibold">Операции подписки</h2>
              <p className="mt-1 text-sm text-text-secondary">
                Выполняет `PATCH /api/v1/subscriptions/:id` и `POST /api/v1/subscriptions/:id/apply-promo`.
              </p>
              <label className="mt-4 block">
                <span className="text-xs text-text-secondary">Операция</span>
                <select
                  aria-label="Операция"
                  className="mt-1 h-10 w-full admin-panel-elevated px-3 text-sm outline-none focus:border-brand-primary"
                  onChange={(event) => setOperation(event.target.value as SubscriptionOperation)}
                  value={operation}
                >
                  {Object.entries(operationLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              {operation === "apply_promo" ? (
                <label className="mt-4 block">
                  <span className="text-xs text-text-secondary">Промокод</span>
                  <input
                    aria-label="Промокод"
                    className="mt-1 h-10 w-full admin-panel-elevated px-3 text-sm uppercase outline-none focus:border-brand-primary"
                    onChange={(event) => setPromoCode(event.target.value)}
                    placeholder="WELCOME10"
                    value={promoCode}
                  />
                </label>
              ) : null}
              <button
                className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md admin-gradient px-3 text-sm font-medium text-white shadow-lg shadow-brand-primary/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={
                  updateSubscriptionMutation.isPending ||
                  applyPromoMutation.isPending ||
                  !selectedSubscription ||
                  (operation === "apply_promo" && promoCode.trim().length === 0)
                }
                onClick={buildOperationPreview}
                type="button"
              >
                <BadgePercent aria-hidden="true" size={16} />
                Выполнить операцию
              </button>
              {preview ? (
                <div
                  className="mt-4 rounded-md border border-brand-primary/30 bg-brand-primary/10 p-3 text-sm"
                  data-testid="subscription-operation-preview"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-text-primary">{preview.tariffName}</span>
                    <code className="rounded bg-bg-base px-2 py-1 text-xs text-brand-primary">
                      {preview.operation}
                    </code>
                  </div>
                  <p className="mt-2 leading-6 text-text-secondary">{preview.impact}</p>
                </div>
              ) : null}
            </section>
          </aside>
        ) : null}
      </section>

      <section className="admin-panel">
        <div className="flex flex-col gap-4 border-b border-white/10 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-semibold">Транзакции и финансы</h2>
            <p className="mt-1 text-sm text-text-secondary">
              Платежи, отчеты и шлюзы в одном contract-first контуре.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(financeTabLabel) as FinanceTab[]).map((tab) => (
              <button
                className={cn(
                  "h-9 rounded-md border px-3 text-sm transition",
                  financeTab === tab
                    ? "border-brand-primary bg-brand-primary/10 text-text-primary"
                    : "border-white/10 bg-bg-elevated text-text-secondary hover:text-white",
                )}
                key={tab}
                onClick={() => setFinanceTab(tab)}
                type="button"
              >
                {financeTabLabel[tab]}
              </button>
            ))}
          </div>
        </div>

        {financeTab === "transactions" ? (
          <div className="p-4">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="block sm:w-64">
                <span className="text-xs text-text-secondary">Статус транзакции</span>
                <select
                  aria-label="Статус транзакции"
                  className="mt-1 h-10 w-full admin-panel-elevated px-3 text-sm outline-none focus:border-brand-primary"
                  onChange={(event) =>
                    setTransactionStatus(event.target.value as TransactionStatus)
                  }
                  value={transactionStatus}
                >
                  {Object.entries(transactionStatusLabel).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <p className="text-sm text-text-secondary">
                {visibleTransactions.length} операций в текущем фильтре
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead className="bg-bg-elevated text-xs uppercase tracking-[0.05em] text-text-disabled">
                  <tr>
                    <th className="p-3" scope="col">ID транзакции</th>
                    <th className="p-3" scope="col">Пользователь</th>
                    <th className="p-3" scope="col">Сумма</th>
                    <th className="p-3" scope="col">Статус</th>
                    <th className="p-3" scope="col">Шлюз</th>
                    <th className="p-3" scope="col">Дата</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleTransactions.map((transaction) => (
                    <tr className="border-t border-white/[0.06]" key={transaction.id}>
                      <td className="p-3 font-medium text-brand-primary">{transaction.id}</td>
                      <td className="p-3">{transaction.user}</td>
                      <td className="p-3">{formatCurrencyRub(transaction.amount)}</td>
                      <td className="p-3">
                        <span
                          className={cn(
                            "rounded-md px-2 py-1 text-xs",
                            transaction.status === "success"
                              ? "bg-success/10 text-success"
                              : transaction.status === "failed"
                                ? "bg-danger/10 text-danger"
                                : transaction.status === "refund"
                                  ? "bg-warning/10 text-warning"
                                  : "bg-info/10 text-info",
                          )}
                        >
                          {transactionStatusLabel[transaction.status]}
                        </span>
                      </td>
                      <td className="p-3 text-text-secondary">{transaction.gateway}</td>
                      <td className="p-3 text-text-secondary">{transaction.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {financeTab === "reports" ? (
          <div className="p-4">
            <div className="grid gap-3 md:grid-cols-4">
              {financialReports.map((report) => (
                <article className="admin-panel-elevated p-4" key={report.id}>
                  <p className="text-sm text-text-secondary">{report.title}</p>
                  <p className="mt-2 text-xl font-semibold text-text-primary">{report.value}</p>
                  <p className="mt-2 text-xs text-text-secondary">{report.detail}</p>
                </article>
              ))}
              {financialReports.length === 0 ? (
                <p className="rounded-md border border-white/10 bg-bg-elevated p-4 text-sm text-text-secondary md:col-span-4">
                  Отчет по биллингу загружается.
                </p>
              ) : null}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {(["CSV", "PDF", "Excel"] as const).map((format) => (
                  <button
                    className="inline-flex h-9 items-center justify-center admin-panel-elevated px-3 text-sm text-text-secondary transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={exportReportMutation.isPending}
                    key={format}
                    onClick={() => exportReport(format)}
                    type="button"
                >
                  Экспорт {format}
                </button>
              ))}
            </div>
            {exportMessage ? (
              <p className="mt-3 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
                {exportMessage}
              </p>
            ) : null}
          </div>
        ) : null}

        {financeTab === "gateways" ? (
          <div className="p-4">
            <div className="grid gap-3 lg:grid-cols-3">
              {gateways.map((gateway) => (
                <article className="admin-panel-elevated p-4" key={gateway.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-medium text-text-primary">{gateway.name}</h3>
                      <p className="mt-1 text-sm text-text-secondary">
                        Priority {gateway.priority} · {gateway.methods}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "rounded-md px-2 py-1 text-xs",
                        gateway.status === "active"
                          ? "bg-success/10 text-success"
                          : gateway.status === "test"
                            ? "bg-warning/10 text-warning"
                            : "bg-muted/20 text-text-secondary",
                      )}
                    >
                      {gatewayStatusLabel[gateway.status]}
                    </span>
                  </div>
                  <p className="mt-4 text-sm text-text-secondary">Decline rate</p>
                  <p className="mt-1 text-[22px] font-bold tracking-normal text-white">
                    {gateway.declineRate.toLocaleString("ru-RU")}%
                  </p>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <button
                      className="h-9 admin-panel px-2 text-xs text-text-secondary transition hover:text-white"
                      type="button"
                    >
                      Настроить
                    </button>
                    <button
                      className="h-9 admin-panel px-2 text-xs text-text-secondary transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={testGatewayMutation.isPending}
                      onClick={() => testGateway(gateway)}
                      type="button"
                    >
                      Тест {gateway.name}
                    </button>
                    <button
                      className="h-9 rounded-md border border-danger/30 bg-danger/10 px-2 text-xs text-danger transition hover:bg-danger/20 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={updateGatewayMutation.isPending}
                      onClick={() => toggleGateway(gateway)}
                      type="button"
                    >
                      {gateway.status === "disabled" ? "Включить" : "Отключить"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
            {gatewayMessage ? (
              <p className="mt-3 rounded-md border border-info/30 bg-info/10 px-3 py-2 text-sm text-info">
                {gatewayMessage}
              </p>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="admin-panel p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold">Финансовые события</h2>
            <p className="mt-1 text-sm text-text-secondary">
              Подписки с риском отмены, заморозки или платежного отказа.
            </p>
          </div>
          <button className="inline-flex h-9 items-center gap-2 admin-panel-elevated px-3 text-sm text-text-secondary">
            <Plus aria-hidden="true" size={16} />
            Экспорт CSV
          </button>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {financialEvents.map((renewal) => (
            <article
              className={cn(
                "rounded-md border p-4",
                renewal.tone === "warning"
                  ? "border-warning/40 bg-warning/10"
                  : "border-white/10 bg-bg-elevated",
              )}
              key={renewal.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-text-primary">{renewal.name}</p>
                  <p className="mt-1 text-sm text-text-secondary">{renewal.tariff}</p>
                </div>
                {renewal.tone === "freeze" ? (
                  <Snowflake aria-hidden="true" className="text-info" size={18} />
                ) : (
                  <CalendarClock aria-hidden="true" className="text-warning" size={18} />
                )}
              </div>
              <p className="mt-4 text-sm text-text-secondary">{renewal.status}</p>
              <p className="mt-2 text-lg font-semibold text-text-primary">{renewal.value}</p>
            </article>
          ))}
          {financialEvents.length === 0 ? (
            <p className="rounded-md border border-white/10 bg-bg-elevated p-4 text-sm text-text-secondary lg:col-span-3">
              Активных финансовых событий по подпискам нет.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
