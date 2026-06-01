# Smart Analytics ML Churn Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add explicit ML churn prediction evidence to `/smart-analytics` while preserving the existing what-if simulator and retention automation flows.

**Architecture:** Keep the route server-first and keep the interactive workspace inside `SmartAnalyticsClient`. Extend the existing smart analytics workspace contract with prediction probability, confidence, and driver fields, then render those fields in the churn risk view.

**Tech Stack:** Next.js 16 App Router, React 19, TanStack Query, Zod, TypeScript, Tailwind CSS v4, Vitest/Testing Library.

---

### Task 1: Contract And Mock Data

**Files:**
- Modify: `src/lib/api/contracts.ts`
- Modify: `src/lib/api/mock-data.ts`
- Modify: `src/lib/api/mock-service.ts`

- [x] Add `churn_probability_pct`, `confidence_pct`, and `top_drivers` to `ChurnRiskSegment`.
- [x] Populate every smart analytics risk segment with ML prediction metadata.
- [x] Update the smart analytics clone helper to copy `top_drivers`.

### Task 2: Smart Analytics UI

**Files:**
- Modify: `src/components/smart-analytics/smart-analytics-client.tsx`

- [x] Render a ML churn prediction card in the summary row.
- [x] Render churn probability, confidence, and top drivers in the selected risk detail panel.
- [x] Preserve what-if scenario calculation, validation, risk row selection, and automation preview.
- [x] Normalize visible smart analytics text touched by this feature to readable English labels.

### Task 3: Focused Verification

**Files:**
- Modify: `src/tests/smart-analytics.test.tsx`
- Modify: `docs/STATUS.md`

- [x] Assert the ML churn prediction summary renders from fetched data.
- [x] Assert selected risk detail shows probability, confidence, and drivers.
- [x] Assert what-if validation and automation preview still work.
- [x] Run `npm.cmd run test -- src/tests/smart-analytics.test.tsx`.
- [x] Run `npm.cmd run lint`.
- [x] Update `STATUS.md` with completed Advanced Analytics progress.
