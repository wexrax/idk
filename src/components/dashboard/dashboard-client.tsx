"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CalendarDays,
  CircleDollarSign,
  Download,
  LineChart,
  Plus,
  UserRoundMinus,
  UsersRound,
  Zap,
} from "lucide-react";
import Link from "next/link";
import {
  getAnomalies,
  getDashboardNewUsers,
  getDashboardKpis,
  getDashboardRiskSummary,
  getMrrChart,
  getTopServices,
} from "@/lib/api/client";
import type { Anomaly } from "@/lib/api/contracts";
import { formatCurrencyRub, formatPercent } from "@/lib/utils";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/admin-primitives";
import { MetricCard } from "./metric-card";
import { MrrChart } from "./mrr-chart";

function formatNumber(value: number) {
  return new Intl.NumberFormat("ru-RU").format(value);
}

function formatSignedPercent(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toLocaleString("ru-RU")}%`;
}

function formatDashboardUpdatedAt(value?: string) {
  const date = value ? new Date(value) : new Date();
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
  const day = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(safeDate);
  const time = new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(safeDate);

  return `Сводка по сервису · ${day} · обновлено в ${time}`;
}

const severityStyle: Record<Anomaly["severity"], {
  icon: typeof AlertTriangle;
  panel: string;
  text: string;
}> = {
  critical: {
    icon: AlertTriangle,
    panel: "border-danger/30 bg-danger/10",
    text: "text-danger",
  },
  info: {
    icon: Zap,
    panel: "border-warning/30 bg-warning/10",
    text: "text-warning",
  },
  warning: {
    icon: AlertTriangle,
    panel: "border-warning/30 bg-warning/10",
    text: "text-warning",
  },
};

export function DashboardClient() {
  const kpisQuery = useQuery({
    queryFn: getDashboardKpis,
    queryKey: ["dashboard", "kpis"],
    refetchInterval: 120_000,
  });
  const mrrQuery = useQuery({
    queryFn: getMrrChart,
    queryKey: ["dashboard", "mrr-chart"],
  });
  const newUsersQuery = useQuery({
    queryFn: getDashboardNewUsers,
    queryKey: ["dashboard", "new-users"],
  });
  const riskSummaryQuery = useQuery({
    queryFn: getDashboardRiskSummary,
    queryKey: ["dashboard", "risk-summary"],
  });
  const anomaliesQuery = useQuery({
    queryFn: getAnomalies,
    queryKey: ["dashboard", "anomalies"],
  });
  const servicesQuery = useQuery({
    queryFn: getTopServices,
    queryKey: ["dashboard", "top-services"],
  });

  const queries = [kpisQuery, mrrQuery, newUsersQuery, riskSummaryQuery, anomaliesQuery, servicesQuery];

  const header = (
    <PageHeader
      actions={
        <>
          <button className="admin-focus inline-flex h-9 items-center gap-2 rounded-lg border border-white/[0.08] bg-bg-card px-3 text-sm font-medium text-white shadow-sm shadow-black/20 hover:border-brand-primary/30 hover:bg-bg-elevated">
            <CalendarDays aria-hidden className="h-4 w-4 text-brand-secondary" />
            Последние 30 дней
          </button>
          <button className="admin-focus inline-flex h-9 items-center gap-2 rounded-lg border border-white/[0.08] bg-bg-card px-3 text-sm font-medium text-white shadow-sm shadow-black/20 hover:border-brand-primary/30 hover:bg-bg-elevated">
            <Download aria-hidden className="h-4 w-4 text-brand-secondary" />
            Отчёт PDF
          </button>
          <Link
            className="admin-gradient inline-flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-white shadow-lg shadow-brand-primary/25"
            href="/marketing#new-campaign"
          >
            <Plus aria-hidden className="h-4 w-4" />
            Создать рассылку
          </Link>
        </>
      }
      description={formatDashboardUpdatedAt(kpisQuery.data?.data.updated_at)}
      eyebrow="Операции"
      title="Главный дашборд"
    />
  );

  if (queries.some((query) => query.isPending)) {
    return (
      <div className="space-y-6">
        {header}
        <LoadingState />
      </div>
    );
  }

  if (queries.some((query) => query.isError)) {
    return (
      <div className="space-y-6">
        {header}
        <ErrorState
          onRetry={() => {
            queries.forEach((query) => void query.refetch());
          }}
        />
      </div>
    );
  }

  const kpis = kpisQuery.data!.data;
  const mrrChart = mrrQuery.data!.data;
  const newUsers = newUsersQuery.data!.data;
  const riskSummary = riskSummaryQuery.data!.data;
  const anomalies = anomaliesQuery.data!.data;
  const topServices = servicesQuery.data!.data;
  const riskUsers = riskSummary.high + riskSummary.medium;

  return (
    <div className="space-y-6">
      {header}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          detail={formatSignedPercent(kpis.active_users.delta_pct ?? 0)}
          icon={UsersRound}
          label="Активные пользователи"
          meta="vs прошлый месяц"
          trend={kpis.active_users.trend}
          value={formatNumber(kpis.active_users.value)}
        />
        <MetricCard
          detail={formatSignedPercent(kpis.mrr.delta_pct ?? 0)}
          icon={CircleDollarSign}
          label="MRR"
          meta={`ARR: ${formatCurrencyRub(kpis.mrr.arr)}`}
          trend={kpis.mrr.trend}
          value={formatCurrencyRub(kpis.mrr.value)}
        />
        <MetricCard
          detail={`+${kpis.churn_rate.delta_pp.toLocaleString("ru-RU")} п.п.`}
          icon={UserRoundMinus}
          label="Churn rate"
          meta={<><span className="sr-only">Отток</span>внимание</>}
          tone={kpis.churn_rate.is_alert ? "danger" : "default"}
          trend={kpis.churn_rate.trend}
          value={formatPercent(kpis.churn_rate.value)}
        />
        <MetricCard
          detail={`ROMI ${formatNumber(kpis.ltv_cac_ratio.romi_pct)}%`}
          icon={LineChart}
          label="LTV:CAC"
          meta="отлично"
          trend={kpis.ltv_cac_ratio.trend}
          value={`${kpis.ltv_cac_ratio.value.toLocaleString("ru-RU")}x`}
        />
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_26rem] 2xl:grid-cols-[minmax(0,1fr)_29rem]">
        <MrrChart data={mrrChart} />
        <section className="admin-panel min-h-[292px] p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-base font-bold leading-5 text-white">
              Аномалии и оповещения
            </h2>
            <span className="rounded-lg bg-danger/15 px-2 py-1 text-xs font-bold text-danger">
              {anomalies.length}
            </span>
          </div>
          <div className="space-y-2.5">
            {anomalies.map((anomaly) => (
              <article className={`rounded-lg border px-3 py-3 shadow-sm shadow-black/10 ${severityStyle[anomaly.severity].panel}`} key={anomaly.id}>
                <div className="flex items-center gap-3">
                  <span className={`grid size-7 shrink-0 place-items-center rounded-lg bg-black/15 ${severityStyle[anomaly.severity].text}`}>
                    {(() => {
                      const Icon = severityStyle[anomaly.severity].icon;
                      return <Icon aria-hidden className="h-4 w-4" />;
                    })()}
                  </span>
                  <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold leading-5 text-white">{anomaly.title}</h3>
                      <p className="truncate text-xs leading-5 text-text-secondary">
                      {anomaly.description}
                      </p>
                    </div>
                    <a className="inline-flex shrink-0 text-xs font-bold text-brand-primary hover:text-brand-secondary" href="/analytics">
                      К деталям →
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-3 xl:grid-cols-[1fr_1.05fr_1fr]">
        <section className="admin-panel min-h-[250px] p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-white">Топ внешних сервисов</h2>
            <span className="text-xs text-text-disabled">за 30 дн.</span>
          </div>
          <ol className="space-y-2.5">
            {topServices.map((service, index) => (
              <li className="space-y-1.5" key={service.id}>
                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <p className="truncate font-medium text-white">{service.name}</p>
                    <span className="shrink-0 text-text-secondary">{formatNumber(service.subscribers)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-bg-elevated/80 ring-1 ring-white/[0.04]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-secondary to-brand-primary"
                      style={{ width: `${Math.max(12, 100 - index * 14)}%` }}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="admin-panel min-h-[250px] p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-white">Новые пользователи</h2>
            <div className="flex rounded-[10px] border border-white/[0.06] bg-bg-elevated p-1">
              <span className="admin-gradient rounded-lg px-3 py-1 text-xs font-medium text-white">День</span>
              <span className="rounded-lg px-3 py-1 text-xs font-medium text-text-secondary">Неделя</span>
            </div>
          </div>
          <div className="flex items-end gap-3">
            <p className="text-[34px] font-extrabold leading-none text-white">
              {formatNumber(newUsers.count)}
            </p>
            <p className="pb-1 text-xs font-bold text-success">
              {formatNumber(newUsers.items.length)} <span className="font-medium text-text-disabled">в выборке</span>
            </p>
          </div>
          <div className="mt-6 grid h-[92px] grid-cols-8 items-end gap-2 border-y border-white/[0.06] py-4">
            {mrrChart.concat(mrrChart.slice(0, 3)).map((point, index) => (
              <div className="rounded-t-md bg-gradient-to-t from-brand-primary to-brand-secondary shadow-[0_0_20px_rgb(58_160_255/0.16)]" key={`${point.date}-${index}`} style={{ height: `${24 + index * 7}px` }} />
            ))}
          </div>
        </section>

        <section className="admin-panel min-h-[250px] p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-white">Риск оттока</h2>
            <span className="rounded-lg bg-danger/15 px-2 py-1 text-xs font-bold text-danger">ML</span>
          </div>
          <div className="relative mx-auto mt-2 grid aspect-square max-w-[128px] place-items-center rounded-full bg-bg-elevated shadow-inner shadow-black/30">
            <div className="absolute inset-3 rounded-full border-[14px] border-danger border-b-transparent border-l-bg-overlay border-r-warning/70 border-t-danger" />
            <div className="z-10 text-center">
              <p className="text-[22px] font-extrabold leading-none text-white">
                {formatNumber(riskUsers)}
              </p>
              <p className="mt-1 text-[10px] text-text-secondary">в зоне риска</p>
            </div>
          </div>
          <div className="mt-4 flex justify-center gap-4 text-[11px] text-text-secondary">
            <span><span className="mr-1 inline-block size-2 rounded-full bg-danger" />Высокий {formatNumber(riskSummary.high)}</span>
            <span><span className="mr-1 inline-block size-2 rounded-full bg-warning" />Средний {formatNumber(riskSummary.medium)}</span>
          </div>
          <button className="admin-focus mt-3 h-8 w-full rounded-lg border border-white/[0.08] bg-bg-elevated text-xs font-semibold text-white hover:border-brand-primary/30 hover:bg-bg-overlay">
            Посмотреть список →
          </button>
        </section>
      </div>
    </div>
  );
}
