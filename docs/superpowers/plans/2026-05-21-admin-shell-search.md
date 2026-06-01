# Admin Shell Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the admin shell search field functional by surfacing module links and quick actions from the global header.

**Architecture:** Convert `AdminShell` into a small Client Component because search requires local state and event handlers. Keep search data local to the shell and derived from `adminNavigation`, avoiding new routes, stores, or global refactors.

**Tech Stack:** Next.js 16.2.6 App Router Client Component, React 19.2.4, TypeScript, Tailwind CSS v4, lucide-react, Vitest, Testing Library.

---

## File Structure

- Modify `src/components/admin/admin-shell.tsx` to add search state, result filtering, and a result panel.
- Modify `src/tests/shell.test.tsx` to cover search interactions.

## Tasks

- [ ] **Task 1: Add search behavior tests**

  Update `src/tests/shell.test.tsx` with a test that types `аналитика`, sees module results, clicks clear, and sees the panel disappear. Add a second test for a no-results query.

- [ ] **Task 2: Convert shell to a Client Component**

  Add `"use client"` and import `useMemo` and `useState`. Keep `children` rendering unchanged.

- [ ] **Task 3: Build searchable items**

  Create searchable items from `adminNavigation` and a short quick-action list such as `Новый отчет`, `Новая кампания`, and `Проверить интеграции`.

- [ ] **Task 4: Render result panel**

  Render a positioned panel under the search field when the query is not empty. Results should be links when they map to modules and plain labeled actions when they are quick actions.

- [ ] **Task 5: Add clear and empty states**

  Add an accessible `Очистить поиск` button when a query exists and render `Ничего не найдено` when no item matches.

- [ ] **Task 6: Verify**

  Run `npm.cmd run test -- src/tests/shell.test.tsx` and `npm.cmd run lint`.

## Self-Review

- Spec coverage: the plan covers functional global search, module discovery, quick actions, clear behavior, and empty state.
- Placeholder scan: no vague implementation steps or unresolved placeholders remain.
- Type consistency: test and component file paths match the planned changes.
