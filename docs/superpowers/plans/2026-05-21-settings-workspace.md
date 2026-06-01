# Settings Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generic `/settings` workspace with a focused settings UI for system configuration, integrations, and alert thresholds.

**Architecture:** Keep the App Router route as a Server Component and place interactive behavior in `src/components/settings/settings-client.tsx`. Use deterministic local state and UI-only mutations, matching the already implemented admin modules.

**Tech Stack:** Next.js 16.2.6 App Router, React 19.2.4, TypeScript, Tailwind CSS v4, lucide-react, Vitest, Testing Library.

---

## File Structure

- Create `src/components/settings/settings-client.tsx` for general settings, integrations, and alerts.
- Modify `src/app/(admin)/settings/page.tsx` to render `SettingsClient`.
- Create `src/tests/settings.test.tsx` for route behavior.
- Modify `src/tests/module-placeholders.test.tsx` so it no longer expects generic module workspaces.

## Tasks

- [ ] **Task 1: Add behavior tests**

  Create `src/tests/settings.test.tsx` to render `SettingsPage`, assert the page title, general settings form, integration tab, and alert tab. Cover saving a setting, checking an integration, and updating an alert threshold.

- [ ] **Task 2: Implement settings shell and KPI cards**

  Create `SettingsClient` with a header and four KPI cards for integrations, alert thresholds, pending drafts, and last publish time.

- [ ] **Task 3: Implement general settings tab**

  Add controlled inputs for environment, default currency, report timezone, and support SLA. Clicking `Сохранить настройки` creates a draft row and shows a confirmation message.

- [ ] **Task 4: Implement integrations tab**

  Add integration cards for Stripe, Robokassa, Telegram, and App Store. Clicking `Проверить интеграцию` updates the selected integration status message.

- [ ] **Task 5: Implement alerts tab**

  Add alert threshold controls and a table. Editing the churn anomaly threshold and clicking `Обновить порог` updates the visible threshold and success message.

- [ ] **Task 6: Wire route and verify**

  Replace `AdminModuleWorkspace` usage in `src/app/(admin)/settings/page.tsx`, update placeholder tests, then run `npm.cmd run test -- src/tests/settings.test.tsx src/tests/module-placeholders.test.tsx` and `npm.cmd run lint`.

## Self-Review

- Spec coverage: the plan covers system settings, integrations, and alert threshold management.
- Placeholder scan: no vague implementation steps or unresolved placeholders remain.
- Type consistency: route, component, and test names match the file structure above.
