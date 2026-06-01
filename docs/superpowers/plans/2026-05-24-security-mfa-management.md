# Security MFA Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build full Russian 2FA/MFA management UI for the Security workspace.

**Architecture:** Keep `src/app/(admin)/security/page.tsx` server-first and extend the existing `SecurityClient` for interactive MFA management. Use contract-first mock data so the future backend can expose the same workspace shape.

**Tech Stack:** Next.js 16 App Router, React 19, TanStack Query, Zod, Tailwind CSS v4, Vitest, Testing Library.

---

### Task 1: MFA Contracts And Mock Data

**Files:**
- Modify: `src/lib/api/contracts.ts`
- Modify: `src/lib/api/mock-data.ts`
- Modify: `src/lib/api/mock-service.ts`

- [x] **Step 1: Add MFA contract types**

Add `SecurityMfaStatus`, `SecurityMfaFactor`, `SecurityMfaUser`, and `SecurityMfaPolicy`, then include `mfa_users` and `mfa_policy` in `SecurityWorkspace`.

- [x] **Step 2: Add Russian mock MFA rows**

Add admin MFA users with enabled, pending, and disabled statuses plus a policy object.

- [x] **Step 3: Clone MFA data**

Update `cloneSecurityWorkspace()` to copy MFA users and policy values.

### Task 2: MFA UI And Validation

**Files:**
- Modify: `src/components/security/security-client.tsx`

- [x] **Step 1: Add MFA tab and state**

Add `2FA/MFA` tab, selected MFA user state, status/risk filters, search, and local policy state.

- [x] **Step 2: Render MFA dashboard**

Show coverage, pending setup count, protected privileged admins, policy deadline, and user cards.

- [x] **Step 3: Render selected MFA details**

Show factor, status, risk, last challenge, backup code count, trusted devices, and recommendation/history text.

- [x] **Step 4: Validate policy update**

Add a policy form with minimum coverage, grace period, and backup code fields; validate with Russian Zod messages and apply locally.

### Task 3: Tests And Status

**Files:**
- Modify: `src/tests/security.test.tsx`
- Modify: `docs/STATUS.md`

- [x] **Step 1: Update focused security tests**

Cover the MFA tab, filters, selected user details, policy save, and validation errors.

- [x] **Step 2: Update project status**

Mark `2FA / MFA` as complete and document checks in `docs/STATUS.md`.

- [x] **Step 3: Run minimal verification**

Run `npm.cmd run test -- src/tests/security.test.tsx`, `npm.cmd run test -- src/tests/contracts.test.ts`, `npm.cmd run lint`, and `git diff --check`.
