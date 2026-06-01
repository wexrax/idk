"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Check,
  ChevronRight,
  Filter,
  Gauge,
  Gift,
  Mail,
  Play,
  Plus,
  Settings,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ModuleTone = "danger" | "info" | "success" | "warning";

type ModuleMetric = {
  label: string;
  value: string;
  detail: string;
  tone: ModuleTone;
};

type ModuleSegment = {
  label: string;
  value: string;
};

type ModuleRecord = {
  id: string;
  name: string;
  owner: string;
  status: string;
  metric: string;
  nextStep: string;
  updatedAt: string;
};

type ModuleEvent = {
  label: string;
  detail: string;
  time: string;
};

type ModuleAction = {
  label: string;
  helper: string;
  fields: string[];
};

export type AdminModuleConfig = {
  title: string;
  description: string;
  icon: typeof Activity;
  primaryAction: string;
  filters: string[];
  metrics: ModuleMetric[];
  segments: ModuleSegment[];
  records: ModuleRecord[];
  events: ModuleEvent[];
  action: ModuleAction;
};

const toneClass: Record<ModuleTone, string> = {
  danger: "border-danger/40 bg-danger/10 text-danger",
  info: "border-info/40 bg-info/10 text-info",
  success: "border-success/40 bg-success/10 text-success",
  warning: "border-warning/40 bg-warning/10 text-warning",
};

const statusClass: Record<string, string> = {
  active: "bg-success/10 text-success",
  draft: "bg-muted/20 text-text-secondary",
  paused: "bg-warning/10 text-warning",
  review: "bg-info/10 text-info",
  risk: "bg-danger/10 text-danger",
};

function getStatusTone(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes("риск") || normalized.includes("требует")) {
    return statusClass.risk;
  }

  if (normalized.includes("актив") || normalized.includes("готов")) {
    return statusClass.active;
  }

  if (normalized.includes("пауза") || normalized.includes("чернов")) {
    return statusClass.paused;
  }

  return statusClass.review;
}

