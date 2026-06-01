# Analytics Export Russian UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Russian-language CSV/PDF/Excel export preparation to `/analytics`.

**Architecture:** Keep the analytics route server-first and preserve all interactivity inside `AnalyticsClient`. Use existing contract-first mock data and local UI state for prepared export jobs until backend mutations exist.

**Tech Stack:** Next.js 16 App Router, React 19, TanStack Query, Zod, TypeScript, Tailwind CSS v4, Vitest/Testing Library.

---

### Task 1: Export Contract And Mock Data

**Files:**
- Modify: `src/lib/api/contracts.ts`
- Modify: `src/lib/api/mock-data.ts`

- [x] Replace JSON export format with PDF while keeping CSV and XLSX.
- [x] Russianize visible analytics report, cohort, recommendation, and export seed data.
- [x] Keep mock data compatible with the existing `AnalyticsWorkspace` shape.

### Task 2: Russian Analytics Export UI

**Files:**
- Modify: `src/components/analytics/analytics-client.tsx`

- [x] Translate all visible analytics UI copy to Russian.
- [x] Keep report builder controls, validation, and local report creation working.
- [x] Add CSV, PDF, and Excel export actions.
- [x] Queue local export jobs with Russian messages and statuses.
- [x] Keep loading, empty, and error states in Russian.

### Task 3: Focused Verification

**Files:**
- Modify: `src/tests/analytics.test.tsx`
- Modify: `docs/STATUS.md`

- [x] Assert Russian analytics KPI, tabs, and reports render.
- [x] Assert report builder validation and creation.
- [x] Assert cohort drill-down remains functional.
- [x] Assert CSV, PDF, and Excel exports can be queued.
- [x] Run `npm.cmd run test -- src/tests/analytics.test.tsx`.
- [x] Run `npm.cmd run test -- src/tests/contracts.test.ts`.
- [x] Run `npm.cmd run lint`.
- [x] Update `STATUS.md` with completed export progress.
