# Disposal Tracking Workflow + In-App Notifications Design

**Date:** 2026-06-13
**Status:** Approved (pending implementation plan)
**Scope:** Expand the disposal status model into a multi-stage, parcel-tracking workflow with
per-stage dates, Unit-Aset-driven transitions, in-app notifications to the applicant, and
consolidation of existing status displays (no duplicate trackers).

> Builds on `2026-06-13-mohon-form-field-changes-design.md` (migration 005). This spec is
> migration **006** and redefines `approve_disposal_ticket` / `complete_disposal_ticket`;
> it **preserves** the Borang-CA approval guard added in 005.

---

## 1. Summary

Today's status model is `menunggu_semakan → proses_pelupusan → selesai` (+ `ditolak`). The
real disposal process has more stages: after Unit Aset reviews, the application goes to
**Radicare** for approval (~14 working days), then to **JKNT** (Jabatan Kesihatan Negeri
Terengganu), then completion. The applicant should track progress like a parcel, with a date
on every stage, and be **notified in-app** at each Unit-Aset-driven transition.

In-app only (users authenticate via IC → synthetic `@ic.local` emails, so no real
email/phone exists). Delivery is fetch-on-load (no Realtime in this phase).

---

## 2. New state machine

```
menunggu_semakan ──(Lulus → Hantar ke Radicare)──► dihantar_radicare
       │                                                  │
       │                                       (Lulus → Hantar ke JKNT)
       │                                                  ▼
       │                                            dihantar_jknt
       │                                                  │
       │                                          (Pelupusan Selesai)
       │                                                  ▼
       │                                              selesai
       │
       └──(Tolak, from ANY non-terminal stage, with reason)──► ditolak ──(resubmit)──► menunggu_semakan
```

**Enum (`ticket_status`) change:** replace `proses_pelupusan` with **`dihantar_radicare`** and
**`dihantar_jknt`**. Keep `menunggu_semakan`, `selesai`, `ditolak`.

**Rejection is allowed from any non-terminal stage** (`menunggu_semakan`,
`dihantar_radicare`, `dihantar_jknt`), always with a remark stored in `rejection_reason` so
the applicant sees why.

**Disposal method is removed** — drop the `disposal_method` column, the `disposal_method`
enum, its capture UI, and its detail-page display.

---

## 3. RPC layer (PL/pgSQL, migration 006)

- **`approve_disposal_ticket(p_ticket_id)`** — now transitions `menunggu_semakan →
  dihantar_radicare`. Sets `reviewed_by`/`reviewed_at`. Audit action `'dihantar_radicare'`
  (old `menunggu_semakan` → new `dihantar_radicare`). **Preserves** the 005 Borang-CA guard.
- **`forward_to_jknt_disposal_ticket(p_ticket_id)`** — NEW. Transitions `dihantar_radicare →
  dihantar_jknt`. Role: asset staff. Audit action `'dihantar_jknt'`.
- **`complete_disposal_ticket(p_ticket_id)`** — now transitions `dihantar_jknt → selesai`.
  **Drops the `p_disposal_method` param.** Sets `completed_by`/`completed_at`. Audit action
  `'pelupusan_selesai'`.
- **`reject_disposal_ticket(p_ticket_id, p_rejection_reason)`** — relax the status guard from
  "must be `menunggu_semakan`" to "must be one of `menunggu_semakan`, `dihantar_radicare`,
  `dihantar_jknt`". Reason required (existing validation). Audit action `'semakan_ditolak'`
  (old = current status, new = `ditolak`).
- **`resubmit_disposal_ticket(...)`** — unchanged transition (`ditolak → menunggu_semakan`);
  keeps the field changes from spec 005.

All transition RPCs already write `audit_logs`; the tracking timeline and notifications both
derive from these writes (single source of truth — see §5, §6).

---

## 4. Action buttons (Unit Aset) — one contextual button per stage

Consolidates today's `/semakan` Lulus/Tolak buttons and the `TicketActions`
"Selesaikan Pelupusan" button into a single status-driven control set (shown to asset staff
on the detail page; `/semakan` queue keeps its quick Lulus/Tolak for `menunggu_semakan`):

```
status = menunggu_semakan  →  [ Lulus → Hantar ke Radicare ]   [ Tolak ]
status = dihantar_radicare →  [ Lulus → Hantar ke JKNT ]        [ Tolak ]
status = dihantar_jknt     →  [ Pelupusan Selesai ]            [ Tolak ]
status = selesai / ditolak →  (no actions)
```

"Tolak" opens the existing reason modal (textarea) at any stage.

---

## 5. Tracking timeline (the applicant view) — upgrades the existing Jejak Audit card

The detail page (`app/(protected)/semua/[id]/page.tsx`) already renders a chronological
timeline from `audit_logs` (the "Jejak Audit" card, ~lines 304–337). **Upgrade that one card
into the parcel tracker — do not add a second timeline.** Source stays `audit_logs` ordered by
`created_at`.

Rendering:
- A fixed **stage ladder** (Dihantar → Radicare → JKNT → Selesai) with each completed stage
  marked done and stamped with its **date (DD/MM/YYYY)** from the matching audit_logs row;
  the current stage highlighted; future stages muted.
- The current pending stage shows a static wait hint:
  - `menunggu_semakan` → "Sila tunggu 3 hari bekerja untuk Unit Aset semak"
  - `dihantar_radicare` → "Sila tunggu 14 hari bekerja kelulusan dari pihak Radicare"
