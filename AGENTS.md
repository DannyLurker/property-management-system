# Property Management System

## Stack

- **Language / Runtime**: TypeScript strict, Node 20 plus
- **Framework**: NestJS 12 API, Vite plus React staff app, Next.js booking site later
- **Key dependencies**: Prisma 7 plus Postgres 16, Better Auth, shadcn on Tailwind v4
- **Package manager**: pnpm plus Turborepo, one VPS with Docker Compose plus Nginx

## Build approach

Skateboard, ship the thinnest usable whole, then grow it

## Commands

```bash
pnpm install
pnpm build        # turbo, dependency order
pnpm typecheck
pnpm lint
DATABASE_URL=... pnpm --filter @pms/db exec prisma validate
```

## Specs

Decisions in `docs/specs/`, format `docs/specs/NNNN-title.md`. Plan in `docs/scope/scope.md`.

## Rules

- SOLID classes with one job each, dependencies through constructors, composition over deep trees, small focused interfaces, classes under 200 lines.
- Strict types with no any. Named exports only.
- One error shape across the API.
- Validate env at startup and fail fast on missing secrets.
- Conventional commits.
- Commit hooks run lint plus format plus typecheck.
- Tests are unit plus integration. CI checks every push.

## Git

- integration: on
- branch prefix: feat/
- commit: per-milestone

## Agent skills

- [shadcn](.agents/skills/shadcn/): `shadcn-ui/ui`, parts catalog plus Tailwind v4 combo for packages/ui

`MCP servers: shadcn (configured in opencode.json)`

## Context files

- [apps/api/AGENTS.md](apps/api/AGENTS.md): NestJS API plus auth mount
- [apps/pms-pos/AGENTS.md](apps/pms-pos/AGENTS.md): staff Vite SPA on shared UI
- [apps/booking-web/AGENTS.md](apps/booking-web/AGENTS.md): guest booking placeholder until v1.1.0
- [packages/auth/AGENTS.md](packages/auth/AGENTS.md): Better Auth home
- [packages/db/AGENTS.md](packages/db/AGENTS.md): Prisma schema plus seed
- [packages/payments/AGENTS.md](packages/payments/AGENTS.md): Xendit home from v1.1.0
- [packages/ui/AGENTS.md](packages/ui/AGENTS.md): shared shadcn parts
- [packages/eslint-config/AGENTS.md](packages/eslint-config/AGENTS.md): shared lint rules
- [packages/typescript-config/AGENTS.md](packages/typescript-config/AGENTS.md): shared TS bases

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
