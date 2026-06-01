# Security RBAC UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Russian-language RBAC role management to `/security`.

**Architecture:** Extend the existing security workspace contract with RBAC roles, permission matrix rows, and user role assignments. Keep the route server-first and all RBAC interactivity inside `SecurityClient` with local UI mutations until backend mutations exist.

**Tech Stack:** Next.js 16 App Router, React 19, TanStack Query, Zod, TypeScript, Tailwind CSS v4, Vitest/Testing Library.

---

### Task 1: RBAC Contract And Mock Data

**Files:**
- Modify: `src/lib/api/contracts.ts`
- Modify: `src/lib/api/mock-data.ts`
- Modify: `src/lib/api/mock-service.ts`

- [x] Add typed DTOs for RBAC roles, permissions, and user assignments.
- [x] Add Russian RBAC seed data to the security workspace.
- [x] Update the security workspace clone helper to copy RBAC collections.

### Task 2: Russian RBAC UI

**Files:**
- Modify: `src/components/security/security-client.tsx`

- [x] Add a `Роли` tab.
- [x] Render role summary cards.
- [x] Render a permission matrix.
- [x] Add a role assignment form with user, role, and reason fields.
- [x] Validate assignment fields with Russian messages and update local assignments.

### Task 3: Focused Verification

**Files:**
- Modify: `src/tests/security.test.tsx`
- Modify: `docs/STATUS.md`

- [x] Assert the RBAC tab renders Russian roles and permission matrix.
- [x] Assert a valid role assignment can be created.
- [x] Assert validation errors appear for invalid role assignment.
- [x] Run `npm.cmd run test -- src/tests/security.test.tsx`.
- [x] Run `npm.cmd run test -- src/tests/contracts.test.ts`.
- [x] Run `npm.cmd run lint`.
- [x] Update `STATUS.md` with completed RBAC progress.
