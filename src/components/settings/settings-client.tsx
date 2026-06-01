"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  CloudCog,
  DatabaseZap,
  PlugZap,
  Save,
  SlidersHorizontal,
} from "lucide-react";
import { z } from "zod";
import { getSettingsWorkspace, updateSettings } from "@/lib/api/client";
import type {
  AlertRuleStatus,
  ConfigDraftStatus,
  IntegrationStatus,
  SettingsAlertRule,
  SettingsConfigDraft,
  SettingsIntegration,
} from "@/lib/api/contracts";
import { cn } from "@/lib/utils";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";

type SettingsTab = "general" | "integrations" | "alerts";
type GeneralErrors = Partial<Record<"supportSla", string>>;
type AlertErrors = Partial<Record<"churnThreshold", string>>;

const emptyDrafts: SettingsConfigDraft[] = [];
const emptyIntegrations: SettingsIntegration[] = [];
const emptyAlerts: SettingsAlertRule[] = [];

const environmentLabel: Record<string, string> = {
  Production: "Продакшен",
  Sandbox: "Песочница",
  Staging: "Стейджинг",
};

const tabLabel: Record<SettingsTab, string> = {
  alerts: "Оповещения",
  general: "Основное",
  integrations: "Интеграции",
};

const draftStatusClass: Record<ConfigDraftStatus, string> = {
  draft: "bg-muted/20 text-text-secondary",
  published: "bg-success/10 text-success",
  review: "bg-info/10 text-info",
};

const draftStatusLabel: Record<ConfigDraftStatus, string> = {
  draft: "Черновик",
  published: "Опубликовано",
  review: "На проверке",
};

const integrationStatusClass: Record<IntegrationStatus, string> = {
  disabled: "bg-muted/20 text-text-secondary",
  healthy: "bg-success/10 text-success",
  review: "bg-warning/10 text-warning",
};

const integrationStatusLabel: Record<IntegrationStatus, string> = {
  disabled: "Отключено",
  healthy: "Работает",
  review: "На проверке",
};

const alertStatusClass: Record<AlertRuleStatus, string> = {
  active: "bg-success/10 text-success",
  muted: "bg-muted/20 text-text-secondary",
  review: "bg-warning/10 text-warning",
};

const alertStatusLabel: Record<AlertRuleStatus, string> = {
  active: "Активно",
  muted: "Заглушено",
  review: "На проверке",
};

const generalSettingsSchema = z.object({
  supportSla: z
    .number()
    .int("SLA поддержки должен быть целым числом")
    .min(1, "SLA поддержки должен быть не меньше 1 часа")
    .max(72, "SLA поддержки не может превышать 72 часа"),
});

const alertThresholdSchema = z.object({
  churnThreshold: z
    .number()
    .min(0.1, "Порог оттока должен быть больше 0")
    .max(100, "Порог оттока не может превышать 100%"),
});

