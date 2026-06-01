"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Download,
  FileSpreadsheet,
  Filter,
  LineChart,
  Plus,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { z } from "zod";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import {
  cancelJob,
  createAnalyticsExport,
  createAnalyticsScheduledReport,
  getAnalyticsWorkspace,
  getJobs,
} from "@/lib/api/client";
import type {
  AnalyticsCohort,
  AnalyticsCustomDashboard,
  AnalyticsDashboardTemplate,
  AnalyticsExportFormat,
  AnalyticsExportJob,
  AnalyticsReport,
  AnalyticsReportStatus,
  AnalyticsReportType,
  AnalyticsScheduledReport,
  AnalyticsScheduleFrequency,
} from "@/lib/api/contracts";
import { cn } from "@/lib/utils";

type AnalyticsTab = "reports" | "cohorts" | "exports" | "schedules" | "dashboards";
type SegmentOption = "all" | "premium" | "family" | "trial" | "custom";
type PeriodOption = "30 дней" | "90 дней" | "Год";
type GroupingOption = "Тариф" | "Способ оплаты" | "Платформа";
type ReportErrors = Partial<Record<"segment", string>>;
type ScheduleForm = {
  email: string;
  format: AnalyticsExportFormat;
  frequency: AnalyticsScheduleFrequency;
  name: string;
};
type ScheduleErrors = Partial<Record<keyof ScheduleForm, string>>;
type DashboardForm = {
  name: string;
  owner: string;
  period: PeriodOption;
  template: AnalyticsDashboardTemplate;
};
type DashboardErrors = Partial<Record<keyof DashboardForm, string>>;

const emptyReports: AnalyticsReport[] = [];
const emptyCohorts: AnalyticsCohort[] = [];
const emptyExports: AnalyticsExportJob[] = [];
const emptySchedules: AnalyticsScheduledReport[] = [];
const emptyDashboards: AnalyticsCustomDashboard[] = [];

const tabLabel: Record<AnalyticsTab, string> = {
  cohorts: "Когорты",
  dashboards: "Дашборды",
  exports: "Экспорт",
  reports: "Отчеты",
  schedules: "Расписание",
};

const statusClass: Record<AnalyticsReportStatus, string> = {
  queued: "bg-warning/10 text-warning",
  ready: "bg-success/10 text-success",
  review: "bg-info/10 text-info",
};

const statusLabel: Record<AnalyticsReportStatus, string> = {
  queued: "В очереди",
  ready: "Готов",
  review: "На проверке",
};

const reportTypeLabel: Record<AnalyticsReportType, string> = {
  Churn: "Отток",
  Retention: "Удержание",
  Revenue: "Выручка",
  Services: "Сервисы",
};

const segmentLabel: Record<SegmentOption, string> = {
  all: "Все пользователи",
  custom: "Свой сегмент",
  family: "Family",
  premium: "Premium",
  trial: "Пробный период",
};

const exportLabel: Record<AnalyticsExportFormat, string> = {
  CSV: "CSV",
  PDF: "PDF",
  XLSX: "Excel",
};

const frequencyLabel: Record<AnalyticsScheduleFrequency, string> = {
  daily: "Ежедневно",
  monthly: "Ежемесячно",
  weekly: "Еженедельно",
};

const dashboardTemplateLabel: Record<AnalyticsDashboardTemplate, string> = {
  operations: "Операционный",
  retention: "Удержание",
  revenue: "Выручка",
};

const reportBuilderSchema = z.object({
  segment: z.string().trim().min(3, "Сегмент должен быть не короче 3 символов"),
});

const scheduleSchema = z.object({
  email: z.string().trim().email("Укажите корректную почту"),
  format: z.enum(["CSV", "XLSX", "PDF"]),
  frequency: z.enum(["daily", "weekly", "monthly"]),
  name: z.string().trim().min(3, "Название расписания должно быть не короче 3 символов"),
});

const dashboardSchema = z.object({
  name: z.string().trim().min(3, "Название дашборда должно быть не короче 3 символов"),
  owner: z.string().trim().min(2, "Владелец должен быть не короче 2 символов"),
  period: z.enum(["30 дней", "90 дней", "Год"]),
  template: z.enum(["revenue", "retention", "operations"]),
});

function formatUsers(value: number) {
  return value.toLocaleString("ru-RU");
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  });
}