export const adminModuleConfigs = {
  analytics: {
    action: {
      fields: ["Период", "Сегмент", "Формат"],
      helper: "Собирает выгрузку по MRR, когортам и сервисам за выбранный период.",
      label: "Собрать отчет",
    },
    description:
      "Операционная аналитика подписок, сервисов, выручки и поведения пользователей.",
    events: [
      {
        detail: "MRR за май обновлен после сверки платежей.",
        label: "Финансовый снимок готов",
        time: "09:40",
      },
      {
        detail: "В сегменте Family выросла доля годовых оплат.",
        label: "Когортный сдвиг",
        time: "08:55",
      },
      {
        detail: "CSV по отказам от подписок поставлен в очередь.",
        label: "Экспорт",
        time: "Вчера",
      },
    ],
    filters: ["30 дней", "90 дней", "Год", "Enterprise"],
    icon: Gauge,
    metrics: [
      { detail: "+8,4% к прошлому периоду", label: "MRR", tone: "success", value: "12,8 млн ₽" },
      { detail: "Среднее по активным тарифам", label: "ARPU", tone: "info", value: "742 ₽" },
      { detail: "-0,6 п.п.", label: "Churn", tone: "success", value: "4,1%" },
    ],
    primaryAction: "Новый отчет",
    records: [
      {
        id: "rep-001",
        metric: "12,8 млн ₽",
        name: "MRR по тарифам",
        nextStep: "Проверить вклад Robokassa",
        owner: "Финансы",
        status: "Готов",
        updatedAt: "10 мин назад",
      },
      {
        id: "rep-002",
        metric: "18 когорт",
        name: "Retention по онбордингу",
        nextStep: "Сравнить iOS и Android",
        owner: "Аналитика",
        status: "В проверке",
        updatedAt: "42 мин назад",
      },
      {
        id: "rep-003",
        metric: "7 сервисов",
        name: "Топ внешних сервисов",
        nextStep: "Экспортировать CSV",
        owner: "Продукт",
        status: "Активно",
        updatedAt: "Сегодня",
      },
    ],
    segments: [
      { label: "Платежные отчеты", value: "14" },
      { label: "Когорты", value: "18" },
      { label: "Экспорты", value: "6" },
    ],
    title: "Аналитика",
  },
  gamification: {
    action: {
      fields: ["Событие", "Баллы", "Лимит"],
      helper: "Обновляет правило начисления баллов и показывает эффект до публикации.",
      label: "Настроить правило",
    },
    description:
      "Баллы, достижения и магазин наград для удержания пользователей SubHub.",
    events: [
      {
        detail: "Награда «Месяц Premium» закончится при текущем спросе за 5 дней.",
        label: "Склад наград",
        time: "11:10",
      },
      {
        detail: "Достижение за первую оплату прошло модерацию.",
        label: "Достижение готово",
        time: "09:15",
      },
      {
        detail: "Правило за ежедневный вход временно снижено до 3 баллов.",
        label: "Баланс экономики",
        time: "Вчера",
      },
    ],
    filters: ["Активные", "Черновики", "Награды", "Достижения"],
    icon: Gift,
    metrics: [
      { detail: "+14% за неделю", label: "Начислено баллов", tone: "success", value: "2,4 млн" },
      { detail: "Средняя цена обмена", label: "Стоимость награды", tone: "info", value: "860" },
      { detail: "Нужно пополнение", label: "Низкий склад", tone: "warning", value: "3" },
    ],
    primaryAction: "Новое правило",
    records: [
      {
        id: "game-001",
        metric: "+50 баллов",
        name: "Первая успешная оплата",
        nextStep: "Опубликовать в мобильном приложении",
        owner: "Growth",
        status: "Готово",
        updatedAt: "15 мин назад",
      },
      {
        id: "game-002",
        metric: "1 240 обменов",
        name: "Магазин наград",
        nextStep: "Пополнить Premium купоны",
        owner: "Маркетинг",
        status: "Требует внимания",
        updatedAt: "1 час назад",
      },
      {
        id: "game-003",
        metric: "32%",
        name: "Серия ежедневных входов",
        nextStep: "Проверить удержание D7",
        owner: "Продукт",
        status: "Активно",
        updatedAt: "Сегодня",
      },
    ],
    segments: [
      { label: "Правила баллов", value: "12" },
      { label: "Достижения", value: "24" },
      { label: "Награды", value: "9" },
    ],
    title: "Геймификация",
  },
  marketing: {
    action: {
      fields: ["Канал", "Сегмент", "Время отправки"],
      helper: "Создает кампанию с предпросмотром аудитории и лимитом частоты.",
      label: "Собрать кампанию",
    },
    description:
      "Рассылки, промокоды и сегменты для коммуникаций с пользователями мобильного приложения.",
    events: [
      {
        detail: "Push про истекающую подписку готов к отправке на 18:00.",
        label: "Кампания запланирована",
        time: "12:05",
      },
      {
        detail: "Промокод MAYPREMIUM достиг 71% лимита использований.",
        label: "Лимит промокода",
        time: "10:24",
      },
      {
        detail: "Сегмент «Спящие 14 дней» обновился после ночной синхронизации.",
        label: "Сегмент пересчитан",
        time: "08:00",
      },
    ],
    filters: ["Все", "Push", "Email", "Промокоды"],
    icon: Mail,
    metrics: [
      { detail: "+5,8% к прошлой неделе", label: "Открытия", tone: "success", value: "42,7%" },
      { detail: "После push-цепочек", label: "Возвраты", tone: "info", value: "8 420" },
      { detail: "Лимиты частоты соблюдены", label: "Активные кампании", tone: "warning", value: "11" },
    ],
    primaryAction: "Новая кампания",
    records: [
      {
        id: "mkt-001",
        metric: "128 тыс.",
        name: "Renewal push D-3",
        nextStep: "Проверить A/B тему",
        owner: "CRM",
        status: "Активно",
        updatedAt: "5 мин назад",
      },
      {
        id: "mkt-002",
        metric: "15%",
        name: "MAYPREMIUM",
        nextStep: "Ограничить тариф Family",
        owner: "Growth",
        status: "В проверке",
        updatedAt: "36 мин назад",
      },
      {
        id: "mkt-003",
        metric: "42 тыс.",
        name: "Спящие 14 дней",
        nextStep: "Запустить win-back",
        owner: "CRM",
        status: "Черновик",
        updatedAt: "Сегодня",
      },
    ],
    segments: [
      { label: "Сегменты", value: "18" },
      { label: "Кампании", value: "11" },
      { label: "Промокоды", value: "7" },
    ],
    title: "Маркетинг",
  },
  security: {
    action: {
      fields: ["Роль", "Разрешение", "Срок доступа"],
      helper: "Создает изменение RBAC с обязательной записью в audit log.",
      label: "Изменить доступ",
    },
    description:
      "Контроль доступа, аудит действий администраторов и настройки безопасности.",
    events: [
      {
        detail: "Финансовая роль получила доступ только на чтение к платежным шлюзам.",
        label: "RBAC обновлен",
        time: "13:10",
      },
      {
        detail: "Подозрительная сессия завершена после смены IP.",
        label: "Сессия закрыта",
        time: "11:42",
      },
      {
        detail: "2FA включена для нового администратора поддержки.",
        label: "2FA",
        time: "Вчера",
      },
    ],
    filters: ["RBAC", "Audit log", "2FA", "Сессии"],
    icon: ShieldCheck,
    metrics: [
      { detail: "Без критичных событий", label: "События аудита", tone: "success", value: "284" },
      { detail: "Ожидают ревью", label: "Запросы доступа", tone: "warning", value: "3" },
      { detail: "Администраторы", label: "2FA покрытие", tone: "info", value: "96%" },
    ],
    primaryAction: "Новый доступ",
    records: [
      {
        id: "sec-001",
        metric: "read-only",
        name: "Финансовый менеджер",
        nextStep: "Подтвердить матрицу ролей",
        owner: "Security",
        status: "В проверке",
        updatedAt: "20 мин назад",
      },
      {
        id: "sec-002",
        metric: "184 события",
        name: "Audit log за сегодня",
        nextStep: "Экспортировать для ревью",
        owner: "Security",
        status: "Активно",
        updatedAt: "35 мин назад",
      },
      {
        id: "sec-003",
        metric: "3 сессии",
        name: "Сессии без 2FA",
        nextStep: "Принудительно запросить 2FA",
        owner: "Admin",
        status: "Требует внимания",
        updatedAt: "Сегодня",
      },
    ],
    segments: [
      { label: "Роли", value: "8" },
      { label: "Админы", value: "26" },
      { label: "События", value: "284" },
    ],
    title: "Безопасность",
  },
  settings: {
    action: {
      fields: ["Раздел", "Значение", "Среда"],
      helper: "Сохраняет изменение как черновик конфигурации до публикации.",
      label: "Изменить настройку",
    },
    description:
      "Системные настройки, интеграции и пороги оповещений для админ-консоли.",
    events: [
      {
        detail: "Порог churn anomaly снижен до 5,5% для ранних предупреждений.",
        label: "Порог обновлен",
        time: "12:40",
      },
      {
        detail: "Stripe переведен в тестовый режим для проверки webhooks.",
        label: "Интеграция",
        time: "10:10",
      },
      {
        detail: "Валюта отчетов оставлена RUB для всех финансовых модулей.",
        label: "Финансовая настройка",
        time: "Вчера",
      },
    ],
    filters: ["Общие", "Интеграции", "Пороги", "Уведомления"],
    icon: Settings,
    metrics: [
      { detail: "Требуют проверки", label: "Интеграции", tone: "warning", value: "2" },
      { detail: "Используются в алертах", label: "Пороги", tone: "info", value: "9" },
      { detail: "Готовы к публикации", label: "Черновики", tone: "success", value: "4" },
    ],
    primaryAction: "Новая настройка",
    records: [
      {
        id: "set-001",
        metric: "5,5%",
        name: "Churn anomaly threshold",
        nextStep: "Опубликовать после ревью",
        owner: "Admin",
        status: "В проверке",
        updatedAt: "18 мин назад",
      },
      {
        id: "set-002",
        metric: "test",
        name: "Stripe webhooks",
        nextStep: "Проверить retry policy",
        owner: "Интеграции",
        status: "Активно",
        updatedAt: "1 час назад",
      },
      {
        id: "set-003",
        metric: "RUB",
        name: "Валюта отчетов",
        nextStep: "Синхронизировать с биллингом",
        owner: "Финансы",
        status: "Готово",
        updatedAt: "Сегодня",
      },
    ],
    segments: [
      { label: "Интеграции", value: "12" },
      { label: "Пороги", value: "9" },
      { label: "Черновики", value: "4" },
    ],
    title: "Настройки",
  },
  smartAnalytics: {
    action: {
      fields: ["Изменение цены", "Churn delta", "Горизонт"],
      helper: "Пересчитывает what-if сценарий и показывает прогноз MRR/LTV.",
      label: "Запустить сценарий",
    },
    description:
      "Прогнозы, what-if сценарии, churn risk модели и автоматизации удержания.",
    events: [
      {
        detail: "Сценарий +8% к цене дает +1,1 млн ₽ MRR при churn +0,4 п.п.",
        label: "What-if готов",
        time: "12:18",
      },
      {
        detail: "820 пользователей попали в высокий риск оттока.",
        label: "Churn prediction",
        time: "03:00",
      },
      {
        detail: "Автоматизация win-back ожидает подтверждения шаблона push.",
        label: "Автоматизация",
        time: "Вчера",
      },
    ],
    filters: ["What-if", "Churn", "A/B тесты", "Автоматизации"],
    icon: Sparkles,
    metrics: [
      { detail: "После сценария +8% цены", label: "Projected MRR", tone: "success", value: "13,9 млн ₽" },
      { detail: "Высокий риск", label: "Churn users", tone: "danger", value: "820" },
      { detail: "Работают без ошибок", label: "Автоматизации", tone: "info", value: "6" },
    ],
    primaryAction: "Новый сценарий",
    records: [
      {
        id: "ml-001",
        metric: "+8% price",
        name: "Premium pricing what-if",
        nextStep: "Согласовать с финансами",
        owner: "Аналитика",
        status: "В проверке",
        updatedAt: "22 мин назад",
      },
      {
        id: "ml-002",
        metric: "0,82 risk",
        name: "High churn cohort",
        nextStep: "Отправить win-back",
        owner: "CRM",
        status: "Требует внимания",
        updatedAt: "Сегодня",
      },
      {
        id: "ml-003",
        metric: "6 активных",
        name: "Automation builder",
        nextStep: "Проверить задержки",
        owner: "Growth",
        status: "Активно",
        updatedAt: "Вчера",
      },
    ],
    segments: [
      { label: "Сценарии", value: "10" },
      { label: "ML модели", value: "3" },
      { label: "Автоматизации", value: "6" },
    ],
    title: "Умная аналитика",
  },
} satisfies Record<string, AdminModuleConfig>;

