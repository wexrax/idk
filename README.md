# SubHub Admin Console

Contract-first admin dashboard for the SubHub mobile app.

## Overview

This repository contains the admin console UI for SubHub. The frontend is implemented with **Next.js 16**, **React 19**, and **Tailwind CSS v4**.

The project is designed as a **contract-first UI** experience: the frontend is built against typed API contracts and mock data while the backend is still under development. Once the Python + FastAPI backend is available, the app should switch from mocks to real endpoints with minimal schema friction.

## Current State

- Frontend implemented in **Next.js 16** using the App Router.
- Backend is not implemented yet.
- All UI data is currently sourced from `src/lib/api/mock-service.ts`.
- API DTOs and shared types live in `src/lib/api/contracts.ts`.
- The shared admin shell is interactive: role filtering, environment switching, global search, notifications, collapsible desktop sidebar, and mobile drawer controls are implemented locally in UI state.
- Implemented admin routes:
  - `/dashboard`
  - `/users`
  - `/subscriptions`
  - `/marketing`
  - `/gamification`
  - `/analytics`
  - `/smart-analytics`
  - `/security`
  - `/settings`
- Admin pages live under `src/app/(admin)` and are wrapped in a shared `AdminShell`.

## Project Structure

```text
src/
├── app/
│   ├── layout.tsx          # root layout, fonts, body wrapper
│   └── (admin)/            # admin route group
│       ├── layout.tsx      # Admin shell + providers
│       ├── dashboard/page.tsx
│       ├── users/page.tsx
│       ├── users/[id]/page.tsx
│       ├── subscriptions/page.tsx
│       ├── marketing/page.tsx
│       ├── gamification/page.tsx
│       ├── analytics/page.tsx
│       ├── smart-analytics/page.tsx
│       ├── security/page.tsx
│       └── settings/page.tsx
├── components/
│   ├── admin/              # shared admin UI pieces
│   ├── analytics/          # analytics reports, cohorts, exports
│   ├── dashboard/          # dashboard widgets and charts
│   ├── gamification/       # achievements, reward shop, reviews
│   ├── marketing/          # campaigns, promo codes, referrals
│   ├── security/           # RBAC, audit log, session controls
│   ├── settings/           # system settings, integrations, alerts
│   ├── smart-analytics/    # what-if scenarios, churn risk, automations
│   ├── subscriptions/      # subscription UI
│   ├── users/              # user management UI
│   └── ui/                 # reusable interface primitives
├── lib/
│   ├── api/                # API client, contracts, mock service
│   ├── query-client.tsx    # shared React Query provider
│   └── utils.ts            # helper utilities
├── stores/                 # zustand UI state store
└── test/                   # test setup
```

## Key Files

- `src/lib/api/contracts.ts` — Type-safe DTOs for backend contract agreements.
- `src/lib/api/client.ts` — API client entrypoints; replace mock implementation when the backend is ready.
- `src/lib/api/mock-service.ts` — current mock responses and adapter functions.
- `src/lib/query-client.tsx` — central React Query provider and global mutation/query defaults.
- `src/app/(admin)/layout.tsx` — admin layout wrapper including `AdminShell`.
- `src/components/admin/admin-shell.tsx` — interactive desktop shell: sidebar, role filter, environment selector, search, notifications, and page container.
- `src/components/admin/mobile-sidebar.tsx` — mobile drawer with role/environment selectors.
- `src/components/admin/module-placeholder.tsx` — legacy shared workspace code retained for reference; new routes should use dedicated module clients.
- `src/tests/shell.test.tsx` — coverage for shell navigation, search, roles, environment, notifications, collapse, and mobile drawer behavior.

## Routing and Layouts

### App Router Grouping

The admin section is nested under `src/app/(admin)` to share a common layout and shell. This means each page automatically receives the same sidebar, header, and provider context.

### Page Conventions

- Pages in `src/app/(admin)` are server components by default.
- Use `"use client"` only in components that need state, effects, or browser-only APIs.
- Avoid importing server-only modules into client components.
- Route-specific interactive UIs should live in `src/components/<module>/` and be imported by the server page.

## Data and Contract-First Pattern

The app is intentionally designed to work with a contract-first approach:

- UI shape and API contracts are defined first in `src/lib/api/contracts.ts`.
- Mock implementations live in `src/lib/api/mock-service.ts` and follow the same output contract.
- When the backend is ready, `src/lib/api/client.ts` should switch from mock responses to real network calls while preserving the exported shapes.

This reduces the risk of API drift and ensures the frontend can safely evolve in parallel with the backend.

## Styling

- Uses **Tailwind CSS v4** with the new theme syntax.
- Styling is centralized in `src/app/globals.css`.
- The `cn()` helper in `src/lib/utils.ts` merges Tailwind classes safely.
- Prefer design tokens and semantic class names over hard-coded utility values.

## Admin Shell

