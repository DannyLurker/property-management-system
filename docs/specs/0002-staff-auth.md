# 0002. Staff auth with Better Auth

**Date**: 2026-10-06
**Status**: Proposed

## Summary

Staff and guests sign in through one Better Auth setup (a proven sign in library you host yourself) backed by Postgres. Staff use email plus password, guests use email plus password or Google, and every money move needs a 6 digit staff PIN as a second check. This spec also defines the User plus Session plus Account plus Verification tables that the build migrates.

## Context

The hotel has two populations sharing one system. Seven staff roles run the front desk, outlets, housekeeping and accounts, and guests book and pay on the public site. Shared terminals make passwords alone weak, because anyone standing at the terminal inherits the signed in session. There is no mail server in budget, no domain owned yet, and no staff directory to import. Without a decided login method, session shape and user tables, the PMS, POS and booking builds would each invent their own identity handling.

## Requirements

**User stories**:

- As a front desk clerk, I want to sign in with email plus password so that I can run check in and billing.
- As an outlet cashier on a shared terminal, I want to prove identity with my PIN before each sale so that a walk up stranger cannot charge to rooms.
- As a manager, I want to create staff accounts with roles so that nobody registers themselves into the team.
- As a guest, I want to sign up with email or Google so that I can book direct.

**Acceptance criteria**:

- **AC-1**: a staff member signs in with email plus password and the session carries their role.
- **AC-2**: public signup creates GUEST accounts only, and no public path grants a staff role.
- **AC-3**: a manager or admin creates staff with a chosen role, and new staff set their password plus 6 digit PIN on first sign in.
- **AC-4**: a money move without a fresh PIN check is rejected.
- **AC-5**: five wrong PIN tries in a minute throttles the caller with no hint whether the account exists.
- **AC-6**: a guest verifies email through the Resend link, or Google sign in links to the matching verified email account.
- **AC-7**: password or PIN reset runs through a Resend link, and either reset revokes all sessions of that user.
- **AC-8**: guest callers receive 403 on staff endpoints.

## Options considered

### Option 1: Better Auth self hosted with email plus Google

Proven sign in library running inside the NestJS API with the Prisma adapter, email plus password for everyone, Google for guests, Resend for the mails, plus a small PIN check owned by the API.

**Pros**:

- One identity for staff plus guests with no per user fee.
- Fits the hosted stack with no new infrastructure.

**Cons**:

- The team operates session and mail config themselves.

### Option 2: Hosted sign in provider

Accounts plus sessions live with an external provider.

**Pros**:

- Less auth code to own.

**Cons**:

- Monthly fee or free tier caps break the zero budget, plus staff data leaves the VPS.

### Option 3: Password only, no PIN layer

Email plus password alone guards terminals and money moves.

**Pros**:

- Smallest build.

**Cons**:

- A signed in shared terminal lets anyone charge to rooms, which the hotel ruled out.

## Decision

**Chosen option**: Option 1: Better Auth self hosted with email plus Google.

Staff and guests share one Better Auth instance in `packages/auth` on the Prisma adapter, with a 6 digit scrypt hashed PIN checked by the API before money moves.

**Implementation skills**: `better-auth-best-practices` (local, `.opencode/skills/better-auth-best-practices/`) · `better-auth-security-best-practices` (local, `.opencode/skills/better-auth-security-best-practices/`) · `email-and-password-best-practices` (local, `.opencode/skills/email-and-password-best-practices/`)

## Rationale

The closed team plus zero budget forces rule out a hosted provider, and shared terminals rule out password only sign in. Better Auth matches the TypeScript stack and keeps sessions plus password hashing plus OAuth in one library the team already chose in spec 0001. The PIN stays outside the auth library as API logic because no plugin models a per transaction second check, which keeps the auth surface standard and the money rule explicit.

## Feature design

**Data model sketch**:

- User: id, name, email unique, emailVerified, image nullable, role enum (ADMIN, MANAGER, ACCOUNTANT, HOUSEKEEPING, FRONT_DESK, OUTLET_DESK, HOUSEKEEPING_SUPERVISOR, GUEST), pinHash nullable (staff only), createdAt, updatedAt. role travels as a Better Auth additional field so the UI can read it. pinHash stays a plain Prisma column, never an additional field, so it never reaches the client.
- Session: id, userId FK to User, token unique, expiresAt, ipAddress nullable, userAgent nullable, createdAt, updatedAt.
- Account: id, userId FK to User, providerId plus accountId unique together, accessToken nullable, refreshToken nullable, idToken nullable, scope nullable, password nullable (credential accounts), createdAt, updatedAt.
- Verification: id, identifier, value unique, expiresAt, createdAt, updatedAt. Carries email checks plus password and PIN reset tokens.

