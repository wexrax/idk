<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This repository uses **Next.js 16 App Router** conventions, but with enough differences that you should treat the app as a custom architecture rather than standard examples.

Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

This repo uses specialized agent skills; pick the most relevant skill for UI, API, design, and admin-shell tasks rather than solving everything with generic guidance. Use `AVAILABLE_SKILLS.md` as the local skill usage guide.

Repository notes:

- Next.js 16 App Router with route groups under `src/app/(admin)`.
- React 19 and Tailwind CSS v4 across the project.
- The admin console is built as a **contract-first UI** over mock data.
- Backend is not implemented yet; API contracts are defined in `src/lib/api/contracts.ts` and mock responses are in `src/lib/api/mock-service.ts`.
- Backend-facing integration files live in `src/lib/api`: use `endpoints.ts`, `http-client.ts`, `live-service.ts`, `auth-contracts.ts`, and `client.ts` rather than scattering fetch calls through components.
- `src/lib/api/client.ts` is the switch point for future backend integration.
- `src/lib/query-client.tsx` is the shared React Query provider wrapper and global error strategy.
- `src/app/(admin)/layout.tsx` and `src/components/admin/admin-shell.tsx` provide the shared admin layout, sidebar, and page wrapper.
- `src/components/admin/admin-shell.tsx` is an interactive client shell. It owns local UI state for role filtering, environment switching, global search, notifications, and desktop sidebar collapse.
- `src/components/admin/mobile-sidebar.tsx` owns the mobile drawer open/close state and receives role/environment state from `AdminShell`.
- `src/components/admin/module-placeholder.tsx` is legacy/shared workspace code. Do not use it for new admin routes unless explicitly requested.
- Implemented routes should prefer dedicated module clients under `src/components/<module>/`, for example `analytics`, `smart-analytics`, `security`, and `settings`.
- `use client` should only be applied to truly interactive components; keep pages server-first when possible.
- Client components must avoid importing server-only modules and use browser-safe guards.
- Tailwind CSS v4 uses the new theme syntax in `src/app/globals.css` and `cn()` merges utility classes safely.
- No Web3 / MetaMask wallet integration exists in this repository; any wallet extension errors are external to app code.
- Use repository skills for feature-specific implementation guidance, especially for UI, API contract handling, and admin-shell behavior. Match the task to the most relevant skill when available, using `AVAILABLE_SKILLS.md` to decide what and why.
- API and backend work must preserve contract compatibility: align with `src/lib/api/contracts.ts` and `src/lib/api/auth-contracts.ts`, respect the client-side switch in `src/lib/api/client.ts`, and keep mock service data shapes in `src/lib/api/mock-service.ts` consistent with backend expectations.

When editing or reviewing code, pay special attention to these patterns:

- Route files under `src/app/(admin)` are server components unless marked with `"use client"`.
- Shared UI lives in `src/components/ui` or `src/components/admin`.
- Feature-level interactive clients live in `src/components/<feature>/` and are imported by server route pages.
- API contract types should remain compatible with `src/lib/api/contracts.ts` and `src/lib/api/auth-contracts.ts`.
- Mock data should remain close to the expected backend shape.
- Shell behavior is covered by `src/tests/shell.test.tsx`; update it when changing sidebar, role, search, environment, notification, or mobile drawer behavior.
- Module behavior is covered by focused tests in `src/tests/*.test.tsx`; add or update the narrow test for the module you touch.
- Use `npm.cmd` in PowerShell on this machine, for example `npm.cmd run lint` and `npm.cmd run test -- src/tests/shell.test.tsx`.
<!-- END:nextjs-agent-rules -->
<!-- BEGIN:nextjs-agent-instructions -->
# Next.js Agent Instructions

This repository is supported by specialized agent skills. Prefer skill-based implementation for UI, API, design, and admin-shell work instead of generic templates.

## Core repository principles

- Treat this workspace as a custom admin shell built on Next.js, not a generic app template.
- Use the repository notes above as your primary architecture guide.
- Prefer minimal, idiomatic changes that preserve existing file structure, layout patterns, and testing strategy.
- Keep work aligned with the current admin shell and module conventions, even when adding new features.

## Skill usage

