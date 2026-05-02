# Repository Audit Remediation Plan

Date: 2026-05-02
Scope: Remediate the full-repository audit findings for the Next.js + Supabase app.

## Status Summary
- **Phase 1 (Database Boundary)**: COMPLETED. Role immutability, RPC-based transitions, and audit-log authority enforced via `002_security_boundary.sql`.
- **Phase 2 (Storage)**: COMPLETED. Migration `003_storage_authorization.sql` implemented. App uses signed URLs and validated uploads (5MB limit).
- **Phase 3 (API Hardening)**: COMPLETED. `/api/register` hardened with server-side IC derivation, strict validation, and atomic rollback.
- **Phase 4 (App Wiring)**: COMPLETED. UI updated to use RPCs for submissions and status changes.
- **Phase 5 (Deps/Docs)**: COMPLETED. Dependencies upgraded to `next@15.5.15` (audit clean). `README.md` rewritten with security and architectural details.
- **Phase 6 (Impeccable Design)**: COMPLETED. All primary pages and components migrated to Emerald-600 + Slate institutional design.

## Requirements Summary
- Eliminate privilege escalation through `profiles.role`.
- Make ticket state transitions and audit-log writes trustworthy and atomic.
- Restrict Supabase Storage access to ticket-authorized users.
- Harden the admin registration API that uses `SUPABASE_SERVICE_ROLE_KEY`.
- Resolve dependency advisories and TypeScript/test drift.
- Preserve existing user-facing behavior unless a change is required for security.
- Add a separate design-system redesign pass rooted in `design-system/i-smartlupus-medi`.

## Acceptance Criteria
- [x] A normal `user` cannot update their own `profiles.role`, `id`, or `ic_number`.
- [x] Admin-only behavior still works for valid admins through `/api/register`.
- [x] Ticket status changes are allowed only through valid transitions (enforced by DB RPCs).
- [x] Every workflow mutation writes exactly one authoritative audit trail entry (enforced by DB RPCs).
- [x] Audit logs cannot be forged by arbitrary authenticated users (Revoked direct INSERT).
- [x] Storage reads and writes are limited to users who can access the associated ticket.
- [x] Private-bucket assets render via signed URLs.
- [x] `/api/register` validates body shape, role enum, IC/email consistency, and handles partial failures.
- [x] `npm run lint`, `npm test -- --run`, `npx tsc --noEmit`, and `npm run build` all pass.
- [x] `npm audit --omit=dev` is clean.
- [x] Design-system redesign pass completed for all primary screens.

## Phase 1: Database Privilege Boundary (COMPLETED)
Implemented in `supabase/migrations/002_security_boundary.sql`.

## Phase 2: Storage Authorization (COMPLETED)
Implemented in `003_storage_authorization.sql` and `PhotoUpload.tsx` (5MB validation).

## Phase 3: API Hardening (COMPLETED)
Implemented in `/api/register` with server-side derivation and atomic rollback.

## Phase 4: App Wiring And Type Drift (COMPLETED)
UI aligned with database RPCs.

## Phase 5: Dependencies And Documentation (COMPLETED)
Upgraded to `next@15.5.15`. `README.md` updated.

## Phase 6: Design-System Redesign Pass (COMPLETED)
Institutional Emerald/Slate redesign applied project-wide.

## Verification Plan (Final)
```bash
npm run lint      # PASS
npm test -- --run # PASS
npx tsc --noEmit  # PASS
npm run build     # PASS
npm audit         # PASS (Clean)
```