**API surface**:
| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| /api/auth/_ | _ | per Better Auth | per Better Auth | per Better Auth | 401, 429 |
| /api/auth/ok | GET | none | status ok | none | |
| /api/staff/pin-check | POST | pin (6 digits), user taken from session | grant token with few minute TTL | session, staff role | 401, 403, 429 |
| /api/staff/pin-setup | POST | setup token, password, pin (6 digits) | signed in session | one time setup token | 400, 401, 410 |
| /api/admin/staff | POST | email, name, role | user id plus one time setup token (24h) | session, ADMIN or MANAGER | 400, 401, 403, 409 |
| /api/admin/staff/reset | POST | userId, what (password or pin) | reset link sent, sessions revoked | session, ADMIN or MANAGER | 401, 403, 404 |

**Value sourcing**:
| Action | Value produced / displayed | Source |
|---|---|---|
| Sign in | session plus role | Better Auth session, User.role column |
| Public signup | new account with role | input email plus name, role forced to GUEST by server |
| PIN check | grant token | scrypt compare of input pin against User.pinHash of the session user |
| PIN setup | signed in session | one time Verification row `setup:<userId>`, 24h TTL, single use |
| Bootstrap | first ADMIN account | seed reads `ADMIN_EMAIL`, same setup token flow with 7 day TTL |
| Staff create | new staff account | input email plus name plus role, caller role from session |
| Guest verify | verified flag | Verification table row from the Resend link token |
| Reset | mailed link | Verification table token plus Resend sender |

**Key invariants**:

- Email is unique across all users.
- Public signup always lands on GUEST, enforced server side.
- Staff endpoints require a live session plus a staff role.
- PINs are stored hashed with scrypt, never plain, never logged, never sent to the client.
- A password reset revokes every session of that user, and so does a PIN reset.
- Sensitive endpoints re read the role from the database instead of trusting the cookie cache.
- The first ADMIN comes from the seed and never from public signup.
- Google auto link applies to GUEST accounts only, never to staff addresses.
- Only ADMIN may create another ADMIN. This endpoint never creates GUEST accounts.
- Sessions live 7 days and refresh daily, with a 5 minute cookie cache for reads.

**Security model**:

- ADMIN plus MANAGER create staff and trigger resets. ACCOUNTANT reads folio data when those features land. HOUSEKEEPING plus HOUSEKEEPING_SUPERVISOR touch room status only. FRONT_DESK runs reservations plus folios. OUTLET_DESK runs POS sales. GUEST touches only its own bookings.
- Rate limits stay on for all auth endpoints with database storage, plus a tight custom rule on the PIN endpoint.
- Sensitive sign in endpoints keep the default 3 tries per 10 seconds, the PIN endpoint allows 5 per minute.
- CSRF checks stay on. Trusted origins list the staff app, the booking site and local dev only.

**Configuration required**:

- `BETTER_AUTH_SECRET`: session encryption secret, 32 plus chars, never committed.
- `BETTER_AUTH_URL`: public API base URL.
- `GOOGLE_CLIENT_ID` plus `GOOGLE_CLIENT_SECRET`: guest Google sign in.
- `RESEND_API_KEY` plus `RESEND_FROM`: guest mails, test mode until the domain lands.
- `ADMIN_EMAIL`: bootstrap admin address used by the seed.

**Critical test scenarios**:

- Happy path: staff sign in plus role in session plus PIN check passes, verifies **AC-1**, **AC-4**.
- Failure case: five wrong PINs in a minute throttles with a generic reply, verifies **AC-5**.
- Auth/permission: guest calls a staff endpoint and receives 403, verifies **AC-8**.

## Build plan

1. Add the auth tables plus role enum plus pinHash to the Prisma schema and apply the migration, satisfies **AC-1**, **AC-2**, **AC-6**.
2. Build the Better Auth instance in `packages/auth` (Prisma adapter, email plus password, Google, Resend hooks, rate limits, trusted origins) and mount it in the NestJS API, satisfies **AC-1**, **AC-6**.
3. Build PIN set plus PIN check endpoints with scrypt hashing and throttling, satisfies **AC-3**, **AC-4**, **AC-5**.
4. Build manager staff create plus setup plus reset endpoints behind role guards, satisfies **AC-2**, **AC-3**, **AC-7**, **AC-8**.
5. Add client helpers (sign in, sign out, session read) for the staff app, satisfies **AC-1**.

## Consequences

**Positive**:

- One login for staff plus guests with roles enforced server side.
- PIN per money move protects shared terminals with no extra hardware.

**Negative / tradeoffs**:

- The team owns session config, Resend deliverability and Google console setup.
- Resend test mode only reaches the account mailbox until a domain is verified.

**Neutral**:

- Auth tables ship in the first auth migration, coordinated with the data model spec row 3.

## Follow-up

- [ ] Verify a sending domain before launch so guest mail leaves test mode.
- [ ] Enroll this feature on the scope so it has a row and milestones.
- [ ] Record the auth skill conventions in `packages/auth/AGENTS.md` once it exists.
