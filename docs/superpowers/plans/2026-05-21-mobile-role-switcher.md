# Mobile Role Switcher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make role switching available inside the mobile navigation drawer so mobile operators can filter modules by role without relying on the desktop header control.

**Architecture:** Keep role state owned by `AdminShell` and pass `activeRole` plus `onRoleChange` into `MobileSidebar`. The drawer renders a compact role selector and derives its navigation from the selected role.

**Tech Stack:** Next.js 16.2.6 App Router Client Components, React 19.2.4, TypeScript, Tailwind CSS v4, Vitest, Testing Library.

---

## File Structure

- Modify `src/components/admin/admin-shell.tsx` to pass the role change callback into `MobileSidebar`.
- Modify `src/components/admin/mobile-sidebar.tsx` to render the mobile role selector and module count.
- Modify `src/tests/shell.test.tsx` to cover mobile role switching.

## Tasks

- [ ] **Task 1: Add mobile role test**

  Update `src/tests/shell.test.tsx` to open the mobile drawer, select `marketer` from `Роль в меню`, assert marketing modules are visible, and assert support-only modules are hidden.

- [ ] **Task 2: Define mobile role props**

  Update `MobileSidebarProps` to accept `activeRole` and `onRoleChange` with the same role values used by `AdminShell`.

- [ ] **Task 3: Add mobile role options**

  Add local role option labels for `admin`, `finance`, `support`, `analyst`, and `marketer`.

- [ ] **Task 4: Render mobile selector**

  Add a small `Роль в меню` select under the drawer title, plus a `Доступно: N` count.

- [ ] **Task 5: Wire role changes**

  Call `onRoleChange(nextRole)` when the mobile selector changes and keep the drawer open.

- [ ] **Task 6: Preserve navigation behavior**

  Keep active `aria-current="page"` behavior and existing close-on-link-click behavior unchanged.

- [ ] **Task 7: Verify**

  Run `npm.cmd run test -- src/tests/shell.test.tsx` and `npm.cmd run lint`.

## Self-Review

- Spec coverage: the plan covers mobile role selection, filtered drawer navigation, and existing behavior preservation.
- Placeholder scan: no vague implementation steps or unresolved placeholders remain.
- Type consistency: component and test paths match the planned changes.
