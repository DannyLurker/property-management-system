# Review, feat/data-model, 2026-10-08

**Reviewed by**: Big Pickle (author model not specified)
**Scope**: 24 files, branch vs base (merge base 54ded15; all changes currently uncommitted or untracked)
**Verdict**: Approve with nits

## Summary

This change lands spec 0003: a full hotel domain schema (RatePlan, Guest, Reservation, Folio, FolioLine, Payment, Shift, StatusLog) in one feature-sized Prisma migration, plus five constructor-injected query helpers (folio balance, rate lookup, availability, booking, status flip) with 22 live-database integration tests. The code is tight, convention-compliant and matches the spec's acceptance criteria closely — typecheck, lint, `prisma validate` and the full test suite all pass as reviewed. The headline issues are all in the seams: a triplicated date helper with a timezone trap, an unlocked read-modify-write in the status flip that contrasts with the properly locked booking path, and the new test suite not being wired into any gate (turbo/CI) while raising the de facto Node floor above the repo's declared "Node 20 plus".

## Major

_None._

## Minor

### 🟡 UTC-day truncation shifts locally-constructed dates back one day, `packages/db/src/rates/rate-lookup.ts:4` (same helper at `src/reservations/availability.ts:9`, `src/reservations/reservations.ts:17`)
**Problem**: `toDay` normalises using `getUTCFullYear/Month/Date`. That is consistent with how Prisma stores `@db.Date`, but a caller that builds a Date in local time — e.g. `new Date(2036, 5, 1)` at the hotel's UTC+7 — yields 2036-05-31 under these getters, so the intended hotel date silently becomes the previous day in rate lookup, availability and booking alike.
**Why it matters**: A one-day shift on a hotel date changes which rate plan applies, which nights block, and what the folio posts. Tests only pass because they all construct dates with a `Z` suffix; the trap fires for the first caller who parses or builds a local Date.
**Suggested fix**: Keep the UTC normalisation but make the contract explicit — accept date-only strings or UTC-midnight Dates, document it on `CreateReservationInput`/helper signatures, and normalise string inputs via `new Date("YYYY-MM-DD")` at the boundary. Add one test with a non-UTC-midnight input to pin the intended behaviour.

### 🟡 `toDay` is copy-pasted across three modules, `packages/db/src/reservations/reservations.ts:17`
**Problem**: The identical five-line `toDay` lives in `reservations.ts`, `availability.ts` and `rate-lookup.ts`.
**Why it matters**: The date-only rule is the spec's core timezone defence ("Date only values remove an entire class of time zone bugs"); a future fix or change applied to one copy silently desynchronises the other two.
**Suggested fix**: Extract one shared helper (e.g. `src/dates.ts`) and import it from all three.

### 🟡 Status flip is an unlocked read-modify-write, unlike booking, `packages/db/src/rooms/room-status.ts:27`
**Problem**: `flip` reads the room, checks `room.status === toStatus`, then updates — with no `FOR UPDATE` lock, unlike `ReservationBooker.book` which explicitly locks the Room row (`reservations.ts:34`). Two concurrent flips can both pass the check; the final status is last-write-wins and the second `StatusLog.fromStatus` records a state the room never actually held.
**Why it matters**: `StatusLog` is the audit trail for AC-6, and the spec invariant is that the log reflects the flip. Under concurrent housekeeping/front-desk updates the log can lie, and the repo already has the correct pattern one file over.
**Suggested fix**: Take the same `FOR UPDATE` row lock inside the transaction (or drive the check through a conditional `updateMany({ where: { id, status: { not: toStatus } } })` and treat 0 rows as the conflict), so check, update and log are serialized per room.

### 🟡 vitest 5's Node floor is above the repo's declared "Node 20 plus", `packages/db/package.json:38`
**Problem**: The change adds `vitest ^5.0.3`, whose engines are `^22.12.0 || ^24.0.0 || >=26.0.0` (confirmed in `pnpm-lock.yaml`), while root `package.json` declares `"node": ">=20"` and root `AGENTS.md` states "Node 20 plus".
**Why it matters**: On a supported Node 20/early-22 runtime the test command is outside upstream's supported matrix and may fail with obscure errors the moment CI or another machine picks up the declared floor. Nothing enforces this today (no `.npmrc`, no `.nvmrc`, local is v24), so it is a latent support-matrix inconsistency rather than a break right now.
**Suggested fix**: Decide the real floor: either pin a vitest major that supports Node 20, or raise `engines.node` (and the AGENTS.md stack line) to `>=22.12` so the declaration matches what the dev loop actually requires.

### 🟡 The new `test` script is in no gate, `packages/db/package.json:24`
**Problem**: `turbo.json` has no `test` task and the root `package.json` has no `test` script, so `turbo run test` and root `pnpm test` don't exist; the suite only runs via `pnpm --filter @pms/db test`. Root AGENTS.md also lists no test command, and there are no CI workflow files despite the "CI checks every push" rule (the missing CI is pre-existing, but this change creates the first thing it would run).
**Why it matters**: The suite is now the safety net for every future schema change; a safety net nobody is wired to run decays quietly.
**Suggested fix**: Add a `test` task to `turbo.json` (`dependsOn: ["^build"]`, no outputs), a root `"test": "turbo run test"` script, and note the command in AGENTS.md when CI lands.

