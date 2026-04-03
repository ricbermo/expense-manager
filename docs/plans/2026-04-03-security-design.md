# Security hardening design for public deployment

Date: 2026-04-03
Owner: ricbermo
Status: Approved by user

## Context and problem

The app is publicly reachable on the internet and currently allows unrestricted data access/modification because database policies are permissive (`USING (true)` / `WITH CHECK (true)`).

The user needs to prevent anyone who knows the URL from entering and changing data.

## Decisions validated with user

- Authentication model: **single-user login**
- Allowed email: **`rickardoberdejo@gmail.com` only**
- Preferred login for PWA (installed on phone): **email + password**
- Keep UX simple and persistent for mobile/PWA usage

## Goals

1. Require authentication for all app routes with business data.
2. Restrict app access to one whitelisted email.
3. Enforce data isolation/protection at DB level with strict RLS.
4. Preserve smooth PWA experience (persistent session, explicit logout).

## Non-goals

- Multi-user onboarding/registration flows.
- Social login providers (Google, etc.) for this iteration.
- Full account-recovery UX beyond baseline auth behavior.

## Evaluated approaches

1. **Global shared password**
   - Pros: very fast to add.
   - Cons: weak model, no user identity, poor long-term security.

2. **Supabase Auth + email/password + whitelist + strict RLS** (**chosen**)
   - Pros: robust access control at app and DB layers, good PWA UX.
   - Cons: requires schema + policy migration and route guards.

3. **Magic link + whitelist + strict RLS**
   - Pros: no password memory burden.
   - Cons: friction in installed PWA due external mail/deep-link flow.

## High-level architecture

### Authentication

- Use Supabase Auth with email/password.
- No open registration surface in app UX.
- Enforce an allowlist check for `rickardoberdejo@gmail.com` after auth/session load.

### App access control

- Add `/login` public route.
- Treat existing app routes as private (`/`, `/accounts`, `/transactions`, `/budgets`).
- If session is missing, redirect to `/login`.
- If session email is not whitelisted, force sign-out and block access.

### Database security

Move from permissive policies to user-scoped ownership:

- Add `user_id uuid` to `accounts`, `transactions`, `budgets`, `categories`.
- Backfill existing rows to the owner user.
- Enforce strict RLS on all CRUD ops using `auth.uid()`.
- Optionally auto-populate `user_id` with trigger/default to avoid client trust.
- Add indexes on `user_id` for performance.

## Data model changes

Tables to update:

- `categories(user_id uuid not null)`
- `accounts(user_id uuid not null)`
- `transactions(user_id uuid not null)`
- `budgets(user_id uuid not null)`

Rationale: every row must have explicit ownership for deterministic RLS checks.

## RLS policy model (target)

For each protected table:

- `SELECT`: `USING (user_id = auth.uid())`
- `INSERT`: `WITH CHECK (user_id = auth.uid())`
- `UPDATE`: `USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())`
- `DELETE`: `USING (user_id = auth.uid())`

This removes anonymous/public data access even when URL and anon key are known.

## PWA session behavior

- Persist session with Supabase client defaults.
- App boot behavior:
  - Valid session -> enter app.
  - Missing/expired session -> redirect to login.
- Provide explicit logout action and clear sensitive client state after logout.

## Error handling and UX

- Friendly errors for invalid credentials.
- Explicit message for unauthorized email.
- Handle expired sessions by redirecting to login and showing context message.

## Testing and verification strategy

### Functional checks

1. Unauthenticated user opening private routes gets redirected to `/login`.
2. Authenticated non-whitelisted email cannot use app (forced sign-out).
3. Whitelisted user can perform CRUD flows normally.
4. Post-logout, previous data is not visible from stale client state.

### Security checks

1. Verify old permissive policies are removed.
2. Verify RLS blocks cross-user access at DB level.
3. Verify anonymous access returns no protected rows.

## Success criteria

- Public URL no longer exposes or allows modifying data without auth.
- Only `rickardoberdejo@gmail.com` can access app functionality.
- All business tables are protected by strict user-scoped RLS policies.
- PWA remains usable with persistent sessions and reliable relogin behavior.

## Risks and mitigations

- **Risk:** Existing rows without owner mapping.
  - **Mitigation:** Backfill migration before enforcing `NOT NULL` and strict RLS.

- **Risk:** Frontend-only checks bypassed.
  - **Mitigation:** DB-enforced RLS and server-side/session checks.

- **Risk:** Session edge cases in installed PWA.
  - **Mitigation:** deterministic boot guard + logout + clear messaging.
