# 0003. Hotel data model

**Date**: 2026-10-08
**Status**: Accepted

## Summary

One Prisma schema covers stays, money and daily ops for 117 rooms (the room inventory the hotel runs). Reservations link a Guest row to a Room over dates, each stay owns one folio bill built from signed line items, and payments settle against it. Later slices for booking, Xendit, POS and shifts fit these tables with no breaking remake.

## Requirements

**User stories**:

- As front desk, I want to book a room for a guest with or without a login so that walk ins and OTA arrivals both work.
- As a manager, I want each stay to carry one bill with auditable lines so that disputes resolve from records.
- As the night auditor, I want every charge tied to a hotel date so that the daily summary balances.

**Acceptance criteria**:

- **AC-1**: the migration applies clean on an empty database and the seed loads 117 rooms with types plus base rates.
- **AC-2**: a stay folio balance equals signed lines minus paid payments, computed at read time with no stored balance.
- **AC-3**: a booking overlapping existing dates for one room is rejected inside one transaction.
- **AC-4**: a nightly price resolves from the rate plan inside its date range, else the type baseRate.
- **AC-5**: Guest rows work with null login link and null email, and this migration adds no auth tables.
- **AC-6**: a room status flip writes Room status plus a StatusLog row together.
- **AC-7**: rooms with CLEAN or INSPECTED status are sellable and appear in free lists; DIRTY and OUT_OF_ORDER rooms never appear, and booking one is rejected with room not sellable after a status recheck inside the room locking transaction.
- **AC-8**: flips into or out of INSPECTED and OUT_OF_ORDER are supervisor acts; helpers record the performing actor staff id, and the API layer proves the HOUSEKEEPING_SUPERVISOR role through the User role lookup and rejects other actors with a forbidden actor error.

## Decision

**Chosen option**: Option 1: Full domain schema now with forward tables.

The schema below lands in `packages/db` in one migration, with auth tables arriving separately under spec 0002.

**Implementation skills**: `prisma-orm-setup` (local, `.agents/skills/prisma-orm-setup/`)

## Feature design

**Data model sketch**:

- RoomType: id, code unique, name, sizeM2, bedSetup, bathSetup, baseRate Decimal. Has many Room plus RatePlan. Exists already, unchanged.
- Room: id, number unique, floor, status enum (CLEAN, DIRTY, INSPECTED, OUT_OF_ORDER), typeId FK. Exists already, status extended by migration `20261008124831_room_status_inspected`.
- RatePlan: id, typeId FK, name, startDate, endDate, price Decimal. Unique on type plus startDate. Price wins inside its range.
- Guest: id, name required, phone nullable, email nullable, idNumber nullable, userId nullable plain string (link to auth User when a login exists, no Prisma relation so migrations stay independent).
- Reservation: id, guestId FK, roomId FK, checkIn plus checkOut as date only values, state enum (RESERVED, CHECKED_IN, CHECKED_OUT, CANCELLED, NO_SHOW), source enum (DIRECT, OTA, WALK_IN), staffId nullable plain string. Index on room plus dates.
- Folio: id, reservationId unique FK. No stored balance.
- FolioLine: id, folioId FK, date, source enum (ROOM, POS, MANUAL), label, signed amount Decimal (refunds are negative lines), idemKey nullable unique (webhook retries).
- Payment: id, folioId FK, method enum (CASH, QRIS, VA, EWALLET, CARD), state enum (PENDING, PAID, FAILED, REFUNDED), amount Decimal, reference nullable unique (Xendit invoice id later, nulls allowed), paidAt nullable.
- Shift: id, staffId plain string, startedAt, endedAt nullable.
- StatusLog: id, roomId FK, fromStatus plus toStatus, staffId plain string (the performing actor), createdAt.

**State transitions**:

- RoomStatus: DIRTY becomes CLEAN (housekeeping clean) becomes INSPECTED (supervisor sign off, the room is verified sellable). CLEAN, DIRTY or INSPECTED becomes OUT_OF_ORDER (fault found, unsellable). OUT_OF_ORDER becomes DIRTY (repaired, needs reclean plus reinspect). CLEAN or INSPECTED becomes DIRTY on guest checkout (performed by the later checkout flow). No other moves.
- Reservation: RESERVED becomes CHECKED_IN becomes CHECKED_OUT. RESERVED becomes CANCELLED or NO_SHOW. No other moves.
- Payment: PENDING becomes PAID or FAILED. PAID becomes REFUNDED. No other moves.

