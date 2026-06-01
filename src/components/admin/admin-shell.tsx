"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Circle,
  CircleHelp,
  LogOut,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  ShieldCheck,
  UserCircle,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MobileSidebar } from "./mobile-sidebar";
import { adminNavigation } from "./navigation";
import {
  getNotifications,
  getSubscriptions,
  updateNotificationStatus,
} from "@/lib/api/client";
import type { AdminNotification, AdminNotificationStatus, AdminNotificationTone } from "@/lib/api/contracts";
import { getAdminProfile, logout } from "@/lib/api/auth-client";
import type { AdminProfileRole } from "@/lib/api/auth-contracts";
import {
  buildApiUrl,
  getAccessToken,
  getApiBaseUrl,
  getApiMode,
  setAccessToken,
} from "@/lib/api/http-client";
import { apiEndpoints } from "@/lib/api/endpoints";

type SearchItem = {
  description: string;
  href?: string;
  keywords: string[];
  label: string;
  roles: AdminRole[];
  type: "action" | "module";
};

type AdminRole = "admin" | "analyst" | "finance" | "marketer" | "support";
type AdminEnvironment = "Production" | "Sandbox" | "Staging";
type NotificationFilter = "all" | "unread";

const quickActions: SearchItem[] = [
  {
    description: "Собрать отчет в аналитике",
    href: "/analytics",
    keywords: ["analytics", "report", "отчет", "аналитика"],
    label: "Новый отчет",
    roles: ["admin", "analyst", "marketer"],
    type: "action",
  },
  {
    description: "Открыть конструктор рассылки",
    href: "/marketing",
    keywords: ["marketing", "campaign", "кампания", "маркетинг"],
    label: "Новая кампания",
    roles: ["admin", "marketer"],
    type: "action",
  },
  {
    description: "Проверить платежные и review-интеграции",
    href: "/settings",
    keywords: ["settings", "integration", "интеграции", "настройки"],
    label: "Проверить интеграции",
    roles: ["admin"],
    type: "action",
  },
];

const roleOptions: { label: string; value: AdminRole }[] = [
  { label: "Администратор", value: "admin" },
  { label: "Финансы", value: "finance" },
  { label: "Поддержка", value: "support" },
  { label: "Аналитик", value: "analyst" },
  { label: "Маркетолог", value: "marketer" },
];

const environmentOptions: {
  banner: string;
  label: string;
  toneClass: string;
  value: AdminEnvironment;
}[] = [
  {
    banner: "Продакшен: подключение к API запланировано; сейчас используется контрактный mock-сервис.",
    label: "Продакшен",
    toneClass: "border-danger/30 bg-danger/10 text-danger",
    value: "Production",
  },
  {
    banner: "Стейджинг: проверяйте изменения перед публикацией.",
    label: "Стейджинг",
    toneClass: "border-warning/30 bg-warning/10 text-warning",
    value: "Staging",
  },
  {
    banner: "Песочница: можно безопасно проверять сценарии и тестовые данные.",
    label: "Песочница",
    toneClass: "border-info/30 bg-info/10 text-info",
    value: "Sandbox",
  },
];

const notificationToneClass: Record<AdminNotificationTone, string> = {
  danger: "bg-danger/10 text-danger",
  info: "bg-info/10 text-info",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
};

const navigationGroups = [
  {
    label: "Главное",
    items: ["/dashboard", "/users", "/subscriptions", "/analytics"],
  },
  {
    label: "Рост",
    items: ["/marketing", "/gamification", "/smart-analytics"],
  },
  {
    label: "Система",
    items: ["/security", "/settings"],
  },
];

type JwtPayload = {
  email?: string;
  name?: string;
  role?: string;
  sub?: string;
};

const fallbackAdminEmail = "admin@subhub.app";

function getAdminInitials(email: string) {
  const localPart = email.split("@")[0] || "admin";
  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "A";
}

function getInitialsFromName(name: string, email: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return initials || getAdminInitials(email);
}

