# Admin Shell Role Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make role metadata in `adminNavigation` functional by filtering global navigation and search results according to the selected admin role.

**Architecture:** Keep the feature local to `AdminShell`, which is already a Client Component. Derive available navigation from the selected role and existing `adminNavigation.roles`, avoiding new stores, auth plumbing, or route changes.

**Tech Stack:** Next.js 16.2.6 App Router Client Component, React 19.2.4, TypeScript, Tailwind CSS v4, Vitest, Testing Library.

---

## File Structure

- Modify `src/components/admin/admin-shell.tsx` to add role state, role selector, filtered navigation, and filtered search items.
- Modify `src/tests/shell.test.tsx` to cover role switching and search filtering.

## Tasks

- [ ] **Task 1: Add role behavior tests**

  Update `src/tests/shell.test.tsx` to assert that `admin` sees all modules, selecting `support` hides marketing-only modules, keeps support modules, and search no longer returns hidden modules.

- [ ] **Task 2: Add role types and options**

  Define role options from the existing roles: `admin`, `finance`, `support`, `analyst`, and `marketer`.

- [ ] **Task 3: Filter navigation**

  Derive `availableNavigation` from `adminNavigation.filter((item) => item.roles.includes(activeRole))`.

- [ ] **Task 4: Add role selector UI**

  Add a compact accessible `Роль` select to the header with a visible available-module count.

- [ ] **Task 5: Filter search**

  Build module search items from `availableNavigation` and add role metadata to quick actions so hidden actions are not shown to unsupported roles.

- [ ] **Task 6: Verify**

  Run `npm.cmd run test -- src/tests/shell.test.tsx` and `npm.cmd run lint`.

## Self-Review

- Spec coverage: the plan covers role selector, navigation filtering, and search filtering.
- Placeholder scan: no vague implementation steps or unresolved placeholders remain.
- Type consistency: component and test paths match the planned changes.
