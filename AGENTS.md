# Repository Guidelines

## Project Overview
MManalytics is the internal analytics dashboard for Mad Monkey AI (student app with Spark and Discover). It is **frontend-only for now**. All data flows through a typed API client that talks to mocks until the backend team ships real endpoints. The goal of this phase is a realistic, reviewable UI plus an API contract the backend team can implement.

## Stack
Next.js (App Router) + TypeScript (strict), Tailwind CSS, shadcn/ui, Recharts, MSW for mocks, Vitest, Playwright, pnpm. Do not add dependencies outside this list without asking.

## Project Structure
- `app/(auth)/login` - login page (UI only, stubbed)
- `app/(dashboard)/{overview,campuses,growth,sparks,retention}` - dashboard screens
- `components/ui` (shadcn), `components/charts` (Recharts wrappers)
- `lib/api/client.ts` - the **only** place that fetches data; `lib/api/types.ts` mirrors the contract
- `lib/auth/session.ts` - stubbed `getSession()` returning `{ user, role, campusId }`
- `mocks/handlers.ts`, `mocks/fixtures/` - MSW handlers and realistic fixture data
- `docs/api-contract.yaml` - OpenAPI source of truth; `docs/screenshots/` - UI mockups

## Build, Test, and Development Commands
- `pnpm dev` - run locally with mocks (`NEXT_PUBLIC_USE_MOCKS=true` by default)
- `pnpm build` - production build
- `pnpm lint` / `pnpm format` - ESLint / Prettier
- `pnpm test` - Vitest unit tests
- `pnpm shots` - Playwright captures desktop (1440x900) and mobile (390x844) PNGs into `docs/screenshots/<screen>.png`

## Contract-First Workflow
1. Any new data need becomes an endpoint in `docs/api-contract.yaml` **before** UI code uses it.
2. Update `lib/api/types.ts` and the MSW handler/fixture to match.
3. UI calls only `lib/api/client.ts`. Never hardcode data in components.
4. Fixtures must look real: 5 campuses, 90 days of data, uneven density, one underperforming campus.

## Screens (build in this order)
1. **Overview:** signups, activated users, DAU/WAU, D1/D7/D30 retention
2. **Campuses:** penetration, Sparks per day, % Sparks answered within 15 min, median time to first response
3. **Growth:** signups by source (ambassador, creator, referral, store), ambassador yield, cost per activated user
4. **Sparks:** Fun vs Build volume, post-to-accept rate
5. **Retention:** weekly cohort table

## Roles (stubbed in UI, enforced by backend later)
`ceo` sees everything. `admin` sees everything and manages users. `campus_lead` sees only their own `campusId`. UI gating is cosmetic; the backend must enforce it.

## Mockup Definition of Done
A screen is done only when it runs on mocks, handles loading, empty and error states, and has fresh desktop and mobile screenshots in `docs/screenshots/`.

## Coding Style
2-space indent, named exports, `PascalCase` components, `camelCase` values, `kebab-case` filenames. Run `pnpm lint && pnpm test` before committing. Tests live next to code as `*.test.ts(x)`.

## Commits and Pull Requests
Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`). PRs need a short description, screenshots for any UI change, and a callout for any change to `docs/api-contract.yaml`.

## Agent Instructions
Never invent an endpoint silently; edit the contract. Show aggregates only, never individual student PII (phone, email, precise location). No real credentials in the repo. Commands run in PowerShell on Windows. Keep README commands accurate.
