# Collapsible Sidebar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a collapsible desktop sidebar so dense admin tables and charts can use more horizontal space.

**Architecture:** Keep the collapse state local to `AdminShell`. Toggle desktop sidebar width and content left padding with conditional classes, while preserving existing navigation, active route state, role filtering, mobile drawer, search, notifications, and environment banner behavior.

**Tech Stack:** Next.js 16.2.6 App Router Client Component, React 19.2.4, TypeScript, Tailwind CSS v4, lucide-react, Vitest, Testing Library.

---

## File Structure

- Modify `src/components/admin/admin-shell.tsx` to add sidebar collapse state, toggle button, compact layout classes, and accessible compact nav labels.
- Modify `src/tests/shell.test.tsx` to cover collapse/expand behavior.

## Tasks

- [ ] **Task 1: Add sidebar collapse test**

  Update `src/tests/shell.test.tsx` to render `AdminShell`, click `Свернуть сайдбар`, assert the toggle changes to `Развернуть сайдбар`, and assert navigation links remain accessible.

- [ ] **Task 2: Add collapse state**

  Add `isSidebarCollapsed` local state to `AdminShell`, defaulting to `false`.

- [ ] **Task 3: Add desktop toggle**

  Add a desktop-only button in the sidebar header using `PanelLeftClose` and `PanelLeftOpen` icons with accessible labels.

- [ ] **Task 4: Toggle layout widths**

  Switch aside width between `w-64` and `w-20`; switch main wrapper padding between `lg:pl-64` and `lg:pl-20`.

- [ ] **Task 5: Preserve accessible navigation**

  Keep link accessible names unchanged. In compact mode, hide visible text with `sr-only` and add `title` to links.

- [ ] **Task 6: Preserve shell features**

  Do not change mobile drawer, search, role filtering, notifications, or environment switching behavior.

- [ ] **Task 7: Verify**

  Run `npm.cmd run test -- src/tests/shell.test.tsx` and `npm.cmd run lint`.

## Self-Review

- Spec coverage: the plan covers collapse, expand, layout width, and accessible navigation.
- Placeholder scan: no vague implementation steps or unresolved placeholders remain.
- Type consistency: component and test paths match the planned changes.