The shared admin shell provides:

- navigation between admin sections
- role-aware navigation for `admin`, `finance`, `support`, `analyst`, and `marketer`
- responsive sidebar for mobile and desktop
- collapsible desktop sidebar for dense operational screens
- mobile drawer with role and environment selectors
- global search across accessible modules and quick actions
- notification center with unread count, filters, read actions, and read-event cleanup
- environment switcher for `Production`, `Staging`, and `Sandbox`
- environment safety banner below the header
- global page layout and spacing
- common UI wrapper for `AppProviders`

Role filtering is currently local UI state, not authentication. It models expected RBAC behavior while backend auth is not implemented.

Environment switching is also local UI state. It changes shell context and safety copy only; it does not change API routing because all data still comes from mocks.

## Implemented Modules

### Dashboard

`/dashboard` is the MVP overview route for revenue, subscription, service, churn, and anomaly widgets. It reads through the typed client/mock-service boundary.

### Users

`/users` and `/users/[id]` provide CRM-style user management flows, including search/filter behavior, profile views, and mock user actions.

### Subscriptions

`/subscriptions` covers tariffs and subscription state for the monetization slice. It is intentionally mock-backed but shaped for future backend replacement.

### Marketing

`/marketing` includes campaign building, mobile/desktop preview, test send state, promo code creation, and referral reward settings.

### Gamification

`/gamification` includes achievement construction, reward shop inventory interactions, and app review response handling.

### Analytics

`/analytics` includes report creation, KPI cards, cohort drill-down, and export preparation.

### Smart Analytics

`/smart-analytics` includes what-if pricing scenarios, churn-risk review, and retention automation previews.

### Security

`/security` includes RBAC change drafts, audit log review, and active admin session controls.

### Settings

`/settings` includes general system settings, integration health checks, and alert threshold management.

## Testing

The project includes unit and component tests powered by **Vitest** and **React Testing Library**, plus **Playwright** for E2E.

### Scripts

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test
npm.cmd run test:mvp
npm.cmd run test:watch
npm.cmd run test:e2e
npm.cmd run build
```

### Test Setup

- `src/test/setup.ts` configures the test environment.
- Tests use `@testing-library/react` for component rendering.
- Mocks and providers are included in test wrappers when needed.
- Shell behavior is concentrated in `src/tests/shell.test.tsx`.
- Module behavior is covered by focused tests such as `analytics.test.tsx`, `smart-analytics.test.tsx`, `security.test.tsx`, `settings.test.tsx`, `marketing.test.tsx`, and `gamification.test.tsx`.
- For small changes, prefer running only the affected test file plus `npm.cmd run lint`.

Example targeted checks:

```powershell
npm.cmd run test -- src/tests/shell.test.tsx
npm.cmd run test -- src/tests/settings.test.tsx
npm.cmd run lint
```

## Local Development

### Install

```powershell
npm.cmd install
```

### Run the app

```powershell
npm.cmd run dev
```

### Build

```powershell
npm.cmd run build
```

### Lint

```powershell
npm.cmd run lint
```

### Typecheck

```powershell
npm.cmd run typecheck
```

### Playwright browsers

Before running E2E tests install browsers:

```powershell
npx.cmd playwright install
```

## Contribution Guidelines

- Keep components small and purpose-focused.
- Place shared UI in `src/components/ui` or `src/components/admin`.
- Place route-specific interactive clients under `src/components/<module>/`.
- Keep `src/app/(admin)/**/page.tsx` server-first and delegate stateful UI to client components.
- Keep business logic and data fetching inside pages or hooks, not in simple presentational components.
- Preserve the typed API contract in `src/lib/api/contracts.ts`.
- Avoid new global styles outside `globals.css` unless necessary.
- When changing shell behavior, update `src/tests/shell.test.tsx`.
- When changing a module, update its focused test file instead of broadening unrelated tests.
- Avoid using `src/components/admin/module-placeholder.tsx` for new feature work; create a dedicated module client.

## Backend Handoff

When the Python + FastAPI backend is ready:

1. Implement concrete request/response calls in `src/lib/api/client.ts`.
2. Keep exported functions and DTOs compatible with `src/lib/api/contracts.ts`.
3. Replace mock service usage where appropriate.
4. Verify page behavior with the real API and update typings only if the backend contract changes.
5. Replace local UI-only mutations with API mutations where needed, preserving the component-facing function shapes.
6. Map shell role/environment state to real auth/session/environment context instead of local state.

## Troubleshooting

- If `npm.cmd` is blocked, ensure PowerShell execution policy allows running scripts, or use a standard terminal that supports `.cmd`.
- If the app fails during client-side rendering, check whether a component imported a server-only module.
- For route issues, confirm page files are placed under `src/app/(admin)` and not in nested non-route folders.
- There is no MetaMask wallet integration in this repository; browser wallet extension errors are not from app code.
