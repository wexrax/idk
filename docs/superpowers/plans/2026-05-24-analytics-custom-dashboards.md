# Analytics Custom Dashboards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Russian-language custom dashboard builder management to `/analytics`.

**Architecture:** Extend the analytics workspace contract with custom dashboards and widgets. Keep the route server-first and all dashboard builder interactivity inside `AnalyticsClient` with local UI mutations until backend mutations exist.

**Tech Stack:** Next.js 16 App Router, React 19, TanStack Query, Zod, TypeScript, Tailwind CSS v4, Vitest/Testing Library.

---

### Task 1: Dashboard Contract And Mock Data

**Files:**
- Modify: `src/lib/api/contracts.ts`
- Modify: `src/lib/api/mock-data.ts`
- Modify: `src/lib/api/mock-service.ts`

- [x] Add typed DTOs for custom dashboards and dashboard widgets.
- [x] Add Russian custom dashboard seed data to the analytics workspace.
- [x] Update the analytics workspace clone helper to copy dashboards and nested widgets.

### Task 2: Russian Dashboard Builder UI

**Files:**
- Modify: `src/components/analytics/analytics-client.tsx`

- [x] Add a `Дашборды` tab.
- [x] Add a dashboard builder form with name, owner, template, and period fields.
- [x] Validate dashboard name and owner with Russian error messages.
- [x] Add local dashboard creation with default widgets.
- [x] Render dashboard list and selected dashboard widgets.

### Task 3: Focused Verification

**Files:**
- Modify: `src/tests/analytics.test.tsx`
- Modify: `docs/STATUS.md`

- [x] Assert the dashboard tab renders Russian dashboard data.
- [x] Assert a valid custom dashboard can be created.
- [x] Assert validation errors appear for invalid dashboard input.
- [x] Run `npm.cmd run test -- src/tests/analytics.test.tsx`.
- [x] Run `npm.cmd run test -- src/tests/contracts.test.ts`.
- [x] Run `npm.cmd run lint`.
- [x] Update `STATUS.md` with completed custom dashboards progress.