function getJwtPayload(token: string | null | undefined): JwtPayload {
  if (!token) {
    return {};
  }

  try {
    const [, payload] = token.split(".");
    if (!payload) {
      return {};
    }

    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(window.atob(normalizedPayload)) as JwtPayload;
  } catch {
    return {};
  }
}

function getRoleLabel(role: AdminProfileRole | string | undefined, fallback: string) {
  if (role === "super_admin") {
    return "Super Admin";
  }

  return roleOptions.find((option) => option.value === role)?.label ?? fallback;
}

function BrandMark({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
      <div className="admin-gradient grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[10px] text-white shadow-lg shadow-brand-primary/25">
        <ShieldCheck aria-hidden className="h-4 w-4" />
      </div>
      <div className={collapsed ? "sr-only" : "min-w-0"}>
        <div className="truncate text-[15px] font-bold tracking-normal text-white">SubHub</div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-text-disabled">
          Admin Console
        </div>
      </div>
    </div>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [accessToken, setAccessTokenSnapshot] = useState<string | null | undefined>(undefined);
  const isLiveApi = getApiMode() === "live";
  const shouldRequestAdminProfile = true;
  const [activeRole, setActiveRole] = useState<AdminRole>("admin");
  const [activeEnvironment, setActiveEnvironment] =
    useState<AdminEnvironment>("Production");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [query, setQuery] = useState("");
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState<NotificationFilter>("all");
  const profileQuery = useQuery({
    enabled: Boolean(accessToken) && shouldRequestAdminProfile,
    queryFn: getAdminProfile,
    queryKey: ["auth", "me"],
    retry: false,
  });
  const notificationsQuery = useQuery({
    enabled: Boolean(accessToken),
    queryFn: getNotifications,
    queryKey: ["notifications"],
    retry: false,
    staleTime: 30_000,
  });
  const subscriptionsQuery = useQuery({
    enabled: Boolean(accessToken),
    queryFn: getSubscriptions,
    queryKey: ["subscriptions"],
    retry: false,
    staleTime: 30_000,
  });
  const notificationStatusMutation = useMutation({
    mutationFn: ({
      notificationId,
      status,
    }: {
      notificationId: string;
      status: AdminNotificationStatus;
    }) => updateNotificationStatus(notificationId, { status }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
  const normalizedQuery = query.trim().toLowerCase();
  const availableNavigation = useMemo(
    () => adminNavigation.filter((item) => item.roles.includes(activeRole)),
    [activeRole],
  );
  const searchItems = useMemo<SearchItem[]>(
    () => [
      ...availableNavigation.map((item) => ({
        description: `Раздел доступен ролям: ${item.roles.join(", ")}`,
        href: item.href,
        keywords: [item.label.toLowerCase(), item.href.replace("/", "")],
        label: item.label,
        roles: [...item.roles] as AdminRole[],
        type: "module" as const,
      })),
      ...quickActions.filter((item) => item.roles.includes(activeRole)),
    ],
    [activeRole, availableNavigation],
  );
  const searchResults = useMemo(
    () =>
      normalizedQuery
        ? searchItems.filter((item) =>
            [item.label, item.description, ...item.keywords]
              .join(" ")
              .toLowerCase()
              .includes(normalizedQuery),
          )
        : [],
    [normalizedQuery, searchItems],
  );
  const moduleResults = searchResults.filter((item) => item.type === "module");
  const actionResults = searchResults.filter((item) => item.type === "action");
  const notifications = notificationsQuery.data?.data.items.filter(
    (notification) => notification.status !== "archived",
  ) ?? [];
  const unreadCount = notifications.filter((notification) => !notification.isRead).length;
  const subscriptionCount = subscriptionsQuery.data?.data.length ?? 0;
  const filteredNotifications =
    notificationFilter === "unread"
      ? notifications.filter((notification) => !notification.isRead)
      : notifications;
  const environment = environmentOptions.find((item) => item.value === activeEnvironment) ??
    environmentOptions[0];
  const apiBaseUrl = getApiBaseUrl();
  const environmentBanner =
    isLiveApi && activeEnvironment === "Production"
      ? `Продакшен: подключен live API ${apiBaseUrl || "http://127.0.0.1:8000"}.`
      : environment.banner;
  const activeRoleLabel =
    roleOptions.find((role) => role.value === activeRole)?.label ?? "Администратор";
  const tokenPayload = useMemo(() => getJwtPayload(accessToken), [accessToken]);
  const adminEmail = profileQuery.data?.email ?? tokenPayload.email ?? tokenPayload.sub ?? fallbackAdminEmail;
  const adminName = profileQuery.data?.name ?? tokenPayload.name ?? adminEmail.split("@")[0] ?? "Admin";
  const adminRole = profileQuery.data?.role ?? tokenPayload.role ?? activeRole;
  const adminRoleLabel = getRoleLabel(adminRole, activeRoleLabel);
  const adminInitials = useMemo(
    () => getInitialsFromName(adminName, adminEmail),
    [adminEmail, adminName],
  );
  const profileStatus = profileQuery.isError
    ? "Profile endpoint unavailable"
    : !shouldRequestAdminProfile
      ? "JWT profile"
      : profileQuery.isPending
        ? "Loading profile"
        : "Live profile";

  useEffect(() => {
    function syncAccessToken() {
      setAccessTokenSnapshot(getAccessToken());
    }

    syncAccessToken();
    window.addEventListener("storage", syncAccessToken);
    window.addEventListener("subhub-auth-change", syncAccessToken);

    return () => {
      window.removeEventListener("storage", syncAccessToken);
      window.removeEventListener("subhub-auth-change", syncAccessToken);
    };
  }, []);

  useEffect(() => {
    if (accessToken === null) {
      router.replace("/login");
    }
  }, [accessToken, router]);

  useEffect(() => {
    if (!accessToken || !isLiveApi) {
      return;
    }

    const controller = new AbortController();

    async function connectNotificationStream() {
      try {
        const response = await fetch(buildApiUrl(apiEndpoints.stream.notifications), {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (!controller.signal.aborted) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split("\n\n");
          buffer = events.pop() ?? "";

          events.forEach((event) => {
            if (event.includes("event: notification")) {
              void queryClient.invalidateQueries({ queryKey: ["notifications"] });
              void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
            }
          });
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.warn("Notification stream unavailable", error);
        }
      }
    }

    void connectNotificationStream();

    return () => {
      controller.abort();
    };
  }, [accessToken, isLiveApi, queryClient]);

  if (accessToken === undefined || accessToken === null) {
    return (
      <main className="grid min-h-screen place-items-center bg-bg-base px-4 text-sm text-text-secondary">
        Проверка авторизации
      </main>
    );
  }

  async function updateNotificationStatuses(
    items: AdminNotification[],
    status: AdminNotificationStatus,
  ) {
    if (items.length === 0) {
      return;
    }

    await Promise.all(
      items.map((notification) =>
        updateNotificationStatus(notification.id, {
          status,
        }),
      ),
    );
    await queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

  function markNotificationRead(notificationId: string) {
    notificationStatusMutation.mutate({
      notificationId,
      status: "read",
    });
  }

  function markAllNotificationsRead() {
    void updateNotificationStatuses(
      notifications.filter((notification) => !notification.isRead),
      "read",
    );
  }

  function clearReadNotifications() {
    void updateNotificationStatuses(
      notifications.filter((notification) => notification.isRead),
      "archived",
    );
    setNotificationFilter("all");
  }

  async function handleLogout() {
    try {
      await logout();
    } catch {
      setAccessToken(null);
    } finally {
      setIsProfileOpen(false);
      router.replace("/login");
    }
  }

  const navigationLinks = (
    <nav aria-label="Основная навигация" className="space-y-4">
      {navigationGroups.map((group) => {
        const groupItems = availableNavigation.filter((item) =>
          group.items.includes(item.href),
        );

        if (groupItems.length === 0) {
          return null;
        }

        return (
          <div key={group.label}>
            {!isSidebarCollapsed ? (
              <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-text-disabled">
                {group.label}
              </div>
            ) : null}
            <div className="space-y-1">
              {groupItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    aria-current={isActive ? "page" : undefined}
                    className={`admin-focus flex min-h-9 items-center gap-3 rounded-lg border px-3 text-[13px] font-semibold ${
                      isActive
                        ? "border-brand-primary/20 bg-gradient-to-r from-brand-primary/20 to-brand-secondary/10 text-white shadow-lg shadow-brand-primary/10"
                        : "border-transparent text-text-secondary hover:bg-white/[0.04] hover:text-white"
                    }`}
                    href={item.href}
                    key={item.href}
                    title={item.label}
                  >
                    <item.icon
                      aria-hidden
                      className={`h-4 w-4 shrink-0 ${isActive ? "text-brand-primary" : "text-text-secondary"}`}
                    />
                    <span className={isSidebarCollapsed ? "sr-only" : ""}>{item.label}</span>
                    {item.href === "/subscriptions" &&
                    !isSidebarCollapsed &&
                    subscriptionCount > 0 ? (
                      <span className="ml-auto rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {subscriptionCount}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );

  if (!accessToken) {
    return null;
  }

  return (
    <div className="min-h-screen bg-bg-base text-text-primary">
      <aside
        className={`fixed inset-y-0 left-0 hidden border-r border-white/[0.06] bg-[#0f1218] px-3 py-5 transition-[width] lg:block ${
          isSidebarCollapsed ? "w-20" : "w-52"
        }`}
      >
        <div
          className={`mb-5 flex items-center gap-3 border-b border-white/[0.06] px-2 pb-5 ${
            isSidebarCollapsed ? "justify-center" : "justify-between"
          }`}
        >
          <BrandMark collapsed={isSidebarCollapsed} />
          <button
            aria-label={isSidebarCollapsed ? "Развернуть сайдбар" : "Свернуть сайдбар"}
            className="admin-focus grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/[0.06] bg-bg-elevated text-text-secondary hover:bg-bg-overlay hover:text-white"
            onClick={() => setIsSidebarCollapsed((current) => !current)}
            type="button"
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen aria-hidden className="h-4 w-4" />
            ) : (
              <PanelLeftClose aria-hidden className="h-4 w-4" />
            )}
          </button>
        </div>
        {navigationLinks}
      </aside>
      <div className={isSidebarCollapsed ? "lg:pl-20" : "lg:pl-52"}>
        <header className="sticky top-0 z-10 flex min-h-12 items-center justify-between border-b border-white/[0.06] bg-[#0f1218]/95 px-4 backdrop-blur-xl lg:px-5">
          <MobileSidebar
            activeEnvironment={activeEnvironment}
            activeRole={activeRole}
            onEnvironmentChange={setActiveEnvironment}
            onRoleChange={setActiveRole}
            subscriptionCount={subscriptionCount}
          />
          <label className="sr-only">
            <span>Роль</span>
            <select
              aria-label="Роль"
              className="bg-transparent text-sm text-text-primary outline-none [color-scheme:dark]"
              onChange={(event) => {
                setActiveRole(event.target.value as AdminRole);
                setQuery("");
              }}
              value={activeRole}
            >
              {roleOptions.map((role) => (
                <option
                  className="bg-bg-card text-text-primary"
                  key={role.value}
                  value={role.value}
                >
                  {role.label}
                </option>
              ))}
            </select>
            <span className="rounded-lg bg-bg-card px-2 py-1 text-xs text-text-secondary">
              Доступно: {availableNavigation.length}
            </span>
          </label>
          <label className="sr-only">
            <span>Среда</span>
            <select
              aria-label="Среда админки"
              className="bg-transparent text-sm text-text-primary outline-none [color-scheme:dark]"
              onChange={(event) => setActiveEnvironment(event.target.value as AdminEnvironment)}
              value={activeEnvironment}
            >
              {environmentOptions.map((option) => (
                <option
                  className="bg-bg-card text-text-primary"
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
            <span className={`rounded-md border px-2 py-1 text-xs ${environment.toneClass}`}>
              Среда: {environment.label}
            </span>
          </label>
          <div className="relative w-full max-w-[420px]">
            <label className="admin-focus flex h-8 items-center gap-2 rounded-lg border border-white/[0.06] bg-bg-elevated px-3 text-xs text-text-secondary focus-within:border-brand-primary/50">
              <Search aria-hidden className="h-4 w-4" />
              <input
                aria-label="Поиск"
                className="w-full bg-transparent outline-none placeholder:text-text-secondary"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Поиск пользователей, транзакций, подписок..."
                value={query}
              />
              {query ? (
                <button
                  aria-label="Очистить поиск"
                  className="grid size-6 place-items-center rounded-md text-text-secondary hover:bg-bg-overlay hover:text-white"
                  onClick={() => setQuery("")}
                  type="button"
                >
                  <X aria-hidden className="h-4 w-4" />
                </button>
              ) : null}
            </label>
            {normalizedQuery ? (
              <div className="admin-panel absolute left-0 right-0 top-11 z-20 p-2 shadow-2xl">
                {searchResults.length > 0 ? (
                  <div className="space-y-3">
                    {moduleResults.length > 0 ? (
                      <section>
                        <h2 className="px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-text-disabled">
                          Модули
                        </h2>
                        <div className="space-y-1">
                          {moduleResults.map((item) => (
                            <Link
                              className="block rounded-lg px-2 py-2 text-sm hover:bg-bg-elevated"
                              href={item.href ?? "/dashboard"}
                              key={`module-${item.label}`}
                              onClick={() => setQuery("")}
                            >
                              <span className="font-medium text-text-primary">
                                Модуль {item.label}
                              </span>
                              <span className="mt-1 block text-xs text-text-secondary">
                                {item.description}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </section>
                    ) : null}

                    {actionResults.length > 0 ? (
                      <section>
                        <h2 className="px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-text-disabled">
                          Быстрые действия
                        </h2>
                        <div className="space-y-1">
                          {actionResults.map((item) => (
                            <Link
                              className="block rounded-lg px-2 py-2 text-sm hover:bg-bg-elevated"
                              href={item.href ?? "/dashboard"}
                              key={`action-${item.label}`}
                              onClick={() => setQuery("")}
                            >
                              <span className="font-medium text-text-primary">{item.label}</span>
                              <span className="mt-1 block text-xs text-text-secondary">
                                {item.description}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </section>
                    ) : null}
                  </div>
                ) : (
                  <p className="px-2 py-3 text-sm text-text-secondary">Ничего не найдено</p>
                )}
              </div>
            ) : null}
          </div>
          <div className="relative ml-4 flex items-center gap-1.5">
            <button
              aria-label="Тёмная тема"
              className="admin-focus grid h-8 w-8 place-items-center rounded-lg border border-white/[0.06] bg-bg-elevated text-text-secondary hover:bg-bg-overlay hover:text-white"
              type="button"
            >
              <Moon aria-hidden className="h-4 w-4" />
            </button>
            <button
              aria-label={
                unreadCount > 0
                  ? `Оповещения, ${unreadCount} непрочитанных`
                  : "Оповещения, нет непрочитанных"
              }
              className="admin-focus relative grid h-8 w-8 place-items-center rounded-lg border border-white/[0.06] bg-bg-elevated text-text-secondary hover:bg-bg-overlay hover:text-white"
              onClick={() => {
                setIsNotificationsOpen((current) => !current);
                setIsProfileOpen(false);
              }}
              type="button"
            >
              <Bell aria-hidden className="h-4 w-4" />
              {unreadCount > 0 ? (
                <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-danger px-1 text-xs font-medium text-white ring-2 ring-[#0f1218]">
                  {unreadCount}
                </span>
              ) : null}
            </button>
            <button
              aria-label="Справка"
              className="admin-focus grid h-8 w-8 place-items-center rounded-lg border border-white/[0.06] bg-bg-elevated text-text-secondary hover:bg-bg-overlay hover:text-white"
              type="button"
            >
              <CircleHelp aria-hidden className="h-4 w-4" />
            </button>
            <button
              aria-expanded={isProfileOpen}
              aria-label="Профиль администратора"
              className="admin-gradient grid h-8 w-8 place-items-center rounded-full text-xs font-bold text-white shadow-lg shadow-brand-primary/25"
              onClick={() => {
                setIsProfileOpen((current) => !current);
                setIsNotificationsOpen(false);
              }}
              type="button"
            >
              <UserCircle aria-hidden className="sr-only" />
              {profileQuery.data?.avatar_url ? (
                <span
                  aria-hidden
                  className="h-full w-full rounded-full bg-cover bg-center"
                  style={{ backgroundImage: `url("${profileQuery.data.avatar_url}")` }}
                />
              ) : (
                adminInitials
              )}
            </button>

            {isProfileOpen ? (
              <div className="admin-panel absolute right-0 top-11 z-20 w-[min(20rem,calc(100vw-2rem))] p-3 shadow-2xl">
                <div className="flex items-start gap-3 border-b border-white/[0.06] pb-3">
                  <div className="admin-gradient grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full text-xs font-bold text-white shadow-lg shadow-brand-primary/20">
                    {profileQuery.data?.avatar_url ? (
                      <span
                        aria-hidden
                        className="h-full w-full bg-cover bg-center"
                        style={{ backgroundImage: `url("${profileQuery.data.avatar_url}")` }}
                      />
                    ) : (
                      adminInitials
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold text-text-primary">
                      {adminName}
                    </h2>
                    <p className="mt-1 truncate text-xs text-text-secondary">{adminEmail}</p>
                    <p className="mt-1 text-[11px] text-text-disabled">{profileStatus}</p>
                  </div>
                </div>

                <dl className="grid grid-cols-2 gap-2 border-b border-white/[0.06] py-3 text-xs">
                  <div className="rounded-lg border border-white/[0.06] bg-bg-elevated p-2">
                    <dt className="text-text-disabled">Роль</dt>
                    <dd className="mt-1 font-semibold text-white">{adminRoleLabel}</dd>
                  </div>
                  <div className="rounded-lg border border-white/[0.06] bg-bg-elevated p-2">
                    <dt className="text-text-disabled">MFA</dt>
                    <dd className="mt-1 font-semibold text-white">
                      {profileQuery.data?.mfa_enabled ? "Enabled" : "Unknown"}
                    </dd>
                  </div>
                </dl>

                <div className="border-b border-white/[0.06] py-3 text-xs">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-text-disabled">Permissions</span>
                    <span className="font-semibold text-white">
                      {profileQuery.data?.permissions.length ?? 0}
                    </span>
                  </div>
                  {profileQuery.data?.permissions.length ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {profileQuery.data.permissions.slice(0, 4).map((permission) => (
                        <span
                          className="rounded-md border border-white/[0.06] bg-bg-elevated px-2 py-1 text-[11px] text-text-secondary"
                          key={permission}
                        >
                          {permission}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="space-y-1 pt-3">
                  <Link
                    className="admin-focus flex h-9 items-center gap-2 rounded-lg px-2 text-sm font-medium text-text-secondary hover:bg-bg-elevated hover:text-white"
                    href="/settings"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <Settings aria-hidden className="h-4 w-4" />
                    Настройки профиля
                  </Link>
                  <button
                    className="admin-focus flex h-9 w-full items-center gap-2 rounded-lg px-2 text-left text-sm font-medium text-danger hover:bg-danger/10"
                    onClick={handleLogout}
                    type="button"
                  >
                    <LogOut aria-hidden className="h-4 w-4" />
                    Выйти
                  </button>
                </div>
              </div>
            ) : null}

            {isNotificationsOpen ? (
              <div className="admin-panel absolute right-0 top-11 z-20 w-[min(22rem,calc(100vw-2rem))] p-3 shadow-2xl">
                <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
                  <div>
                    <h2 className="text-sm font-semibold text-text-primary">Оповещения</h2>
                    <p className="mt-1 text-xs text-text-secondary">
                      {unreadCount > 0
                        ? `${unreadCount} непрочитанных событий`
                        : "Нет непрочитанных событий"}
                    </p>
                  </div>
                  {unreadCount > 0 ? (
                    <button
                      className="admin-focus rounded-lg border border-white/[0.06] px-2 py-1 text-xs text-text-secondary hover:bg-bg-elevated hover:text-white"
                      disabled={notificationStatusMutation.isPending}
                      onClick={markAllNotificationsRead}
                      type="button"
                    >
                      Прочитать все
                    </button>
                  ) : null}
                </div>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="flex rounded-[10px] border border-white/[0.06] bg-bg-elevated p-1">
                    {[
                      { label: "Все", value: "all" },
                      { label: "Непрочитанные", value: "unread" },
                    ].map((filter) => (
                      <button
                        className={`admin-focus rounded-lg px-2 py-1 text-xs ${
                          notificationFilter === filter.value
                            ? "admin-gradient text-white"
                            : "text-text-secondary hover:text-white"
                        }`}
                        key={filter.value}
                        onClick={() => setNotificationFilter(filter.value as NotificationFilter)}
                        type="button"
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                  {notifications.some((notification) => notification.isRead) ? (
                    <button
                      className="admin-focus rounded-lg border border-white/[0.06] px-2 py-1 text-xs text-text-secondary hover:bg-bg-elevated hover:text-white"
                      disabled={notificationStatusMutation.isPending}
                      onClick={clearReadNotifications}
                      type="button"
                    >
                      Скрыть прочитанные
                    </button>
                  ) : null}
                </div>

                <div className="mt-3 space-y-2">
                  {notificationsQuery.isPending ? (
                    <p className="rounded-[10px] border border-white/[0.06] bg-bg-elevated px-3 py-4 text-sm text-text-secondary">
                      Загрузка оповещений
                    </p>
                  ) : filteredNotifications.length > 0 ? (
                    filteredNotifications.map((notification) => (
                    <article
                      className="rounded-[10px] border border-white/[0.06] bg-bg-elevated p-3"
                      key={notification.id}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            {!notification.isRead ? (
                              <Circle aria-hidden className="h-2 w-2 fill-brand-primary text-brand-primary" />
                            ) : null}
                            <h3 className="truncate text-sm font-medium text-text-primary">
                              {notification.title}
                            </h3>
                          </div>
                          <p className="mt-1 text-xs leading-5 text-text-secondary">
                            {notification.description}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-md px-2 py-1 text-xs ${notificationToneClass[notification.tone]}`}
                        >
                          {notification.time}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <Link
                          className="text-xs font-medium text-brand-primary hover:text-brand-secondary"
                          href={notification.href}
                          onClick={() => setIsNotificationsOpen(false)}
                        >
                          Открыть модуль
                        </Link>
                        {!notification.isRead ? (
                          <button
                            aria-label={`Отметить ${notification.title} прочитанным`}
                            className="admin-focus rounded-lg border border-white/[0.06] px-2 py-1 text-xs text-text-secondary hover:bg-bg-card hover:text-white"
                            disabled={notificationStatusMutation.isPending}
                            onClick={() => markNotificationRead(notification.id)}
                            type="button"
                          >
                            Отметить прочитанным
                          </button>
                        ) : (
                          <span className="text-xs text-text-secondary">Прочитано</span>
                        )}
                      </div>
                    </article>
                    ))
                  ) : (
                    <p className="rounded-[10px] border border-white/[0.06] bg-bg-elevated px-3 py-4 text-sm text-text-secondary">
                      {notificationFilter === "unread"
                        ? "Непрочитанных событий нет"
                        : "Оповещений нет"}
                    </p>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </header>
        <div className={`sr-only ${environment.toneClass}`}>
          {environmentBanner}
        </div>
        {children}
      </div>
    </div>
  );
}
