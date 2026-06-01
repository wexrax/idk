# Smart Analytics Contract Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move `/smart-analytics` from local constants to a contract-first mock API workspace with complete interactive UI states.

**Architecture:** Keep `src/app/(admin)/smart-analytics/page.tsx` server-first and keep interactivity inside `SmartAnalyticsClient`. The client reads typed mock data through `src/lib/api/client.ts`, adds local simulated what-if scenarios, and validates scenario input before updating UI.

**Tech Stack:** Next.js 16 App Router, React 19, TanStack Query, Zod, TypeScript, Tailwind CSS v4, Vitest/Testing Library.

---

### Task 1: Smart Analytics Contracts And Mock Service

**Files:**
- Modify: `src/lib/api/contracts.ts`
- Modify: `src/lib/api/mock-data.ts`
- Modify: `src/lib/api/mock-service.ts`
- Modify: `src/lib/api/client.ts`

- [x] Add typed DTOs for smart scenarios, churn-risk segments, automations, and the workspace aggregate.
- [x] Move smart analytics seed data into `mock-data.ts`.
- [x] Add a clone helper and `getSmartAnalyticsWorkspace()` to the mock service.
- [x] Expose `getSmartAnalyticsWorkspace()` from the API client.

### Task 2: Smart Analytics Workspace Client

**Files:**
- Modify: `src/components/smart-analytics/smart-analytics-client.tsx`

- [x] Fetch smart analytics workspace data with React Query.
- [x] Render `LoadingState`, `ErrorState`, and an empty-state fallback.
- [x] Preserve tabs for What-if, Churn risk, and Automations.
- [x] Validate what-if inputs with Zod: price change between -50 and 100, churn delta between -5 and 5, and horizon selected.
- [x] Keep scenario creation as local UI state until backend mutation endpoints exist.

### Task 3: Focused Verification

**Files:**
- Modify: `src/tests/smart-analytics.test.tsx`

- [x] Wrap the page in a QueryClient provider.
- [x] Assert fetched KPI/table rendering.
- [x] Assert scenario calculation and validation errors.
- [x] Assert churn-risk detail and automation preview tabs.
- [x] Run `npm.cmd run test -- src/tests/smart-analytics.test.tsx`.
- [x] Run `npm.cmd run lint`.
