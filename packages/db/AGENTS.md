# packages/db

## Overview

Prisma 7 schema plus client plus seed. Owns RoomType plus Room today, auth tables land with the staff auth feature.

## Key files

| File | Owns |
|---|---|
| `prisma.config.ts` | schema path, seed command, database URL |
| `prisma/schema.prisma` | models, single source of truth |
| `prisma/seed.ts` | 117 room seed |
| `src/client.ts` | single shared client on the Postgres adapter |

## Commands

```bash
DATABASE_URL=... pnpm --filter @pms/db exec prisma validate
DATABASE_URL=... pnpm --filter @pms/db exec prisma migrate deploy
DATABASE_URL=... pnpm --filter @pms/db exec prisma db seed
```

## Conventions

- One migration per feature, sized to that feature.
- Reuse the single client, never construct a second pool.
- CLI commands need `DATABASE_URL` in env since the config loads it at startup.

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
