"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Circle, Download, ExternalLink, FileDown, Filter, Mail, RotateCcw, Search, Shield, ShieldOff } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ChurnRiskBadge, UserStatusBadge } from "@/components/ui/status-badge";
import { PageHeader, StatusChip } from "@/components/ui/admin-primitives";
import { ErrorState } from "@/components/ui/error-state";
import type { ChurnRisk, UserRow } from "@/lib/api/contracts";
import { bulkUserAction, exportUsers, getUsers } from "@/lib/api/client";
import { cn, formatCurrencyRub } from "@/lib/utils";

type QuickFilter = "all" | "pro" | "trial" | "overdue" | "risk";

const userMeta: Record<string, { age: string; gender: string; region: string; shortId: string }> = {
  usr_anna_morozova: { age: "35-44", gender: "Мужской", region: "Москва", shortId: "U-00001" },
  usr_ilya_sokolov: { age: "25-34", gender: "Женский", region: "СПб", shortId: "U-00002" },
  usr_maria_volkova: { age: "35-44", gender: "Мужской", region: "Казань", shortId: "U-00003" },
  usr_oleg_petrov: { age: "25-34", gender: "Женский", region: "Новосибирск", shortId: "U-00004" },
};

const quickFilters: { label: string; tone?: "danger" | "success" | "warning"; value: QuickFilter }[] = [
  { label: "Все", tone: "success", value: "all" },
  { label: "Pro-тариф", value: "pro" },
  { label: "Триал", value: "trial" },
  { label: "Просрочка", value: "overdue" },
  { label: "Высокий риск оттока", tone: "danger", value: "risk" },
];

