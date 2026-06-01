"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  Bot,
  Brain,
  Calculator,
  CircleDollarSign,
  Play,
  ShieldAlert,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { z } from "zod";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { getSmartAnalyticsWorkspace, runSmartAutomation } from "@/lib/api/client";
import type {
  ChurnRiskSegment,
  RetentionAutomation,
  SmartAutomationStatus,
  SmartScenario,
  SmartScenarioStatus,
  SmartTariff,
} from "@/lib/api/contracts";
import { cn, formatCurrencyRub } from "@/lib/utils";

type SmartTab = "whatIf" | "risk" | "automations";
type ScenarioFormErrors = Partial<
  Record<"churnDelta" | "horizonMonths" | "priceDelta", string>
>;

const emptyScenarios: SmartScenario[] = [];
const emptyRiskSegments: ChurnRiskSegment[] = [];
const emptyAutomations: RetentionAutomation[] = [];

const tabLabel: Record<SmartTab, string> = {
  automations: "Автоматизации",
  risk: "Риск оттока",
  whatIf: "What-if",
};

const statusClass: Record<SmartScenarioStatus | SmartAutomationStatus, string> = {
  active: "bg-success/10 text-success",
  draft: "bg-muted/20 text-text-secondary",
  ready: "bg-success/10 text-success",
  review: "bg-info/10 text-info",
};

const statusLabel: Record<SmartScenarioStatus | SmartAutomationStatus, string> = {
  active: "Активно",
  draft: "Черновик",
  ready: "Готово",
  review: "На проверке",
};

const horizonLabel: Record<number, string> = {
  1: "30 дней",
  3: "90 дней",
  6: "180 дней",
};

const scenarioSchema = z.object({
  churnDelta: z
    .number()
    .min(-5, "Дельта оттока не может быть ниже -5 п.п.")
    .max(5, "Дельта оттока не может превышать 5 п.п."),
  horizonMonths: z.number().refine((value) => [1, 3, 6].includes(value), {
    message: "Выберите корректный горизонт сценария",
  }),
  priceDelta: z
    .number()
    .min(-50, "Изменение цены не может быть ниже -50%")
    .max(100, "Изменение цены не может превышать 100%"),
});