- Before implementing non-trivial work, check `AVAILABLE_SKILLS.md` and choose the most relevant skill or minimal skill set.
- Announce the selected skill briefly before using it, including why it fits the task.
- Prefer repository-local skills over user-level or plugin skills when names overlap.
- UI and visual composition: use `frontend-design`, `design-taste-frontend`, or similar UI/design skills.
- Admin-shell and workspace behavior: use repo-specific instructions and admin-shell patterns from the top of this file.
- API contract and data shape work: use contract-aware guidance and preserve compatibility with existing `src/lib/api/contracts.ts` and `src/lib/api/client.ts`.
- Backend/API integration work: use `vercel:nextjs`, `vercel:vercel-functions`, `vercel:routing-middleware`, `supabase-postgres-best-practices`, or security skills only when the backend surface actually calls for them; keep SubHub's local API contract layer as the source of truth.
- If a task touches both UI and API, favor the skill that best matches the surface being changed; verify both UI patterns and API contract shape.
- For bug fixes, tests, code review, security review, deployment, GitHub work, documents, presentations, or spreadsheets, use the quick-choice table in `AVAILABLE_SKILLS.md`.

## API and data guidance

- Always validate API work against `src/lib/api/contracts.ts`.
- Always validate auth/session API work against `src/lib/api/auth-contracts.ts`.
- Keep mock responses in `src/lib/api/mock-service.ts` aligned with the contract types.
- Use `src/lib/api/client.ts` as the switch point for mock vs backend behavior.
- Use `src/lib/api/endpoints.ts` for backend endpoint paths and `src/lib/api/http-client.ts` for HTTP behavior.
- Put real backend wiring in `src/lib/api/live-service.ts`; do not call `fetch` directly from feature components when the shared client can own it.
- Do not invent new API surface shapes unless the task explicitly calls for a new endpoint or contract update.
- Add or update contract tests when API shapes change.

## Backend implementation guidance

- Treat backend work as contract-first until a real backend exists.
- Start by reading the relevant `src/lib/api/*` contract, endpoint, client, live-service, and mock-service files before editing code.
- If adding a backend-backed feature, define or update the contract type first, then align mock data, live service behavior, and client access together.
- Keep feature components consuming the API client layer rather than backend details.
- For Next.js route handlers, middleware, server actions, caching, or runtime behavior, read the relevant Next.js 16 docs in `node_modules/next/dist/docs/` before implementation and use the matching Vercel/Next skill from `AVAILABLE_SKILLS.md`.
- For database-related backend work, use `supabase-postgres-best-practices` when Supabase/Postgres is involved; otherwise document the assumed persistence model before adding data-access code.
- For authentication, authorization, secrets, webhooks, payments, or admin-sensitive endpoints, include a security skill pass and avoid logging tokens, credentials, or direct personal contact/payment identifiers.
- Backend tests should cover contracts, mock/live service parity, auth edge cases, and error handling rather than broad UI flows.

## UI and component guidance

- Prefer dedicated module components in `src/components/<module>/` for new feature pages.
- Use `src/components/ui` for shared visual primitives and wrappers.
- Do not reuse `src/components/admin/module-placeholder.tsx` for new routes.
- Keep route files in `src/app/(admin)` as server components unless client DOM interaction is required.
- When client interactivity is needed, wrap only the necessary component in `"use client"`.
- Avoid importing server-only modules in client components; use browser-safe guards where needed.
- Use Tailwind v4 theme tokens from `src/app/globals.css` and `cn()` for class composition.

## Testing and validation

- Update `src/tests/shell.test.tsx` for changes to shell behavior, including sidebar collapse, role filters, environment switcher, search, notifications, or mobile drawer state.
- Add or update focused tests in `src/tests/*.test.tsx` for feature module changes.
- Prefer targeted tests over broad, end-to-end coverage for local validation.
- Run `npm.cmd run lint` and `npm.cmd run test -- src/tests/<relevant-file>.test.tsx` when asked or when the change is non-trivial.

## Practical implementation checklist

- Review the existing route or module before editing.
- Use dedicated module folders and shared UI components when possible.
- Keep API calls centralized through `src/lib/api/client.ts`.
- Preserve mock service shapes and contract compatibility.
- Keep layout and shell structure unchanged unless the task explicitly requires a layout-level update.
- Document any non-obvious change in a concise comment or test case.

## Notes for agent authors

- This repo uses feature-first admin route groups under `src/app/(admin)`.
- There is no current backend implementation, so mock contract consistency is critical.
- The admin shell and module clients are the preferred implementation path for new pages.
- When in doubt, ask for clarification rather than guessing the backend contract or shell behavior.
- Always align with the repository notes and patterns above to maintain consistency.
<!-- END:nextjs-agent-instructions -->
