# Batam Hotel PMS plus POS

Monorepo (Turborepo plus pnpm). Spec: `docs/scope/scope.md`, stack decision: `docs/specs/0001-stack-architecture/spec.md`.

## Workspaces

| Path | Package | Notes |
|---|---|---|
| `apps/api` | `@pms/api` | NestJS REST plus webhooks |
| `apps/pms-pos` | `@pms/pms-pos` | Staff Vite SPA, consumes `@pms/ui` |
| `apps/booking-web` | `@pms/booking-web` | Placeholder until v1.1.0 |
| `packages/db` | `@pms/db` | Prisma schema plus 117 room seed |
| `packages/auth` | `@pms/auth` | Stub until an auth feature lands |
| `packages/payments` | `@pms/payments` | Stub until v1.1.0 Xendit work |
| `packages/ui` | `@pms/ui` | Shared shadcn parts on Tailwind v4 |

## Commands

```sh
cp .env.example .env
pnpm install
pnpm build        # turbo, dependency order
pnpm typecheck
DATABASE_URL=... pnpm --filter @pms/db exec prisma validate
```

Database (needs Postgres running, for example `docker compose up postgres` on the VPS):

```sh
DATABASE_URL=... pnpm --filter @pms/db exec prisma migrate deploy
DATABASE_URL=... pnpm --filter @pms/db exec prisma db seed
```

Full stack on the VPS: `docker compose up --build`.
