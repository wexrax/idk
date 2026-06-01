# Settings Contract Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move `/settings` system configuration, integrations, and alert rules to a contract-first mock API workspace.

**Architecture:** Keep `src/app/(admin)/settings/page.tsx` server-first and keep all interactivity inside `SettingsClient`. The client reads a typed settings workspace through `src/lib/api/client.ts`, keeps simulated settings/alert mutations in local component state, and validates form inputs before updating UI.

**Tech Stack:** Next.js 16 App Router, React 19, TanStack Query, Zod, TypeScript, Tailwind CSS v4, Vitest/Testing Library.

---

### Task 1: Settings Contracts And Mock Service

**Files:**
- Modify: `src/lib/api/contracts.ts`
- Modify: `src/lib/api/mock-data.ts`
- Modify: `src/lib/api/mock-service.ts`
- Modify: `src/lib/api/client.ts`

- [x] Add typed DTOs for config drafts, integrations, alert rules, and `SettingsWorkspace`.
- [x] Move settings seed data into `mock-data.ts`.
- [x] Add a clone helper and `getSettingsWorkspace()` to the mock service.
- [x] Expose `getSettingsWorkspace()` from the API client.

### Task 2: Settings Workspace Client

**Files:**
- Modify: `src/components/settings/settings-client.tsx`

- [x] Fetch settings workspace data with React Query.
- [x] Render `LoadingState`, `ErrorState`, and an empty-state fallback.
- [x] Preserve tabs for General, Integrations, and Alerts.
- [x] Keep config draft creation and alert threshold update as local UI state until backend mutation endpoints exist.
- [x] Validate general settings and alert threshold with Zod before updating UI.

### Task 3: Focused Verification

**Files:**
- Modify: `src/tests/settings.test.tsx`

- [x] Wrap the page in a QueryClient provider.
- [x] Assert fetched metrics/table rendering.
- [x] Assert settings draft creation and validation errors.
- [x] Assert integration check and alert threshold update.
- [x] Run `npm.cmd run test -- src/tests/settings.test.tsx`.
- [x] Run `npm.cmd run lint`.
