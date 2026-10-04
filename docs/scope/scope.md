# Scope: Batam Hotel PMS plus POS

You run a 3 star hotel in Batam with 117 rooms and you need one simple system to run it. This scope gives you a usable PMS first, then adds booking, payments, channels, POS and small extras release by release.

**Build approach:** Skateboard (smallest usable whole first, then grow it).
**Workflow:** GA (after develop you run check verify, then test, then review, then document). The project default level of rigor. `/architect` is the recommended first stop for a feature with a real decision, but skippable when you already know the build. Any feature can carry its own tag (for example `· Beta`) to do more or less.

_These are recommendations to keep your build orderly, not requirements. Skip anything that does not fit: if you already know how to build a feature, use `/develop` and skip `/architect`. You decide when a feature is `done`._

## At a glance

| #   | Feature                         | Phase      | Status  |
| --- | ------------------------------- | ---------- | ------- |
| 1   | Stack and architecture          | Foundation | planned |
| 2   | Coding standards and tooling    | Foundation | planned |
| 3   | Data model                      | Foundation | planned |
| 4   | Deploy and backup               | Foundation | planned |
| 5   | Design system and UI foundation | Foundation | planned |
| 6   | Room master and rates           | v1.0.0     | planned |
| 7   | Reservation calendar            | v1.0.0     | planned |
| 8   | Check in, check out and folio   | v1.0.0     | planned |
| 9   | Housekeeping status             | v1.0.0     | planned |
| 10  | Night audit and daily summary   | v1.0.0     | planned |
| 11  | Direct booking engine           | v1.1.0     | planned |
| 12  | Xendit payments and webhook     | v1.1.0     | planned |
| 13  | SiteMinder outbound ARI         | v1.2.0     | planned |
| 14  | SiteMinder inbound reservations | v1.2.0     | planned |
| 15  | POS terminal and charge to room | v1.3.0     | planned |
| 16  | POS stock deduction             | v1.3.0     | planned |
| 17  | Staff PIN shift logger          | v1.4.0     | planned |
| 18  | AI guest FAQ and mgmt bot       | v1.4.0     | planned |

## Foundations

### 1. Stack and architecture · needs a decision

You need one recorded choice for monorepo layout, API, web apps, database and auth so later work has solid ground.
**Done when:** the stack choice is recorded in a spec and an empty scaffold boots locally and builds clean.

- [ ] Decide the stack (spec): `/architect stack and architecture`

### 2. Coding standards and tooling

You need shared rules and clean checks from the real scaffold so solo work stays tidy.
**Done when:** root `AGENTS.md` reflects the real stack and lint and format run clean.

- [ ] Capture conventions and tooling: `/audit`

### 3. Data model · needs a decision

You need rooms, rates, guests, reservations, folios, users and PINs modeled once so later slices avoid painful remakes. Seed covers 117 rooms (Moderate 20, Superior Double 40, Superior Twin 35, Deluxe 15, Junior Suite 5, BIZ Suite 2) with your room sizes and bed and bath details.
**Done when:** entities and links support reservations, folios, housekeeping and later POS and payments without a breaking remake.

- [ ] Design it (spec): `/architect data model`

### 4. Deploy and backup

You need live VPS deploy as you go with safe migrations and zero cost backups so v1.0.0 can ship early.
**Done when:** Docker Compose stack runs on the VPS over IP with Nginx, Prisma migrate deploy succeeds without downtime, and nightly `pg_dump` restores in a test.

- [ ] Design it (spec): `/architect deploy and backup`

### 5. Design system and UI foundation · needs a decision

You need one visual language and base parts for staff screens plus guest booking so every page feels like one product.
**Done when:** `design.md` covers type and color and spacing and parts, and base parts support keyboard and focus.

- [ ] Design it (spec): `/architect design system and UI foundation`

## v1.0.0 PMS Core

### 6. Room master and rates · needs a decision

You need to manage 6 room types and nightly rates in one place.
**Done when:** you can create and edit room types and rooms and rates and see the 117 room list load fast.

- [ ] Design it (spec): `/architect room master and rates`

### 7. Reservation calendar · needs a decision

You need a grid view of availability by day and room so front desk avoids double booking.
**Done when:** you can view availability by date and room, create and move a booking, and empty and clash states show clearly.

- [ ] Design it (spec): `/architect reservation calendar`

### 8. Check in, check out and folio · needs a decision

You need arrival to departure flow with a guest bill that posts by itself.
**Done when:** you can check in and check out a guest and room charges post to the folio and the balance stays correct.

- [ ] Design it (spec): `/architect check in check out and folio`

### 9. Housekeeping status · needs a decision

You need Clean and Dirty and Out of Order tracking so front desk only sells ready rooms.
**Done when:** staff can flip room status and front desk sees fresh status on the calendar and Out of Order rooms stay unsellable.

- [ ] Design it (spec): `/architect housekeeping status`

### 10. Night audit and daily summary · needs a decision

You need a nightly close plus a morning money summary for managers.
**Done when:** the audit script closes the hotel date cleanly and the daily report shows occupancy and revenue correctly.

