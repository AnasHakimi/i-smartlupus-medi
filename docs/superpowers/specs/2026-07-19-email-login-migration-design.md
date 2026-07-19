# Email Login Migration — Design Spec

**Date:** 2026-07-19
**Goal:** Replace IC-based login with real email + password, and remove IC (`ic_number`) from the system entirely.

## Motivation

IC (Malaysian NRIC) is sensitive PII under the PDPA — holding other people's IC is a legal liability, and leaking it carries penalties. IC is **not** used anywhere official in this system (not on disposal certificates, tickets, or any workflow — the cert uses the officer's name). It exists only as: the login identifier, an admin-registration field, and a profile display value. Therefore the safest move is **data minimization: stop holding it at all.**

## Scope

Login identity changes from `{ic}@ic.local` synthetic email to a **real email**. The `ic_number` column is dropped. All existing data is wiped afterward (separate step), so no user migration is required — accounts are recreated email-first.

### Onboarding model (unchanged from today, minus IC)

Admin-provisioned. Admin creates each account with an email + password; account is auto-confirmed (`email_confirm: true`) — **no verification email is sent** (free Supabase caps transactional email; also keeps shipping fast). No self-signup. No forgot-password self-service (admin resets via Admin API; SMTP can be added later if ever needed).

## Changes

1. **DB — migration `006_drop_ic_number.sql`:** `ALTER TABLE public.profiles DROP COLUMN ic_number;` plus drop its unique index/constraint. No backfill (data wiped).
2. **Login page (`app/login/page.tsx`):** replace IC field with an email `<Input type="email">`; call `signInWithPassword({ email, password })` directly (drop `icToEmail`). Remove IC validation/formatting. Update copy to "Log masuk dengan e-mel."
3. **Register API (`app/api/register/route.ts`):** accept `email` instead of `ic_number`; validate email format; `createUser({ email, password, email_confirm: true })`; profile insert without `ic_number`. Keep admin-gate + atomic rollback unchanged.
4. **Admin user-management (`app/(protected)/pengguna/page.tsx`):** IC input → email input; IC column in the user list → email.
5. **Profile (`app/(protected)/profil/page.tsx`):** remove IC display; show email instead.
6. **Cleanup:** delete now-dead helpers `icToEmail`, `validateIc`, `formatIc`, `formatIcProgressive`, `IC_DOMAIN`; remove `ic_number` from the `Profile` type; fix any test mocks referencing it.

## Post-migration: DB wipe + admin re-seed (separate, explicitly-confirmed step)

Wipe all app data (tickets, profiles, auth users, storage files, demo data). **Critical:** the wipe deletes the admin account too, which would lock everyone out — so the wipe **must re-seed one fresh admin** (email + password chosen by the user) via the Admin API immediately after. Scope of the wipe is confirmed with the user before execution.

## Out of scope

Email verification, self-signup, forgot-password/SMTP, multi-factor. All deferred (YAGNI).

## Verification

- `tsc` 0 · `vitest` green · `next build` clean
- Manual smoke: admin creates a user with email+password → that user logs in with email → IC no longer appears anywhere → profile shows email.
