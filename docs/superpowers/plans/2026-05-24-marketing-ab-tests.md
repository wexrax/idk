# Marketing A/B Tests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Russian-language A/B split-test management to `/marketing` while preserving campaign filtering and draft creation.

**Architecture:** Extend the existing marketing workspace contract with A/B experiment data. Keep the route server-first and all interactivity inside `MarketingClient`, with local UI mutations for draft campaigns, experiment creation, and winner selection until backend mutations exist.

**Tech Stack:** Next.js 16 App Router, React 19, TanStack Query, Zod, TypeScript, Tailwind CSS v4, Vitest/Testing Library.

---

### Task 1: Marketing A/B Contracts And Mock Data

**Files:**
- Modify: `src/lib/api/contracts.ts`
- Modify: `src/lib/api/mock-data.ts`
- Modify: `src/lib/api/mock-service.ts`

- [x] Add typed DTOs for A/B experiment variants and marketing experiments.
- [x] Add experiment seed data to the marketing workspace.
- [x] Update the marketing workspace clone helper to copy experiments and variants.

### Task 2: Russian Marketing Workspace UI

**Files:**
- Modify: `src/components/marketing/marketing-client.tsx`

- [x] Normalize visible marketing UI copy to Russian.
- [x] Add tabs for campaigns and A/B tests.
- [x] Preserve campaign KPIs, filters, empty state, and draft creation.
- [x] Add A/B test builder with Zod validation.
- [x] Add local winner selection for experiments.

### Task 3: Focused Verification

**Files:**
- Modify: `src/tests/marketing.test.tsx`
- Modify: `docs/STATUS.md`

- [x] Assert Russian campaign UI renders.
- [x] Assert campaign filters and draft creation still work.
- [x] Assert A/B experiment creation, validation, and winner selection.
- [x] Run `npm.cmd run test -- src/tests/marketing.test.tsx`.
- [x] Run `npm.cmd run lint`.
- [x] Update `STATUS.md` with completed A/B testing progress.