### 🟡 Two spec invariants are exercised only on their happy paths, `packages/db/src/tests/reservations.test.ts:60`
**Problem**: (1) AC-3's claim is atomic rejection *under concurrency*, but the clash test books sequentially — the `FOR UPDATE` serialization that actually justifies the design is never stressed by two simultaneous `book()` calls. (2) The spec invariant "CHECKED_OUT, CANCELLED and NO_SHOW free [dates]" is tested for booking (`reservations.test.ts:71` covers CANCELLED) but never through `AvailabilityReader.freeRooms`, which only proves checkout-day visibility for an active stay.
**Why it matters**: These are branching/transactional paths, the kind that regress first; per the test-adequacy bar, untested branching logic is a finding.
**Suggested fix**: Add a test firing two `book()` calls for the same room/dates via `Promise.all` and asserting exactly one succeeds; add an availability case where a room with only CANCELLED (or CHECKED_OUT) reservations stays in the free list over those dates.

### 🟡 Tests are not re-run-safe after an interrupted run, `packages/db/src/tests/reservations.test.ts:17`
**Problem**: Cleanup happens only in `afterAll`. A run that crashes or is Ctrl-C'd leaves tagged rows behind (a stale `t-book` reservation on room 3 at 2034-06-10 makes the next run's first booking throw `ConflictError`; a stale `t-rate` plan collides with `@@unique([typeId, startDate])` in `rate-lookup.test.ts:22`).
**Why it matters**: The next developer (or CI) sees a red suite caused by residue, not by their change, and wastes time on a false failure.
**Suggested fix**: Clear TAG-owned rows at the start of `beforeAll` as well as in `afterAll` (idempotent seeding), or run the suite against a reset schema.

## Nits

- ⚪ `packages/db/src/tests/availability.test.ts:1`, tests live grouped under `src/tests/` while `test-preferences.json` declares `"testDir": "beside the source"`; either co-locate (`src/reservations/availability.test.ts`) or update the preference.
- ⚪ `packages/db/src/reservations/availability.ts:25` / `reservations.ts:34`, neither `freeRooms` nor `book` gates on `Room.status`, so an OUT_OF_ORDER room reads as free and can be booked. This matches the spec as written ("free rooms = rooms with no clash"), so it is a spec follow-up, not a code defect — worth a line in spec 0003's Follow-up section before the booking API lands.
- ⚪ `packages/db/src/errors.ts:1`, three error classes with no shared base or exported `code` union; the API layer will need to map them to "one error shape across the API", so exporting a `type AppErrorCode = "NOT_FOUND" | "CONFLICT" | "VALIDATION"` now would keep that mapping exhaustive.
- ⚪ `packages/db/src/rates/rate-lookup.ts:14`, the RoomType lookup always runs before the RatePlan probe even though the plan short-circuits the fallback; probing the plan first skips one query on the common path.

## Strengths

- `ReservationBooker.book` is a textbook implementation of the spec's hardest invariant: `SELECT ... FOR UPDATE` on the Room row, clash check, and folio creation inside one interactive transaction, with a parameterized raw query (no injection) — and the clash overlap math (`checkIn < end && checkOut > start`) is correct half-open-interval logic.
- The test suite is real live-DB integration testing with clever isolation: each file partitions distinct rooms (101/102/103/104), distinct date ranges and distinct TAG names, so parallel file execution doesn't collide; assertions map directly onto ACs (exact folio totals with a negative line, end-exclusive rate date, latest-start-plan precedence, checkout-day availability).
- Schema and migration are consistent and feature-sized per `packages/db/AGENTS.md`; every new query has a matching index (`[roomId, checkIn, checkOut]`, `[folioId, date]`, `[folioId, state]`, `[typeId, startDate, endDate]`), unique-with-null-nullable `idemKey`/`reference` are correct for Postgres, and the tsconfig `include` fix means `src/`, tests and `seed.ts` are now actually typechecked (the old `lib/**/*.ts` glob matched nothing).

## Test coverage

22 tests across 6 files, all passing (verified: `pnpm --filter @pms/db test`, 22/22). AC-2 (signed lines minus PAID-only payments at read time), AC-3 (booking, clash, cancelled-frees-dates, bad range, not-found, availability show/hide), AC-4 (in-range, fallback, exclusive end, overlap precedence, not-found) and AC-6 (flip + log + rejections) are automated; AC-1 and AC-5 are schema-level and covered by the live steps in `verify.md`, which is a reasonable split for a data-model slice. Error classes are unit-tested for their `code` contract. Gaps: concurrent double-booking atomicity, availability over freed reservation states, and crash-residue re-run safety (all detailed as Minors above). No mocks anywhere — every test asserts against the real database, which is the right call for this spec.
