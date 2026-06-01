# Russian UI Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish translating the visible SubHub admin UI to Russian.

**Architecture:** Keep the Next.js App Router pages server-first and touch only interactive client components that already own visible UI strings. Preserve contract enum values and API DTO shapes; translate display labels, messages, headings, table headers, and mock labels that are rendered directly.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS v4, Vitest/Testing Library, Playwright smoke tests.

---

### Task 1: Scope Remaining English UI

**Files:**
- Read: `docs/STATUS.md`
- Read: `src/components/admin/admin-shell.tsx`
- Read: `src/components/admin/mobile-sidebar.tsx`
- Read: `src/components/dashboard/dashboard-client.tsx`
- Read: `src/components/settings/settings-client.tsx`
- Read: `src/components/smart-analytics/smart-analytics-client.tsx`
- Read: `src/components/users/user-management-client.tsx`
- Read: `src/components/security/security-client.tsx`
- Read: `src/components/subscriptions/subscriptions-client.tsx`
- Read: `src/lib/api/mock-data.ts`

- [x] **Step 1: Search for remaining visible English strings**

Run:

```powershell
rg -n "\b(Dashboard|Users|Subscriptions|Marketing|Analytics|Security|Settings|Loading|Error|Search|Export|Create|Save|Active|Admin|Owner|Revenue|Churn|Campaign|Segment|Report|Environment|Production|Staging)\b" src/app src/components src/lib/api/mock-data.ts src/tests
```

Expected: a focused list of candidate UI strings and test expectations.

- [x] **Step 2: Classify strings**

Keep internal contract values unchanged when they are used as data keys or select values, such as `Revenue`, `Churn`, `Production`, and `Staging`.

Translate visible text nodes, aria labels, validation messages, toast messages, table headers, and mock labels that are rendered in the UI.

### Task 2: Translate UI Strings

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/components/admin/admin-shell.tsx`
- Modify: `src/components/admin/mobile-sidebar.tsx`
- Modify: `src/components/dashboard/dashboard-client.tsx`
- Modify: `src/components/settings/settings-client.tsx`
- Modify: `src/components/smart-analytics/smart-analytics-client.tsx`
- Modify: `src/components/users/user-management-client.tsx`
- Modify: `src/components/security/security-client.tsx`
- Modify: `src/components/subscriptions/subscriptions-client.tsx`
- Modify: `src/lib/api/mock-data.ts`

- [x] **Step 1: Translate shell labels and notifications**

Change role labels, environment labels, notification titles, and brand suffixes to Russian while preserving state values.

- [x] **Step 2: Translate module labels and messages**

Change headings, labels, aria labels, validation errors, button text, table headers, and loading text to Russian.

- [x] **Step 3: Translate rendered mock labels**

Change rendered mock names such as churn anomaly, owner labels, and settings sections to Russian where they appear in the UI.

### Task 3: Update Focused Tests

**Files:**
- Modify: `src/tests/dashboard.test.tsx`
- Modify: `src/tests/settings.test.tsx`
- Modify: `src/tests/security.test.tsx`
- Modify: `src/tests/shell.test.tsx`
- Modify: `src/tests/smart-analytics.test.tsx`
- Modify: `src/tests/smoke.spec.ts`

- [x] **Step 1: Update assertions**

Replace expected English UI text with the Russian display text introduced in Task 2.

- [x] **Step 2: Keep data values**

Do not change select option values or test inputs when they target internal contract values.

### Task 4: Documentation and Verification

**Files:**
- Modify: `docs/STATUS.md`

- [x] **Step 1: Record session update**

Add a short `2026-05-24` status entry saying the remaining visible admin UI strings were translated to Russian.

- [x] **Step 2: Run minimal checks**

Run:

```powershell
npm.cmd run test -- src/tests/shell.test.tsx src/tests/dashboard.test.tsx src/tests/users.test.tsx src/tests/settings.test.tsx src/tests/smart-analytics.test.tsx src/tests/security.test.tsx src/tests/subscriptions.test.tsx
npm.cmd run lint
```

Expected: focused tests and lint pass, or any failures are reported with the exact failing area.