function formatCompactCurrency(value: number) {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString("ru-RU", {
      maximumFractionDigits: 1,
      minimumFractionDigits: 1,
    })} млн ₽`;
  }

  return formatCurrencyRub(value);
}

function formatSignedPercent(value: number) {
  return `${value > 0 ? "+" : ""}${value.toLocaleString("en-US", {
    maximumFractionDigits: 1,
  })}%`;
}

function formatSignedPoints(value: number) {
  return `${value > 0 ? "+" : ""}${value.toLocaleString("ru-RU", {
    maximumFractionDigits: 1,
  })} п.п.`;
}

function calculateProjectedMrr(tariff: SmartTariff, priceDelta: number, churnDelta: number) {
  const base = tariff === "Family" ? 5_400_000 : tariff === "Trial" ? 1_200_000 : 14_200_000;
  const priceFactor = 1 + priceDelta / 100;
  const churnFactor = 1 - Math.max(-5, Math.min(5, churnDelta)) / 100;

  return Math.round(base * priceFactor * churnFactor);
}

function createScenario(params: {
  churnDelta: number;
  horizonMonths: number;
  priceDelta: number;
  tariff: SmartTariff;
}): SmartScenario {
  return {
    churn_delta_pp: params.churnDelta,
    horizon_months: params.horizonMonths,
    id: `scenario-${Date.now()}`,
    ltv_impact_pct: params.priceDelta > 0 ? 6.2 : 1.5,
    name: `${params.tariff} ${params.priceDelta >= 0 ? "+" : ""}${params.priceDelta}%`,
    price_delta_pct: params.priceDelta,
    projected_mrr: calculateProjectedMrr(
      params.tariff,
      params.priceDelta,
      params.churnDelta,
    ),
    status: "ready",
    tariff: params.tariff,
  };
}

function RiskDetail({ segment }: { segment: ChurnRiskSegment }) {
  return (
    <aside
      className="admin-panel-elevated p-4"
      data-testid="risk-detail-panel"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">{segment.name}</h2>
        <ShieldAlert aria-hidden="true" className="text-danger" size={18} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg bg-bg-card p-3">
        <p className="text-text-secondary">Вероятность оттока</p>
          <p className="mt-1 font-semibold text-danger">{segment.churn_probability_pct}%</p>
        </div>
        <div className="rounded-lg bg-bg-card p-3">
          <p className="text-text-secondary">Уверенность</p>
          <p className="mt-1 font-semibold text-success">{segment.confidence_pct}%</p>
        </div>
        <div className="rounded-lg bg-bg-card p-3">
          <p className="text-text-secondary">Ожидаемые потери</p>
          <p className="mt-1 font-semibold">{formatCompactCurrency(segment.expected_loss)}</p>
        </div>
        <div className="rounded-lg bg-bg-card p-3">
          <p className="text-text-secondary">Пользователи</p>
          <p className="mt-1 font-semibold">{segment.users.toLocaleString("en-US")}</p>
        </div>
      </div>
      <div className="mt-4 admin-panel p-3">
        <p className="text-xs text-text-secondary">Главные факторы</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {segment.top_drivers.map((driver) => (
            <span className="rounded-lg bg-bg-elevated px-2 py-1 text-xs" key={driver}>
              {driver}
            </span>
          ))}
        </div>
      </div>
      <p className="mt-4 rounded-md border border-info/30 bg-info/10 px-3 py-2 text-sm text-info">
        Рекомендуемое действие: {segment.recommended_action}
      </p>
    </aside>
  );
}

function AutomationPreview({
  automation,
  isRunning,
  message,
  onPreview,
}: {
  automation: RetentionAutomation;
  isRunning: boolean;
  message: string;
  onPreview: () => void;
}) {
  return (
    <aside className="admin-panel-elevated p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Превью автоматизации</h2>
        <Bot aria-hidden="true" className="text-info" size={18} />
      </div>
      <p className="mt-3 text-sm leading-6 text-text-secondary">
        {automation.name}: {automation.channel} для {automation.audience}, когда{" "}
        {automation.trigger}.
      </p>
      <button
        className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md admin-gradient px-3 text-sm font-medium text-white shadow-lg shadow-brand-primary/20 transition hover:-translate-y-0.5"
        disabled={isRunning}
        onClick={onPreview}
        type="button"
      >
        <Play aria-hidden="true" size={16} />
        {isRunning ? "Запуск..." : "Запустить превью"}
      </button>
      {message ? (
        <p className="mt-3 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
          {message}
        </p>
      ) : null}
    </aside>
  );
}

export function SmartAnalyticsClient() {
  const queryClient = useQueryClient();
  const workspaceQuery = useQuery({
    queryFn: getSmartAnalyticsWorkspace,
    queryKey: ["smart-analytics-workspace"],
  });
  const [activeTab, setActiveTab] = useState<SmartTab>("whatIf");
  const [localScenarios, setLocalScenarios] = useState<SmartScenario[] | null>(null);
  const [tariff, setTariff] = useState<SmartTariff>("Premium");
  const [priceDelta, setPriceDelta] = useState(8);
  const [churnDelta, setChurnDelta] = useState(0.4);
  const [horizonMonths, setHorizonMonths] = useState(3);
  const [scenarioMessage, setScenarioMessage] = useState("");
  const [formErrors, setFormErrors] = useState<ScenarioFormErrors>({});
  const [selectedRiskId, setSelectedRiskId] = useState<string | null>(null);
  const [selectedAutomationId, setSelectedAutomationId] = useState<string | null>(null);
  const [automationMessage, setAutomationMessage] = useState("");

  const workspace = workspaceQuery.data?.data;
  const workspaceScenarios = workspace?.scenarios ?? emptyScenarios;
  const scenarios = useMemo(
    () => localScenarios ?? workspaceScenarios,
    [localScenarios, workspaceScenarios],
  );
  const riskSegments = workspace?.risk_segments ?? emptyRiskSegments;
  const automations = workspace?.automations ?? emptyAutomations;
  const selectedRisk = useMemo(
    () => riskSegments.find((segment) => segment.id === selectedRiskId) ?? riskSegments[0],
    [riskSegments, selectedRiskId],
  );
  const selectedAutomation = useMemo(
    () =>
      automations.find((automation) => automation.id === selectedAutomationId) ??
      automations[0],
    [automations, selectedAutomationId],
  );
  const riskUsers = riskSegments.reduce((sum, segment) => sum + segment.users, 0);
  const highestRisk = riskSegments.reduce<ChurnRiskSegment | null>(
    (highest, segment) =>
      !highest || segment.churn_probability_pct > highest.churn_probability_pct
        ? segment
        : highest,
    null,
  );
  const bestScenario = scenarios.reduce<SmartScenario | null>(
    (best, scenario) =>
      !best || scenario.projected_mrr > best.projected_mrr ? scenario : best,
    null,
  );
  const runAutomationMutation = useMutation({
    mutationFn: runSmartAutomation,
    onError: () => {
      setAutomationMessage("Не удалось запустить automation через API");
    },
    onSuccess: async (result) => {
      setAutomationMessage(
        `Automation запущена: matched ${result.data.matched.toLocaleString("en-US")}`,
      );
      await queryClient.invalidateQueries({ queryKey: ["smart-analytics-workspace"] });
    },
  });

  function calculateScenario() {
    const parsed = scenarioSchema.safeParse({
      churnDelta,
      horizonMonths,
      priceDelta,
    });

    if (!parsed.success) {
      const nextErrors: ScenarioFormErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof ScenarioFormErrors;
        nextErrors[field] = issue.message;
      }
      setFormErrors(nextErrors);
      setScenarioMessage("");
      return;
    }

    const nextScenario = createScenario({
      churnDelta,
      horizonMonths,
      priceDelta,
      tariff,
    });

    setLocalScenarios((current) => [nextScenario, ...(current ?? scenarios)]);
    setFormErrors({});
    setScenarioMessage(`Сценарий ${nextScenario.name} рассчитан`);
  }

  function launchAutomationPreview() {
    if (!selectedAutomation) {
      return;
    }

    setAutomationMessage("");
    runAutomationMutation.mutate(selectedAutomation.id);
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

  if (!workspace || (scenarios.length === 0 && riskSegments.length === 0 && automations.length === 0)) {
    return (
      <main className="px-4 py-6 lg:px-6">
        <section className="admin-panel p-6">
          <h1 className="text-[22px] font-bold tracking-normal text-white">Умная аналитика</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Сценарии, прогноз оттока и автоматизации удержания пока недоступны.
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
            Предиктивные операции
          </p>
          <h1 className="mt-2 text-[22px] font-bold tracking-normal text-white">Умная аналитика</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-text-secondary">
            What-if сценарии, ML-прогноз оттока и автоматизации удержания для платных
            сегментов SubHub.
          </p>
        </div>
        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md admin-gradient px-4 text-sm font-medium text-white shadow-lg shadow-brand-primary/20 transition hover:-translate-y-0.5"
          onClick={calculateScenario}
          type="button"
        >
          <Sparkles aria-hidden="true" size={16} />
          Новый сценарий
        </button>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <article className="admin-panel p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">Прогноз MRR</p>
            <CircleDollarSign aria-hidden="true" className="text-success" size={18} />
          </div>
          <p className="mt-3 text-[22px] font-bold tracking-normal text-white">
            {bestScenario ? formatCompactCurrency(bestScenario.projected_mrr) : "0 ₽"}
          </p>
          <p className="mt-2 text-sm text-text-secondary">Лучший готовый сценарий</p>
        </article>
        <article className="rounded-md border border-danger/30 bg-danger/10 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-danger">ML-прогноз оттока</p>
            <ShieldAlert aria-hidden="true" className="text-danger" size={18} />
          </div>
          <p className="mt-3 text-[22px] font-bold tracking-normal text-white">
            {highestRisk ? `${highestRisk.churn_probability_pct}%` : "0%"}
          </p>
          <p className="mt-2 text-sm text-text-secondary">
            {highestRisk ? `${highestRisk.confidence_pct}% уверенность` : "Нет результата модели"}
          </p>
        </article>
        <article className="admin-panel p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">Пользователи в риске</p>
            <Bot aria-hidden="true" className="text-info" size={18} />
          </div>
          <p className="mt-3 text-[22px] font-bold tracking-normal text-white">{riskUsers.toLocaleString("en-US")}</p>
          <p className="mt-2 text-sm text-text-secondary">В очереди модели</p>
        </article>
        <article className="admin-panel p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">Сценарии</p>
            <Brain aria-hidden="true" className="text-brand-primary" size={18} />
          </div>
          <p className="mt-3 text-[22px] font-bold tracking-normal text-white">{scenarios.length}</p>
          <p className="mt-2 text-sm text-text-secondary">Запуски ценовой модели</p>
        </article>
      </section>

      <section className="mt-6 admin-panel">
        <div className="flex flex-wrap gap-2 border-b border-white/10 p-4">
          {(Object.keys(tabLabel) as SmartTab[]).map((tab) => (
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

        {activeTab === "whatIf" ? (
          <div className="grid gap-6 p-4 xl:grid-cols-[24rem_minmax(0,1fr)]">
            <section className="admin-panel-elevated p-4">
              <h2 className="text-base font-semibold">What-if сценарий</h2>
              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className="text-xs text-text-secondary">Тариф</span>
                  <select
                    aria-label="Тариф"
                    className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                    onChange={(event) => setTariff(event.target.value as SmartTariff)}
                    value={tariff}
                  >
                    <option>Premium</option>
                    <option>Family</option>
                    <option>Trial</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs text-text-secondary">Изменение цены, %</span>
                  <input
                    aria-label="Изменение цены, %"
                    className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                    onChange={(event) => setPriceDelta(Number(event.target.value))}
                    type="number"
                    value={priceDelta}
                  />
                  {formErrors.priceDelta ? (
                    <span className="mt-1 block text-xs text-danger">
                      {formErrors.priceDelta}
                    </span>
                  ) : null}
                </label>
                <label className="block">
                  <span className="text-xs text-text-secondary">Дельта оттока, п.п.</span>
                  <input
                    aria-label="Дельта оттока, п.п."
                    className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                    onChange={(event) => setChurnDelta(Number(event.target.value))}
                    step="0.1"
                    type="number"
                    value={churnDelta}
                  />
                  {formErrors.churnDelta ? (
                    <span className="mt-1 block text-xs text-danger">
                      {formErrors.churnDelta}
                    </span>
                  ) : null}
                </label>
                <label className="block">
                  <span className="text-xs text-text-secondary">Горизонт</span>
                  <select
                    aria-label="Горизонт"
                    className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                    onChange={(event) => setHorizonMonths(Number(event.target.value))}
                    value={horizonMonths}
                  >
                    <option value={1}>30 дней</option>
                    <option value={3}>90 дней</option>
                    <option value={6}>180 дней</option>
                  </select>
                  {formErrors.horizonMonths ? (
                    <span className="mt-1 block text-xs text-danger">
                      {formErrors.horizonMonths}
                    </span>
                  ) : null}
                </label>
              </div>
              <button
                aria-label="Рассчитать сценарий"
                className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md admin-gradient px-3 text-sm font-medium text-white shadow-lg shadow-brand-primary/20 transition hover:-translate-y-0.5"
                onClick={calculateScenario}
                type="button"
              >
                <Calculator aria-hidden="true" size={16} />
                Рассчитать сценарий
              </button>
              {scenarioMessage ? (
                <p className="mt-3 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
                  {scenarioMessage}
                </p>
              ) : null}
            </section>

            <section className="space-y-4">
              <div className="admin-panel-elevated p-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-base font-semibold">Прогноз модели</h2>
                  <TrendingUp aria-hidden="true" className="text-success" size={18} />
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-lg bg-bg-card p-3">
                    <p className="text-xs text-text-secondary">Тариф</p>
                    <p className="mt-1 font-medium">{tariff}</p>
                  </div>
                  <div className="rounded-lg bg-bg-card p-3">
                    <p className="text-xs text-text-secondary">Цена</p>
                    <p className="mt-1 font-medium">{formatSignedPercent(priceDelta)}</p>
                  </div>
                  <div className="rounded-lg bg-bg-card p-3">
                    <p className="text-xs text-text-secondary">Отток</p>
                    <p className="mt-1 font-medium">{formatSignedPoints(churnDelta)}</p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-white/[0.06]">
                <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                  <thead className="bg-bg-elevated text-xs uppercase tracking-[0.05em] text-text-disabled">
                    <tr>
                      <th className="p-3" scope="col">Сценарий</th>
                      <th className="p-3" scope="col">Горизонт</th>
                      <th className="p-3" scope="col">Прогноз MRR</th>
                      <th className="p-3" scope="col">Влияние на LTV</th>
                      <th className="p-3" scope="col">Дельта оттока</th>
                      <th className="p-3" scope="col">Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scenarios.map((scenario) => (
                      <tr className="border-t border-white/[0.06]" key={scenario.id}>
                        <td className="p-3 font-medium">{scenario.name}</td>
                        <td className="p-3">{horizonLabel[scenario.horizon_months]}</td>
                        <td className="p-3">{formatCompactCurrency(scenario.projected_mrr)}</td>
                        <td className="p-3 text-success">
                          {formatSignedPercent(scenario.ltv_impact_pct)}
                        </td>
                        <td className="p-3">{formatSignedPoints(scenario.churn_delta_pp)}</td>
                        <td className="p-3">
                          <span
                            className={cn(
                              "rounded-md px-2 py-1 text-xs",
                              statusClass[scenario.status],
                            )}
                          >
                            {statusLabel[scenario.status]}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        ) : null}

        {activeTab === "risk" ? (
          <div className="grid gap-6 p-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
            <div className="overflow-x-auto rounded-lg border border-white/[0.06]">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead className="bg-bg-elevated text-xs uppercase tracking-[0.05em] text-text-disabled">
                  <tr>
                    <th className="p-3" scope="col">Сегмент</th>
                    <th className="p-3" scope="col">Пользователи</th>
                    <th className="p-3" scope="col">Вероятность</th>
                    <th className="p-3" scope="col">Уверенность</th>
                    <th className="p-3" scope="col">Потери</th>
                    <th className="p-3" scope="col">Владелец</th>
                  </tr>
                </thead>
                <tbody>
                  {riskSegments.map((segment) => (
                    <tr
                      className={cn(
                        "cursor-pointer border-t border-white/[0.06] transition hover:bg-bg-elevated/70",
                        selectedRisk?.id === segment.id ? "bg-bg-elevated" : "",
                      )}
                      key={segment.id}
                      onClick={() => setSelectedRiskId(segment.id)}
                    >
                      <td className="p-3 font-medium">{segment.name}</td>
                      <td className="p-3">{segment.users.toLocaleString("en-US")}</td>
                      <td className="p-3 text-danger">{segment.churn_probability_pct}%</td>
                      <td className="p-3 text-success">{segment.confidence_pct}%</td>
                      <td className="p-3">{formatCompactCurrency(segment.expected_loss)}</td>
                      <td className="p-3 text-text-secondary">{segment.owner}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedRisk ? <RiskDetail segment={selectedRisk} /> : null}
          </div>
        ) : null}

        {activeTab === "automations" ? (
          <div className="grid gap-6 p-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
            <div className="grid gap-3 lg:grid-cols-3">
              {automations.map((automation) => (
                <article
                  className={cn(
                    "cursor-pointer rounded-md border p-4 transition",
                    selectedAutomation?.id === automation.id
                      ? "border-brand-primary bg-brand-primary/10"
                      : "border-white/10 bg-bg-elevated hover:border-white/20",
                  )}
                  key={automation.id}
                  onClick={() => setSelectedAutomationId(automation.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-medium">{automation.name}</h2>
                      <p className="mt-1 text-sm text-text-secondary">{automation.trigger}</p>
                    </div>
                    <Activity aria-hidden="true" className="text-brand-primary" size={18} />
                  </div>
                  <div className="mt-4 grid gap-2 text-sm">
                    <p className="text-text-secondary">Канал: {automation.channel}</p>
                    <p className="text-text-secondary">Аудитория: {automation.audience}</p>
                    <span
                      className={cn(
                        "w-fit rounded-md px-2 py-1 text-xs",
                        statusClass[automation.status],
                      )}
                    >
                      {statusLabel[automation.status]}
                    </span>
                  </div>
                </article>
              ))}
            </div>

            {selectedAutomation ? (
              <AutomationPreview
                automation={selectedAutomation}
                isRunning={runAutomationMutation.isPending}
                message={automationMessage}
                onPreview={launchAutomationPreview}
              />
            ) : null}
          </div>
        ) : null}
      </section>
    </main>
  );
}
