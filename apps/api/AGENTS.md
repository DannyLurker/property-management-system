# apps/api

## Overview

NestJS 12 REST API plus webhooks. Owns auth mounting, folio and reservation logic as features land. Follows spec 0001 plus spec 0002.

## Key files

| File                    | Owns                              |
| ----------------------- | --------------------------------- |
| `src/main.ts`           | bootstrap, security headers, port |
| `src/app.module.ts`     | module wiring, throttler          |
| `src/app.controller.ts` | health plus root routes           |
| `Dockerfile`            | production image                  |

## Commands

```bash
pnpm --filter @pms/api dev
pnpm --filter @pms/api build
pnpm --filter @pms/api test
```

## Conventions

- Controllers stay thin, logic lives in services injected by constructor.
- Imports use explicit `.js` extensions (NodeNext).
- Lint is oxlint, format is Prettier. Tests run on Vitest.
- Env is read through config with fallbacks, never hardcoded secrets.

## Related specs

- `docs/specs/0001-stack-architecture/spec.md`
- `docs/specs/0002-staff-auth.md`

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