- The **ditolak** branch renders a rejection node with the date + `rejection_reason` + a
  "Hantar Semula" action (existing resubmit path).

```
●  Permohonan Dihantar          15/01/2026
●  Dihantar ke Radicare         17/01/2026  · oleh Unit Aset
◉  Dihantar ke JKNT             (current — menunggu maklum balas JKNT)
○  Pelupusan Selesai            (akan datang)
```

**Action → Malay label map (new).** Today the timeline just underscore-replaces the raw
action string. Add a single map (in `lib/constants.ts`) used by both the tracker and any
audit display:

| action | label |
|---|---|
| `permohonan_dibuat` | Permohonan Dihantar |
| `dihantar_radicare` | Dihantar ke Radicare |
| `dihantar_jknt` | Dihantar ke JKNT |
| `pelupusan_selesai` | Pelupusan Selesai |
| `semakan_ditolak` | Permohonan Ditolak |
| `permohonan_dihantar_semula` | Dihantar Semula |
| `foto_aset_dilampirkan` | Foto Aset Dilampirkan |
| `borang_ca_dilampirkan` | Borang CA Dilampirkan |
| `sijil_dijana` | Sijil Dijana |

---

## 6. In-app notifications

### 6.1 Table

```
notifications (
  id          UUID PK DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,  -- recipient
  ticket_id   UUID NOT NULL REFERENCES disposal_tickets(id) ON DELETE CASCADE,
  message     TEXT NOT NULL,         -- Malay, ready to display
  status      ticket_status NOT NULL,-- the new status (for icon/context)
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
)
```

RLS: a user may `SELECT` and `UPDATE` (only `is_read`) their own rows
(`user_id = auth.uid()`). No client INSERT — rows are created by a SECURITY DEFINER trigger.

### 6.2 Trigger (single source, can't be missed)

`AFTER UPDATE OF status ON disposal_tickets`, when the status changed, insert one notification
for the ticket's `created_by` (the applicant) — **only** for staff-driven transitions:

| new status | message |
|---|---|
| `dihantar_radicare` | "Permohonan anda telah diluluskan & dihantar ke Radicare. Sila tunggu 14 hari bekerja untuk kelulusan dari pihak Radicare." |
| `dihantar_jknt` | "Permohonan anda telah dihantar ke Jabatan Kesihatan Negeri Terengganu (JKNT)." |
| `selesai` | "Permohonan pelupusan anda telah selesai." |
| `ditolak` | "Permohonan anda telah ditolak. Sebab: " ‖ rejection_reason |

Transitions **to** `menunggu_semakan` (submit / resubmit) are applicant-driven and produce no
notification.

### 6.3 Bell UI (AppHeader, top-right next to ProfileMenu)

- Bell icon with an unread-count badge (count of `is_read = false` for the current user).
- Click → dropdown list (newest first): message + date (DD/MM/YYYY), unread visually marked.
- Clicking an item → navigate to `/semua/{ticket_id}` and mark that notification read
  (`mark_notification_read` RPC or a scoped UPDATE permitted by RLS).
- Fetch on load/navigation (no Realtime subscription this phase).

---

## 7. No-duplicate consolidation

- **Tracker:** upgrade the single Jejak Audit card; no second timeline.
- **`StatusChip`** (`components/StatusChip.tsx`): add `dihantar_radicare` + `dihantar_jknt`
  (tone + Malay label) and remove `proses_pelupusan`. Every page inherits it — single edit.
- **`STATUS_CONFIG`** (`lib/constants.ts`) + the **`/semua` filter pills**
  (`FILTER_OPTIONS`): update to the new status set (Menunggu / Radicare / JKNT / Selesai /
  Ditolak).
- **`/status`** stays the per-user entry list (TicketCard + StatusChip) → click → tracker.
- **`/semakan`** still queues `menunggu_semakan` for quick Lulus/Tolak; later-stage advances
  happen from the detail page action set.

---

## 8. Database migration 006 — ordering

1. Add enum values `dihantar_radicare`, `dihantar_jknt` to `ticket_status` (ALTER TYPE ADD
   VALUE — note these are not transactional with other DDL in some PG versions; run enum adds
   first / in their own step).
2. Migrate data: `UPDATE disposal_tickets SET status = 'dihantar_radicare' WHERE status =
   'proses_pelupusan';`
3. Drop `disposal_method` column; drop the `disposal_method` enum type.
4. Create `notifications` table + RLS policies.
5. Create the status-change notification trigger + function.
6. Redefine RPCs per §3 (approve/forward_to_jknt/complete/reject), preserving the 005 guard.
7. (Cannot easily remove the old `proses_pelupusan` enum label in PG; leave it orphaned/unused
   or recreate the enum if a clean drop is required — decide in the plan.)

---

## 9. Testing

- Unit: StatusChip new statuses; action→label map; tracker stage derivation from a mock
  audit_logs set; bell unread-count + read-marking logic.
- Migration: data migration of `proses_pelupusan` rows; trigger inserts the correct message
  per transition; RLS lets a user read only their own notifications; reject works from each
  non-terminal stage.
- Manual smoke: full happy path (submit → Lulus→Radicare → Lulus→JKNT → Selesai) with a
  notification + dated tracker node appearing at each step; reject at the Radicare stage with a
  reason → applicant notified + tracker shows rejection + Hantar Semula.

---

## 10. Out of scope (future)

- Realtime live notifications (this phase is fetch-on-load).
- Email/SMS/WhatsApp channels (no real contact info under IC auth).
- Working-day countdown logic beyond the static wait hint text.
