# Security Audit History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Russian-language audit log filtering and change-history management to `/security`.

**Architecture:** Extend the existing security workspace contract with audit change-history records. Keep the route server-first and all filtering/history interactivity inside `SecurityClient` with local UI mutations until backend mutations exist.

**Tech Stack:** Next.js 16 App Router, React 19, TanStack Query, Zod, TypeScript, Tailwind CSS v4, Vitest/Testing Library.

---

### Task 1: Audit History Contract And Mock Data

**Files:**
- Modify: `src/lib/api/contracts.ts`
- Modify: `src/lib/api/mock-data.ts`
- Modify: `src/lib/api/mock-service.ts`

- [x] Add typed DTOs for audit change-history records.
- [x] Add Russian audit history seed data to the security workspace.
- [x] Update the security workspace clone helper to copy change history.

### Task 2: Russian Audit History UI

**Files:**
- Modify: `src/components/security/security-client.tsx`

- [x] Add audit risk filter and search input.
- [x] Render filtered audit rows.
- [x] Render selected event details and related change history.
- [x] Add a change-history form with event, description, and validation.
- [x] Add local change-history creation with Russian success messages.

### Task 3: Focused Verification

**Files:**
- Modify: `src/tests/security.test.tsx`
- Modify: `docs/STATUS.md`

- [x] Assert audit filtering and search work.
- [x] Assert selected audit history renders.
- [x] Assert a valid change-history record can be created.
- [x] Assert validation errors appear for invalid history input.
- [x] Run `npm.cmd run test -- src/tests/security.test.tsx`.
- [x] Run `npm.cmd run test -- src/tests/contracts.test.ts`.
- [x] Run `npm.cmd run lint`.
- [x] Update `STATUS.md` with completed audit history progress.
