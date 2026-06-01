# Admin Shell Environment Switcher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a global environment switcher to the admin shell so operators can see whether they are working in Production, Staging, or Sandbox.

**Architecture:** Keep environment state local to `AdminShell`, alongside existing role/search/notification state. Render a compact header selector and a contextual safety banner without changing routes, backend contracts, or module components.

**Tech Stack:** Next.js 16.2.6 App Router Client Component, React 19.2.4, TypeScript, Tailwind CSS v4, Vitest, Testing Library.

---

## File Structure

- Modify `src/components/admin/admin-shell.tsx` to add environment state, selector, badge, and banner.
- Modify `src/tests/shell.test.tsx` to cover environment switching behavior.

## Tasks

- [ ] **Task 1: Add environment behavior tests**

  Update `src/tests/shell.test.tsx` to assert the default `Production` environment, switch to `Sandbox`, assert the sandbox banner, then switch back to `Production` and assert the production banner.

- [ ] **Task 2: Define environment model**

  Add `AdminEnvironment` type and environment option metadata for `Production`, `Staging`, and `Sandbox`.

- [ ] **Task 3: Add environment state**

  Add `activeEnvironment` local state in `AdminShell`, defaulting to `Production`.

- [ ] **Task 4: Render header selector**

  Add an accessible `Среда админки` select next to the role selector and keep it compact for the existing header layout.

- [ ] **Task 5: Render environment badge**

  Show a small `Среда: Production|Staging|Sandbox` badge near the selector.

- [ ] **Task 6: Render safety banner**

  Render a short full-width banner below the header whose copy changes per environment.

- [ ] **Task 7: Verify**

  Run `npm.cmd run test -- src/tests/shell.test.tsx` and `npm.cmd run lint`.

## Self-Review

- Spec coverage: the plan covers visible environment state, switching, and contextual safety copy.
- Placeholder scan: no vague implementation steps or unresolved placeholders remain.
- Type consistency: component and test paths match the planned changes.
