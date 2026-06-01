# Security Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generic `/security` workspace with a focused admin security UI for RBAC changes, audit log review, and session control.

**Architecture:** Keep the App Router route as a Server Component and move interactive behavior into `src/components/security/security-client.tsx`. Use deterministic local state, matching the existing module pattern, so a future backend adapter can replace these UI-only mutations without changing the page contract.

**Tech Stack:** Next.js 16.2.6 App Router, React 19.2.4, TypeScript, Tailwind CSS v4, lucide-react, Vitest, Testing Library.

---

## File Structure

- Create `src/components/security/security-client.tsx` for RBAC, audit log, and active session controls.
- Modify `src/app/(admin)/security/page.tsx` to render `SecurityClient`.
- Create `src/tests/security.test.tsx` for the new route behavior.
- Modify `src/tests/module-placeholders.test.tsx` so security is no longer tested as a generic workspace.

## Tasks

- [ ] **Task 1: Add behavior tests**

  Create `src/tests/security.test.tsx` to render `SecurityPage`, assert the `Безопасность` title, RBAC form, role table, audit log tab, and sessions tab. Cover adding a permission, selecting an audit event, and terminating a session.

- [ ] **Task 2: Implement security shell and KPI cards**

  Create `SecurityClient` with a concise header and four KPI cards for audit events, pending access requests, 2FA coverage, and active sessions.

- [ ] **Task 3: Implement RBAC tab**

  Add controlled inputs for role, permission, scope, and expiry. Clicking `Сохранить доступ` inserts a role change row and shows a confirmation message.

- [ ] **Task 4: Implement audit log tab**

  Add an audit events table. Clicking a row updates a detail panel with actor, action, IP, severity, and evidence.

- [ ] **Task 5: Implement sessions tab**

  Add active session cards with device, IP, location, and risk level. Clicking `Завершить сессию` marks the selected session as terminated and displays a status message.

- [ ] **Task 6: Wire route and verify**

  Replace `AdminModuleWorkspace` usage in `src/app/(admin)/security/page.tsx`, update placeholder tests, then run `npm.cmd run test -- src/tests/security.test.tsx src/tests/module-placeholders.test.tsx` and `npm.cmd run lint`.

## Self-Review

- Spec coverage: the plan covers RBAC, audit log, and session control as a complete security workspace slice.
- Placeholder scan: no vague implementation steps or unresolved placeholders remain.
- Type consistency: route, component, and test names match the file structure above.
