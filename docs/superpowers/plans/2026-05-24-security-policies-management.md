# Security Policies Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Russian UI for API rate limiting and security headers inside the Security workspace.

**Architecture:** Keep the security route server-first and extend the existing interactive `SecurityClient`. Add contract-first mock data for rate limits and headers so the future backend can expose the same workspace shape without changing the UI.

**Tech Stack:** Next.js 16 App Router, React 19, TanStack Query, Zod, Tailwind CSS v4, Vitest, Testing Library.

---

### Task 1: Contracts And Mock Data

**Files:**
- Modify: `src/lib/api/contracts.ts`
- Modify: `src/lib/api/mock-data.ts`
- Modify: `src/lib/api/mock-service.ts`

- [x] **Step 1: Add policy contract types**

Add `SecurityPolicyStatus`, `SecurityRateLimitRule`, and `SecurityHeaderPolicy`, then include `rate_limit_rules` and `header_policies` in `SecurityWorkspace`.

- [x] **Step 2: Add Russian mock policies**

Add rate limit rules for auth, users, and exports plus security header policies for CSP, HSTS, and frame protection.

- [x] **Step 3: Clone policy data**

Update `cloneSecurityWorkspace()` to copy `rate_limit_rules` and `header_policies`.

### Task 2: Policies UI

**Files:**
- Modify: `src/components/security/security-client.tsx`

- [x] **Step 1: Add `Политики` tab**

Add a tab for API rate limiting and security headers without changing the server route.

- [x] **Step 2: Add rate limit controls**

Add KPI, search, risk/status filters, rule list, selected detail panel, and local edit form.

- [x] **Step 3: Add security headers controls**

Add header coverage, status cards, selected header detail, and recommendation text.

- [x] **Step 4: Validate rate limit edit**

Use Zod to validate limit, window, and reason with Russian messages before applying local changes.

### Task 3: Tests And Status

**Files:**
- Modify: `src/tests/security.test.tsx`
- Modify: `docs/STATUS.md`

- [x] **Step 1: Update focused tests**

Cover the `Политики` tab, filters, selected header detail, rate limit save, and validation error.

- [x] **Step 2: Update project status**

Mark `API rate limiting` and `Security headers` as complete and document checks.

- [x] **Step 3: Run minimal verification**

Run `npm.cmd run test -- src/tests/security.test.tsx`, `npm.cmd run test -- src/tests/contracts.test.ts`, `npm.cmd run lint`, and `git diff --check`.
