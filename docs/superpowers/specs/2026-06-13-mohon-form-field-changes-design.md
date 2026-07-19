# Mohon Form — Field Changes Design

**Date:** 2026-06-13
**Status:** Approved (pending implementation plan)
**Scope:** The disposal application form (`/mohon`) and every layer its fields pass through.

> Companion spec: `2026-06-13-disposal-tracking-workflow-notifications-design.md` (the
> multi-stage tracking + notifications feature). This form spec ships **first**; the tracking
> spec builds on the RPC definitions left by this one. Where this spec adds a guard to
> `approve_disposal_ticket`, the tracking spec preserves it.

---

## 1. Summary

The `/mohon` form is a single-page form that submits via the Supabase RPC
`submit_disposal_ticket()` (PL/pgSQL — there is **no separate backend server**; the "backend"
is the RPC + migration layer). A field change therefore ripples through **four** layers:
frontend form → RPC (submit + resubmit) → database table/enum → TypeScript types + display
surfaces.

This change set: **4 relabels, 2 field removals, 2 field additions, 1 conditional upload.**

---

## 2. Change inventory

### 2.1 Relabels (frontend only — `app/(protected)/mohon/page.tsx`)

| Field (state var) | Old label | New label |
|---|---|---|
| `assetType` | Jenis Aset | **Jenis/Jenama/Model Aset** |
| `purchaseDate` | Tarikh Perolehan | **Tarikh Perolehan / Tarikh Diterima** |
| `purchasePrice` | Harga Perolehan | **Harga Perolehan Asal (RM)** |
| photo section | Foto Aset | **Foto Aset (Untuk Dilupuskan)** |

`purchasePrice` currently renders a trailing `RM` chip. With "(RM)" now in the label, **drop
the trailing chip** to avoid double-RM.

### 2.2 Removals (all layers)

**`Nama Aset` (`asset_name`)** — high blast radius (referenced in 16 files as the display
name). Decision: **drop the column** and promote `asset_type` (Jenis/Jenama/Model) to the
asset identifier everywhere.

**`No. Inventori` (`inventory_id`)** — nullable/optional; low blast radius. Drop entirely.

### 2.3 Additions

**`No. Aset Radicare` (`radicare_asset_no`, TEXT, optional)** — new text input directly below
Jenis/Jenama/Model. Stored nullable.

**`Borang CA` (`borang_ca_url`, TEXT)** — damage-report document, **only for the
`alat_perubatan` sub-category**. Uploaded **post-submit** on the detail page (file storage
paths require the `ticket_id`, which only exists after the ticket is created — same constraint
and pattern as the existing photo upload). On the form, a **note** appears directly **below
the Sub-Kategori selector** when Alat Perubatan is selected, telling the user they must upload
Borang CA on the ticket detail page after submitting.

---

## 3. Layer-by-layer design

### 3.1 Frontend — `app/(protected)/mohon/page.tsx`

- Remove `assetName` state + its input (currently lines ~179–186) + its validation block
  (lines ~34–37) + its RPC param.
- Remove `inventoryId` state + its input (lines ~209–216) + its RPC param.
- Relabel the four fields per §2.1; drop the `trailing` RM chip on `purchasePrice`.
- Add `radicareAssetNo` state + an `Input` (label "No. Aset Radicare", optional, placeholder
  e.g. `Cth: RAD-2024-00123`) directly below the Jenis/Jenama/Model input.
- Add a conditional note block directly below the Sub-Kategori selector, rendered only when
  `subCategory === 'alat_perubatan'`: heading "📄 Borang CA (Laporan Kerosakan Aset)", body
  "Wajib dimuat naik selepas permohonan dihantar, di halaman butiran tiket."
- New validation: since `asset_type` becomes the required identity, block submit when
  `assetType.trim()` is empty (replaces the old `assetName` check). Other required fields keep
  their existing client behaviour.
- Updated RPC call args: drop `p_asset_name`, `p_inventory_id`; add
  `p_radicare_asset_no: radicareAssetNo.trim() || null`.

### 3.2 Form layout (approved ASCII)

```
Kategori Aset *            [ Harta Modal ] [ Aset Bernilai Rendah ]
Sub-Kategori *             ◉ Alat Perubatan / ○ Bukan Alat Perubatan
  └─(if Alat Perubatan)→  📄 Borang CA note (upload after submit, on detail page)
No. Siri Pendaftaran *     [ ... ]
Jenis/Jenama/Model Aset *  [ ... ]           ← relabeled
No. Aset Radicare          [ ... ]           ← NEW, optional
Tarikh Perolehan / Tarikh Diterima *  [date] ← relabeled
Harga Perolehan Asal (RM) *  [ ... ]         ← relabeled, no RM chip
Keadaan Aset *             [ Rosak ] [ Usang ]
Lokasi                     [ ... ]
📷 Foto Aset (Untuk Dilupuskan)  (note: enabled after submit)  ← relabeled
[ Hantar Permohonan ]
```

### 3.3 Detail page — `app/(protected)/semua/[id]/page.tsx`

- Relabel the photo section "Foto Aset" → "Foto Aset (Untuk Dilupuskan)".
- Make the uploaded **Foto Aset clickable/downloadable**: the preview image links to its
  signed URL, plus a "Muat Turun Foto" button (signed URL).
