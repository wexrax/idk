"use client";

import { Menu, ShieldCheck, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { adminNavigation } from "./navigation";

type AdminRole = "admin" | "analyst" | "finance" | "marketer" | "support";
type AdminEnvironment = "Production" | "Sandbox" | "Staging";

type MobileSidebarProps = {
  activeEnvironment?: AdminEnvironment;
  activeRole?: AdminRole;
  onEnvironmentChange?: (environment: AdminEnvironment) => void;
  onRoleChange?: (role: AdminRole) => void;
  subscriptionCount?: number;
};

const roleOptions: { label: string; value: AdminRole }[] = [
  { label: "Администратор", value: "admin" },
  { label: "Финансы", value: "finance" },
  { label: "Поддержка", value: "support" },
  { label: "Аналитик", value: "analyst" },
  { label: "Маркетолог", value: "marketer" },
];

const environmentOptions: { label: string; value: AdminEnvironment }[] = [
  { label: "Продакшен", value: "Production" },
  { label: "Стейджинг", value: "Staging" },
  { label: "Песочница", value: "Sandbox" },
];

export function MobileSidebar({
  activeEnvironment = "Production",
  activeRole = "admin",
  onEnvironmentChange,
  onRoleChange,
  subscriptionCount = 0,
}: MobileSidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const availableNavigation = adminNavigation.filter((item) => item.roles.includes(activeRole));

  return (
    <>
      <button
        aria-label="Открыть меню"
        className="admin-focus mr-3 grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/[0.06] bg-bg-elevated text-text-secondary hover:bg-bg-overlay hover:text-white lg:hidden"
        onClick={() => setOpen(true)}
        type="button"
      >
        <Menu aria-hidden className="h-4 w-4" />
      </button>
      {open ? (
        <div className="fixed inset-0 z-30 lg:hidden">
          <button
            aria-label="Закрыть меню"
            className="absolute inset-0 h-full w-full bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            type="button"
          />
          <aside
            aria-label="Основная навигация"
            className="relative h-full w-72 max-w-[85vw] border-r border-white/[0.06] bg-[#0f1218] px-4 py-5 shadow-2xl"
          >
            <div className="mb-5 flex items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
              <div className="flex items-center gap-3">
                <div className="admin-gradient grid h-[34px] w-[34px] place-items-center rounded-[10px] text-white shadow-lg shadow-brand-primary/25">
                  <ShieldCheck aria-hidden className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[15px] font-bold text-white">SubHub</div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-text-disabled">
                    Admin Console
                  </div>
                </div>
              </div>
              <button
                aria-label="Закрыть меню"
                className="admin-focus grid h-9 w-9 place-items-center rounded-lg border border-white/[0.06] bg-bg-elevated text-text-secondary hover:bg-bg-overlay hover:text-white"
                onClick={() => setOpen(false)}
                type="button"
              >
                <X aria-hidden className="h-4 w-4" />
              </button>
            </div>
            <label className="mb-3 flex min-h-10 items-center gap-2 rounded-lg border border-white/[0.06] bg-bg-elevated px-3 text-xs text-text-secondary">
              <span>Роль</span>
              <select
                aria-label="Роль в меню"
                className="min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none [color-scheme:dark]"
                onChange={(event) => onRoleChange?.(event.target.value as AdminRole)}
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
              <span className="shrink-0 rounded-lg bg-bg-card px-2 py-1 text-xs text-text-secondary">
                Доступно: {availableNavigation.length}
              </span>
            </label>
            <label className="mb-5 flex min-h-10 items-center gap-2 rounded-lg border border-white/[0.06] bg-bg-elevated px-3 text-xs text-text-secondary">
              <span>Среда</span>
              <select
                aria-label="Среда в меню"
                className="min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none [color-scheme:dark]"
                onChange={(event) =>
                  onEnvironmentChange?.(event.target.value as AdminEnvironment)
                }
                value={activeEnvironment}
              >
                {environmentOptions.map((environment) => (
                  <option
                    className="bg-bg-card text-text-primary"
                    key={environment.value}
                    value={environment.value}
                  >
                    {environment.label}
                  </option>
                ))}
              </select>
            </label>
            <nav aria-label="Основная навигация" className="space-y-1">
              {availableNavigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    aria-current={isActive ? "page" : undefined}
                    className={`admin-focus flex min-h-10 items-center gap-3 rounded-lg border px-3 text-sm font-medium ${
                      isActive
                        ? "border-brand-primary/30 bg-gradient-to-r from-brand-primary/20 to-brand-secondary/10 text-white shadow-lg shadow-brand-primary/10"
                        : "border-transparent text-text-secondary hover:bg-white/[0.04] hover:text-white"
                    }`}
                    href={item.href}
                    key={item.href}
                    onClick={() => setOpen(false)}
                  >
                    <item.icon
                      aria-hidden
                      className={`h-4 w-4 ${isActive ? "text-brand-primary" : "text-text-disabled"}`}
                    />
                    <span>{item.label}</span>
                    {item.href === "/subscriptions" && subscriptionCount > 0 ? (
                      <span className="ml-auto rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {subscriptionCount}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      ) : null}
    </>
  );
}
