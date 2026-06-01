# Smart Analytics Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generic `/smart-analytics` workspace with a focused UI for what-if pricing scenarios, churn-risk review, and retention automation previews.

**Architecture:** Keep the App Router page as a Server Component and put interactive state in one client component under `src/components/smart-analytics`. Use deterministic local data and UI-only mutations, following the established marketing, gamification, and analytics module pattern.

**Tech Stack:** Next.js 16.2.6 App Router, React 19.2.4, TypeScript, Tailwind CSS v4, lucide-react, Vitest, Testing Library.

---

## File Structure

- Create `src/components/smart-analytics/smart-analytics-client.tsx` for what-if, churn-risk, and automation interactions.
- Modify `src/app/(admin)/smart-analytics/page.tsx` to render `SmartAnalyticsClient`.
- Create `src/tests/smart-analytics.test.tsx` for route behavior.
- Modify `src/tests/module-placeholders.test.tsx` so smart analytics is no longer tested as a generic workspace.

## Tasks

- [ ] **Task 1: Add behavior tests**

  Create `src/tests/smart-analytics.test.tsx` to assert the page title, what-if form, scenario table, churn tab, and automation tab. Cover price/churn input changes, scenario calculation, selecting a churn segment, and launching an automation preview.

- [ ] **Task 2: Implement page shell and KPI cards**

  Create `SmartAnalyticsClient` with a concise header and four KPI cards for projected MRR, churn-risk users, automation health, and scenario count.

- [ ] **Task 3: Implement what-if tab**

  Add controlled inputs for price delta, churn delta, horizon, and tariff. Clicking `Рассчитать сценарий` creates a scenario row and displays the projected MRR message.

- [ ] **Task 4: Implement churn-risk tab**

  Add a risk cohort table. Clicking a row updates a detail panel with risk score, expected loss, recommended action, and owner.

- [ ] **Task 5: Implement automations tab**

  Add automation cards and a preview panel. Clicking `Запустить preview` marks the selected automation as prepared and shows a success message.

- [ ] **Task 6: Wire route and verify**

  Replace `AdminModuleWorkspace` usage in `src/app/(admin)/smart-analytics/page.tsx`, update placeholder tests, then run `npm.cmd run test -- src/tests/smart-analytics.test.tsx src/tests/module-placeholders.test.tsx` and `npm.cmd run lint`.

## Self-Review

- Spec coverage: the plan covers the smart analytics module with what-if, churn risk, and retention automation UI.
- Placeholder scan: no vague implementation steps or unresolved placeholders remain.
- Type consistency: route, component, and test names match the file structure above.
