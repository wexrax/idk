# SubHub Admin Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first usable contract-first admin console for the SubHub mobile app on top of the existing root Next.js app.

**Architecture:** Use the existing `src/app` App Router project instead of creating a nested `apps/admin` application. The frontend reads from a typed API adapter backed by deterministic mock data now, then swaps the adapter to the future Python + FastAPI backend without changing UI components.

**Tech Stack:** Next.js 16.2.6 App Router, React 19.2.4, TypeScript, Tailwind CSS v4, HeroUI, TanStack Query, Zustand, Zod, Recharts, Vitest, Testing Library, Playwright, future FastAPI REST contracts.

---

## Scope Check

`docs/SPEC_SubHub_Admin_Dashboard.md` describes a large admin product: dashboard, CRM, subscriptions, billing, marketing, gamification, smart analytics, security, settings, realtime streams, and error handling. This plan implements one shippable MVP slice:

- Root app tooling and dependency setup
- SubHub admin shell and design tokens
- Contract-first API types, error shape, mock data, and adapter boundary
- Dashboard route with KPI, chart, anomalies, top services, and churn widgets
- Users CRM route with search/filter/pagination, profile route, block user, grant points, and bulk actions over mocks
- Minimal tariffs/subscriptions route to prove monetization data shape
- Loading, empty, error, and toast behavior
- Smoke verification on desktop and mobile

Marketing, gamification, full billing reports, smart analytics, RBAC/audit log, real SSE, and real FastAPI integration should be separate follow-up plans.

## Local Next.js 16 Notes

Before implementation, the local guides in `node_modules/next/dist/docs/01-app/` were checked:

- Pages and layouts are Server Components by default.
- Use `"use client"` only for state, event handlers, effects, browser APIs, and client-only third-party widgets.
- Server Actions are async Server Functions reached through POST, so every future real mutation must verify auth/authz server-side.
- Dynamic route params are `Promise` values in page props, for example `params: Promise<{ id: string }>`.
- Route Handlers live only under `app/**/route.ts`, cannot share the same route segment as `page.tsx`, and do not participate in layouts.
- Cache Components require explicit `cacheComponents: true`; this MVP does not enable them. Keep caching in TanStack Query and mock services for now.

## File Structure

Modify:

- `package.json` - add scripts and admin UI/testing dependencies.
- `eslint.config.mjs` - ignore `.codex/**` so `npm.cmd run lint` scans project source instead of local agent artifacts.
- `src/app/layout.tsx` - set Russian metadata/lang and keep providers deep.
- `src/app/globals.css` - replace starter theme with SubHub dashboard tokens.
- `src/app/page.tsx` - redirect `/` to `/dashboard`.

Create:

- `src/app/(admin)/layout.tsx` - shared admin shell layout.
- `src/app/(admin)/dashboard/page.tsx` - dashboard page.
- `src/app/(admin)/users/page.tsx` - users list page.
- `src/app/(admin)/users/[id]/page.tsx` - user profile page.
- `src/app/(admin)/subscriptions/page.tsx` - minimal tariffs/subscriptions page.
- `src/components/admin/admin-shell.tsx` - sidebar/header composition.
- `src/components/admin/navigation.ts` - navigation model and role metadata.
- `src/components/dashboard/dashboard-client.tsx` - interactive dashboard query composition.
- `src/components/dashboard/metric-card.tsx` - KPI card.
- `src/components/dashboard/mrr-chart.tsx` - Recharts MRR chart wrapper.
- `src/components/users/users-client.tsx` - users CRM table, search, filters.
- `src/components/users/user-profile.tsx` - user profile cards.
- `src/components/users/user-actions.tsx` - block/grant-points forms.
- `src/components/subscriptions/subscriptions-client.tsx` - minimal tariff table.
- `src/components/ui/error-state.tsx` - reusable error state.
- `src/components/ui/loading-state.tsx` - skeleton/loading state.
- `src/components/ui/section.tsx` - admin section wrapper.
- `src/components/ui/status-badge.tsx` - user/tariff/risk status badges.
- `src/lib/api/contracts.ts` - FastAPI-aligned TypeScript DTOs.
- `src/lib/api/mock-data.ts` - deterministic fixtures.
- `src/lib/api/mock-service.ts` - in-memory mock implementation.
- `src/lib/api/client.ts` - adapter API exported to UI.
- `src/lib/query-client.tsx` - TanStack Query provider and global error mapping.
- `src/lib/utils.ts` - class merging and formatting helpers.
- `src/stores/ui-store.ts` - small UI state store.
- `src/test/setup.ts` - Vitest setup.
- `vitest.config.ts` - component test config.
- `playwright.config.ts` - smoke test config.
- `src/tests/contracts.test.ts` - contract/mock tests.
- `src/tests/shell.test.tsx` - shell render tests.
- `src/tests/dashboard.test.tsx` - dashboard render tests.
- `src/tests/users.test.tsx` - CRM tests.
- `src/tests/smoke.spec.ts` - Playwright smoke tests.

---

### Task 1: Tooling and Dependency Setup

**Files:**
- Modify: `package.json`
- Modify: `eslint.config.mjs`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `src/test/setup.ts`

- [ ] **Step 1: Install runtime and test dependencies**

Run from `G:\Repository\SubHub`:

```powershell
npm.cmd install @heroui/react @heroui/styles @tanstack/react-query clsx lucide-react recharts tailwind-merge zod zustand
npm.cmd install -D @playwright/test @testing-library/jest-dom @testing-library/react @testing-library/user-event @vitejs/plugin-react jsdom vitest
```

Expected: `package.json` and `package-lock.json` update successfully.

- [ ] **Step 2: Update scripts in `package.json`**

