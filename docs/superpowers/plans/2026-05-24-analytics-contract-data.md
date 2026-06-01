# Analytics Contract Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move `/analytics` reports, cohorts, and export jobs to a contract-first mock API workspace.

**Architecture:** Keep `src/app/(admin)/analytics/page.tsx` as a server component and keep all interactivity inside `AnalyticsClient`. The client fetches typed workspace data through `src/lib/api/client.ts`, keeps simulated report/export mutations in local state, and validates report-builder inputs before updating UI.

**Tech Stack:** Next.js 16 App Router, React 19, TanStack Query, Zod, TypeScript, Tailwind CSS v4, Vitest/Testing Library.

---

### Task 1: Analytics Contracts And Mock Service

**Files:**
- Modify: `src/lib/api/contracts.ts`
- Modify: `src/lib/api/mock-data.ts`
- Modify: `src/lib/api/mock-service.ts`
- Modify: `src/lib/api/client.ts`

- [x] Add typed DTOs for reports, cohorts, export jobs, summary metrics, and `AnalyticsWorkspace`.
- [x] Move analytics seed data into `mock-data.ts`.
- [x] Add a clone helper and `getAnalyticsWorkspace()` to the mock service.
- [x] Expose `getAnalyticsWorkspace()` from the API client.

### Task 2: Analytics Workspace Client

**Files:**
- Modify: `src/components/analytics/analytics-client.tsx`

- [x] Fetch analytics workspace data with React Query.
- [x] Render `LoadingState`, `ErrorState`, and an empty-state fallback.
- [x] Preserve tabs for Reports, Cohorts, and Exports.
- [x] Keep report creation and export queueing as local UI state until backend mutation endpoints exist.
- [x] Validate report-builder inputs with Zod before updating UI.

### Task 3: Focused Verification

**Files:**
- Modify: `src/tests/analytics.test.tsx`
- Modify: `docs/STATUS.md`

- [x] Wrap the page test in a QueryClient provider.
- [x] Assert fetched metrics/table rendering.
- [x] Assert report creation and validation errors.
- [x] Assert cohort drill-down and export queueing.
- [x] Run `npm.cmd run test -- src/tests/analytics.test.tsx`.
- [x] Run `npm.cmd run lint`.
- [x] Update `STATUS.md` with the completed analytics contract workspace.
