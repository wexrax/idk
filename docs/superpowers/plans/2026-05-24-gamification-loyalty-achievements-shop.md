# Gamification Loyalty, Achievements, Reward Shop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Russian contract-first UI for loyalty points, achievements, and reward shop in the Gamification admin module.

**Architecture:** Keep the route server-first and implement interactivity inside `GamificationClient`. Extend existing mock API contracts and deterministic fixtures; no backend endpoints are introduced.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS v4, TanStack Query, Zod, Vitest Testing Library.

---

### Task 1: Plan And Context

**Files:**
- Create: `docs/superpowers/plans/2026-05-24-gamification-loyalty-achievements-shop.md`
- Read: `docs/STATUS.md`
- Read: `src/components/gamification/gamification-client.tsx`
- Read: `src/tests/gamification.test.tsx`

- [x] **Step 1: Read the current status and choose scope**

Scope selected from `Marketing & Gamification (Detailed)`:
- `Программа лояльности (loyalty points)`
- `Система достижений (achievements)`
- `Магазин наград (reward shop)`

- [x] **Step 2: Read only the relevant Next.js guide**

Guide read:
- `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`

### Task 2: Loyalty Contracts

**Files:**
- Modify: `src/lib/api/contracts.ts`
- Test: `src/tests/contracts.test.ts`

- [x] **Step 1: Add loyalty point types**

Add contract types for loyalty tiers, account summary, point events, and grant reasons.

- [x] **Step 2: Add loyalty data to `GamificationWorkspace`**

Extend the workspace with `loyalty_summary`, `loyalty_tiers`, and `loyalty_events`.

### Task 3: Loyalty Mock Data

**Files:**
- Modify: `src/lib/api/mock-data.ts`
- Modify: `src/lib/api/mock-service.ts`

- [x] **Step 1: Add deterministic Russian loyalty fixtures**

Add mock balances, tier thresholds, and recent point events.

- [x] **Step 2: Clone nested loyalty arrays safely**

Update `cloneGamificationWorkspace` to return isolated copies.

### Task 4: Gamification UI

**Files:**
- Modify: `src/components/gamification/gamification-client.tsx`

- [x] **Step 1: Translate existing UI to Russian**

Use Russian labels for headings, tabs, buttons, table headers, validation messages, statuses, and empty state.

- [x] **Step 2: Add loyalty points tab**

Show loyalty balance, monthly accrual/spend, tier progress, event history, and a validated local point grant form.

- [x] **Step 3: Keep achievements and reward shop functional**

Preserve local achievement creation, reward redemption, loading, empty, error, and validation behavior.

### Task 5: Tests And Status

**Files:**
- Modify: `src/tests/gamification.test.tsx`
- Modify: `src/tests/contracts.test.ts`
- Modify: `docs/STATUS.md`

- [x] **Step 1: Update focused tests**

Cover Russian labels, achievement creation, reward redemption, loyalty point grant, and validation.

- [x] **Step 2: Update project status**

Mark loyalty points, achievements, and reward shop as completed and add focused check notes.

- [x] **Step 3: Run checks**

Run:
- `npm.cmd run test -- src/tests/gamification.test.tsx`
- `npm.cmd run test -- src/tests/contracts.test.ts`
- `npm.cmd run lint`
- `git diff --check -- <changed files>`
