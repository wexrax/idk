"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Gift, Search } from "lucide-react";
import { useState } from "react";
import {
  addUserNote,
  deductPoints,
  getUser,
  getUsers,
  grantPoints,
  unblockUser,
} from "@/lib/api/client";
import type { ChurnRisk, UserRow, UserStatus } from "@/lib/api/contracts";
import { cn } from "@/lib/utils";

const statusOptions: Array<UserStatus | "all"> = [
  "all",
  "active",
  "trial",
  "frozen",
  "blocked",
];
const riskOptions: Array<ChurnRisk | "all"> = ["all", "high", "medium", "low"];

function formatMoney(value: number) {
  return `${new Intl.NumberFormat("ru-RU").format(value)} ₽`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function StatusBadge({ status }: { status: UserStatus }) {
  const label = {
    active: "Активен",
    blocked: "Заблокирован",
    frozen: "Заморожен",
    trial: "Триал",
  }[status];
  const tone = {
    active: "border-success/30 bg-success/10 text-success",
    blocked: "border-danger/30 bg-danger/10 text-danger",
    frozen: "border-info/30 bg-info/10 text-info",
    trial: "border-warning/30 bg-warning/10 text-warning",
  }[status];

  return (
    <span className={cn("rounded-md border px-2 py-1 text-xs font-medium", tone)}>
      {label}
    </span>
  );
}

function RiskBadge({ risk }: { risk: ChurnRisk }) {
  const label = {
    high: "Высокий",
    low: "Низкий",
    medium: "Средний",
  }[risk];
  const tone = {
    high: "text-danger",
    low: "text-success",
    medium: "text-warning",
  }[risk];

  return <span className={cn("text-sm font-medium", tone)}>{label}</span>;
}

type UserTableProps = {
  onSelect: (user: UserRow) => void;
  selectedUserId: string | null;
  users: UserRow[];
};

function UserTable({ onSelect, selectedUserId, users }: UserTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-white/[0.06]">
      <table aria-label="Пользователи" className="w-full min-w-[760px] text-left text-sm">
        <thead className="bg-bg-card text-xs uppercase text-text-secondary">
          <tr>
            <th className="px-4 py-3 font-medium">Пользователь</th>
            <th className="px-4 py-3 font-medium">Статус</th>
            <th className="px-4 py-3 font-medium">Тариф</th>
            <th className="px-4 py-3 font-medium">MRR</th>
            <th className="px-4 py-3 font-medium">Риск оттока</th>
            <th className="px-4 py-3 font-medium">Последняя активность</th>
            <th className="px-4 py-3 text-right font-medium">Профиль</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10 bg-bg-base">
          {users.map((user) => (
            <tr
              className={cn(
                "text-text-primary transition-colors hover:bg-bg-card",
                selectedUserId === user.id ? "bg-bg-card" : "",
              )}
              key={user.id}
            >
              <td className="px-4 py-4">
                <div className="font-medium">{user.name}</div>
                <div className="mt-1 text-text-secondary">{user.email}</div>
              </td>
              <td className="px-4 py-4">
                <StatusBadge status={user.status} />
              </td>
              <td className="px-4 py-4">{user.tariff}</td>
              <td className="px-4 py-4 font-medium">{formatMoney(user.mrr)}</td>
              <td className="px-4 py-4">
                <RiskBadge risk={user.churn_risk} />
              </td>
              <td className="px-4 py-4 text-text-secondary">
                {formatDate(user.last_seen_at)}
              </td>
              <td className="px-4 py-4 text-right">
                <button
                  aria-label={`Открыть ${user.email}`}
                  className="inline-grid h-9 w-9 place-items-center rounded-lg border border-white/[0.06] text-text-secondary hover:bg-bg-elevated hover:text-white"
                  onClick={() => onSelect(user)}
                  type="button"
                >
                  <Eye aria-hidden className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type UserProfilePanelProps = {
  userId: string | null;
};

function UserProfilePanel({ userId }: UserProfilePanelProps) {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("100");
  const [comment, setComment] = useState("");
  const [deductAmount, setDeductAmount] = useState("50");
  const [deductComment, setDeductComment] = useState("");
  const [note, setNote] = useState("");
  const profileQuery = useQuery({
    enabled: Boolean(userId),
    queryFn: () => getUser(userId!),
    queryKey: ["users", "profile", userId],
  });

  const unblockMutation = useMutation({
    mutationFn: () => unblockUser(userId!),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      await queryClient.invalidateQueries({ queryKey: ["users", "profile", userId] });
    },
  });

  const grantMutation = useMutation({
    mutationFn: () =>
      grantPoints(userId!, {
        amount: Number(amount),
        comment,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      await queryClient.invalidateQueries({ queryKey: ["users", "profile", userId] });
      setComment("");
    },
  });
  const deductMutation = useMutation({
    mutationFn: () =>
      deductPoints(userId!, {
        amount: Number(deductAmount),
        comment: deductComment,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      await queryClient.invalidateQueries({ queryKey: ["users", "profile", userId] });
      setDeductComment("");
    },
  });
  const noteMutation = useMutation({
    mutationFn: () =>
      addUserNote(userId!, {
        note,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users", "profile", userId] });
      setNote("");
    },
  });

  if (!userId) {
    return (
      <aside
        aria-label="Профиль пользователя"
        className="admin-panel p-5 text-sm text-text-secondary"
      >
        Выберите пользователя, чтобы посмотреть устройства, подписки, баллы и факторы оттока.
      </aside>
    );
  }

  if (profileQuery.isPending) {
    return (
      <aside
        aria-label="Профиль пользователя"
        className="admin-panel p-5 text-sm text-text-secondary"
      >
        Загрузка профиля
      </aside>
    );
  }

  if (profileQuery.isError) {
    return (
      <aside
        aria-label="Профиль пользователя"
        className="rounded-md border border-danger/40 bg-danger/10 p-5 text-sm text-text-primary"
      >
        Не удалось загрузить профиль
      </aside>
    );
  }

  const profile = profileQuery.data.data;

  return (
    <aside
      aria-label="Профиль пользователя"
      className="space-y-5 admin-panel p-5"
    >
      <div>
        <p className="text-xs uppercase text-text-secondary">Выбранный пользователь</p>
        <h2 className="mt-1 text-lg font-semibold text-text-primary">{profile.name}</h2>
        <p className="mt-1 text-sm text-text-secondary">{profile.email}</p>
        {profile.status === "blocked" ? (
          <button
            className="mt-3 h-9 rounded-md border border-success/30 bg-success/10 px-3 text-sm font-medium text-success hover:bg-success/20 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={unblockMutation.isPending}
            onClick={() => unblockMutation.mutate()}
            type="button"
          >
            Разблокировать
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-text-secondary">Баллы</p>
          <p className="mt-1 font-semibold text-text-primary">
            {profile.points_balance} баллов
          </p>
        </div>
        <div>
          <p className="text-text-secondary">Вероятность оттока</p>
          <p className="mt-1 font-semibold text-text-primary">
            {Math.round(profile.churn_probability * 100)}%
          </p>
        </div>
        <div>
          <p className="text-text-secondary">Страна</p>
          <p className="mt-1 font-semibold text-text-primary">{profile.country}</p>
        </div>
        <div>
          <p className="text-text-secondary">Устройства</p>
          <p className="mt-1 font-semibold text-text-primary">{profile.devices.length}</p>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-text-primary">Активные подписки</h3>
        {profile.active_subscriptions.length > 0 ? (
          <ul className="space-y-2">
            {profile.active_subscriptions.map((subscription) => (
              <li
                className="flex items-center justify-between gap-3 admin-panel-elevated px-3 py-2 text-sm"
                key={subscription.id}
              >
                <span>{subscription.service.name}</span>
                <span className="text-text-secondary">{formatMoney(subscription.price)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-text-secondary">Активных подписок нет</p>
        )}
      </div>

      <form
        className="space-y-3 border-t border-white/[0.06] pt-4"
        onSubmit={(event) => {
          event.preventDefault();
          grantMutation.mutate();
        }}
      >
        <h3 className="flex items-center gap-2 text-sm font-medium text-text-primary">
          <Gift aria-hidden className="h-4 w-4 text-brand-primary" />
          Начислить баллы
        </h3>
        <label className="block text-sm text-text-secondary">
          Количество баллов
          <input
            aria-label="Количество баллов"
            className="mt-1 h-10 w-full rounded-lg border border-white/[0.06] bg-bg-base px-3 text-text-primary outline-none focus:border-brand-primary"
            min={1}
            onChange={(event) => setAmount(event.target.value)}
            type="number"
            value={amount}
          />
        </label>
        <label className="block text-sm text-text-secondary">
          Комментарий к баллам
          <input
            aria-label="Комментарий к баллам"
            className="mt-1 h-10 w-full rounded-lg border border-white/[0.06] bg-bg-base px-3 text-text-primary outline-none focus:border-brand-primary"
            onChange={(event) => setComment(event.target.value)}
            value={comment}
          />
        </label>
        <button
          className="h-10 w-full rounded-md bg-brand-primary px-3 text-sm font-medium text-white hover:bg-brand-secondary disabled:cursor-not-allowed disabled:opacity-60"
          disabled={grantMutation.isPending || Number(amount) <= 0 || comment.trim() === ""}
          type="submit"
        >
          Начислить баллы
        </button>
      </form>

      <form
        className="space-y-3 border-t border-white/[0.06] pt-4"
        onSubmit={(event) => {
          event.preventDefault();
          deductMutation.mutate();
        }}
      >
        <h3 className="flex items-center gap-2 text-sm font-medium text-text-primary">
          <Gift aria-hidden className="h-4 w-4 text-warning" />
          Списать баллы
        </h3>
        <label className="block text-sm text-text-secondary">
          Количество баллов
          <input
            aria-label="Количество баллов для списания"
            className="mt-1 h-10 w-full rounded-lg border border-white/[0.06] bg-bg-base px-3 text-text-primary outline-none focus:border-brand-primary"
            min={1}
            onChange={(event) => setDeductAmount(event.target.value)}
            type="number"
            value={deductAmount}
          />
        </label>
        <label className="block text-sm text-text-secondary">
          Причина списания
          <input
            aria-label="Причина списания баллов"
            className="mt-1 h-10 w-full rounded-lg border border-white/[0.06] bg-bg-base px-3 text-text-primary outline-none focus:border-brand-primary"
            onChange={(event) => setDeductComment(event.target.value)}
            value={deductComment}
          />
        </label>
        <button
          className="h-10 w-full rounded-md border border-warning/30 bg-warning/10 px-3 text-sm font-medium text-warning hover:bg-warning/20 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={deductMutation.isPending || Number(deductAmount) <= 0 || deductComment.trim() === ""}
          type="submit"
        >
          Списать баллы
        </button>
      </form>

      <form
        className="space-y-3 border-t border-white/[0.06] pt-4"
        onSubmit={(event) => {
          event.preventDefault();
          noteMutation.mutate();
        }}
      >
        <h3 className="text-sm font-medium text-text-primary">Заметка оператора</h3>
        <label className="block text-sm text-text-secondary">
          Текст заметки
          <textarea
            aria-label="Текст заметки оператора"
            className="mt-1 min-h-24 w-full rounded-lg border border-white/[0.06] bg-bg-base px-3 py-2 text-text-primary outline-none focus:border-brand-primary"
            maxLength={2000}
            onChange={(event) => setNote(event.target.value)}
            value={note}
          />
        </label>
        <button
          className="h-10 w-full rounded-md bg-bg-elevated px-3 text-sm font-medium text-white hover:bg-bg-card disabled:cursor-not-allowed disabled:opacity-60"
          disabled={noteMutation.isPending || note.trim() === ""}
          type="submit"
        >
          Добавить заметку
        </button>
      </form>
    </aside>
  );
}

export function UserManagementClient() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<UserStatus | "all">("all");
  const [risk, setRisk] = useState<ChurnRisk | "all">("all");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const usersQuery = useQuery({
    queryFn: () =>
      getUsers({
        churn_risk: risk === "all" ? undefined : risk,
        per_page: 25,
        search,
        status: status === "all" ? undefined : status,
      }),
    queryKey: ["users", { risk, search, status }],
  });

  const users = usersQuery.data?.data.items ?? [];

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="space-y-4">
        <div className="flex flex-col gap-3 admin-panel p-4 md:flex-row md:items-end">
          <label className="flex-1 text-sm text-text-secondary">
            Поиск пользователей
            <span className="mt-1 flex h-10 items-center gap-2 rounded-lg border border-white/[0.06] bg-bg-base px-3">
              <Search aria-hidden className="h-4 w-4" />
              <input
                aria-label="Поиск пользователей"
                className="w-full bg-transparent text-text-primary outline-none"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Email, имя, телефон или ID"
                value={search}
              />
            </span>
          </label>
          <label className="text-sm text-text-secondary">
            Статус
            <select
              aria-label="Статус"
              className="mt-1 h-10 rounded-lg border border-white/[0.06] bg-bg-base px-3 text-text-primary outline-none"
              onChange={(event) => setStatus(event.target.value as UserStatus | "all")}
              value={status}
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {{
                    active: "Активен",
                    all: "Все",
                    blocked: "Заблокирован",
                    frozen: "Заморожен",
                    trial: "Триал",
                  }[option]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-text-secondary">
            Риск оттока
            <select
              aria-label="Риск оттока"
              className="mt-1 h-10 rounded-lg border border-white/[0.06] bg-bg-base px-3 text-text-primary outline-none"
              onChange={(event) => setRisk(event.target.value as ChurnRisk | "all")}
              value={risk}
            >
              {riskOptions.map((option) => (
                <option key={option} value={option}>
                  {{
                    all: "Все",
                    high: "Высокий",
                    low: "Низкий",
                    medium: "Средний",
                  }[option]}
                </option>
              ))}
            </select>
          </label>
        </div>

        {usersQuery.isPending ? (
          <div
            className="admin-panel p-6 text-sm text-text-secondary"
            role="status"
          >
            Загрузка пользователей
          </div>
        ) : null}

        {usersQuery.isError ? (
          <div
            className="rounded-md border border-danger/40 bg-danger/10 p-6 text-sm text-text-primary"
            role="alert"
          >
            Не удалось загрузить пользователей
          </div>
        ) : null}

        {!usersQuery.isPending && !usersQuery.isError && users.length === 0 ? (
          <div className="admin-panel p-6 text-sm text-text-secondary">
            По этим фильтрам пользователи не найдены.
          </div>
        ) : null}

        {users.length > 0 ? (
          <UserTable
            onSelect={(user) => setSelectedUserId(user.id)}
            selectedUserId={selectedUserId}
            users={users}
          />
        ) : null}
      </section>

      <UserProfilePanel userId={selectedUserId} />
    </div>
  );
}