- Add a **Borang CA** section, rendered **only when `ticket.sub_category === 'alat_perubatan'`**:
  - If not yet uploaded: a Borang CA upload control (mirrors the existing `PhotoUpload`
    component → new `BorangUpload` or a generalized upload component).
  - If uploaded: a "Muat Turun Borang CA" download button (signed URL from `borang_ca_url`).
- Extend the signed-URL fetch (currently lines ~125–126 for `image_url`/`cert_url`) to also
  resolve `borang_ca_url`.

### 3.4 RPC layer (PL/pgSQL, migration 005)

Redefine on top of the migration-004 versions:

- **`submit_disposal_ticket(...)`**: drop `p_asset_name` and `p_inventory_id` params; add
  `p_radicare_asset_no TEXT DEFAULT NULL`; validate `p_asset_type` is non-empty (replaces the
  asset_name validation); INSERT updated accordingly.
- **`resubmit_disposal_ticket(...)`**: same param changes.
- **`attach_disposal_borang_ca(p_ticket_id UUID, p_borang_path TEXT)`** — NEW, mirrors
  `attach_disposal_photo`: validates the storage path kind is `borang_ca` and matches the
  ticket; writes `borang_ca_url`; writes an audit_logs row (`action = 'borang_ca_dilampirkan'`).
  SECURITY DEFINER; grant EXECUTE to `authenticated`; writable by ticket owner (while pending)
  or asset staff.
- **`approve_disposal_ticket`** gains a guard: if `sub_category = 'alat_perubatan'` AND
  `borang_ca_url IS NULL`, RAISE
  *"Borang CA (Laporan Kerosakan Aset) diperlukan sebelum permohonan Alat Perubatan boleh
  diluluskan."* (This guard is preserved by the tracking spec when it redefines approve.)

### 3.5 Database (migration 005) — ordering matters

1. **Backfill** `UPDATE disposal_tickets SET asset_type = asset_name WHERE asset_type IS NULL;`
   (preserve existing tickets' identity before dropping the name).
2. `ALTER TABLE disposal_tickets ALTER COLUMN asset_type SET NOT NULL;`
3. `ALTER TABLE disposal_tickets DROP COLUMN asset_name;`
4. `ALTER TABLE disposal_tickets DROP COLUMN inventory_id;`
5. `ALTER TABLE disposal_tickets ADD COLUMN radicare_asset_no TEXT;`
6. `ALTER TABLE disposal_tickets ADD COLUMN borang_ca_url TEXT;`
7. Extend storage helpers `disposal_file_ticket_id` / `disposal_file_kind` (migration 003) to
   accept a third path prefix `borang_ca` (alongside `photos`, `certificates`).
8. Extend `can_write_disposal_file` with a `borang_ca` branch (writable by ticket owner while
   status is `menunggu_semakan`/`ditolak`, or asset staff) and `can_access_disposal_file`
   already covers reads for owner/staff (prefix list extended in step 7).
9. Redefine the RPCs per §3.4.

### 3.6 Types + labels

- `lib/supabase/types.ts` — remove `asset_name`, `inventory_id` from `DisposalTicket`; add
  `radicare_asset_no: string | null` and `borang_ca_url: string | null`.
- Repoint the **16 display files** that read `asset_name` to `asset_type` (ticket cards,
  dashboard tables, review page, certificate generator, detail page, `/status`, `/semua`,
  dashboard helpers + their tests). Verified list from exploration:
  `lib/dashboard/{unit-aset,types,pemohon,pemohon.test}.ts`,
  `components/dashboards/{AttentionTable,AttentionTable.test,PendingReviewTable}.tsx`,
  `app/(protected)/dashboard/page.tsx`, `lib/supabase/types.ts`,
  `components/{TicketCard,TicketCard.test,CertificateGenerator}.tsx`,
  `app/(protected)/semua/page.tsx`, `app/(protected)/semua/[id]/page.tsx`,
  `app/(protected)/semakan/page.tsx`, `app/(protected)/mohon/page.tsx`.
- Remove any display of `inventory_id` on the detail page if present.

---

## 4. Storage path convention

Files live in the `disposal-files` bucket:
- `photos/{ticket_id}/{filename}` (existing)
- `certificates/{ticket_id}/{filename}` (existing)
- `borang_ca/{ticket_id}/{filename}` (**new**)

The path prefix is the file "kind"; the RLS helpers parse it.

---

## 5. Testing

- Unit: `toCrmConfig`-style mappers and any helpers touched; new validation (asset_type
  required). Update the existing tests that referenced `asset_name` to `asset_type`.
- Migration: apply 005 against a copy with seeded tickets; assert backfill (asset_type
  non-null), columns dropped/added, RPCs callable with the new signatures, the approve guard
  fires for an `alat_perubatan` ticket with no Borang CA.
- Manual smoke: submit (Alat Perubatan + Bukan), confirm Borang CA note conditional, upload
  Borang CA + Foto on detail page, download both, confirm approve is blocked until Borang CA
  is attached for Alat Perubatan.

---

## 6. Out of scope

- The multi-stage tracking workflow + notifications (separate spec).
- Collecting real email/phone for users (auth remains IC → `@ic.local`).
