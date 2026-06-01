# Gamification Contract Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move `/gamification` achievements, reward shop, and app reviews to a contract-first mock API workspace.

**Architecture:** Keep `src/app/(admin)/gamification/page.tsx` as a server component and keep interactivity inside `GamificationClient`. The client fetches typed workspace data through `src/lib/api/client.ts`, stores simulated mutations locally until backend mutation endpoints exist, and validates form input before updating UI.

**Tech Stack:** Next.js 16 App Router, React 19, TanStack Query, Zod, TypeScript, Tailwind CSS v4, Vitest/Testing Library.

---

### Task 1: Gamification Contracts And Mock Service

**Files:**
- Modify: `src/lib/api/contracts.ts`
- Modify: `src/lib/api/mock-data.ts`
- Modify: `src/lib/api/mock-service.ts`
- Modify: `src/lib/api/client.ts`

- [x] Add typed DTOs for achievements, reward items, app reviews, and `GamificationWorkspace`.
- [x] Move gamification seed data into `mock-data.ts`.
- [x] Add a clone helper and `getGamificationWorkspace()` to the mock service.
- [x] Expose `getGamificationWorkspace()` from the API client.

### Task 2: Gamification Workspace Client

**Files:**
- Modify: `src/components/gamification/gamification-client.tsx`

- [x] Fetch gamification workspace data with React Query.
- [x] Render `LoadingState`, `ErrorState`, and an empty-state fallback.
- [x] Preserve tabs for Achievements, Reward shop, and Reviews.
- [x] Keep achievement creation, reward redemption, and review replies as local UI state until backend mutation endpoints exist.
- [x] Validate achievement fields and review response with Zod before updating UI.

### Task 3: Focused Verification

**Files:**
- Modify: `src/tests/gamification.test.tsx`
- Modify: `docs/STATUS.md`

- [x] Wrap the page test in a QueryClient provider.
- [x] Assert fetched metrics/table rendering.
- [x] Assert achievement creation and validation errors.
- [x] Assert reward stock updates and review replies.
- [x] Run `npm.cmd run test -- src/tests/gamification.test.tsx`.
- [x] Run `npm.cmd run lint`.
- [x] Update `STATUS.md` with the completed gamification contract workspace.
