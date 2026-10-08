# Rationale: 0003 Hotel data model

_Decision record for spec 0003. The build spec lives in `index.md` beside this file._

## Context

Every later slice reads and writes the same tables, so a wrong model forces every feature to redo its queries. The scaffold holds only room types plus rooms, and the auth tables belong to a separate spec with their own migration. Thin tables now plus compatible growth later is the whole job: walk in guests with no login, OTA guests with no account, seasonal prices, per transaction PIN checks, cash today plus Xendit tomorrow, and a night audit that must tie every charge to a date.

## Options considered

### Option 1: Full domain schema now with forward tables

Stays plus money plus ops tables in one migration, with source flags and nullable links where later slices attach.

**Pros**:

- Later slices attach with no breaking remake, which row 3 demands.

**Cons**:

- Bigger first migration to review carefully.

### Option 2: Minimal stay tables only

Reservations plus folios now, payments and shifts when their slices land.

**Pros**:

- Smallest review.

**Cons**:

- Payment and shift slices would alter live money tables, the exact remake this row exists to prevent.

### Option 3: Nightly inventory rows for availability

One row per room per night with a booked flag instead of date overlap checks.

**Pros**:

- Overbooking becomes a unique constraint violation.

**Cons**:

- 117 rows per night forever for a hotel one transaction check already protects.

## Rationale

Row 3 exists to prevent remakes, so minimal tables now would defeat its purpose while inventory rows would overbuild for one hotel. Source flags plus nullable links give POS, Xendit and shift slices named attachment points without designing those slices here. Auth tables stay out because spec 0002 owns their migration, and plain id strings instead of cross spec relations keep the two migrations independent.

## 2026-10-08 update: room sellability

INSPECTED means the supervisor already signed the room off, so it is sellable and tops the DIRTY becomes CLEAN becomes INSPECTED chain. DIRTY and OUT_OF_ORDER never sell; OUT_OF_ORDER keeps its name as the industry term for a broken room and returns to DIRTY once repaired. Moves into or out of INSPECTED and OUT_OF_ORDER belong to the HOUSEKEEPING_SUPERVISOR role from spec 0002, with helpers recording the staff id and later API specs enforcing the role.