function selectClassName() {
  return "admin-focus h-9 w-full rounded-lg border border-white/[0.08] bg-bg-elevated px-3 text-xs font-semibold text-white outline-none";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part.at(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getRiskLabel(risk: ChurnRisk) {
  if (risk === "high") {
    return "Высокий";
  }

  if (risk === "medium") {
    return "Средний";
  }

  return "Низкий";
}

function passesQuickFilter(user: UserRow, filter: QuickFilter) {
  if (filter === "all") {
    return true;
  }

  if (filter === "pro") {
    return user.tariff.toLowerCase().includes("pro") || user.tariff_id.includes("ultimate");
  }

  if (filter === "trial") {
    return user.status === "trial";
  }

  if (filter === "overdue") {
    return user.status === "blocked" || user.mrr === 0;
  }

  return user.churn_risk === "high";
}

export function UsersClient() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("all");
  const [age, setAge] = useState("all");
  const [gender, setGender] = useState("all");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [actionMessage, setActionMessage] = useState("");
  const params = useMemo(
    () => ({ page: 1, per_page: 25, search: search || undefined }),
    [search],
  );
  const users = useQuery({
    queryFn: () => getUsers(params),
    queryKey: ["users", params],
  });

  const rows = useMemo(
    () =>
      (users.data?.data.items ?? []).filter((user) => {
        const meta = userMeta[user.id];

        return (
          passesQuickFilter(user, quickFilter) &&
          (region === "all" || meta?.region === region) &&
          (age === "all" || meta?.age === age) &&
          (gender === "all" || meta?.gender === gender)
        );
      }),
    [age, gender, quickFilter, region, users.data?.data.items],
  );
  const visibleUserIds = useMemo(() => rows.map((row) => row.id), [rows]);
  const selectedVisibleCount = visibleUserIds.filter((id) => selectedUserIds.includes(id)).length;
  const allVisibleSelected = visibleUserIds.length > 0 && selectedVisibleCount === visibleUserIds.length;
  const currentPageUsers = users.data?.data.items ?? [];
  const activeUsersOnPage = currentPageUsers.filter((user) => user.status === "active").length;
  const payingUsersOnPage = currentPageUsers.filter((user) => user.mrr > 0).length;
  const usersDescription = users.isPending
    ? "Загрузка данных из API"
    : users.isError
      ? "API users вернул ошибку; проверьте авторизацию и права users:read"
      : `Всего: ${(users.data?.data.total ?? 0).toLocaleString("ru-RU")} · На странице активных: ${activeUsersOnPage.toLocaleString("ru-RU")} · Платящих: ${payingUsersOnPage.toLocaleString("ru-RU")}`;

  const exportMutation = useMutation({
    mutationFn: exportUsers,
    onError: () => {
      setActionMessage("Не удалось поставить export пользователей в очередь");
    },
    onSuccess: (result) => {
      setActionMessage(`Export пользователей поставлен в очередь: ${result.data.job_id}`);
    },
  });
  const bulkMutation = useMutation({
    mutationFn: bulkUserAction,
    onError: () => {
      setActionMessage("Не удалось выполнить bulk action через API");
    },
    onSuccess: async (result) => {
      setSelectedUserIds([]);
      setActionMessage(
        `Bulk action поставлен в очередь: ${result.data.updated} пользователей`,
      );
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  function resetFilters() {
    setRegion("all");
    setAge("all");
    setGender("all");
    setQuickFilter("all");
  }

  function toggleUserSelection(userId: string) {
    setSelectedUserIds((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId],
    );
  }

  function toggleVisibleSelection() {
    setSelectedUserIds((current) => {
      if (allVisibleSelected) {
        return current.filter((id) => !visibleUserIds.includes(id));
      }

      return Array.from(new Set([...current, ...visibleUserIds]));
    });
  }

  function runBulkAction(action: "block" | "unblock") {
    bulkMutation.mutate({
      action,
      user_ids: selectedUserIds,
    });
  }

  return (
    <div className="space-y-3">
      <PageHeader
        actions={
          <>
            <button
              className="admin-focus inline-flex h-8 items-center gap-2 rounded-lg border border-white/[0.06] bg-bg-elevated px-3 text-xs font-semibold text-text-secondary hover:bg-bg-overlay hover:text-white"
              onClick={() => {
                setQuickFilter("risk");
                setActionMessage("Сегмент высокого риска применен к текущей live-выборке");
              }}
              type="button"
            >
              <Filter aria-hidden className="h-4 w-4" />
              Сегменты
            </button>
            <button
              className="admin-focus inline-flex h-8 items-center gap-2 rounded-lg border border-white/[0.06] bg-bg-elevated px-3 text-xs font-semibold text-text-secondary hover:bg-bg-overlay hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={exportMutation.isPending}
              onClick={() => exportMutation.mutate()}
              type="button"
            >
              <FileDown aria-hidden className="h-4 w-4" />
              Экспорт CSV
            </button>
            <Link
              className="admin-gradient admin-focus inline-flex h-8 items-center gap-2 rounded-lg px-3 text-xs font-semibold text-white shadow-lg shadow-brand-primary/20"
              href="/marketing"
            >
              <Mail aria-hidden className="h-4 w-4" />
              Создать рассылку
            </Link>
          </>
        }
        description={usersDescription}
        title="Пользователи (CRM)"
      />

      <label className="sr-only">
        Поиск пользователя
        <Search aria-hidden className="h-4 w-4" />
        <input
          aria-label="Поиск пользователя"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Имя или email"
          value={search}
        />
      </label>

      <section className="admin-panel p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_1fr]">
          <label className="space-y-1.5">
            <span className="text-[11px] font-semibold text-text-secondary">Регион</span>
            <select
              aria-label="Регион"
              className={selectClassName()}
              onChange={(event) => setRegion(event.target.value)}
              value={region}
            >
              <option value="all">Все регионы</option>
              <option value="Москва">Москва</option>
              <option value="СПб">СПб</option>
              <option value="Казань">Казань</option>
              <option value="Новосибирск">Новосибирск</option>
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-[11px] font-semibold text-text-secondary">Возраст</span>
            <select
              aria-label="Возраст"
              className={selectClassName()}
              onChange={(event) => setAge(event.target.value)}
              value={age}
            >
              <option value="all">Любой</option>
              <option value="18-24">18-24</option>
              <option value="25-34">25-34</option>
              <option value="35-44">35-44</option>
              <option value="45+">45+</option>
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-[11px] font-semibold text-text-secondary">Пол</span>
            <select
              aria-label="Пол"
              className={selectClassName()}
              onChange={(event) => setGender(event.target.value)}
              value={gender}
            >
              <option value="all">Все</option>
              <option value="Мужской">Мужской</option>
              <option value="Женский">Женский</option>
            </select>
          </label>
          <div className="flex items-end">
            <button
              className="admin-focus inline-flex h-9 w-full items-center gap-2 rounded-lg border border-white/[0.08] bg-bg-elevated px-3 text-xs font-semibold text-white hover:bg-bg-overlay"
              onClick={resetFilters}
              type="button"
            >
              <RotateCcw aria-hidden className="h-4 w-4" />
              Сбросить
            </button>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        {quickFilters.map((filter) => (
          <button
            className={cn(
              "admin-focus inline-flex h-8 items-center gap-2 rounded-lg border px-3 text-xs font-semibold",
              quickFilter === filter.value
                ? "border-brand-primary/40 bg-brand-primary/20 text-white"
                : "border-white/[0.08] bg-bg-elevated text-text-secondary hover:bg-bg-overlay hover:text-white",
            )}
            key={filter.value}
            onClick={() => setQuickFilter(filter.value)}
            type="button"
          >
            <Circle
              aria-hidden
              className={cn(
                "h-2 w-2 fill-current",
                filter.tone === "danger"
                  ? "text-danger"
                  : filter.tone === "warning"
                    ? "text-warning"
                    : filter.tone === "success"
                      ? "text-success"
                      : "text-text-disabled",
              )}
            />
            {filter.label}
          </button>
        ))}
      </div>

      <section className="admin-panel flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="text-sm text-text-secondary">
          Выбрано: <span className="font-semibold text-white">{selectedUserIds.length}</span>
          {actionMessage ? (
            <p className="mt-1 text-xs text-info">{actionMessage}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="admin-focus inline-flex h-9 items-center gap-2 rounded-lg border border-white/[0.08] bg-bg-elevated px-3 text-xs font-semibold text-white hover:bg-bg-overlay disabled:cursor-not-allowed disabled:opacity-60"
            disabled={exportMutation.isPending}
            onClick={() => exportMutation.mutate()}
            type="button"
          >
            <Download aria-hidden className="h-4 w-4" />
            Export CSV
          </button>
          <button
            className="admin-focus inline-flex h-9 items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3 text-xs font-semibold text-danger hover:bg-danger/20 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={bulkMutation.isPending || selectedUserIds.length === 0}
            onClick={() => runBulkAction("block")}
            type="button"
          >
            <ShieldOff aria-hidden className="h-4 w-4" />
            Block
          </button>
          <button
            className="admin-focus inline-flex h-9 items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 text-xs font-semibold text-success hover:bg-success/20 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={bulkMutation.isPending || selectedUserIds.length === 0}
            onClick={() => runBulkAction("unblock")}
            type="button"
          >
            <Shield aria-hidden className="h-4 w-4" />
            Unblock
          </button>
        </div>
      </section>

      {users.isError ? (
        <ErrorState
          message="Backend вернул ошибку для списка пользователей. Если это 401 Unauthorized, войдите заново админом с правом users:read."
          onRetry={() => void users.refetch()}
          title="Не удалось загрузить пользователей из API"
        />
      ) : null}

      <div className="admin-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] border-collapse text-left text-xs">
            <thead className="bg-bg-elevated/70 uppercase tracking-[0.08em] text-text-disabled">
              <tr>
                <th className="w-10 px-3 py-3" scope="col">
                  <input
                    aria-label="Выбрать всех пользователей"
                    checked={allVisibleSelected}
                    onChange={toggleVisibleSelection}
                    type="checkbox"
                  />
                </th>
                <th className="px-3 py-3" scope="col">ID</th>
                <th className="px-3 py-3" scope="col">Пользователь</th>
                <th className="px-3 py-3" scope="col">Тариф</th>
                <th className="px-3 py-3" scope="col">Возраст</th>
                <th className="px-3 py-3" scope="col">Пол</th>
                <th className="px-3 py-3" scope="col">LTV</th>
                <th className="px-3 py-3" scope="col">Регион</th>
                <th className="px-3 py-3" scope="col">Риск</th>
                <th className="px-3 py-3" scope="col">Регистрация</th>
                <th className="w-14 px-3 py-3" scope="col">
                  <span className="sr-only">Открыть профиль</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item, index) => {
                const meta =
                  userMeta[item.id] ?? {
                    age: "25-34",
                    gender: "Женский",
                    region: "Москва",
                    shortId: `U-${String(index + 1).padStart(5, "0")}`,
                  };

                return (
                  <tr
                    className="border-t border-white/[0.06] font-semibold text-text-secondary transition hover:bg-white/[0.03]"
                    key={item.id}
                  >
                    <td className="px-3 py-3">
                      <input
                        aria-label={`Выбрать ${item.name}`}
                        checked={selectedUserIds.includes(item.id)}
                        onChange={() => toggleUserSelection(item.id)}
                        type="checkbox"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <Link className="text-brand-primary hover:text-brand-secondary" href={`/users/${item.id}`}>
                        {meta.shortId}
                      </Link>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <span className="admin-gradient grid h-7 w-7 place-items-center rounded-full text-[10px] font-bold text-white">
                          {getInitials(item.name)}
                        </span>
                        <div>
                          <p className="text-white">анонимизировано</p>
                          <p className="text-[11px] text-text-disabled">PII скрыт</p>
                          <span className="sr-only">{item.name} {item.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <StatusChip tone={item.tariff.includes("Plus") ? "info" : "brand"}>
                          {item.tariff}
                        </StatusChip>
                        <UserStatusBadge status={item.status} />
                      </div>
                    </td>
                    <td className="px-3 py-3">{meta.age}</td>
                    <td className="px-3 py-3">{meta.gender}</td>
                    <td className="px-3 py-3 text-white">{formatCurrencyRub(item.mrr * 12)}</td>
                    <td className="px-3 py-3 text-white">{meta.region}</td>
                    <td className="px-3 py-3">
                      <ChurnRiskBadge risk={item.churn_risk} />
                      <span className="sr-only">{getRiskLabel(item.churn_risk)}</span>
                    </td>
                    <td className="px-3 py-3 text-white">{formatDate(item.registered_at)}</td>
                    <td className="px-3 py-3">
                      <Link
                        aria-label={`Открыть профиль ${item.name}`}
                        className="admin-focus grid h-7 w-7 place-items-center rounded-lg border border-white/[0.08] bg-bg-elevated text-text-secondary hover:bg-bg-overlay hover:text-white"
                        href={`/users/${item.id}`}
                      >
                        <ExternalLink aria-hidden className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {users.isPending ? (
          <p className="p-4 text-sm text-text-secondary">Загрузка пользователей...</p>
        ) : null}
        {rows.length === 0 && !users.isPending && !users.isError ? (
          <p className="p-4 text-sm text-text-secondary">Пользователи не найдены</p>
        ) : null}
        <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-3 text-xs text-text-secondary">
          <span>Показано {rows.length} из {users.data?.data.total ?? 0}</span>
          <div className="flex items-center gap-1">
            {["1", "2", "3", "...", "2305"].map((page) => (
              <button
                className={cn(
                  "admin-focus grid h-8 min-w-8 place-items-center rounded-lg border border-white/[0.08] px-2",
                  page === "1" ? "bg-brand-primary/20 text-white" : "bg-bg-elevated text-text-secondary",
                )}
                key={page}
                type="button"
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
