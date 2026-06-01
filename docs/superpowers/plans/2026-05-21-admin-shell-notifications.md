# Admin Shell Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the admin shell notification button functional with unread counts, operational events, and read-state actions.

**Architecture:** Keep the feature local to `AdminShell`, which is already a Client Component. Use deterministic local notification data and derived unread state without adding stores, backend calls, or route changes.

**Tech Stack:** Next.js 16.2.6 App Router Client Component, React 19.2.4, TypeScript, Tailwind CSS v4, lucide-react, Vitest, Testing Library.

---

## File Structure

- Modify `src/components/admin/admin-shell.tsx` to add notification state, dropdown rendering, and read actions.
- Modify `src/tests/shell.test.tsx` to cover notification behavior.

## Tasks

- [ ] **Task 1: Add notification behavior tests**

  Update `src/tests/shell.test.tsx` with tests that open the notification panel, verify unread count, mark one notification as read, and mark all notifications as read.

- [ ] **Task 2: Add notification types and seed data**

  Define a local `NotificationItem` type and initial notifications for billing, security, analytics, and settings.

- [ ] **Task 3: Render notification trigger state**

  Add an unread badge to the `Оповещения` button and toggle the panel on click.

- [ ] **Task 4: Render notification panel**

  Render a right-aligned dropdown with event title, description, time, severity, unread marker, and module link.

- [ ] **Task 5: Add read actions**

  Add `Отметить прочитанным` per unread item and `Прочитать все` for bulk read. Disable or hide read actions once notifications are read.

- [ ] **Task 6: Verify**

  Run `npm.cmd run test -- src/tests/shell.test.tsx` and `npm.cmd run lint`.

## Self-Review

- Spec coverage: the plan covers opening, display, unread count, single read, and bulk read behavior.
- Placeholder scan: no vague implementation steps or unresolved placeholders remain.
- Type consistency: test and component paths match the planned changes.