type AdminModuleWorkspaceProps = {
  config: AdminModuleConfig;
};

export function AdminModuleWorkspace({ config }: AdminModuleWorkspaceProps) {
  const [activeFilter, setActiveFilter] = useState(config.filters[0] ?? "");
  const [selectedId, setSelectedId] = useState(config.records[0]?.id ?? "");
  const [isPreviewReady, setIsPreviewReady] = useState(false);

  const selectedRecord = useMemo(
    () =>
      config.records.find((record) => record.id === selectedId) ??
      config.records[0] ??
      {
        id: "",
        name: "Нет записей",
        owner: "",
        status: "",
        metric: "",
        nextStep: "",
        updatedAt: "",
      },
    [config.records, selectedId],
  );
  const Icon = config.icon;

  return (
    <main className="px-4 py-6 lg:px-6">
      <header className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-md border border-brand-primary/30 bg-brand-primary/10 text-brand-primary">
              <Icon aria-hidden="true" size={20} />
            </span>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-disabled">
              Contract-first workspace
            </p>
          </div>
          <h1 className="mt-4 text-[22px] font-bold tracking-normal text-white">{config.title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-text-secondary">
            {config.description}
          </p>
        </div>
        <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md admin-gradient px-4 text-sm font-medium text-white shadow-lg shadow-brand-primary/20 transition hover:-translate-y-0.5">
          <Plus aria-hidden="true" size={16} />
          {config.primaryAction}
        </button>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {config.metrics.map((metric) => (
          <article
            className="admin-panel p-4"
            key={metric.label}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-text-secondary">{metric.label}</p>
                <p className="mt-2 text-[22px] font-bold tracking-normal text-white">{metric.value}</p>
              </div>
              <span className={cn("rounded-md border px-2 py-1 text-xs", toneClass[metric.tone])}>
                <ArrowUpRight aria-hidden="true" size={14} />
              </span>
            </div>
            <p className="mt-3 text-sm text-text-secondary">{metric.detail}</p>
          </article>
        ))}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="admin-panel">
          <div className="flex flex-col gap-4 border-b border-white/10 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-semibold text-text-primary">Рабочая очередь</h2>
              <p className="mt-1 text-sm text-text-secondary">
                Фильтры, статусы и следующий шаг по объектам раздела.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {config.filters.map((filter) => (
                <button
                  className={cn(
                    "inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm transition",
                    activeFilter === filter
                      ? "border-brand-primary bg-brand-primary/10 text-text-primary"
                      : "border-white/10 bg-bg-elevated text-text-secondary hover:text-white",
                  )}
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  type="button"
                >
                  <Filter aria-hidden="true" size={14} />
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-left text-sm">
              <thead className="text-text-secondary">
                <tr>
                  <th className="p-4 font-medium" scope="col">Название</th>
                  <th className="p-4 font-medium" scope="col">Владелец</th>
                  <th className="p-4 font-medium" scope="col">Метрика</th>
                  <th className="p-4 font-medium" scope="col">Статус</th>
                  <th className="p-4 font-medium" scope="col">Следующий шаг</th>
                </tr>
              </thead>
              <tbody>
                {config.records.map((record) => (
                  <tr
                    className={cn(
                      "cursor-pointer border-t border-white/[0.06] transition hover:bg-bg-elevated/70",
                      selectedRecord.id === record.id ? "bg-bg-elevated" : "",
                    )}
                    key={record.id}
                    onClick={() => setSelectedId(record.id)}
                  >
                    <td className="p-4">
                      <div className="font-medium text-text-primary">{record.name}</div>
                      <div className="mt-1 text-xs text-text-secondary">{record.updatedAt}</div>
                    </td>
                    <td className="p-4 text-text-secondary">{record.owner}</td>
                    <td className="p-4 font-medium text-text-primary">{record.metric}</td>
                    <td className="p-4">
                      <span className={cn("rounded-md px-2 py-1 text-xs", getStatusTone(record.status))}>
                        {record.status}
                      </span>
                    </td>
                    <td className="p-4 text-text-secondary">
                      <span className="inline-flex items-center gap-2">
                        {record.nextStep}
                        <ChevronRight aria-hidden="true" size={14} />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="space-y-6">
          <section className="admin-panel p-4">
            <h2 className="text-base font-semibold text-text-primary">Срез раздела</h2>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {config.segments.map((segment) => (
                <div className="rounded-lg bg-bg-elevated p-3" key={segment.label}>
                  <p className="text-lg font-semibold text-text-primary">{segment.value}</p>
                  <p className="mt-1 text-xs text-text-secondary">{segment.label}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="admin-panel p-4">
            <h2 className="text-base font-semibold text-text-primary">{config.action.label}</h2>
            <p className="mt-2 text-sm leading-6 text-text-secondary">{config.action.helper}</p>
            <div className="mt-4 space-y-3">
              {config.action.fields.map((field) => (
                <label className="block" key={field}>
                  <span className="text-xs text-text-secondary">{field}</span>
                  <input
                    className="mt-1 h-10 w-full admin-panel-elevated px-3 text-sm text-text-primary outline-none transition placeholder:text-text-disabled focus:border-brand-primary"
                    placeholder={`${field}: ${selectedRecord.metric}`}
                    readOnly
                  />
                </label>
              ))}
            </div>
            <button
              className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-brand-primary/40 bg-brand-primary/10 text-sm font-medium text-text-primary transition hover:bg-brand-primary/20"
              onClick={() => setIsPreviewReady(true)}
              type="button"
            >
              <Play aria-hidden="true" size={16} />
              Предпросмотр
            </button>
            {isPreviewReady ? (
              <p className="mt-3 inline-flex items-center gap-2 text-sm text-success">
                <Check aria-hidden="true" size={16} />
                Preview готов для «{selectedRecord.name}»
              </p>
            ) : null}
          </section>

          <section className="admin-panel p-4">
            <h2 className="text-base font-semibold text-text-primary">Последние события</h2>
            <ol className="mt-4 space-y-4">
              {config.events.map((event) => (
                <li className="grid grid-cols-[1rem_minmax(0,1fr)] gap-3" key={`${event.label}-${event.time}`}>
                  <span className="mt-1 size-2 rounded-full bg-brand-primary" />
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-text-primary">{event.label}</p>
                      <time className="text-xs text-text-secondary">{event.time}</time>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-text-secondary">{event.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </section>
    </main>
  );
}

export function ModulePlaceholder({ config }: AdminModuleWorkspaceProps) {
  return <AdminModuleWorkspace config={config} />;
}