export function SettingsClient() {
  const workspaceQuery = useQuery({
    queryFn: getSettingsWorkspace,
    queryKey: ["settings-workspace"],
  });
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [localDrafts, setLocalDrafts] = useState<SettingsConfigDraft[] | null>(null);
  const [localAlerts, setLocalAlerts] = useState<SettingsAlertRule[] | null>(null);
  const [environment, setEnvironment] = useState("Staging");
  const [currency, setCurrency] = useState("RUB");
  const [timezone, setTimezone] = useState("Europe/Moscow");
  const [supportSla, setSupportSla] = useState(8);
  const [settingsMessage, setSettingsMessage] = useState("");
  const [generalErrors, setGeneralErrors] = useState<GeneralErrors>({});
  const [selectedIntegrationId, setSelectedIntegrationId] = useState<string | null>(null);
  const [integrationMessage, setIntegrationMessage] = useState("");
  const [churnThreshold, setChurnThreshold] = useState("5.5");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertErrors, setAlertErrors] = useState<AlertErrors>({});

  const workspace = workspaceQuery.data?.data;
  const workspaceDrafts = workspace?.config_drafts ?? emptyDrafts;
  const drafts = useMemo(
    () => localDrafts ?? workspaceDrafts,
    [localDrafts, workspaceDrafts],
  );
  const integrations = workspace?.integrations ?? emptyIntegrations;
  const workspaceAlerts = workspace?.alert_rules ?? emptyAlerts;
  const alerts = useMemo(
    () => localAlerts ?? workspaceAlerts,
    [localAlerts, workspaceAlerts],
  );
  const updateSettingsMutation = useMutation({
    mutationFn: updateSettings,
    onError: (error, request) => {
      const message = error instanceof Error ? error.message : "Не удалось обновить настройки";
      if (typeof request.report_currency === "string") {
        setSettingsMessage(message);
      } else {
        setAlertMessage(message);
      }
    },
    onSuccess: ({ data }, request) => {
      if (typeof request.report_currency === "string") {
        setLocalDrafts(data.config_drafts);
        setGeneralErrors({});
        setSettingsMessage(
          `Настройки ${environmentLabel[request.config_environment ?? ""] ?? request.config_environment} - ${request.report_currency} опубликованы`,
        );
        return;
      }

      if (typeof request.alert_churn_rate_threshold !== "number") {
        return;
      }

      const formattedThreshold = `${request.alert_churn_rate_threshold}%`;
      setLocalAlerts((current) =>
        (current ?? workspaceAlerts).length > 0
          ? (current ?? workspaceAlerts).map((alert) =>
              alert.id === "alert-churn-rate-threshold" ||
              alert.id === "alert-churn" ||
              alert.name.includes("оттока") ||
              alert.name.toLowerCase().includes("churn")
                ? { ...alert, status: "active", threshold: formattedThreshold }
                : alert,
            )
          : data.alert_rules,
      );
      setAlertErrors({});
      setAlertMessage(`Порог аномалии оттока обновлён до ${formattedThreshold}`);
    },
  });
  const selectedIntegration = useMemo(
    () =>
      integrations.find((integration) => integration.id === selectedIntegrationId) ??
      integrations[0],
    [integrations, selectedIntegrationId],
  );
  const activeAlerts = alerts.filter((alert) => alert.status === "active").length;
  const draftCount = drafts.filter((draft) => draft.status === "draft").length;

  function saveSettingsDraft() {
    const parsed = generalSettingsSchema.safeParse({ supportSla });

    if (!parsed.success) {
      const nextErrors: GeneralErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof GeneralErrors;
        nextErrors[field] = issue.message;
      }
      setGeneralErrors(nextErrors);
      setSettingsMessage("");
      return;
    }

    setSettingsMessage("");
    updateSettingsMutation.mutate({
      config_environment: environment,
      report_currency: currency,
      report_timezone: timezone,
      support_sla_hours: parsed.data.supportSla,
    });
  }

  function checkIntegration(integrationId: string) {
    const integration = integrations.find((item) => item.id === integrationId);

    if (!integration) {
      return;
    }

    setSelectedIntegrationId(integration.id);
    setIntegrationMessage(`${integration.name} проверена: задержка webhook ${integration.latency}`);
  }

  function updateChurnThreshold() {
    const parsed = alertThresholdSchema.safeParse({
      churnThreshold: Number(churnThreshold),
    });

    if (!parsed.success) {
      const nextErrors: AlertErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof AlertErrors;
        nextErrors[field] = issue.message;
      }
      setAlertErrors(nextErrors);
      setAlertMessage("");
      return;
    }

    setAlertErrors({});
    setAlertMessage("");
    updateSettingsMutation.mutate({
      alert_churn_rate_threshold: parsed.data.churnThreshold,
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

  if (!workspace || (drafts.length === 0 && integrations.length === 0 && alerts.length === 0)) {
    return (
      <main className="px-4 py-6 lg:px-6">
        <section className="admin-panel p-6">
          <h1 className="text-[22px] font-bold tracking-normal text-white">Настройки</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Черновики конфигурации, интеграции и правила оповещений пока недоступны.
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
            Конфигурация системы
          </p>
          <h1 className="mt-2 text-[22px] font-bold tracking-normal text-white">Настройки</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-text-secondary">
            Системные параметры, интеграции и правила оповещений для операционной консоли SubHub.
          </p>
        </div>
        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md admin-gradient px-4 text-sm font-medium text-white shadow-lg shadow-brand-primary/20 transition hover:-translate-y-0.5"
          onClick={saveSettingsDraft}
          type="button"
        >
          <Save aria-hidden="true" size={16} />
          Новая настройка
        </button>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <article className="admin-panel p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">Интеграции</p>
            <PlugZap aria-hidden="true" className="text-brand-primary" size={18} />
          </div>
          <p className="mt-3 text-[22px] font-bold tracking-normal text-white">{integrations.length}</p>
          <p className="mt-2 text-sm text-text-secondary">Платежи, отзывы и оповещения</p>
        </article>
        <article className="admin-panel p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">Оповещения</p>
            <AlertTriangle aria-hidden="true" className="text-warning" size={18} />
          </div>
          <p className="mt-3 text-[22px] font-bold tracking-normal text-white">{activeAlerts}</p>
          <p className="mt-2 text-sm text-text-secondary">Активные пороги</p>
        </article>
        <article className="admin-panel p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">Черновики</p>
            <CloudCog aria-hidden="true" className="text-info" size={18} />
          </div>
          <p className="mt-3 text-[22px] font-bold tracking-normal text-white">{draftCount}</p>
          <p className="mt-2 text-sm text-text-secondary">Ожидают публикации</p>
        </article>
        <article className="rounded-md border border-success/30 bg-success/10 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-success">Публикация</p>
            <Clock3 aria-hidden="true" className="text-success" size={18} />
          </div>
          <p className="mt-3 text-[22px] font-bold tracking-normal text-white">
            {workspace.last_published_at}
          </p>
          <p className="mt-2 text-sm text-text-secondary">Последняя публикация конфигурации</p>
        </article>
      </section>

      <section className="mt-6 admin-panel">
        <div className="flex flex-wrap gap-2 border-b border-white/10 p-4">
          {(Object.keys(tabLabel) as SettingsTab[]).map((tab) => (
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

        {activeTab === "general" ? (
          <div className="grid gap-6 p-4 xl:grid-cols-[24rem_minmax(0,1fr)]">
            <section className="admin-panel-elevated p-4">
              <h2 className="text-base font-semibold">Системные настройки</h2>
              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className="text-xs text-text-secondary">Среда</span>
                  <select
                    aria-label="Среда"
                    className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                    onChange={(event) => setEnvironment(event.target.value)}
                    value={environment}
                  >
                    <option value="Staging">Стейджинг</option>
                    <option value="Production">Продакшен</option>
                    <option value="Sandbox">Песочница</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs text-text-secondary">Валюта отчётов</span>
                  <select
                    aria-label="Валюта отчётов"
                    className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                    onChange={(event) => setCurrency(event.target.value)}
                    value={currency}
                  >
                    <option>RUB</option>
                    <option>USD</option>
                    <option>EUR</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs text-text-secondary">Часовой пояс отчётов</span>
                  <select
                    aria-label="Часовой пояс отчётов"
                    className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                    onChange={(event) => setTimezone(event.target.value)}
                    value={timezone}
                  >
                    <option>Europe/Moscow</option>
                    <option>UTC</option>
                    <option>Europe/Berlin</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs text-text-secondary">SLA поддержки, часы</span>
                  <input
                    aria-label="SLA поддержки, часы"
                    className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                    min={1}
                    onChange={(event) => setSupportSla(Number(event.target.value))}
                    type="number"
                    value={supportSla}
                  />
                  {generalErrors.supportSla ? (
                    <span className="mt-1 block text-xs text-danger">
                      {generalErrors.supportSla}
                    </span>
                  ) : null}
                </label>
              </div>
              <button
                className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md admin-gradient px-3 text-sm font-medium text-white shadow-lg shadow-brand-primary/20 transition hover:-translate-y-0.5"
                onClick={saveSettingsDraft}
                type="button"
              >
                <Save aria-hidden="true" size={16} />
                Сохранить настройки
              </button>
              {settingsMessage ? (
                <p className="mt-3 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
                  {settingsMessage}
                </p>
              ) : null}
            </section>

            <div className="overflow-x-auto rounded-lg border border-white/[0.06]">
              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                <thead className="bg-bg-elevated text-xs uppercase tracking-[0.05em] text-text-disabled">
                  <tr>
                    <th className="p-3" scope="col">Раздел</th>
                    <th className="p-3" scope="col">Значение</th>
                    <th className="p-3" scope="col">Среда</th>
                    <th className="p-3" scope="col">Владелец</th>
                    <th className="p-3" scope="col">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {drafts.map((draft) => (
                    <tr className="border-t border-white/[0.06]" key={draft.id}>
                      <td className="p-3 font-medium">{draft.section}</td>
                      <td className="p-3">{draft.value}</td>
                      <td className="p-3">{environmentLabel[draft.environment] ?? draft.environment}</td>
                      <td className="p-3 text-text-secondary">{draft.owner}</td>
                      <td className="p-3">
                        <span
                          className={cn(
                            "rounded-md px-2 py-1 text-xs",
                            draftStatusClass[draft.status],
                          )}
                        >
                          {draftStatusLabel[draft.status]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {activeTab === "integrations" ? (
          <div className="grid gap-6 p-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
            <div className="grid gap-3 lg:grid-cols-2">
              {integrations.map((integration) => (
                <article
                  className={cn(
                    "cursor-pointer rounded-md border p-4 transition",
                    selectedIntegration?.id === integration.id
                      ? "border-brand-primary bg-brand-primary/10"
                      : "border-white/10 bg-bg-elevated hover:border-white/20",
                  )}
                  key={integration.id}
                  onClick={() => setSelectedIntegrationId(integration.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-medium">{integration.name}</h2>
                      <p className="mt-1 text-sm leading-6 text-text-secondary">
                        {integration.description}
                      </p>
                    </div>
                    <DatabaseZap aria-hidden="true" className="text-brand-primary" size={18} />
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                    <span
                      className={cn(
                        "rounded-md px-2 py-1 text-xs",
                        integrationStatusClass[integration.status],
                      )}
                    >
                      {integrationStatusLabel[integration.status]}
                    </span>
                    <span className="rounded-lg bg-bg-card px-2 py-1 text-xs text-text-secondary">
                      {integration.mode}
                    </span>
                    <span className="rounded-lg bg-bg-card px-2 py-1 text-xs text-text-secondary">
                      {integration.latency}
                    </span>
                  </div>
                  <button
                    className="mt-4 h-10 w-full admin-panel text-sm text-text-secondary transition hover:text-white"
                    onClick={(event) => {
                      event.stopPropagation();
                      checkIntegration(integration.id);
                    }}
                    type="button"
                  >
                    Проверить интеграцию {integration.name}
                  </button>
                </article>
              ))}
            </div>

            {selectedIntegration ? (
              <aside className="admin-panel-elevated p-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-base font-semibold">{selectedIntegration.name}</h2>
                  <CheckCircle2 aria-hidden="true" className="text-success" size={18} />
                </div>
                <p className="mt-3 text-sm leading-6 text-text-secondary">
                  Режим: {selectedIntegration.mode}. Задержка: {selectedIntegration.latency}.
                </p>
                {integrationMessage ? (
                  <p className="mt-4 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
                    {integrationMessage}
                  </p>
                ) : null}
              </aside>
            ) : null}
          </div>
        ) : null}

        {activeTab === "alerts" ? (
          <div className="grid gap-6 p-4 xl:grid-cols-[24rem_minmax(0,1fr)]">
            <section className="admin-panel-elevated p-4">
              <h2 className="text-base font-semibold">Порог оповещения</h2>
              <label className="mt-4 block">
                <span className="text-xs text-text-secondary">Аномалия оттока, %</span>
                <input
                  aria-label="Аномалия оттока, %"
                  className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                  onChange={(event) => setChurnThreshold(event.target.value)}
                  type="number"
                  value={churnThreshold}
                />
                {alertErrors.churnThreshold ? (
                  <span className="mt-1 block text-xs text-danger">
                    {alertErrors.churnThreshold}
                  </span>
                ) : null}
              </label>
              <button
                className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md admin-gradient px-3 text-sm font-medium text-white shadow-lg shadow-brand-primary/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={updateSettingsMutation.isPending}
                onClick={updateChurnThreshold}
                type="button"
              >
                <SlidersHorizontal aria-hidden="true" size={16} />
                Обновить порог
              </button>
              {alertMessage ? (
                <p className="mt-3 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
                  {alertMessage}
                </p>
              ) : null}
            </section>

            <div className="overflow-x-auto rounded-lg border border-white/[0.06]">
              <table className="w-full min-w-[680px] border-collapse text-left text-sm">
                <thead className="bg-bg-elevated text-xs uppercase tracking-[0.05em] text-text-disabled">
                  <tr>
                    <th className="p-3" scope="col">Оповещение</th>
                    <th className="p-3" scope="col">Порог</th>
                    <th className="p-3" scope="col">Канал</th>
                    <th className="p-3" scope="col">Владелец</th>
                    <th className="p-3" scope="col">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((alert) => (
                    <tr className="border-t border-white/[0.06]" key={alert.id}>
                      <td className="p-3 font-medium">{alert.name}</td>
                      <td className="p-3">{alert.threshold}</td>
                      <td className="p-3">{alert.channel}</td>
                      <td className="p-3 text-text-secondary">{alert.owner}</td>
                      <td className="p-3">
                        <span
                          className={cn(
                            "rounded-md px-2 py-1 text-xs",
                            alertStatusClass[alert.status],
                          )}
                        >
                          {alertStatusLabel[alert.status]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
