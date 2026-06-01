# Security Contract Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move `/security` RBAC, audit log, and session management UI to a contract-first mock API workspace.

**Architecture:** Keep `src/app/(admin)/security/page.tsx` server-first and keep the interactive surface in `SecurityClient`. The client reads security workspace data through `src/lib/api/client.ts`, keeps simulated access-rule/session mutations in local component state, and validates RBAC input before updating UI.

**Tech Stack:** Next.js 16 App Router, React 19, TanStack Query, Zod, TypeScript, Tailwind CSS v4, Vitest/Testing Library.

---

### Task 1: Security Contracts And Mock Service

**Files:**
- Modify: `src/lib/api/contracts.ts`
- Modify: `src/lib/api/mock-data.ts`
- Modify: `src/lib/api/mock-service.ts`
- Modify: `src/lib/api/client.ts`

- [x] Add typed DTOs for access rules, audit events, admin sessions, and `SecurityWorkspace`.
- [x] Move security seed data into `mock-data.ts`.
- [x] Add a clone helper and `getSecurityWorkspace()` to the mock service.
- [x] Expose `getSecurityWorkspace()` from the API client.

### Task 2: Security Workspace Client

**Files:**
- Modify: `src/components/security/security-client.tsx`

- [x] Fetch security workspace data with React Query.
- [x] Render `LoadingState`, `ErrorState`, and an empty-state fallback.
- [x] Preserve tabs for RBAC, Audit log, and Sessions.
- [x] Keep access-rule creation and session termination as local UI state until backend mutation endpoints exist.
- [x] Validate the RBAC form with Zod before creating a review access rule.

### Task 3: Focused Verification

**Files:**
- Modify: `src/tests/security.test.tsx`

- [x] Wrap the page in a QueryClient provider.
- [x] Assert fetched security metrics/table rendering.
- [x] Assert RBAC creation and validation errors.
- [x] Assert audit detail and session termination flows.
- [x] Run `npm.cmd run test -- src/tests/security.test.tsx`.
- [x] Run `npm.cmd run lint`.
