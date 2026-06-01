# Security Session Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build full Russian session management UI for the Security workspace.

**Architecture:** Keep the existing server route and client module boundary. Extend the contract-first mock workspace with session action history, then render filtering, detail, validation, and local termination state inside `SecurityClient`.

**Tech Stack:** Next.js 16 App Router, React 19, TanStack Query, Zod, Tailwind CSS v4, Vitest, Testing Library.

---

### Task 1: Contract And Mock Data

**Files:**
- Modify: `src/lib/api/contracts.ts`
- Modify: `src/lib/api/mock-data.ts`
- Modify: `src/lib/api/mock-service.ts`

- [x] **Step 1: Add session history contract**

Add `SecuritySessionHistory` with `session_id`, `action`, `reason`, `actor`, and `created_at`, then include `session_history` in `SecurityWorkspace`.

- [x] **Step 2: Add mock session history**

Add one or more Russian history rows per admin session in `securityWorkspace.session_history`.

- [x] **Step 3: Clone session history**

Update `cloneSecurityWorkspace()` to copy `session_history` entries.

### Task 2: Session Management UI

**Files:**
- Modify: `src/components/security/security-client.tsx`

- [x] **Step 1: Add session filters and local history state**

Track session search, risk filter, status filter, termination reason, validation errors, and local session history.

- [x] **Step 2: Render session management controls**

Add Russian search and filters above session cards, plus active/terminated counters.

- [x] **Step 3: Render selected session details**

Show selected admin, device, IP, location, risk, status, last seen, and related action history.

- [x] **Step 4: Validate termination reason**

Require at least 8 characters before terminating a session, show Russian validation errors, and append a local history row.

### Task 3: Focused Tests And Status

**Files:**
- Modify: `src/tests/security.test.tsx`
- Modify: `docs/STATUS.md`

- [x] **Step 1: Update security tests**

Cover session filtering, details, validated termination, and session history update.

- [x] **Step 2: Update project status**

Mark `Session management` as complete and document the focused checks.

- [x] **Step 3: Run minimal verification**

Run `npm.cmd run test -- src/tests/security.test.tsx`, `npm.cmd run test -- src/tests/contracts.test.ts`, `npm.cmd run lint`, and `git diff --check`.
