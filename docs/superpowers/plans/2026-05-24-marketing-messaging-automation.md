# Marketing Messaging Automation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Russian UI for SMS/Push message construction, template management, and marketing automation rules.

**Architecture:** Keep the marketing route server-first and extend the existing `MarketingClient` as the interactive client boundary. Add contract-first mock data to `MarketingWorkspace` so the future backend can provide the same DTO shape.

**Tech Stack:** Next.js 16 App Router, React 19, TanStack Query, Zod, Tailwind CSS v4, Vitest, Testing Library.

---

### Task 1: Contracts And Mock Data

**Files:**
- Modify: `src/lib/api/contracts.ts`
- Modify: `src/lib/api/mock-data.ts`
- Modify: `src/lib/api/mock-service.ts`

- [x] **Step 1: Add messaging contract types**

Add `MarketingMessageDraft`, `MarketingTemplate`, and `MarketingAutomationRule`, then include `message_drafts`, `templates`, and `automation_rules` in `MarketingWorkspace`.

- [x] **Step 2: Add mock marketing detail data**

Add Russian SMS/Push drafts, reusable templates, and trigger automation rules.

- [x] **Step 3: Clone nested marketing data**

Update `cloneMarketingWorkspace()` to copy the new arrays.

### Task 2: Messaging, Templates, Automation UI

**Files:**
- Modify: `src/components/marketing/marketing-client.tsx`

- [x] **Step 1: Add tabs and state**

Add `Сообщения`, `Шаблоны`, and `Автоматизация` tabs with local draft/template/automation state.

- [x] **Step 2: Build SMS/Push constructor**

Add channel, segment, title, text, CTA, schedule controls, preview, and validation.

- [x] **Step 3: Build template system UI**

Show template filters, list, selected detail, and use selected template in the message constructor.

- [x] **Step 4: Build automation rules UI**

Show trigger rules, status/channel filters, and local creation with validation.

### Task 3: Tests And Status

**Files:**
- Modify: `src/tests/marketing.test.tsx`
- Modify: `docs/STATUS.md`

- [x] **Step 1: Update focused tests**

Cover message draft creation, validation, template selection, automation creation, and automation validation.

- [x] **Step 2: Update project status**

Mark `Конструктор SMS/Push рассылок`, `Template система`, and `Автоматизация` as complete.

- [x] **Step 3: Run minimal verification**

Run `npm.cmd run test -- src/tests/marketing.test.tsx`, `npm.cmd run test -- src/tests/contracts.test.ts`, `npm.cmd run lint`, and `git diff --check`.
