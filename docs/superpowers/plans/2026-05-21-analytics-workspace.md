# Analytics Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generic `/analytics` workspace with a focused analytics UI that supports report creation, cohort drill-down, and export preparation.

**Architecture:** Keep the route as a Server Component and move all interactive state into one client component under `src/components/analytics`. Use deterministic in-memory UI data, matching the existing marketing and gamification modules, so the future API adapter can replace it later.

**Tech Stack:** Next.js 16.2.6 App Router, React 19.2.4, TypeScript, Tailwind CSS v4, lucide-react, Vitest, Testing Library.

---

## File Structure

- Create `src/components/analytics/analytics-client.tsx` for the analytics UI, tabs, report builder, cohort selection, and export state.
- Modify `src/app/(admin)/analytics/page.tsx` to render `AnalyticsClient`.
- Create `src/tests/analytics.test.tsx` to cover the new route behavior.

## Tasks

- [ ] **Task 1: Add route behavior tests**

  Create `src/tests/analytics.test.tsx` with tests that render `AnalyticsPage`, assert the `Аналитика` heading, report builder, KPI table columns, and cohort/export tabs. Add interactions for creating a report, selecting a cohort row, and preparing an export.

- [ ] **Task 2: Implement analytics data model and KPI cards**

  Create typed local arrays for reports, cohorts, exports, and funnel stages. Render four compact KPI cards using existing dark dashboard tokens and lucide icons.

- [ ] **Task 3: Implement report builder**

  Add controlled form fields for period, segment, report type, and grouping. On submit, insert a report row at the top and show a success message with the selected report type and segment.

- [ ] **Task 4: Implement cohort drill-down**

  Add a `Когорты` tab with cohort rows. Clicking a row updates a side panel with retention, churn, ARPU, and recommended action for that cohort.

- [ ] **Task 5: Implement export preparation**

  Add an `Экспорт` tab with CSV/XLSX/JSON buttons and recent export rows. Clicking an export button shows a ready message and updates the selected export format.

- [ ] **Task 6: Wire route and verify**

  Replace the generic `AdminModuleWorkspace` usage in `src/app/(admin)/analytics/page.tsx` with `AnalyticsClient`, then run `npm.cmd run test -- src/tests/analytics.test.tsx`.

## Self-Review

- Spec coverage: the plan covers a full analytics workspace UI with reports, cohorts, and exports.
- Placeholder scan: no `TBD`, vague future steps, or missing test commands remain.
- Type consistency: route, component, and test names match the file structure above.