- [ ] Design it (spec): `/architect night audit and daily summary`

## v1.1.0 Direct Booking plus Payments

### 11. Direct booking engine · needs a decision

You need a public Next.js site where guests can book direct without OTA fees.
**Done when:** a guest can search dates and book a room on mobile and the booking lands in the PMS calendar.

- [ ] Design it (spec): `/architect direct booking engine`

### 12. Xendit payments and webhook · needs a decision

You need QRIS plus Virtual Accounts plus E Wallets on a fresh Xendit sandbox account with paid callbacks updating bills in real time.
**Done when:** a guest can pay by QRIS or Virtual Account or E Wallet and `invoice.paid` updates the folio with no double posting.

- [ ] Design it (spec): `/architect Xendit payments and webhook`

## v1.2.0 Channel Manager

### 13. SiteMinder outbound ARI · needs a decision

You need to push Availability Rates Inventory from PMS to a fresh SiteMinder sandbox so OTAs stop selling stale rooms.
**Done when:** a rate or room count change in PMS appears in SiteMinder and failed pushes retry safely.

- [ ] Design it (spec): `/architect SiteMinder outbound ARI`

### 14. SiteMinder inbound reservations · needs a decision

You need OTA bookings from Traveloka and Agoda and Booking.com to land in PMS with no double rooms.
**Done when:** an inbound SiteMinder booking creates one PMS reservation exactly once even when retried.

- [ ] Design it (spec): `/architect SiteMinder inbound reservations`

## v1.3.0 POS plus Stock

### 15. POS terminal and charge to room · needs a decision

You need a simple touchscreen SPA for cafe and restaurant and room service with Cash or QRIS or charge to room folio.
**Done when:** staff can take an order fast on touch and settle by Cash or QRIS or post it to an active folio.

- [ ] Design it (spec): `/architect POS terminal and charge to room`

### 16. POS stock deduction

You need simple menu item counters that drop when an order settles.
**Done when:** settling an order drops stock counts correctly and low or empty items warn clearly.

- [ ] Develop it: `/develop POS stock deduction`

## v1.4.0 Secondary

### 17. Staff PIN shift logger

You chose PIN only with no geolocation so shifts stay simple and cheap.
**Done when:** staff can start and end a shift with a 4 digit PIN and managers see hours by day.

- [ ] Develop it: `/develop staff PIN shift logger`

### 18. AI guest FAQ and mgmt bot · Beta · needs a decision

You need a small guest helper on the booking site plus an internal helper for occupancy and revenue questions.
**Done when:** guests get correct answers to common stay questions and managers get correct occupancy and revenue answers from live data.

- [ ] Design it (spec): `/architect AI guest FAQ and mgmt bot`

## Deferred

Out of scope for the current pass, kept so the plan stays honest.

1. Domain and SSL cutover: point DNS and turn on Let's Encrypt once you own the domain. IP first with Nginx ready for the swap.
2. Real SiteMinder and Xendit owner accounts: move from your new sandbox to hotel owned keys with signed handover.
3. Browser geolocation for shifts: skipped because you chose PIN.
4. Advanced inventory and purchase orders: stay with simple POS counters for now.
5. Product analytics and error tracking: add after v1.0.0 proves stable.

## Legend

**The decision box.** Every feature carries exactly one, the subtask whose label ends with `(spec)`. Every other box is an execution box and `/architect` never ticks one.

**Feature lifecycle**: the scope updates as a feature moves; each row is what it shows and who sets it.

| State                        | Set by                       | The feature shows                                                                                                                                                             |
| ---------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `planned` · needs a decision | `/scope`                     | one box: `Design it (spec): /architect <feature>`                                                                                                                             |
| `in-progress` (designed)     | `/architect` at spec capture | `Design it` ticked; spec linked; `Build it: /develop <feature>` plus milestones; the tier closing boxes (`Verify it`, `Test it`, `Review it`, `Document it`)                  |
| `in-progress` (building)     | `/develop`                   | milestone boxes tick one by one; code pointer filled                                                                                                                          |
| `in-progress` (verified)     | `/check verify`              | `Build it` plus milestones ticked; `Verify it` ticked                                                                                                                         |
| `done`                       | you, when you decide it is   | boxes you ran ticked; the tier last stage (`Prototype` after `/develop`; `Alpha` after `/check verify`; `Beta` and `GA` after `/test`) is the suggested point to call it done |

- Next step equals the first unticked box (always a command or a tracked milestone).
- needs a decision equals run `/architect` first; otherwise straight to `/develop` (or `/audit` for standards and tooling). The tag drops once the spec is captured.
- Atomic build tasks live in the spec Build plan, not here: the scope carries only the milestone rollup.
- Status `planned` to `in-progress` to `done`, plus `existing` (predates the workflow) and `dropped` (de scoped, kept for history).
- Approach tag beside a heading overrides the project default for that feature; no tag means it inherits it.
- Workflow tier tag beside a heading (for example `· GA`, `· Beta`) sets that one feature rigor above or below the project default; no tag inherits the default.
- Pointer line (`spec <n> · code in <path>`): the spec link added by `/architect`, the code path by `/develop`.
