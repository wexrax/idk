# Marketing Campaign Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `/marketing` with a contract-first campaign management UI over mock data.

**Architecture:** Keep the route page server-first and keep interactivity in `MarketingClient`. Marketing reads campaign rows through `src/lib/api/client.ts`; draft creation is local UI state until backend mutation endpoints exist.

**Tech Stack:** Next.js 16 App Router, React 19, TanStack Query, Zod, TypeScript, Tailwind CSS v4, Vitest/Testing Library.

---

### Task 1: Campaign Contract And Mock Data

**Files:**
- Modify: `src/lib/api/contracts.ts`
- Modify: `src/lib/api/mock-data.ts`
- Modify: `src/lib/api/mock-service.ts`
- Modify: `src/lib/api/client.ts`

- [x] Keep marketing DTOs focused on campaigns and the workspace aggregate.
- [x] Move campaign seed data into `mock-data.ts`.
- [x] Expose `getMarketingWorkspace()` through the mock service and API client.

### Task 2: Marketing Workspace Client

**Files:**
- Modify: `src/components/marketing/marketing-client.tsx`

- [x] Fetch marketing workspace data with React Query.
- [x] Render KPI cards for total campaigns, active campaigns, drafts, and conversion rate.
- [x] Add status filter, channel filter, and name search for the campaign table.
- [x] Add a draft campaign form with Zod validation.
- [x] Render `LoadingState`, `ErrorState`, and filtered empty-state copy.

### Task 3: Focused Verification

**Files:**
- Modify: `src/tests/marketing.test.tsx`

- [x] Update tests to wrap the component in a QueryClient provider.
- [x] Assert campaign KPI/table rendering.
- [x] Assert status/channel/search filters.
- [x] Assert draft creation and validation errors.
- [x] Run `npm.cmd run test -- src/tests/marketing.test.tsx`.
- [x] Run `npm.cmd run lint`.
