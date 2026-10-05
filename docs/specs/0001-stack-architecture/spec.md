# 0001 — Stack and Architecture

Status: In Progress
Updated: 2026-10-05
Scope: docs/scope/scope.md:35

## Summary

You run one monorepo with a NestJS API, a staff web app, a guest booking site, Postgres storage and shared UI parts. This stack keeps cost near zero on one small VPS while letting the PMS ship first and grow release by release. The shared UI package means staff screens use the same parts first and guest pages join them at v1.1.0.

## Context
Solo intern, 6 months, 117 rooms (Moderate 20, Superior Double 40, Superior Twin 35, Deluxe 15, Junior Suite 5, BIZ Suite 2), Batam 3-star hotel. Budget $0-10/mo, no paid SaaS. No domain yet, no SiteMinder/Xendit owner access (use new sandbox accounts). Deploy-as-you-go: v1.0.0 PMS live first.

## Decisions

1. Monorepo: Turborepo + pnpm workspaces. Layout:
   - `apps/api` (NestJS REST + webhooks, Pino logging)
   - `apps/pms-pos` (Vite + React SPA for staff PMS + POS terminal)
   - `apps/booking-web` (Next.js, added/scaffolded at v1.1.0, stubbed before)
   - `packages/db` (Prisma schema + client + migrations + seed for 117 rooms)
   - `packages/auth` (Better Auth config + shared client helpers)
   - `packages/ui` (shared shadcn parts on Tailwind v4, new-york style, consumed first by `apps/pms-pos`)
   - `packages/payments` (Xendit client + webhook verify helpers, stub until v1.1.0)
   Rationale: matches your mandated stack, keeps PMS shippable first. Risk: heavy for solo, so the fix is skeleton first. Scaffold `apps/api` + `apps/pms-pos` + `packages/db` + `packages/ui` in v1.0.0, add `booking-web` only when v1.1.0 starts.

2. Backend: NestJS (REST, Throttler, Helmet). Postgres 16 + Prisma ORM. Migrations via `prisma migrate deploy` only in prod.
   Auth: Better Auth with Prisma adapter, session + PIN (staff shift PIN is separate table, not auth login). Better Auth runs behind NestJS via its Express/node handler route — isolate in `packages/auth`, do not scatter auth logic in controllers.

3. Frontend split:
   - Staff PMS + calendar + folio + housekeeping + POS terminal = one Vite SPA (`apps/pms-pos`) for speed on touchscreen/low spec hardware.
   - Guest booking engine = Next.js (`apps/booking-web`) for SEO, deferred to v1.1.0 behind feature flag / separate compose service.
   Shared parts live in `packages/ui` (shadcn on Tailwind v4, new-york style, CSS variables for hotel theme tokens). `apps/pms-pos` is the first consumer and proves the package. `apps/booking-web` adopts the same package at v1.1.0 instead of forking its own parts.

   Package contract (so the builder invents nothing): the shadcn CLI is initialized once at the `packages/ui` root and every part is added there. Theme tokens live in one shared CSS file using Tailwind v4 `@theme` rules. That CSS file also declares source paths so Tailwind sees classes from the package and from each app. The package exposes one code barrel plus one styles entry through its `package.json` exports map with types. Apps consume raw source through workspace links, so no prebuild step exists. React plus Tailwind are peer needs, small helpers plus radix primitives are package needs. One shared style merge helper ships from the package. Interactive parts carry the client marker from day one so Next.js reuse works later. App builds depend on the package build. Neutral theme placeholders ship now, hotel brand tokens land with the design system spec.

4. Security/middleware: NestJS Throttler + Helmet enabled by default. Arcjet free-tier only for public booking + webhooks (v1.1.0+), not PMS LAN path. Xendit webhook verifies signature + idempotency key before folio write (detail in v1.1.0 spec).

5. Deployment (single VPS $5-10/mo, e.g. 2GB RAM Ubuntu):
   - Docker Compose services: `postgres`, `api`, `pms-pos` (static via Nginx), `booking-web` (from v1.1.0), `nginx` reverse proxy.
   - IP-first (no domain): Nginx serves HTTP via VPS IP; add Let's Encrypt + DNS cutover task at v1.1.0 when domain exists.
   - Backups: nightly `pg_dump` cron on host + 7-day rotation, restore tested once before v1.0.0 tag.
   - Versioning: semver tags v1.0.0..v1.4.0 map to scope phases; unreleased modules behind NestJS config flag (`FEATURE_POS`, `FEATURE_CHANNEL`, etc.).

## Proposed stack

| Layer | Choice | Reason |
|---|---|---|
| Language | TypeScript | Implied by the framework picks, one language everywhere |
| Monorepo | Turborepo plus pnpm workspaces | One repo ships the whole hotel system with shared code between apps |
| API framework | NestJS with Throttler plus Helmet plus Pino | Structured REST plus guards plus logs that one person can operate |
| Staff app | Vite plus React SPA | Fast on touchscreen hardware with no server round trip per click |
| Booking site | Next.js from v1.1.0 | Search friendly pages for direct guest bookings |
| Shared UI | `packages/ui` with shadcn on Tailwind v4 | One set of parts for staff screens plus guest pages |
| Primary DB | Postgres 16 plus Prisma ORM | Relational folio plus reservation data with safe migrations |
| Auth | Better Auth with Prisma adapter | Proven sign in plus sessions instead of custom auth code |
| Nightly jobs | Host cron jobs | Audit plus backups run as cron per the deploy decision |
| Hosting | Single Ubuntu VPS with Docker Compose plus Nginx | Fits the monthly budget with room to add SSL on domain cutover |
| Observability | Pino structured logs | Logging the API already decides, tracking deferred per scope |

## Non-goals
No K8s, no managed DB/Redis, no geolocation shifts (PIN only), no advanced inventory (POS counters only).

## Build plan (for /develop)
1. Init Turborepo + pnpm workspaces + root Docker Compose (postgres + api + pms-pos + nginx skeletons).
2. Add `packages/db` Prisma init + 117-room seed + `migrate deploy` smoke test.
3. Scaffold `packages/ui` on Tailwind v4 with shadcn new-york style plus theme tokens and the first parts (button, input, card).
4. Scaffold NestJS `apps/api` with health, Pino, Throttler, Helmet, config flags.
5. Scaffold Vite SPA shell consuming `packages/ui` + Next.js placeholder (or empty dir + compose stub if deferred).
6. Verify: `pnpm build` + `docker compose up --build` boots, health 200, DB migrates clean.

## Risks
- Better Auth + NestJS integration friction → isolate, keep auth routes thin; fallback to Passport session if blocked (decision log it).
- Turborepo overhead for solo → do not add CI matrix/tooling beyond lint+build until v1.0.0 ships.
- UI drift → pin Tailwind v4 plus shadcn new-york at scaffold and add parts only when a screen needs them, no upgrades until v1.0.0 ships.
- 117-room calendar perf → server-side pagination + date-window queries from day one (enforced in data-model spec).
