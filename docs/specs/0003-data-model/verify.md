# Verify: data model · spec 0003 · updated 2026-10-08
_Steps derived from spec 0003 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._
## Commands
- [x] `pnpm --filter @pms/db exec prisma validate` → schema reports valid → AC-1
- [x] `pnpm --filter @pms/db exec prisma migrate status` → database schema is up to date → AC-1
- [x] `pnpm --filter @pms/db exec prisma db seed` → prints Seeded 117 rooms → AC-1
- [x] `pnpm --filter @pms/db exec tsc --noEmit` → clean → AC-1 through AC-6
## UI / manual
- [x] Create a Guest with null email and null userId → row saves and coexists with linked guests → AC-5
- [x] List public tables → no User, Session, Account or Verification tables → AC-5
- [x] Book a room, then book the same room over the same dates → second booking rejected with a clash error → AC-3
- [x] Query free rooms over booked dates → booked room absent; query starting on the checkout day → room present → AC-3
- [x] Read a folio with lines of 500000 plus 500000 minus a 50000 refund and one PAID payment of 400000 plus one PENDING payment → linesTotal 950000, paidTotal 400000, balance 550000 → AC-2
- [x] Look up a rate inside a plan range → plan price; look up outside all ranges → type baseRate → AC-4
- [x] Flip a room status → Room row plus one StatusLog row share the flip → AC-6
- [x] Set a room DIRTY → it leaves free lists; booking it fails with room not sellable → AC-7
- [x] Flip CLEAN to INSPECTED → room returns to free lists as a typed row → AC-7
- [x] Flip DIRTY to INSPECTED → rejected as an illegal move; flip into OUT_OF_ORDER logs the actor staff id → AC-8
## Acceptance-criteria coverage
- AC-1 covered by validate, migrate status and seed steps
- AC-2 covered by folio balance step
- AC-3 covered by clash booking and free rooms steps
- AC-4 covered by rate lookup step
- AC-5 covered by linkless guest and table list steps
- AC-6 covered by status flip step
- AC-7 covered by dirty hide plus typed row steps
- AC-8 covered by illegal move plus actor log steps