export function AnalyticsClient() {
  const workspaceQuery = useQuery({
    queryFn: getAnalyticsWorkspace,
    queryKey: ["analytics-workspace"],
  });
  const jobsQuery = useQuery({
    queryFn: getJobs,
    queryKey: ["jobs"],
  });
  const [activeTab, setActiveTab] = useState<AnalyticsTab>("reports");
  const [localReports, setLocalReports] = useState<AnalyticsReport[] | null>(null);
  const [localExports, setLocalExports] = useState<AnalyticsExportJob[] | null>(null);
  const [localSchedules, setLocalSchedules] = useState<AnalyticsScheduledReport[] | null>(null);
  const [localDashboards, setLocalDashboards] = useState<AnalyticsCustomDashboard[] | null>(null);
  const [period, setPeriod] = useState<PeriodOption>("30 дней");
  const [segment, setSegment] = useState<SegmentOption>("all");
  const [customSegment, setCustomSegment] = useState("");
  const [reportType, setReportType] = useState<AnalyticsReportType>("Retention");
  const [grouping, setGrouping] = useState<GroupingOption>("Тариф");
  const [scheduleForm, setScheduleForm] = useState<ScheduleForm>({
    email: "analytics@subhub.local",
    format: "PDF",
    frequency: "weekly",
    name: "",
  });
  const [dashboardForm, setDashboardForm] = useState<DashboardForm>({
    name: "",
    owner: "Аналитика",
    period: "30 дней",
    template: "revenue",
  });
  const [reportMessage, setReportMessage] = useState("");
  const [exportMessage, setExportMessage] = useState("");
  const [scheduleMessage, setScheduleMessage] = useState("");
  const [dashboardMessage, setDashboardMessage] = useState("");
  const [reportErrors, setReportErrors] = useState<ReportErrors>({});
  const [scheduleErrors, setScheduleErrors] = useState<ScheduleErrors>({});
  const [dashboardErrors, setDashboardErrors] = useState<DashboardErrors>({});
  const [selectedCohortId, setSelectedCohortId] = useState<string | null>(null);
  const [selectedDashboardId, setSelectedDashboardId] = useState<string | null>(null);

  const workspace = workspaceQuery.data?.data;
  const reports = useMemo(
    () => localReports ?? workspace?.reports ?? emptyReports,
    [localReports, workspace?.reports],
  );
  const cohorts = workspace?.cohorts ?? emptyCohorts;
  const exports = useMemo(
    () => localExports ?? workspace?.exports ?? emptyExports,
    [localExports, workspace?.exports],
  );
  const schedules = useMemo(
    () => localSchedules ?? workspace?.scheduled_reports ?? emptySchedules,
    [localSchedules, workspace?.scheduled_reports],
  );
  const dashboards = useMemo(
    () => localDashboards ?? workspace?.custom_dashboards ?? emptyDashboards,
    [localDashboards, workspace?.custom_dashboards],
  );
  const selectedCohort = useMemo(
    () => cohorts.find((cohort) => cohort.id === selectedCohortId) ?? cohorts[0],
    [cohorts, selectedCohortId],
  );
  const selectedDashboard = useMemo(
    () =>
      dashboards.find((dashboard) => dashboard.id === selectedDashboardId) ??
      dashboards[0],
    [dashboards, selectedDashboardId],
  );
  const totalUsers = cohorts.reduce((sum, cohort) => sum + cohort.users, 0);
  const effectiveSegment = segment === "custom" ? customSegment : segmentLabel[segment];
  const effectiveSegmentLabel = effectiveSegment || segmentLabel.custom;
  const activeSchedules = schedules.filter((schedule) => schedule.status === "Активно").length;
  const activeJobs =
    jobsQuery.data?.data.items.filter(
      (job) => job.status === "queued" || job.status === "running",
    ).length ?? 0;
  const jobs = jobsQuery.data?.data.items ?? [];
  const cancelJobMutation = useMutation({
    mutationFn: cancelJob,
    onSuccess: async () => {
      await jobsQuery.refetch();
    },
  });
  const createExportMutation = useMutation({
    mutationFn: createAnalyticsExport,
    onSuccess: async (response) => {
      setLocalExports((current) => [response.data, ...(current ?? exports)]);
      setExportMessage(`Экспорт ${exportLabel[response.data.format]} поставлен в очередь`);
      await Promise.all([workspaceQuery.refetch(), jobsQuery.refetch()]);
    },
  });
  const createScheduleMutation = useMutation({
    mutationFn: createAnalyticsScheduledReport,
    onSuccess: async (response) => {
      setLocalSchedules((current) => [response.data, ...(current ?? schedules)]);
      setScheduleForm({
        email: "analytics@subhub.local",
        format: "PDF",
        frequency: "weekly",
        name: "",
      });
      setScheduleErrors({});
      setScheduleMessage(`Расписание "${response.data.name}" создано`);
      await workspaceQuery.refetch();
    },
  });

  function updateScheduleForm<Key extends keyof ScheduleForm>(
    key: Key,
    value: ScheduleForm[Key],
  ) {
    setScheduleForm((current) => ({ ...current, [key]: value }));
    setScheduleErrors((current) => ({ ...current, [key]: undefined }));
    setScheduleMessage("");
  }

  function updateDashboardForm<Key extends keyof DashboardForm>(
    key: Key,
    value: DashboardForm[Key],
  ) {
    setDashboardForm((current) => ({ ...current, [key]: value }));
    setDashboardErrors((current) => ({ ...current, [key]: undefined }));
    setDashboardMessage("");
  }

  function buildReport() {
    const parsed = reportBuilderSchema.safeParse({ segment: effectiveSegment });

    if (!parsed.success) {
      setReportErrors({ segment: parsed.error.issues[0]?.message });
      setReportMessage("");
      return;
    }

    const nextSegment = parsed.data.segment.trim();
    const nextReport: AnalyticsReport = {
      arpu: nextSegment === "Family" ? "RUB 820" : "RUB 760",
      churn: reportType === "Churn" ? "4.7%" : "3.9%",
      id: `rep-local-${reports.length + 1}`,
      mrr: nextSegment === "Family" ? "RUB 4.8M" : "RUB 13.1M",
      name: `${reportTypeLabel[reportType]} - ${nextSegment}`,
      owner: "Аналитика",
      period,
      segment: nextSegment,
      status: "ready",
    };

    setLocalReports((current) => [nextReport, ...(current ?? reports)]);
    setReportErrors({});
    setReportMessage(
      `Отчет "${reportTypeLabel[reportType]}" по сегменту "${nextSegment}" за период "${period}" готов`,
    );
  }

  function prepareExport(format: AnalyticsExportFormat) {
    setExportMessage("");
    createExportMutation.mutate({
      format,
      period,
      report_type: reportType,
      segment: effectiveSegmentLabel,
    });
  }

  function createSchedule() {
    const parsed = scheduleSchema.safeParse(scheduleForm);

    if (!parsed.success) {
      const nextErrors: ScheduleErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof ScheduleForm | undefined;
        if (key) {
          nextErrors[key] = issue.message;
        }
      }
      setScheduleErrors(nextErrors);
      setScheduleMessage("");
      return;
    }

    setScheduleErrors({});
    setScheduleMessage("");
    createScheduleMutation.mutate({
      format: parsed.data.format,
      frequency: parsed.data.frequency,
      name: parsed.data.name.trim(),
      owner_email: parsed.data.email.trim(),
    });
  }

  function createDashboard() {
    const parsed = dashboardSchema.safeParse(dashboardForm);

    if (!parsed.success) {
      const nextErrors: DashboardErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof DashboardForm | undefined;
        if (key) {
          nextErrors[key] = issue.message;
        }
      }
      setDashboardErrors(nextErrors);
      setDashboardMessage("");
      return;
    }

    const dashboard: AnalyticsCustomDashboard = {
      id: `dash-local-${dashboards.length + 1}`,
      name: parsed.data.name.trim(),
      owner: parsed.data.owner.trim(),
      period: parsed.data.period,
      template: parsed.data.template,
      updated_at: "2026-05-24T10:00:00.000Z",
      widgets: [
        {
          id: `widget-local-${dashboards.length + 1}-1`,
          metric: parsed.data.template === "retention" ? "Удержание" : "MRR",
          title: parsed.data.template === "retention" ? "Удержание" : "Выручка",
          trend: parsed.data.template === "operations" ? "+4 задачи" : "+5.2%",
          value: parsed.data.template === "retention" ? "68%" : "RUB 13.1M",
        },
        {
          id: `widget-local-${dashboards.length + 1}-2`,
          metric: parsed.data.template === "operations" ? "Очередь" : "Отток",
          title: parsed.data.template === "operations" ? "Очередь задач" : "Отток",
          trend: parsed.data.template === "operations" ? "-12%" : "-0.4 п.п.",
          value: parsed.data.template === "operations" ? "24" : "3.9%",
        },
      ],
    };

    setLocalDashboards((current) => [dashboard, ...(current ?? dashboards)]);
    setSelectedDashboardId(dashboard.id);
    setDashboardForm({
      name: "",
      owner: "Аналитика",
      period: "30 дней",
      template: "revenue",
    });
    setDashboardErrors({});
    setDashboardMessage(`Дашборд "${dashboard.name}" создан`);
  }

  if (workspaceQuery.isPending) {
    return (
      <main className="px-4 py-6 lg:px-6">
        <LoadingState label="Загрузка аналитики" />
      </main>
    );
  }

  if (workspaceQuery.isError) {
    return (
      <main className="px-4 py-6 lg:px-6">
        <ErrorState
          message="Аналитические данные временно недоступны. Повторите загрузку мок-данных."
          onRetry={() => void workspaceQuery.refetch()}
          title="Не удалось загрузить аналитику"
        />
      </main>
    );
  }

  if (
    !workspace ||
    (reports.length === 0 &&
      cohorts.length === 0 &&
      exports.length === 0 &&
      schedules.length === 0 &&
      dashboards.length === 0)
  ) {
    return (
      <main className="px-4 py-6 lg:px-6">
        <section className="admin-panel p-6">
          <h1 className="text-[22px] font-bold tracking-normal text-white">Аналитика</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Отчеты, когорты, задания экспорта, расписания и дашборды пока не добавлены.
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
            Аналитика выручки
          </p>
          <h1 className="mt-2 text-[22px] font-bold tracking-normal text-white">Аналитика</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-text-secondary">
            Операционные отчеты, разбор когорт, экспорт CSV/PDF/Excel, почтовые расписания и дашборды для выручки и удержания SubHub.
          </p>
        </div>
        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md admin-gradient px-4 text-sm font-medium text-white shadow-lg shadow-brand-primary/20 transition hover:-translate-y-0.5"
          onClick={buildReport}
          type="button"
        >
          <Plus aria-hidden="true" size={16} />
          Новый отчет
        </button>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <article className="admin-panel p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">MRR</p>
            <TrendingUp aria-hidden="true" className="text-success" size={18} />
          </div>
          <p className="mt-3 text-[22px] font-bold tracking-normal text-white">{workspace.summary.mrr}</p>
          <p className="mt-2 text-sm text-text-secondary">{workspace.summary.mrr_delta}</p>
        </article>
        <article className="admin-panel p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">Отток</p>
            <TrendingDown aria-hidden="true" className="text-warning" size={18} />
          </div>
          <p className="mt-3 text-[22px] font-bold tracking-normal text-white">{workspace.summary.churn}</p>
          <p className="mt-2 text-sm text-text-secondary">{workspace.summary.churn_delta}</p>
        </article>
        <article className="admin-panel p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">Когорты</p>
            <Users aria-hidden="true" className="text-info" size={18} />
          </div>
          <p className="mt-3 text-[22px] font-bold tracking-normal text-white">{cohorts.length}</p>
          <p className="mt-2 text-sm text-text-secondary">
            {formatUsers(totalUsers)} пользователей
          </p>
        </article>
        <article className="admin-panel p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">Расписания</p>
            <Download aria-hidden="true" className="text-brand-primary" size={18} />
          </div>
          <p className="mt-3 text-[22px] font-bold tracking-normal text-white">{schedules.length}</p>
          <p className="mt-2 text-sm text-text-secondary">
            {activeSchedules} активных почтовых отправок
          </p>
        </article>
      </section>

      <section className="mt-6 admin-panel">
        <div className="flex flex-wrap gap-2 border-b border-white/10 p-4">
          {(Object.keys(tabLabel) as AnalyticsTab[]).map((tab) => (
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

        {activeTab === "reports" ? (
          <div className="grid gap-6 p-4 xl:grid-cols-[24rem_minmax(0,1fr)]">
            <section className="admin-panel-elevated p-4">
              <h2 className="text-base font-semibold">Конструктор отчета</h2>
              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className="text-xs text-text-secondary">Период</span>
                  <select
                    aria-label="Период"
                    className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                    onChange={(event) => setPeriod(event.target.value as PeriodOption)}
                    value={period}
                  >
                    <option>30 дней</option>
                    <option>90 дней</option>
                    <option>Год</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs text-text-secondary">Сегмент</span>
                  <select
                    aria-label="Сегмент"
                    className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                    onChange={(event) => setSegment(event.target.value as SegmentOption)}
                    value={segment}
                  >
                    <option value="all">Все пользователи</option>
                    <option value="premium">Premium</option>
                    <option value="family">Family</option>
                    <option value="trial">Пробный период</option>
                    <option value="custom">Свой сегмент</option>
                  </select>
                </label>
                {segment === "custom" ? (
                  <label className="block">
                    <span className="text-xs text-text-secondary">Свой сегмент</span>
                    <input
                      aria-label="Свой сегмент"
                      className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                      onChange={(event) => {
                        setCustomSegment(event.target.value);
                        setReportErrors({});
                      }}
                      value={customSegment}
                    />
                    {reportErrors.segment ? (
                      <span className="mt-1 block text-xs text-danger">
                        {reportErrors.segment}
                      </span>
                    ) : null}
                  </label>
                ) : null}
                <label className="block">
                  <span className="text-xs text-text-secondary">Тип отчета</span>
                  <select
                    aria-label="Тип отчета"
                    className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                    onChange={(event) =>
                      setReportType(event.target.value as AnalyticsReportType)
                    }
                    value={reportType}
                  >
                    <option value="Revenue">Выручка</option>
                    <option value="Retention">Удержание</option>
                    <option value="Services">Сервисы</option>
                    <option value="Churn">Отток</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs text-text-secondary">Группировка</span>
                  <select
                    aria-label="Группировка"
                    className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                    onChange={(event) => setGrouping(event.target.value as GroupingOption)}
                    value={grouping}
                  >
                    <option>Тариф</option>
                    <option>Способ оплаты</option>
                    <option>Платформа</option>
                  </select>
                </label>
              </div>
              <button
                className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md admin-gradient px-3 text-sm font-medium text-white shadow-lg shadow-brand-primary/20 transition hover:-translate-y-0.5"
                onClick={buildReport}
                type="button"
              >
                <RefreshCw aria-hidden="true" size={16} />
                Собрать отчет
              </button>
              {reportMessage ? (
                <p className="mt-3 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
                  {reportMessage}
                </p>
              ) : null}
            </section>

            <section className="space-y-4">
              <div className="admin-panel-elevated p-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-base font-semibold">Срез отчета</h2>
                  <span className="inline-flex items-center gap-2 rounded-md bg-brand-primary/10 px-2 py-1 text-xs text-brand-primary">
                    <Filter aria-hidden="true" size={13} />
                    {grouping}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-lg bg-bg-card p-3">
                    <p className="text-xs text-text-secondary">Период</p>
                    <p className="mt-1 font-medium">{period}</p>
                  </div>
                  <div className="rounded-lg bg-bg-card p-3">
                    <p className="text-xs text-text-secondary">Сегмент</p>
                    <p className="mt-1 font-medium">{effectiveSegmentLabel}</p>
                  </div>
                  <div className="rounded-lg bg-bg-card p-3">
                    <p className="text-xs text-text-secondary">Тип</p>
                    <p className="mt-1 font-medium">{reportTypeLabel[reportType]}</p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-white/[0.06]">
                <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                  <thead className="bg-bg-elevated text-xs uppercase tracking-[0.05em] text-text-disabled">
                    <tr>
                      <th className="p-3" scope="col">Отчет</th>
                      <th className="p-3" scope="col">Период</th>
                      <th className="p-3" scope="col">MRR</th>
                      <th className="p-3" scope="col">Отток</th>
                      <th className="p-3" scope="col">ARPU</th>
                      <th className="p-3" scope="col">Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report) => (
                      <tr className="border-t border-white/[0.06]" key={report.id}>
                        <td className="p-3">
                          <p className="font-medium">{report.name}</p>
                          <p className="mt-1 text-xs text-text-secondary">
                            {report.owner} - {report.segment}
                          </p>
                        </td>
                        <td className="p-3">{report.period}</td>
                        <td className="p-3">{report.mrr}</td>
                        <td className="p-3">{report.churn}</td>
                        <td className="p-3">{report.arpu}</td>
                        <td className="p-3">
                          <span
                            className={cn(
                              "rounded-md px-2 py-1 text-xs",
                              statusClass[report.status],
                            )}
                          >
                            {statusLabel[report.status]}
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

        {activeTab === "cohorts" ? (
          <div className="grid gap-6 p-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
            <div className="overflow-x-auto rounded-lg border border-white/[0.06]">
              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                <thead className="bg-bg-elevated text-xs uppercase tracking-[0.05em] text-text-disabled">
                  <tr>
                    <th className="p-3" scope="col">Когорта</th>
                    <th className="p-3" scope="col">Пользователи</th>
                    <th className="p-3" scope="col">Удержание</th>
                    <th className="p-3" scope="col">Отток</th>
                    <th className="p-3" scope="col">ARPU</th>
                  </tr>
                </thead>
                <tbody>
                  {cohorts.map((cohort) => (
                    <tr
                      className={cn(
                        "cursor-pointer border-t border-white/[0.06] transition hover:bg-bg-elevated/70",
                        selectedCohort?.id === cohort.id ? "bg-bg-elevated" : "",
                      )}
                      key={cohort.id}
                      onClick={() => setSelectedCohortId(cohort.id)}
                    >
                      <td className="p-3 font-medium">{cohort.name}</td>
                      <td className="p-3">{formatUsers(cohort.users)}</td>
                      <td className="p-3 text-success">{cohort.retention}</td>
                      <td className="p-3 text-warning">{cohort.churn}</td>
                      <td className="p-3">{cohort.arpu}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedCohort ? (
              <aside
                className="admin-panel-elevated p-4"
                data-testid="cohort-detail-panel"
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-base font-semibold">{selectedCohort.name}</h2>
                  <LineChart aria-hidden="true" className="text-brand-primary" size={18} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-bg-card p-3">
                    <p className="text-text-secondary">Удержание</p>
                    <p className="mt-1 font-semibold text-success">{selectedCohort.retention}</p>
                  </div>
                  <div className="rounded-lg bg-bg-card p-3">
                    <p className="text-text-secondary">Отток</p>
                    <p className="mt-1 font-semibold text-warning">{selectedCohort.churn}</p>
                  </div>
                  <div className="rounded-lg bg-bg-card p-3">
                    <p className="text-text-secondary">ARPU</p>
                    <p className="mt-1 font-semibold">{selectedCohort.arpu}</p>
                  </div>
                  <div className="rounded-lg bg-bg-card p-3">
                    <p className="text-text-secondary">Пользователи</p>
                    <p className="mt-1 font-semibold">
                      {formatUsers(selectedCohort.users)}
                    </p>
                  </div>
                </div>
                <p className="mt-4 rounded-md border border-info/30 bg-info/10 px-3 py-2 text-sm text-info">
                  Рекомендация: {selectedCohort.recommendation}
                </p>
              </aside>
            ) : null}
          </div>
        ) : null}

        {activeTab === "exports" ? (
          <div className="grid gap-6 p-4 xl:grid-cols-[22rem_minmax(0,1fr)]">
            <div className="space-y-4">
              <section className="admin-panel-elevated p-4">
                <h2 className="text-base font-semibold">Подготовить экспорт</h2>
                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  Экспорт использует текущие параметры: {reportTypeLabel[reportType]},{" "}
                  {effectiveSegmentLabel}, {period}. Активных задач: {activeJobs}.
                </p>
                <div className="mt-4 grid gap-2">
                  {(["CSV", "PDF", "XLSX"] as AnalyticsExportFormat[]).map((format) => (
                    <button
                      className="inline-flex h-10 items-center justify-center gap-2 admin-panel text-sm text-text-secondary transition hover:text-white"
                      key={format}
                      onClick={() => prepareExport(format)}
                      type="button"
                    >
                      <FileSpreadsheet aria-hidden="true" size={16} />
                      Подготовить {exportLabel[format]}
                    </button>
                  ))}
                </div>
                {exportMessage ? (
                  <p className="mt-3 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
                    {exportMessage}
                  </p>
                ) : null}
              </section>

              <section className="admin-panel-elevated p-4">
                <h2 className="text-base font-semibold">Задачи</h2>
                <div className="mt-3 space-y-2">
                  {jobs.map((job) => (
                    <article className="rounded-md border border-white/10 bg-bg-card p-3" key={job.job_id}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">{job.type}</p>
                          <p className="mt-1 text-xs text-text-secondary">{job.status}</p>
                        </div>
                        <button
                          className="h-8 rounded-md border border-danger/30 bg-danger/10 px-3 text-xs text-danger transition hover:bg-danger/20 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={
                            cancelJobMutation.isPending ||
                            (job.status !== "queued" && job.status !== "running")
                          }
                          onClick={() => cancelJobMutation.mutate(job.job_id)}
                          type="button"
                        >
                          Отменить
                        </button>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-bg-elevated">
                        <div
                          className="h-full rounded-full bg-brand-primary"
                          style={{ width: `${Math.min(100, Math.max(0, job.progress_pct))}%` }}
                        />
                      </div>
                      <p className="mt-2 text-xs text-text-secondary">{job.progress_pct}%</p>
                    </article>
                  ))}
                  {jobs.length === 0 ? (
                    <p className="text-sm text-text-secondary">Активных задач нет.</p>
                  ) : null}
                </div>
              </section>
            </div>

            <div className="overflow-x-auto rounded-lg border border-white/[0.06]">
              <table className="w-full min-w-[620px] border-collapse text-left text-sm">
                <thead className="bg-bg-elevated text-xs uppercase tracking-[0.05em] text-text-disabled">
                  <tr>
                    <th className="p-3" scope="col">Название</th>
                    <th className="p-3" scope="col">Формат</th>
                    <th className="p-3" scope="col">Строки</th>
                    <th className="p-3" scope="col">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {exports.map((job) => (
                    <tr className="border-t border-white/[0.06]" key={job.id}>
                      <td className="p-3 font-medium">{job.name}</td>
                      <td className="p-3">{exportLabel[job.format]}</td>
                      <td className="p-3">{job.rows}</td>
                      <td className="p-3 text-text-secondary">{job.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {activeTab === "schedules" ? (
          <div className="grid gap-6 p-4 xl:grid-cols-[24rem_minmax(0,1fr)]">
            <section className="admin-panel-elevated p-4">
              <h2 className="text-base font-semibold">Расписание почтовых отчетов</h2>
              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className="text-xs text-text-secondary">Название расписания</span>
                  <input
                    aria-label="Название расписания"
                    className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                    onChange={(event) => updateScheduleForm("name", event.target.value)}
                    value={scheduleForm.name}
                  />
                  {scheduleErrors.name ? (
                    <span className="mt-1 block text-xs text-danger">
                      {scheduleErrors.name}
                    </span>
                  ) : null}
                </label>
                <label className="block">
                  <span className="text-xs text-text-secondary">Почта получателя</span>
                  <input
                    aria-label="Почта получателя"
                    className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                    onChange={(event) => updateScheduleForm("email", event.target.value)}
                    value={scheduleForm.email}
                  />
                  {scheduleErrors.email ? (
                    <span className="mt-1 block text-xs text-danger">
                      {scheduleErrors.email}
                    </span>
                  ) : null}
                </label>
                <label className="block">
                  <span className="text-xs text-text-secondary">Частота</span>
                  <select
                    aria-label="Частота"
                    className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                    onChange={(event) =>
                      updateScheduleForm(
                        "frequency",
                        event.target.value as AnalyticsScheduleFrequency,
                      )
                    }
                    value={scheduleForm.frequency}
                  >
                    <option value="daily">Ежедневно</option>
                    <option value="weekly">Еженедельно</option>
                    <option value="monthly">Ежемесячно</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs text-text-secondary">Формат</span>
                  <select
                    aria-label="Формат расписания"
                    className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                    onChange={(event) =>
                      updateScheduleForm("format", event.target.value as AnalyticsExportFormat)
                    }
                    value={scheduleForm.format}
                  >
                    <option value="PDF">PDF</option>
                    <option value="XLSX">Excel</option>
                    <option value="CSV">CSV</option>
                  </select>
                </label>
              </div>
              <button
                className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md admin-gradient px-3 text-sm font-medium text-white shadow-lg shadow-brand-primary/20 transition hover:-translate-y-0.5"
                onClick={createSchedule}
                type="button"
              >
                <RefreshCw aria-hidden="true" size={16} />
                Создать расписание
              </button>
              {scheduleMessage ? (
                <p className="mt-3 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
                  {scheduleMessage}
                </p>
              ) : null}
            </section>

            <div className="overflow-x-auto rounded-lg border border-white/[0.06]">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead className="bg-bg-elevated text-xs uppercase tracking-[0.05em] text-text-disabled">
                  <tr>
                    <th className="p-3" scope="col">Расписание</th>
                    <th className="p-3" scope="col">Почта</th>
                    <th className="p-3" scope="col">Частота</th>
                    <th className="p-3" scope="col">Формат</th>
                    <th className="p-3" scope="col">Следующая отправка</th>
                    <th className="p-3" scope="col">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((schedule) => (
                    <tr className="border-t border-white/[0.06]" key={schedule.id}>
                      <td className="p-3 font-medium">{schedule.name}</td>
                      <td className="p-3">{schedule.owner_email}</td>
                      <td className="p-3">{frequencyLabel[schedule.frequency]}</td>
                      <td className="p-3">{exportLabel[schedule.format]}</td>
                      <td className="p-3">{formatDate(schedule.next_run_at)}</td>
                      <td className="p-3 text-text-secondary">{schedule.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {activeTab === "dashboards" ? (
          <div className="grid gap-6 p-4 xl:grid-cols-[24rem_minmax(0,1fr)]">
            <section className="admin-panel-elevated p-4">
              <h2 className="text-base font-semibold">Конструктор дашборда</h2>
              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className="text-xs text-text-secondary">Название дашборда</span>
                  <input
                    aria-label="Название дашборда"
                    className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                    onChange={(event) => updateDashboardForm("name", event.target.value)}
                    value={dashboardForm.name}
                  />
                  {dashboardErrors.name ? (
                    <span className="mt-1 block text-xs text-danger">
                      {dashboardErrors.name}
                    </span>
                  ) : null}
                </label>
                <label className="block">
                  <span className="text-xs text-text-secondary">Владелец</span>
                  <input
                    aria-label="Владелец дашборда"
                    className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                    onChange={(event) => updateDashboardForm("owner", event.target.value)}
                    value={dashboardForm.owner}
                  />
                  {dashboardErrors.owner ? (
                    <span className="mt-1 block text-xs text-danger">
                      {dashboardErrors.owner}
                    </span>
                  ) : null}
                </label>
                <label className="block">
                  <span className="text-xs text-text-secondary">Шаблон</span>
                  <select
                    aria-label="Шаблон дашборда"
                    className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                    onChange={(event) =>
                      updateDashboardForm(
                        "template",
                        event.target.value as AnalyticsDashboardTemplate,
                      )
                    }
                    value={dashboardForm.template}
                  >
                    <option value="revenue">Выручка</option>
                    <option value="retention">Удержание</option>
                    <option value="operations">Операционный</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs text-text-secondary">Период дашборда</span>
                  <select
                    aria-label="Период дашборда"
                    className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                    onChange={(event) =>
                      updateDashboardForm("period", event.target.value as PeriodOption)
                    }
                    value={dashboardForm.period}
                  >
                    <option>30 дней</option>
                    <option>90 дней</option>
                    <option>Год</option>
                  </select>
                </label>
              </div>
              <button
                className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md admin-gradient px-3 text-sm font-medium text-white shadow-lg shadow-brand-primary/20 transition hover:-translate-y-0.5"
                onClick={createDashboard}
                type="button"
              >
                <Plus aria-hidden="true" size={16} />
                Создать дашборд
              </button>
              {dashboardMessage ? (
                <p className="mt-3 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
                  {dashboardMessage}
                </p>
              ) : null}
            </section>

            <section className="space-y-4">
              <div className="overflow-x-auto rounded-lg border border-white/[0.06]">
                <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                  <thead className="bg-bg-elevated text-xs uppercase tracking-[0.05em] text-text-disabled">
                    <tr>
                      <th className="p-3" scope="col">Дашборд</th>
                      <th className="p-3" scope="col">Владелец</th>
                      <th className="p-3" scope="col">Шаблон</th>
                      <th className="p-3" scope="col">Период</th>
                      <th className="p-3" scope="col">Обновлен</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboards.map((dashboard) => (
                      <tr
                        className={cn(
                          "cursor-pointer border-t border-white/[0.06] transition hover:bg-bg-elevated/70",
                          selectedDashboard?.id === dashboard.id ? "bg-bg-elevated" : "",
                        )}
                        key={dashboard.id}
                        onClick={() => setSelectedDashboardId(dashboard.id)}
                      >
                        <td className="p-3 font-medium">{dashboard.name}</td>
                        <td className="p-3">{dashboard.owner}</td>
                        <td className="p-3">{dashboardTemplateLabel[dashboard.template]}</td>
                        <td className="p-3">{dashboard.period}</td>
                        <td className="p-3">{formatDate(dashboard.updated_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedDashboard ? (
                <div className="admin-panel-elevated p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-semibold">{selectedDashboard.name}</h2>
                      <p className="mt-1 text-sm text-text-secondary">
                        {selectedDashboard.owner} - {dashboardTemplateLabel[selectedDashboard.template]}
                      </p>
                    </div>
                    <LineChart aria-hidden="true" className="text-brand-primary" size={18} />
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {selectedDashboard.widgets.map((widget) => (
                      <article className="rounded-lg bg-bg-card p-3" key={widget.id}>
                        <p className="text-xs text-text-secondary">{widget.title}</p>
                        <p className="mt-2 text-xl font-semibold">{widget.value}</p>
                        <p className="mt-1 text-sm text-success">{widget.trend}</p>
                      </article>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>
          </div>
        ) : null}
      </section>
    </main>
  );
}