Keep existing dependencies and add these scripts:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint src --max-warnings=0",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  }
}
```

- [ ] **Step 3: Ignore local agent artifacts in `eslint.config.mjs`**

Add `.codex/**` to `globalIgnores`:

```javascript
globalIgnores([
  ".next/**",
  "out/**",
  "build/**",
  "next-env.d.ts",
  ".codex/**",
]);
```

- [ ] **Step 4: Add Vitest config**

`vitest.config.ts`:

```typescript
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    css: true,
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
});
```

`src/test/setup.ts`:

```typescript
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 5: Add Playwright config**

`playwright.config.ts`:

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./src/tests",
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm.cmd run dev",
    reuseExistingServer: true,
    url: "http://127.0.0.1:3000",
  },
  projects: [
    { name: "desktop-chrome", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-safari", use: { ...devices["iPhone 14"] } },
  ],
});
```

- [ ] **Step 6: Verify tooling**

Run:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test
```

Expected: typecheck and lint pass; tests pass or report no tests until later tasks add them.

- [ ] **Step 7: Commit**

```powershell
git add package.json package-lock.json eslint.config.mjs vitest.config.ts playwright.config.ts src/test/setup.ts
git commit -m "chore(admin): set up admin tooling"
```

---

### Task 2: Root Layout, Theme, and Admin Shell

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/app/page.tsx`
- Create: `src/app/(admin)/layout.tsx`
- Create: `src/components/admin/navigation.ts`
- Create: `src/components/admin/admin-shell.tsx`
- Create: `src/lib/query-client.tsx`
- Create: `src/lib/utils.ts`
- Create: `src/stores/ui-store.ts`
- Test: `src/tests/shell.test.tsx`

- [ ] **Step 1: Write failing shell test**

`src/tests/shell.test.tsx`:

```typescript
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AdminShell } from "@/components/admin/admin-shell";

describe("AdminShell", () => {
  it("renders admin navigation, search, and children", () => {
    render(
      <AdminShell>
        <main>Dashboard content</main>
      </AdminShell>,
    );

    expect(screen.getByRole("link", { name: /дашборд/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /пользователи/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/поиск/i)).toBeInTheDocument();
    expect(screen.getByText("Dashboard content")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to confirm failure**

```powershell
npm.cmd run test -- src/tests/shell.test.tsx
```

Expected: fail because `@/components/admin/admin-shell` does not exist.

- [ ] **Step 3: Implement utilities and providers**

`src/lib/utils.ts`:

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrencyRub(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    currency: "RUB",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

export function formatPercent(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 1,
    style: "percent",
  }).format(value);
}
```

`src/lib/query-client.tsx`:

```typescript
"use client";

import { HeroUIProvider, addToast } from "@heroui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

type ApiError = {
  code?: string;
  message?: string;
  request_id?: string;
};

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      mutations: {
        onError(error) {
          const err = error as ApiError;
          addToast({
            color: err.code === "FORBIDDEN" ? "warning" : "danger",
            description: err.request_id ? `ID: ${err.request_id}` : undefined,
            title: err.message ?? "Неизвестная ошибка",
          });
        },
      },
      queries: {
        retry: 1,
        staleTime: 60_000,
      },
    },
  });
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  return (
    <HeroUIProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </HeroUIProvider>
  );
}
```

`src/stores/ui-store.ts`:

```typescript
import { create } from "zustand";

type UiState = {
  selectedUserIds: string[];
  sidebarOpen: boolean;
  setSelectedUserIds: (ids: string[]) => void;
  toggleSidebar: () => void;
};

export const useUiStore = create<UiState>((set) => ({
  selectedUserIds: [],
  sidebarOpen: false,
  setSelectedUserIds: (ids) => set({ selectedUserIds: ids }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
```

- [ ] **Step 4: Implement navigation and shell**

`src/components/admin/navigation.ts`:

```typescript
import {
  BarChart3,
  Bell,
  CreditCard,
  Gauge,
  Gift,
  Lock,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";

export const adminNavigation = [
  { href: "/dashboard", icon: Gauge, label: "Дашборд", roles: ["admin", "finance", "support", "analyst"] },
  { href: "/users", icon: Users, label: "Пользователи", roles: ["admin", "support"] },
  { href: "/subscriptions", icon: CreditCard, label: "Подписки", roles: ["admin", "finance", "support"] },
  { href: "/marketing", icon: Bell, label: "Маркетинг", roles: ["admin", "marketer"] },
  { href: "/gamification", icon: Gift, label: "Геймификация", roles: ["admin", "marketer"] },
  { href: "/analytics", icon: BarChart3, label: "Аналитика", roles: ["admin", "marketer", "analyst"] },
  { href: "/smart-analytics", icon: Sparkles, label: "Умная аналитика", roles: ["admin", "analyst"] },
  { href: "/security", icon: Lock, label: "Безопасность", roles: ["admin"] },
  { href: "/settings", icon: Settings, label: "Настройки", roles: ["admin"] },
] as const;
```

`src/components/admin/admin-shell.tsx`:

```typescript
import { Bell, Search } from "lucide-react";
import Link from "next/link";
import { adminNavigation } from "./navigation";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-base text-text-primary">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-white/10 bg-bg-card px-4 py-5 lg:block">
        <div className="mb-8 text-xl font-semibold">SubHub Admin</div>
        <nav aria-label="Основная навигация" className="space-y-1">
          {adminNavigation.map((item) => (
            <Link
              className="flex min-h-10 items-center gap-3 rounded-md px-3 text-sm text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
              href={item.href}
              key={item.href}
            >
              <item.icon aria-hidden className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 flex min-h-16 items-center justify-between border-b border-white/10 bg-bg-base/95 px-4 backdrop-blur lg:px-8">
          <label className="flex h-10 w-full max-w-md items-center gap-2 rounded-md border border-white/10 bg-bg-card px-3 text-sm text-text-secondary">
            <Search aria-hidden className="h-4 w-4" />
            <input className="w-full bg-transparent outline-none" placeholder="Поиск" />
          </label>
          <button aria-label="Оповещения" className="ml-4 grid h-10 w-10 place-items-center rounded-md border border-white/10 bg-bg-card">
            <Bell aria-hidden className="h-4 w-4" />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Update root layout, styles, route group, and index redirect**

`src/app/layout.tsx`:

```typescript
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ subsets: ["latin", "cyrillic"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  description: "Панель администратора для мобильного приложения SubHub",
  title: "SubHub Admin Console",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
```

`src/app/globals.css`:

```css
@import "tailwindcss";
@import "@heroui/styles/dist/theme-dark.css";

@theme inline {
  --color-bg-base: #0f1117;
  --color-bg-card: #1a1d2e;
  --color-bg-elevated: #22263a;
  --color-bg-overlay: #2c3150;
  --color-brand-primary: #6366f1;
  --color-brand-secondary: #8b5cf6;
  --color-danger: #ef4444;
  --color-info: #3b82f6;
  --color-muted: #6b7280;
  --color-success: #22c55e;
  --color-text-disabled: #475569;
  --color-text-primary: #f1f5f9;
  --color-text-secondary: #94a3b8;
  --color-warning: #f59e0b;
  --font-mono: var(--font-geist-mono);
  --font-sans: var(--font-geist-sans);
}

html {
  background: var(--color-bg-base);
  color: var(--color-text-primary);
}

body {
  background: var(--color-bg-base);
  font-family: var(--font-sans), Arial, Helvetica, sans-serif;
  margin: 0;
}

button,
input,
select,
textarea {
  font: inherit;
}
```

`src/app/(admin)/layout.tsx`:

```typescript
import { AdminShell } from "@/components/admin/admin-shell";
import { AppProviders } from "@/lib/query-client";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProviders>
      <AdminShell>{children}</AdminShell>
    </AppProviders>
  );
}
```

`src/app/page.tsx`:

```typescript
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/dashboard");
}
```

- [ ] **Step 6: Verify and commit**

Run:

```powershell
npm.cmd run test -- src/tests/shell.test.tsx
npm.cmd run typecheck
npm.cmd run lint
```

Expected: all pass.

Commit:

```powershell
git add src/app src/components/admin src/lib src/stores src/tests/shell.test.tsx
git commit -m "feat(admin): add admin shell"
```

---

### Task 3: Contract-First API Adapter and Mocks

**Files:**
- Create: `src/lib/api/contracts.ts`
- Create: `src/lib/api/mock-data.ts`
- Create: `src/lib/api/mock-service.ts`
- Create: `src/lib/api/client.ts`
- Test: `src/tests/contracts.test.ts`

- [ ] **Step 1: Write failing contract test**

`src/tests/contracts.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { blockUser, getDashboardKpis, getTariffs, getUser, getUsers, grantPoints } from "@/lib/api/client";

describe("mock API contract", () => {
  it("returns FastAPI-shaped dashboard and users data", async () => {
    const kpis = await getDashboardKpis();
    const users = await getUsers({ page: 1, per_page: 10, search: "anna" });

    expect(kpis.data.mrr.currency).toBe("RUB");
    expect(kpis.data.active_users.value).toBeGreaterThan(0);
    expect(users.data.items[0].email).toContain("@");
    expect(users.data.page).toBe(1);
  });

  it("mutates user status and points in the mock adapter", async () => {
    const users = await getUsers({ page: 1, per_page: 10 });
    const first = users.data.items[0];

    await blockUser(first.id, { reason: "Проверочная блокировка пользователя" });
    await grantPoints(first.id, { amount: 100, comment: "Компенсация от поддержки" });

    const profile = await getUser(first.id);
    expect(profile.data.status).toBe("blocked");
    expect(profile.data.points_balance).toBeGreaterThanOrEqual(100);
  });

  it("returns tariffs for the subscriptions slice", async () => {
    const tariffs = await getTariffs();
    expect(tariffs.data[0].currency).toBe("RUB");
    expect(tariffs.data[0].services.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to confirm failure**

```powershell
npm.cmd run test -- src/tests/contracts.test.ts
```

Expected: fail because `@/lib/api/client` does not exist.

- [ ] **Step 3: Implement contracts**

`src/lib/api/contracts.ts`:

```typescript
export type ApiResponse<T> = {
  data: T;
  meta?: Record<string, unknown>;
};

export type PaginatedResponse<T> = {
  items: T[];
  page: number;
  per_page: number;
  total: number;
};

export type ApiError = {
  code: string;
  details?: Record<string, string[]>;
  message: string;
  request_id?: string;
};

export type Trend = "up" | "down" | "flat";
export type ChurnRisk = "high" | "medium" | "low";
export type UserStatus = "active" | "blocked" | "trial" | "frozen";
export type TariffStatus = "active" | "archived";

export type KpiMetric = {
  currency?: "RUB" | "USD" | "EUR";
  delta_pct: number;
  trend: Trend;
  value: number;
};

export type DashboardKpis = {
  active_users: KpiMetric;
  churn_rate: KpiMetric;
  failed_payments: KpiMetric;
  mrr: KpiMetric & { currency: "RUB" | "USD" | "EUR" };
};

export type MrrPoint = {
  date: string;
  mrr: number;
  new_users: number;
};

export type Anomaly = {
  description: string;
  id: string;
  severity: "info" | "warning" | "critical";
  title: string;
};

export type ServiceRef = {
  id: string;
  name: string;
};

export type TopService = ServiceRef & {
  mrr: number;
  subscribers: number;
};

export type UserRow = {
  avatar_url: string | null;
  churn_risk: ChurnRisk;
  email: string;
  id: string;
  last_seen_at: string;
  mrr: number;
  name: string;
  registered_at: string;
  status: UserStatus;
  tariff: string;
};

export type Device = {
  id: string;
  last_seen_at: string;
  platform: "ios" | "android";
};

export type Subscription = {
  id: string;
  next_payment_at: string;
  price: number;
  status: "active" | "cancelled" | "frozen" | "past_due";
  tariff: string;
};

export type UserProfile = UserRow & {
  active_subscriptions: Subscription[];
  churn_probability: number;
  country: string;
  devices: Device[];
  phone: string | null;
  points_balance: number;
};

export type UserFilterParams = {
  churn_risk?: ChurnRisk[];
  page?: number;
  per_page?: number;
  search?: string;
  status?: UserStatus[];
  tariff_id?: string[];
};

export type BlockUserRequest = {
  reason: string;
};

export type GrantPointsRequest = {
  amount: number;
  comment: string;
};

export type Tariff = {
  currency: "RUB" | "USD" | "EUR";
  id: string;
  is_public: boolean;
  name: string;
  period: "month" | "year" | "once";
  price: number;
  services: ServiceRef[];
  status: TariffStatus;
  subscribers: number;
  trial_days: number;
};
```

- [ ] **Step 4: Implement mock data and service**

`src/lib/api/mock-data.ts`:

```typescript
import type { Anomaly, DashboardKpis, MrrPoint, Tariff, TopService, UserProfile } from "./contracts";

export const dashboardKpis: DashboardKpis = {
  active_users: { delta_pct: 8.4, trend: "up", value: 18420 },
  churn_rate: { delta_pct: -1.2, trend: "down", value: 0.047 },
  failed_payments: { delta_pct: 2.1, trend: "up", value: 312 },
  mrr: { currency: "RUB", delta_pct: 12.6, trend: "up", value: 8420000 },
};

export const mrrChart: MrrPoint[] = [
  { date: "2026-01", mrr: 6100000, new_users: 840 },
  { date: "2026-02", mrr: 6740000, new_users: 910 },
  { date: "2026-03", mrr: 7210000, new_users: 980 },
  { date: "2026-04", mrr: 7890000, new_users: 1040 },
  { date: "2026-05", mrr: 8420000, new_users: 1120 },
];

export const anomalies: Anomaly[] = [
  { description: "Decline rate вырос на 18% за последние 2 часа.", id: "anomaly-1", severity: "critical", title: "Рост ошибок оплаты" },
  { description: "Сегмент trial показывает повышенный риск оттока.", id: "anomaly-2", severity: "warning", title: "Отток trial-пользователей" },
];

export const topServices: TopService[] = [
  { id: "spotify", mrr: 1820000, name: "Spotify", subscribers: 4210 },
  { id: "netflix", mrr: 1640000, name: "Netflix", subscribers: 3880 },
  { id: "youtube", mrr: 1210000, name: "YouTube Premium", subscribers: 2910 },
];

export const users: UserProfile[] = [
  {
    active_subscriptions: [{ id: "sub-1", next_payment_at: "2026-06-02T10:00:00Z", price: 599, status: "active", tariff: "Plus" }],
    avatar_url: null,
    churn_probability: 0.18,
    churn_risk: "low",
    country: "RU",
    devices: [{ id: "dev-1", last_seen_at: "2026-05-19T12:30:00Z", platform: "ios" }],
    email: "anna.morozova@example.com",
    id: "11111111-1111-4111-8111-111111111111",
    last_seen_at: "2026-05-19T12:30:00Z",
    mrr: 599,
    name: "Анна Морозова",
    phone: "+79990000001",
    points_balance: 1240,
    registered_at: "2025-11-14T09:00:00Z",
    status: "active",
    tariff: "Plus",
  },
  {
    active_subscriptions: [{ id: "sub-2", next_payment_at: "2026-05-24T10:00:00Z", price: 1099, status: "past_due", tariff: "Family" }],
    avatar_url: null,
    churn_probability: 0.74,
    churn_risk: "high",
    country: "RU",
    devices: [{ id: "dev-2", last_seen_at: "2026-05-10T07:10:00Z", platform: "android" }],
    email: "ilya.sokolov@example.com",
    id: "22222222-2222-4222-8222-222222222222",
    last_seen_at: "2026-05-10T07:10:00Z",
    mrr: 1099,
    name: "Илья Соколов",
    phone: null,
    points_balance: 320,
    registered_at: "2025-12-02T11:00:00Z",
    status: "trial",
    tariff: "Family",
  },
];

export const tariffs: Tariff[] = [
  { currency: "RUB", id: "tariff-plus", is_public: true, name: "Plus", period: "month", price: 599, services: [{ id: "spotify", name: "Spotify" }], status: "active", subscribers: 8420, trial_days: 7 },
  { currency: "RUB", id: "tariff-family", is_public: true, name: "Family", period: "month", price: 1099, services: [{ id: "netflix", name: "Netflix" }], status: "active", subscribers: 3120, trial_days: 14 },
];
```

`src/lib/api/mock-service.ts`:

```typescript
import type { ApiResponse, BlockUserRequest, GrantPointsRequest, PaginatedResponse, UserFilterParams, UserProfile, UserRow } from "./contracts";
import { anomalies, dashboardKpis, mrrChart, tariffs, topServices, users } from "./mock-data";

const mutableUsers = users.map((user) => ({ ...user }));

function toRow(user: UserProfile): UserRow {
  const { active_subscriptions, churn_probability, country, devices, phone, points_balance, ...row } = user;
  void active_subscriptions;
  void churn_probability;
  void country;
  void devices;
  void phone;
  void points_balance;
  return row;
}

export const mockService = {
  async blockUser(id: string, request: BlockUserRequest): Promise<ApiResponse<null>> {
    if (request.reason.length < 10) throw new Error("Причина должна быть не короче 10 символов");
    const user = mutableUsers.find((item) => item.id === id);
    if (user) user.status = "blocked";
    return { data: null };
  },
  async getDashboard() {
    return {
      anomalies: { data: anomalies },
      kpis: { data: dashboardKpis },
      mrrChart: { data: mrrChart },
      topServices: { data: topServices },
    };
  },
  async getTariffs() {
    return { data: tariffs };
  },
  async getUser(id: string): Promise<ApiResponse<UserProfile>> {
    const user = mutableUsers.find((item) => item.id === id);
    if (!user) throw new Error("Пользователь не найден");
    return { data: user };
  },
  async getUsers(params: UserFilterParams): Promise<ApiResponse<PaginatedResponse<UserRow>>> {
    const page = params.page ?? 1;
    const perPage = params.per_page ?? 25;
    const search = params.search?.toLowerCase().trim();
    const filtered = mutableUsers.filter((user) => {
      const matchesSearch = !search || user.name.toLowerCase().includes(search) || user.email.toLowerCase().includes(search);
      const matchesStatus = !params.status?.length || params.status.includes(user.status);
      const matchesRisk = !params.churn_risk?.length || params.churn_risk.includes(user.churn_risk);
      return matchesSearch && matchesStatus && matchesRisk;
    });
    const start = (page - 1) * perPage;
    return { data: { items: filtered.slice(start, start + perPage).map(toRow), page, per_page: perPage, total: filtered.length } };
  },
  async grantPoints(id: string, request: GrantPointsRequest): Promise<ApiResponse<null>> {
    const user = mutableUsers.find((item) => item.id === id);
    if (user) user.points_balance += request.amount;
    return { data: null };
  },
};
```

`src/lib/api/client.ts`:

```typescript
import type { BlockUserRequest, GrantPointsRequest, UserFilterParams } from "./contracts";
import { mockService } from "./mock-service";

export async function getDashboardKpis() {
  return (await mockService.getDashboard()).kpis;
}

export async function getMrrChart() {
  return (await mockService.getDashboard()).mrrChart;
}

export async function getAnomalies() {
  return (await mockService.getDashboard()).anomalies;
}

export async function getTopServices() {
  return (await mockService.getDashboard()).topServices;
}

export function getUsers(params: UserFilterParams) {
  return mockService.getUsers(params);
}

export function getUser(id: string) {
  return mockService.getUser(id);
}

export function blockUser(id: string, request: BlockUserRequest) {
  return mockService.blockUser(id, request);
}

export function grantPoints(id: string, request: GrantPointsRequest) {
  return mockService.grantPoints(id, request);
}

export function getTariffs() {
  return mockService.getTariffs();
}
```

- [ ] **Step 5: Verify and commit**

Run:

```powershell
npm.cmd run test -- src/tests/contracts.test.ts
npm.cmd run typecheck
npm.cmd run lint
```

Expected: all pass.

Commit:

```powershell
git add src/lib/api src/tests/contracts.test.ts
git commit -m "feat(admin): add contract-first mock API"
```

---

### Task 4: Dashboard MVP

**Files:**
- Create: `src/app/(admin)/dashboard/page.tsx`
- Create: `src/components/dashboard/dashboard-client.tsx`
- Create: `src/components/dashboard/metric-card.tsx`
- Create: `src/components/dashboard/mrr-chart.tsx`
- Create: `src/components/ui/section.tsx`
- Create: `src/components/ui/loading-state.tsx`
- Create: `src/components/ui/error-state.tsx`
- Test: `src/tests/dashboard.test.tsx`

- [ ] **Step 1: Write failing dashboard test**

`src/tests/dashboard.test.tsx`:

```typescript
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

describe("DashboardClient", () => {
  it("renders KPI cards and operational sections", async () => {
    const client = new QueryClient();
    render(
      <QueryClientProvider client={client}>
        <DashboardClient />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(screen.getByText("MRR")).toBeInTheDocument());
    expect(screen.getByText("Активные пользователи")).toBeInTheDocument();
    expect(screen.getByText("Аномалии")).toBeInTheDocument();
    expect(screen.getByText("Топ сервисов")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to confirm failure**

```powershell
npm.cmd run test -- src/tests/dashboard.test.tsx
```

Expected: fail because dashboard components do not exist.

- [ ] **Step 3: Implement reusable UI pieces**

`src/components/ui/section.tsx`:

```typescript
export function Section({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section className="rounded-md border border-white/10 bg-bg-card p-4">
      <h2 className="mb-4 text-sm font-semibold text-text-primary">{title}</h2>
      {children}
    </section>
  );
}
```

`src/components/ui/loading-state.tsx`:

```typescript
export function LoadingState({ label = "Загрузка данных" }: { label?: string }) {
  return <div className="rounded-md border border-white/10 bg-bg-card p-4 text-sm text-text-secondary">{label}</div>;
}
```

`src/components/ui/error-state.tsx`:

```typescript
export function ErrorState({ message = "Не удалось загрузить данные" }: { message?: string }) {
  return <div className="rounded-md border border-danger/40 bg-danger/10 p-4 text-sm text-danger">{message}</div>;
}
```

- [ ] **Step 4: Implement dashboard widgets**

`src/components/dashboard/metric-card.tsx`:

```typescript
import type { Trend } from "@/lib/api/contracts";

export function MetricCard({ delta, label, trend, value }: { delta: number; label: string; trend: Trend; value: string }) {
  const deltaPrefix = delta > 0 ? "+" : "";
  return (
    <article className="rounded-md border border-white/10 bg-bg-card p-4">
      <p className="text-sm text-text-secondary">{label}</p>
      <div className="mt-3 flex items-end justify-between gap-4">
        <strong className="text-2xl font-semibold">{value}</strong>
        <span className={trend === "down" ? "text-success" : "text-warning"}>{deltaPrefix}{delta}%</span>
      </div>
    </article>
  );
}
```

`src/components/dashboard/mrr-chart.tsx`:

```typescript
"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MrrPoint } from "@/lib/api/contracts";

export function MrrChart({ data }: { data: MrrPoint[] }) {
  return (
    <div className="h-72">
      <ResponsiveContainer height="100%" width="100%">
        <AreaChart data={data}>
          <CartesianGrid stroke="rgba(255,255,255,0.08)" />
          <XAxis dataKey="date" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip contentStyle={{ background: "#1a1d2e", border: "1px solid rgba(255,255,255,0.12)" }} />
          <Area dataKey="mrr" fill="#6366f1" fillOpacity={0.22} stroke="#6366f1" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
```

`src/components/dashboard/dashboard-client.tsx`:

```typescript
"use client";

import { useQuery } from "@tanstack/react-query";
import { getAnomalies, getDashboardKpis, getMrrChart, getTopServices } from "@/lib/api/client";
import { formatCurrencyRub, formatPercent } from "@/lib/utils";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { Section } from "@/components/ui/section";
import { MetricCard } from "./metric-card";
import { MrrChart } from "./mrr-chart";

export function DashboardClient() {
  const kpis = useQuery({ queryKey: ["dashboard", "kpis"], queryFn: getDashboardKpis });
  const chart = useQuery({ queryKey: ["dashboard", "mrr"], queryFn: getMrrChart });
  const anomalies = useQuery({ queryKey: ["dashboard", "anomalies"], queryFn: getAnomalies });
  const topServices = useQuery({ queryKey: ["dashboard", "top-services"], queryFn: getTopServices });

  if (kpis.isLoading) return <LoadingState />;
  if (!kpis.data) return <ErrorState />;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard delta={kpis.data.data.active_users.delta_pct} label="Активные пользователи" trend={kpis.data.data.active_users.trend} value={kpis.data.data.active_users.value.toLocaleString("ru-RU")} />
        <MetricCard delta={kpis.data.data.mrr.delta_pct} label="MRR" trend={kpis.data.data.mrr.trend} value={formatCurrencyRub(kpis.data.data.mrr.value)} />
        <MetricCard delta={kpis.data.data.churn_rate.delta_pct} label="Churn Rate" trend={kpis.data.data.churn_rate.trend} value={formatPercent(kpis.data.data.churn_rate.value)} />
        <MetricCard delta={kpis.data.data.failed_payments.delta_pct} label="Ошибки оплаты" trend={kpis.data.data.failed_payments.trend} value={kpis.data.data.failed_payments.value.toLocaleString("ru-RU")} />
      </div>
      <Section title="Динамика MRR">
        {chart.data ? <MrrChart data={chart.data.data} /> : <LoadingState label="Загрузка графика" />}
      </Section>
      <div className="grid gap-4 xl:grid-cols-2">
        <Section title="Аномалии">
          <div className="space-y-3">
            {anomalies.data?.data.map((item) => (
              <article className="rounded-md bg-bg-elevated p-3" key={item.id}>
                <strong>{item.title}</strong>
                <p className="mt-1 text-sm text-text-secondary">{item.description}</p>
              </article>
            ))}
          </div>
        </Section>
        <Section title="Топ сервисов">
          <div className="space-y-3">
            {topServices.data?.data.map((service) => (
              <div className="flex justify-between gap-4 text-sm" key={service.id}>
                <span>{service.name}</span>
                <span className="text-text-secondary">{service.subscribers.toLocaleString("ru-RU")} пользователей</span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
```

`src/app/(admin)/dashboard/page.tsx`:

```typescript
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default function DashboardPage() {
  return (
    <main className="px-4 py-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Дашборд</h1>
        <p className="mt-1 text-sm text-text-secondary">Операционная картина мобильного приложения SubHub.</p>
      </div>
      <DashboardClient />
    </main>
  );
}
```

- [ ] **Step 5: Verify and commit**

Run:

```powershell
npm.cmd run test -- src/tests/dashboard.test.tsx
npm.cmd run typecheck
npm.cmd run lint
```

Expected: all pass.

Commit:

```powershell
git add "src/app/(admin)/dashboard" src/components/dashboard src/components/ui src/tests/dashboard.test.tsx
git commit -m "feat(admin): implement dashboard MVP"
```

---

### Task 5: Users CRM MVP

**Files:**
- Create: `src/app/(admin)/users/page.tsx`
- Create: `src/app/(admin)/users/[id]/page.tsx`
- Create: `src/components/users/users-client.tsx`
- Create: `src/components/users/user-profile.tsx`
- Create: `src/components/users/user-actions.tsx`
- Create: `src/components/ui/status-badge.tsx`
- Test: `src/tests/users.test.tsx`

- [ ] **Step 1: Write failing users test**

`src/tests/users.test.tsx`:

```typescript
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { UsersClient } from "@/components/users/users-client";

describe("UsersClient", () => {
  it("renders users and filters by search", async () => {
    const client = new QueryClient();
    const user = userEvent.setup();
    render(
      <QueryClientProvider client={client}>
        <UsersClient />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(screen.getByText("Анна Морозова")).toBeInTheDocument());
    await user.type(screen.getByPlaceholderText(/имя или email/i), "ilya");
    await waitFor(() => expect(screen.getByText("Илья Соколов")).toBeInTheDocument());
  });
});
```

- [ ] **Step 2: Run test to confirm failure**

```powershell
npm.cmd run test -- src/tests/users.test.tsx
```

Expected: fail because users components do not exist.

- [ ] **Step 3: Implement status badges and users table**

`src/components/ui/status-badge.tsx`:

```typescript
import type { ChurnRisk, UserStatus } from "@/lib/api/contracts";

const userLabels: Record<UserStatus, string> = {
  active: "Активен",
  blocked: "Заблокирован",
  frozen: "Заморожен",
  trial: "Trial",
};

const riskLabels: Record<ChurnRisk, string> = {
  high: "Высокий",
  low: "Низкий",
  medium: "Средний",
};

export function UserStatusBadge({ status }: { status: UserStatus }) {
  return <span className="rounded bg-bg-elevated px-2 py-1 text-xs text-text-secondary">{userLabels[status]}</span>;
}

export function ChurnRiskBadge({ risk }: { risk: ChurnRisk }) {
  return <span className="rounded bg-bg-elevated px-2 py-1 text-xs text-text-secondary">{riskLabels[risk]}</span>;
}
```

`src/components/users/users-client.tsx`:

```typescript
"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState } from "react";
import { getUsers } from "@/lib/api/client";
import { formatCurrencyRub } from "@/lib/utils";
import { ChurnRiskBadge, UserStatusBadge } from "@/components/ui/status-badge";

export function UsersClient() {
  const [search, setSearch] = useState("");
  const params = useMemo(() => ({ page: 1, per_page: 25, search: search || undefined }), [search]);
  const users = useQuery({ queryKey: ["users", params], queryFn: () => getUsers(params) });

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-white/10 bg-bg-card p-4">
        <input className="h-10 w-full rounded-md border border-white/10 bg-bg-elevated px-3 text-sm outline-none md:w-80" onChange={(event) => setSearch(event.target.value)} placeholder="Имя или email" value={search} />
      </div>
      <div className="overflow-x-auto rounded-md border border-white/10 bg-bg-card">
        <table className="w-full min-w-[840px] border-collapse text-left text-sm">
          <thead className="bg-bg-elevated text-text-secondary">
            <tr>
              <th className="p-3">Пользователь</th>
              <th className="p-3">Статус</th>
              <th className="p-3">Тариф</th>
              <th className="p-3">MRR</th>
              <th className="p-3">Риск</th>
              <th className="p-3">Последняя активность</th>
            </tr>
          </thead>
          <tbody>
            {users.data?.data.items.map((item) => (
              <tr className="border-t border-white/10" key={item.id}>
                <td className="p-3">
                  <Link className="font-medium hover:text-brand-primary" href={`/users/${item.id}`}>{item.name}</Link>
                  <div className="text-text-secondary">{item.email}</div>
                </td>
                <td className="p-3"><UserStatusBadge status={item.status} /></td>
                <td className="p-3">{item.tariff}</td>
                <td className="p-3">{formatCurrencyRub(item.mrr)}</td>
                <td className="p-3"><ChurnRiskBadge risk={item.churn_risk} /></td>
                <td className="p-3 text-text-secondary">{new Date(item.last_seen_at).toLocaleString("ru-RU")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

`src/app/(admin)/users/page.tsx`:

```typescript
import { UsersClient } from "@/components/users/users-client";

export default function UsersPage() {
  return (
    <main className="px-4 py-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Пользователи</h1>
        <p className="mt-1 text-sm text-text-secondary">CRM мобильного приложения SubHub.</p>
      </div>
      <UsersClient />
    </main>
  );
}
```

- [ ] **Step 4: Implement user profile and actions**

`src/components/users/user-actions.tsx`:

```typescript
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { blockUser, grantPoints } from "@/lib/api/client";

export function UserActions({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("Нарушение правил сервиса");
  const [amount, setAmount] = useState(100);

  const block = useMutation({
    mutationFn: () => blockUser(userId, { reason }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user", userId] }),
  });
  const grant = useMutation({
    mutationFn: () => grantPoints(userId, { amount, comment: "Компенсация от поддержки" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user", userId] }),
  });

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <form className="rounded-md border border-white/10 bg-bg-card p-4" onSubmit={(event) => { event.preventDefault(); block.mutate(); }}>
        <label className="text-sm text-text-secondary">Причина блокировки</label>
        <input className="mt-2 h-10 w-full rounded-md border border-white/10 bg-bg-elevated px-3 text-sm" onChange={(event) => setReason(event.target.value)} value={reason} />
        <button className="mt-3 h-10 rounded-md bg-danger px-4 text-sm text-white" disabled={block.isPending}>Заблокировать</button>
      </form>
      <form className="rounded-md border border-white/10 bg-bg-card p-4" onSubmit={(event) => { event.preventDefault(); grant.mutate(); }}>
        <label className="text-sm text-text-secondary">Начислить баллы</label>
        <input className="mt-2 h-10 w-full rounded-md border border-white/10 bg-bg-elevated px-3 text-sm" onChange={(event) => setAmount(Number(event.target.value))} type="number" value={amount} />
        <button className="mt-3 h-10 rounded-md bg-brand-primary px-4 text-sm text-white" disabled={grant.isPending}>Начислить</button>
      </form>
    </div>
  );
}
```

`src/components/users/user-profile.tsx`:

```typescript
"use client";

import { useQuery } from "@tanstack/react-query";
import { getUser } from "@/lib/api/client";
import { formatCurrencyRub, formatPercent } from "@/lib/utils";
import { ChurnRiskBadge, UserStatusBadge } from "@/components/ui/status-badge";
import { UserActions } from "./user-actions";

export function UserProfile({ userId }: { userId: string }) {
  const user = useQuery({ queryKey: ["user", userId], queryFn: () => getUser(userId) });
  if (!user.data) return <p className="text-text-secondary">Загрузка карточки...</p>;
  const profile = user.data.data;

  return (
    <div className="space-y-4">
      <section className="rounded-md border border-white/10 bg-bg-card p-4">
        <div className="flex flex-col justify-between gap-4 md:flex-row">
          <div>
            <h1 className="text-2xl font-semibold">{profile.name}</h1>
            <p className="text-text-secondary">{profile.email}</p>
          </div>
          <div className="flex gap-2">
            <UserStatusBadge status={profile.status} />
            <ChurnRiskBadge risk={profile.churn_risk} />
          </div>
        </div>
        <dl className="mt-6 grid gap-4 md:grid-cols-4">
          <div><dt className="text-sm text-text-secondary">MRR</dt><dd>{formatCurrencyRub(profile.mrr)}</dd></div>
          <div><dt className="text-sm text-text-secondary">Баллы</dt><dd>{profile.points_balance}</dd></div>
          <div><dt className="text-sm text-text-secondary">Отток</dt><dd>{formatPercent(profile.churn_probability)}</dd></div>
          <div><dt className="text-sm text-text-secondary">Страна</dt><dd>{profile.country}</dd></div>
        </dl>
      </section>
      <UserActions userId={userId} />
    </div>
  );
}
```

`src/app/(admin)/users/[id]/page.tsx`:

```typescript
import { UserProfile } from "@/components/users/user-profile";

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="px-4 py-6 lg:px-8">
      <UserProfile userId={id} />
    </main>
  );
}
```

- [ ] **Step 5: Verify and commit**

Run:

```powershell
npm.cmd run test -- src/tests/users.test.tsx
npm.cmd run typecheck
npm.cmd run lint
```

Expected: all pass.

Commit:

```powershell
git add "src/app/(admin)/users" src/components/users src/components/ui/status-badge.tsx src/tests/users.test.tsx
git commit -m "feat(admin): implement users CRM MVP"
```

---

### Task 6: Minimal Subscriptions Slice

**Files:**
- Create: `src/app/(admin)/subscriptions/page.tsx`
- Create: `src/components/subscriptions/subscriptions-client.tsx`

- [ ] **Step 1: Implement subscriptions client**

`src/components/subscriptions/subscriptions-client.tsx`:

```typescript
"use client";

import { useQuery } from "@tanstack/react-query";
import { getTariffs } from "@/lib/api/client";
import { formatCurrencyRub } from "@/lib/utils";

export function SubscriptionsClient() {
  const tariffs = useQuery({ queryKey: ["tariffs"], queryFn: getTariffs });

  return (
    <div className="overflow-x-auto rounded-md border border-white/10 bg-bg-card">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-bg-elevated text-text-secondary">
          <tr>
            <th className="p-3">Тариф</th>
            <th className="p-3">Цена</th>
            <th className="p-3">Период</th>
            <th className="p-3">Подписчики</th>
            <th className="p-3">Публичный</th>
          </tr>
        </thead>
        <tbody>
          {tariffs.data?.data.map((tariff) => (
            <tr className="border-t border-white/10" key={tariff.id}>
              <td className="p-3 font-medium">{tariff.name}</td>
              <td className="p-3">{formatCurrencyRub(tariff.price)}</td>
              <td className="p-3">{tariff.period}</td>
              <td className="p-3">{tariff.subscribers.toLocaleString("ru-RU")}</td>
              <td className="p-3">{tariff.is_public ? "Да" : "Нет"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

`src/app/(admin)/subscriptions/page.tsx`:

```typescript
import { SubscriptionsClient } from "@/components/subscriptions/subscriptions-client";

export default function SubscriptionsPage() {
  return (
    <main className="px-4 py-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Подписки</h1>
        <p className="mt-1 text-sm text-text-secondary">Минимальный срез тарифов до готовности FastAPI.</p>
      </div>
      <SubscriptionsClient />
    </main>
  );
}
```

- [ ] **Step 2: Verify and commit**

Run:

```powershell
npm.cmd run typecheck
npm.cmd run lint
```

Expected: all pass.

Commit:

```powershell
git add "src/app/(admin)/subscriptions" src/components/subscriptions
git commit -m "feat(admin): add subscriptions MVP"
```

---

### Task 7: Smoke Verification and Handoff

**Files:**
- Create: `src/tests/smoke.spec.ts`
- Modify: `README.md`

- [ ] **Step 1: Create smoke test**

`src/tests/smoke.spec.ts`:

```typescript
import { expect, test } from "@playwright/test";

test("admin MVP routes render", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Дашборд" })).toBeVisible();
  await expect(page.getByText("MRR")).toBeVisible();

  await page.goto("/users");
  await expect(page.getByRole("heading", { name: "Пользователи" })).toBeVisible();
  await expect(page.getByText("Анна Морозова")).toBeVisible();

  await page.goto("/subscriptions");
  await expect(page.getByRole("heading", { name: "Подписки" })).toBeVisible();
  await expect(page.getByText("Plus")).toBeVisible();
});
```

- [ ] **Step 2: Add README handoff section**

Append to `README.md`:

```markdown
## SubHub Admin Console

The admin console is contract-first. Until the Python + FastAPI backend is available, UI data comes from `src/lib/api/mock-service.ts`.

Useful commands:

```powershell
npm.cmd run dev
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test
npm.cmd run build
npm.cmd run test:e2e
```

When FastAPI is ready, replace the implementation behind `src/lib/api/client.ts` while preserving exported function signatures and DTOs from `src/lib/api/contracts.ts`.
```

- [ ] **Step 3: Run full verification**

Run:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test
npm.cmd run build
npm.cmd run test:e2e
```

Expected: all commands pass. If `npm.cmd run build` fails because `next/font/google` cannot reach Google during sandboxed execution, either run with approved network access or replace the font import with a local/system font in a separate fix commit.

- [ ] **Step 4: Manual browser check**

Run:

```powershell
npm.cmd run dev
```

Open `http://127.0.0.1:3000/dashboard` and verify:

- Desktop: sidebar, header search, KPI cards, chart, and tables do not overlap.
- Mobile: content remains readable and horizontal table overflow is contained.
- `/users` search filters without layout shift.
- `/subscriptions` proves tariff DTOs are visible.

- [ ] **Step 5: Commit verification**

```powershell
git add README.md src/tests/smoke.spec.ts
git commit -m "test(admin): add smoke verification"
```

---

## Self-Review

Spec coverage in this MVP:

- Covered: admin panel for mobile app, contract-first mock mode before FastAPI, App Router layout, Tailwind v4 tokens, HeroUI provider, React Query, Zustand, dashboard KPI/widgets, users CRM, user profile, block user, grant points, tariff list, loading/error states, and FastAPI handoff.
- Deferred: real auth/session refresh, full RBAC, billing reports, campaign builder, promo codes, gamification store, reviews, what-if analytics, ML churn admin, automation builder, audit log, settings, real SSE/WebSocket, exports, and production FastAPI implementation.

Placeholder scan:

- No `TBD`, `TODO`, or vague implementation-only steps remain.
- Every code-writing step names exact files and includes concrete starter code.

Type consistency:

- `UserStatus`, `ChurnRisk`, `Tariff`, `ApiResponse<T>`, and query functions are defined once in `src/lib/api/contracts.ts` and reused by tests, mocks, and UI.
- Dynamic user route uses `params: Promise<{ id: string }>` per local Next.js 16 docs.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-19-subhub-admin-dashboard.md`. Two execution options:

**1. Subagent-Driven (recommended)** - dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** - execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
