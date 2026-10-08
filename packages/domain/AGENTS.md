# packages/domain

## Overview

Pure hotel domain logic over Prisma types from `@pms/db`: folio math, nightly rates, availability, atomic booking and room status moves. Holds no SQL and no schema; tables plus migrations plus the client stay in `packages/db`.

## Key files

| File | Owns |
|---|---|
| `index.ts` | public barrel, the only import path outsiders use |
| `src/dates.ts` | `toDayUTC`, the one UTC calendar day contract every helper shares |
| `src/errors.ts` | `NotFoundError`, `ConflictError`, `ValidationError` plus `AppErrorCode` |
| `src/rooms/sellable.ts` | shared sellable rule, CLEAN plus INSPECTED sell |
| `src/rooms/transitions.ts` | allowed RoomStatus moves |
| `src/rooms/room-status.ts` | locked status flip writing room plus log row |
| `src/reservations/availability.ts` | free rooms, sellable plus clash free with type |
| `src/reservations/reservations.ts` | booking inside the room locking transaction |
| `src/folio/folio-balance.ts` | balance computed at read time, never stored |
| `src/rates/rate-lookup.ts` | plan price inside range, else type baseRate |
| `src/tests/` | live database suite, one file per helper |
| `vitest.setup.ts` | loads `DATABASE_URL` from the db package env file |

## Commands

```bash
pnpm --filter @pms/domain typecheck
pnpm --filter @pms/domain test
pnpm --filter @pms/domain lint
```

## Conventions

- One shared rule per decision: sellability lives in `sellable.ts`, moves in `transitions.ts`, dates in `dates.ts`. Never reimplement them per helper.
- `staffId` stays a plain string with no auth relation; role checks land in later API specs.
- Money helpers never store a balance; refunds are negative lines and only PAID payments count.
- Tests hit the live seeded database using one TAG plus distinct rooms and dates per file, and clear TAG rows on entry as well as exit.

## Gotchas

- Tests need the db package `.env` present; without it every database file fails at import with missing `DATABASE_URL`.
- Booking and status flips take a row lock; keep every check that must stay atomic inside the same transaction.

## Related specs

- `docs/specs/0003-data-model/index.md`

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
