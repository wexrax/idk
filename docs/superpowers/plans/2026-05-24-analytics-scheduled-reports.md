# Analytics Scheduled Reports Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Russian-language scheduled report management to `/analytics`.

**Architecture:** Extend the existing analytics workspace contract with scheduled report data. Keep the page server-first and all interactive scheduling behavior inside `AnalyticsClient` with local UI mutations until backend mutations exist.

**Tech Stack:** Next.js 16 App Router, React 19, TanStack Query, Zod, TypeScript, Tailwind CSS v4, Vitest/Testing Library.

---

### Task 1: Scheduled Report Contract And Mock Data

**Files:**
- Modify: `src/lib/api/contracts.ts`
- Modify: `src/lib/api/mock-data.ts`
- Modify: `src/lib/api/mock-service.ts`

- [x] Add typed DTOs for scheduled analytics reports.
- [x] Add Russian scheduled report seed data to the analytics workspace.
- [x] Update the analytics workspace clone helper to copy scheduled reports.

### Task 2: Russian Scheduled Report UI

**Files:**
- Modify: `src/components/analytics/analytics-client.tsx`

- [x] Add a `Расписание` tab.
- [x] Add a schedule form with name, email, frequency, and format fields.
- [x] Validate schedule name and email with Russian error messages.
- [x] Queue local scheduled reports with Russian success messages.
- [x] Render existing and local scheduled reports in a table.

### Task 3: Focused Verification

**Files:**
- Modify: `src/tests/analytics.test.tsx`
- Modify: `docs/STATUS.md`

- [x] Assert the schedule tab renders Russian scheduled report data.
- [x] Assert a valid scheduled report can be created.
- [x] Assert validation errors appear for invalid schedule input.
- [x] Run `npm.cmd run test -- src/tests/analytics.test.tsx`.
- [x] Run `npm.cmd run test -- src/tests/contracts.test.ts`.
- [x] Run `npm.cmd run lint`.
- [x] Update `STATUS.md` with completed scheduled reports progress.
