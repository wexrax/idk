# Mobile Environment Switcher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make environment switching available inside the mobile navigation drawer so mobile operators can switch Production, Staging, and Sandbox without the desktop-only header control.

**Architecture:** Keep environment state owned by `AdminShell` and pass `activeEnvironment` plus `onEnvironmentChange` into `MobileSidebar`. The drawer renders a compact environment selector and the existing shell banner reflects the selected environment.

**Tech Stack:** Next.js 16.2.6 App Router Client Components, React 19.2.4, TypeScript, Tailwind CSS v4, Vitest, Testing Library.

---

## File Structure

- Modify `src/components/admin/admin-shell.tsx` to pass environment state and callback into `MobileSidebar`.
- Modify `src/components/admin/mobile-sidebar.tsx` to render the mobile environment selector.
- Modify `src/tests/shell.test.tsx` to cover mobile environment switching.

## Tasks

- [ ] **Task 1: Add mobile environment test**

  Update `src/tests/shell.test.tsx` to open the mobile drawer, select `Sandbox` from `Среда в меню`, and assert the shared banner changes to sandbox copy.

- [ ] **Task 2: Define environment prop type**

  Add `AdminEnvironment` type to `MobileSidebar` with `Production`, `Staging`, and `Sandbox`.

- [ ] **Task 3: Extend mobile props**

  Add `activeEnvironment` and `onEnvironmentChange` to `MobileSidebarProps`.

- [ ] **Task 4: Add mobile environment options**

  Add local option labels matching the desktop header control.

- [ ] **Task 5: Render mobile selector**

  Add a `Среда в меню` select in the drawer below the role selector.

- [ ] **Task 6: Wire shell state**

  Pass `activeEnvironment` and `setActiveEnvironment` from `AdminShell` into `MobileSidebar`.

- [ ] **Task 7: Verify**

  Run `npm.cmd run test -- src/tests/shell.test.tsx` and `npm.cmd run lint`.

## Self-Review

- Spec coverage: the plan covers mobile environment selection and shared banner update.
- Placeholder scan: no vague implementation steps or unresolved placeholders remain.
- Type consistency: component and test paths match the planned changes.
