# Active Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add active-route highlighting to the desktop and mobile admin navigation so operators can see the current module.

**Architecture:** Use `usePathname()` in the existing Client Components (`AdminShell` and `MobileSidebar`). Keep the navigation model unchanged and apply active styles at render time.

**Tech Stack:** Next.js 16.2.6 App Router Client Components, React 19.2.4, TypeScript, Tailwind CSS v4, Vitest, Testing Library.

---

## File Structure

- Modify `src/components/admin/admin-shell.tsx` to highlight the active desktop navigation item.
- Modify `src/components/admin/mobile-sidebar.tsx` to highlight the active mobile navigation item.
- Modify `src/tests/shell.test.tsx` to mock `usePathname()` and cover active desktop/mobile navigation.

## Tasks

- [ ] **Task 1: Add active route tests**

  Update `src/tests/shell.test.tsx` to mock `next/navigation` and return `/analytics`. Assert the desktop `Аналитика` link has `aria-current="page"`. Open the mobile menu and assert its `Аналитика` link also has `aria-current="page"`.

- [ ] **Task 2: Add active matcher in AdminShell**

  Import `usePathname()` and derive an `isActive` value for each navigation link. Match exact href and nested paths with `pathname.startsWith(item.href + "/")`.

- [ ] **Task 3: Style active desktop links**

  Apply brand-colored border/background/text styles and `aria-current="page"` to the active desktop link.

- [ ] **Task 4: Add active matcher in MobileSidebar**

  Import `usePathname()` and apply the same matching logic for drawer links.

- [ ] **Task 5: Style active mobile links**

  Apply the same active visual language and `aria-current="page"` inside the mobile drawer.

- [ ] **Task 6: Verify**

  Run `npm.cmd run test -- src/tests/shell.test.tsx` and `npm.cmd run lint`.

## Self-Review

- Spec coverage: the plan covers visible active navigation for desktop and mobile.
- Placeholder scan: no vague implementation steps or unresolved placeholders remain.
- Type consistency: component and test paths match the planned changes.