**API surface** (query helpers in `packages/domain`, no HTTP in this spec):
| Function | Key inputs | Key outputs | Errors |
|---|---|---|---|
| folioBalance | folioId | total lines minus paid payments | folio missing |
| rateForDate | typeId, date | plan price or baseRate | type missing |
| roomsFree | checkIn, checkOut | sellable rooms with no clash as full Room rows with type | bad range |
| flipStatus | roomId, toStatus, staffId | room plus log row | bad transition, supervisor only for INSPECTED and OUT_OF_ORDER moves (enforced at the API layer) |

**Value sourcing**:
| Action | Value produced / displayed | Source |
|---|---|---|
| Folio total | balance | sum of FolioLine amounts minus PAID Payment amounts, computed |
| Nightly price | amount | RatePlan row covering the date, else RoomType.baseRate |
| Availability | free rooms | clash free rooms with status CLEAN or INSPECTED, checkout day exclusive |
| Hotel date on lines | date | date only value, no time zone math |

**Key invariants**:

- No two active reservations overlap on one room, enforced by the transactional check.
- RESERVED plus CHECKED_IN block dates; CHECKED_OUT, CANCELLED and NO_SHOW free them; a checkout day is free for the next checkin.
- Paid totals count PAID payments only; refunds land as negative lines.
- Latest starting rate plan wins; ranges are start inclusive and end exclusive.
- Line dates come from the server at post time; backdating needs a manager role.
- Booking locks the Room row inside its transaction; folio plus status writes share the pattern.
- Payment reference plus line idempotency keys stay unique so retries never double settle.
- Folio balance is never stored, always computed.
- One folio per reservation, enforced by the unique link.
- Status flips always write the log row in the same transaction.
- Only CLEAN and INSPECTED rooms are sellable; DIRTY and OUT_OF_ORDER rooms never appear in free lists and cannot be booked.
- One shared sellable rule (status CLEAN or INSPECTED) feeds both roomsFree and the booking guard, and the status filter reads current status at call time.
- Moves into or out of INSPECTED and OUT_OF_ORDER are supervisor acts (HOUSEKEEPING_SUPERVISOR per spec 0002); helpers record the staff id and later API specs enforce the role.
- PIN hashes and auth data never enter these tables.

**Security model**:

- These tables hold guest PII (names, phones, ID numbers), readable only through staff role guards defined in later API specs.
- No table is exposed directly, all access passes query helpers plus role checked endpoints.

**Critical test scenarios**:

- Happy path: book plus folio lines plus cash payment balances to zero, verifies **AC-2**.
- Failure case: double booking the same dates is rejected atomically, verifies **AC-3**.
- Auth/permission: guest linked and linkless Guest rows coexist, verifies **AC-5**.
- Sellability: a DIRTY room stays out of free lists and its booking is rejected with room not sellable, verifies **AC-7**.
- Supervisor trail: a flip into INSPECTED writes the log with the performing actor staff id, verifies **AC-8**.

## Build plan

1. Write the schema plus the migration plus the extended seed, satisfies **AC-1**, **AC-5**.
2. Build the query helpers for balance, rate lookup, availability guard and status flip, satisfies **AC-2**, **AC-3**, **AC-4**, **AC-6**.
3. Validate the schema, run typecheck and prove the seed counts on a live database, satisfies **AC-1** through **AC-6**.
4. Enforce sellability in availability plus booking and record the supervisor rule on status flips with tests, satisfies **AC-7**, **AC-8**.

## Consequences

**Positive**:

- Later slices attach to named points with no table remakes.
- Date only values remove an entire class of time zone bugs.

**Negative / tradeoffs**:

- The first migration is large and deserves a careful read.
- Availability relies on app side transactional discipline rather than a constraint.

**Neutral**:

- Auth tables arrive in the spec 0002 migration against the same database.
- The INSPECTED enum value already ships in migration `20261008124831_room_status_inspected`; only the sellability enforcement plus tests remain.

## Follow-up

- [ ] Enforce the supervisor only rule for INSPECTED and OUT_OF_ORDER flips at the API layer with the spec 0002 HOUSEKEEPING_SUPERVISOR role.
- [ ] Decide check in time behavior for a room that turns DIRTY after booking, owned by the check in slice.
- [ ] Coordinate migration order with the spec 0002 auth tables before the first deploy.
- [ ] Record the prisma skill conventions in `packages/db/AGENTS.md`.

## Decision record

The deliberation behind this choice lives in `rationale.md` beside this file.
