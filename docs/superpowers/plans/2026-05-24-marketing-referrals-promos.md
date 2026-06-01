# Marketing Referrals And Promo Codes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Russian contract-first UI for referral program management and promo code/coupon operations in the Marketing admin module.

**Architecture:** Keep `/marketing` server-first and extend the existing interactive `MarketingClient`. Add mock-backed DTOs to the existing API contract and deterministic fixtures; no backend integration is introduced.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS v4, TanStack Query, Zod, Vitest Testing Library.

---

### Task 1: Plan And Scope

**Files:**
- Create: `docs/superpowers/plans/2026-05-24-marketing-referrals-promos.md`
- Read: `docs/STATUS.md`
- Read: `src/components/marketing/marketing-client.tsx`
- Read: `src/tests/marketing.test.tsx`

- [x] **Step 1: Choose the next status scope**

Scope selected from `Marketing & Gamification (Detailed)`:
- `Реферальная программа`
- `Промо-коды + купоны`

- [x] **Step 2: Read the relevant Next.js guide**

Guide read:
- `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`

### Task 2: Contracts And Mock Data

**Files:**
- Modify: `src/lib/api/contracts.ts`
- Modify: `src/lib/api/mock-data.ts`
- Modify: `src/lib/api/mock-service.ts`
- Test: `src/tests/contracts.test.ts`

- [x] **Step 1: Add referral program contracts**

Add summary, tier, and referral event DTOs to `MarketingWorkspace`.

- [x] **Step 2: Add promo coupon contracts**

Add coupon status, discount type, and coupon DTOs to `MarketingWorkspace`.

- [x] **Step 3: Add deterministic Russian fixtures**

Add referral and coupon mock data close to expected backend shape.

- [x] **Step 4: Clone nested data safely**

Update `cloneMarketingWorkspace` for the new arrays and summary object.

### Task 3: Marketing UI

**Files:**
- Modify: `src/components/marketing/marketing-client.tsx`

- [x] **Step 1: Add `Рефералы` tab**

Show referral summary, tier cards, recent referral table, and a validated local referral campaign form.

- [x] **Step 2: Add `Промо-коды` tab**

Show coupon filter, coupon cards, and a validated local coupon creation form.

- [x] **Step 3: Preserve existing marketing behavior**

Existing campaign, A/B test, SMS/Push, template, and automation flows continue to work.

### Task 4: Tests And Status

**Files:**
- Modify: `src/tests/marketing.test.tsx`
- Modify: `src/tests/contracts.test.ts`
- Modify: `docs/STATUS.md`

- [x] **Step 1: Update focused tests**

Cover Russian tabs, referral campaign creation, promo coupon creation, and validation.

- [x] **Step 2: Update status**

Mark `Реферальная программа` and `Промо-коды + купоны` complete.

- [x] **Step 3: Run checks**

Run:
- `npm.cmd run test -- src/tests/marketing.test.tsx`
- `npm.cmd run test -- src/tests/contracts.test.ts`
- `npm.cmd run lint`
- `git diff --check -- <changed files>`
