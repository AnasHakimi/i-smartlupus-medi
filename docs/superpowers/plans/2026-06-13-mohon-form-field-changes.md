# Mohon Form Field Changes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the approved field changes to the `/mohon` disposal application form across all four layers (DB migration, RPCs, frontend form, detail-page uploads/downloads, types).

**Architecture:** Next.js 14 (App Router, client components) + Supabase (Postgres RPCs are the "backend"; no separate server). Form submits via the `submit_disposal_ticket` RPC. Files upload to the `disposal-files` storage bucket post-submit, attached via SECURITY DEFINER RPCs. A single SQL migration (`005`) does all schema + RPC changes; frontend changes follow.

**Tech Stack:** TypeScript, React 18, Next 15, Supabase JS, Tailwind, vitest + @testing-library/react, Supabase CLI for migrations.

**Spec:** `docs/superpowers/specs/2026-06-13-mohon-form-field-changes-design.md`

---

## File Structure

- **Create:** `supabase/migrations/005_form_field_changes.sql` — all schema + RPC changes.
- **Create:** `components/BorangUpload.tsx` — Borang CA document uploader (modeled on `PhotoUpload.tsx`).
- **Modify:** `lib/supabase/types.ts` — `DisposalTicket` field changes (drives the repoint).
- **Modify:** `app/(protected)/mohon/page.tsx` — relabels, remove/add fields, conditional note, validation, RPC args.
- **Modify:** `app/(protected)/semua/[id]/page.tsx` — Foto relabel + download, Borang CA section + download, signed-URL fetch.
- **Modify (repoint `asset_name` → `asset_type`):** `components/TicketCard.tsx`, `components/CertificateGenerator.tsx`, `app/(protected)/semua/page.tsx`, `app/(protected)/semakan/page.tsx`, `lib/dashboard/{unit-aset,types,pemohon}.ts`, `components/dashboards/{AttentionTable,PendingReviewTable}.tsx`, `app/(protected)/dashboard/page.tsx`.
- **Modify (test mocks):** `components/TicketCard.test.tsx`, `components/dashboards/AttentionTable.test.tsx`, `lib/dashboard/pemohon.test.ts`.

---

## Task 1: Migration 005 — schema, storage, RPCs

**Files:**
- Create: `supabase/migrations/005_form_field_changes.sql`

- [ ] **Step 1: Write the migration file**

```sql
-- ============================================================
-- i-SMARTLUPUS - Mohon form field changes
-- Migration: 005_form_field_changes.sql
--   * asset_type becomes the asset identity (backfill from asset_name)
--   * drop asset_name + inventory_id
--   * add radicare_asset_no + borang_ca_url
--   * storage: add 'borang_ca' file kind
--   * rewrite submit/resubmit RPCs; new attach_disposal_borang_ca RPC
--   * approve guard: Borang CA required for alat_perubatan
-- ============================================================

-- 1. Promote asset_type to the asset identity --------------------------------
UPDATE public.disposal_tickets
SET asset_type = asset_name
WHERE asset_type IS NULL OR BTRIM(asset_type) = '';

ALTER TABLE public.disposal_tickets
    ALTER COLUMN asset_type SET NOT NULL;

-- 2. Drop removed columns -----------------------------------------------------
ALTER TABLE public.disposal_tickets DROP COLUMN asset_name;
ALTER TABLE public.disposal_tickets DROP COLUMN inventory_id;

-- 3. Add new columns ----------------------------------------------------------
ALTER TABLE public.disposal_tickets ADD COLUMN radicare_asset_no TEXT;
ALTER TABLE public.disposal_tickets ADD COLUMN borang_ca_url TEXT;

-- 4. Storage: allow a third file kind 'borang_ca' -----------------------------
CREATE OR REPLACE FUNCTION public.disposal_file_ticket_id(p_name TEXT)
RETURNS UUID
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
    v_parts TEXT[];
    v_ticket_id UUID;
BEGIN
    v_parts := string_to_array(p_name, '/');
    IF array_length(v_parts, 1) < 3 THEN
        RETURN NULL;
    END IF;
    IF v_parts[1] NOT IN ('photos', 'certificates', 'borang_ca') THEN
        RETURN NULL;
    END IF;
    BEGIN
        v_ticket_id := v_parts[2]::UUID;
    EXCEPTION WHEN invalid_text_representation THEN
        RETURN NULL;
    END;
    RETURN v_ticket_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.disposal_file_kind(p_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
    v_parts TEXT[];
BEGIN
    v_parts := string_to_array(p_name, '/');
    IF array_length(v_parts, 1) < 3 THEN
        RETURN NULL;
    END IF;
    IF v_parts[1] NOT IN ('photos', 'certificates', 'borang_ca') THEN
        RETURN NULL;
    END IF;
    RETURN v_parts[1];
END;
$$;

CREATE OR REPLACE FUNCTION public.can_write_disposal_file(p_name TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.disposal_tickets t
        WHERE t.id = public.disposal_file_ticket_id(p_name)
          AND (
              (
                  public.disposal_file_kind(p_name) IN ('photos', 'borang_ca')
                  AND (
                      t.created_by = auth.uid()
                      OR public.current_user_is_asset_staff()
                  )
              )
              OR (
                  public.disposal_file_kind(p_name) = 'certificates'
                  AND t.status = 'selesai'
                  AND public.current_user_is_asset_staff()
              )
          )
    );
$$;

-- 5. Rewrite submit_disposal_ticket (drop name/inventory, add radicare) -------
DROP FUNCTION IF EXISTS public.submit_disposal_ticket(
    TEXT, public.asset_condition, TEXT, TEXT, public.asset_category,
    public.asset_sub_category, TEXT, TEXT, DATE, NUMERIC);

CREATE FUNCTION public.submit_disposal_ticket(
    p_asset_condition public.asset_condition,
    p_location TEXT DEFAULT NULL,
    p_category public.asset_category DEFAULT NULL,
    p_sub_category public.asset_sub_category DEFAULT NULL,
    p_serial_no TEXT DEFAULT NULL,
    p_asset_type TEXT DEFAULT NULL,
    p_radicare_asset_no TEXT DEFAULT NULL,
    p_purchase_date DATE DEFAULT NULL,
    p_purchase_price NUMERIC DEFAULT NULL
)
RETURNS public.disposal_tickets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_actor UUID := auth.uid();
    v_ticket public.disposal_tickets;
BEGIN
    IF v_actor IS NULL THEN
        RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
    END IF;

    IF NULLIF(BTRIM(p_asset_type), '') IS NULL THEN
        RAISE EXCEPTION 'Asset type is required.' USING ERRCODE = '22023';
    END IF;

    INSERT INTO public.disposal_tickets (
        asset_condition, location, category, sub_category,
        serial_no, asset_type, radicare_asset_no,
        purchase_date, purchase_price, created_by
    )
    VALUES (
        p_asset_condition,
        NULLIF(BTRIM(p_location), ''),
        p_category,
        p_sub_category,
        NULLIF(BTRIM(p_serial_no), ''),
        BTRIM(p_asset_type),
        NULLIF(BTRIM(p_radicare_asset_no), ''),
        p_purchase_date,
        p_purchase_price,
        v_actor
    )
    RETURNING * INTO v_ticket;

    INSERT INTO public.audit_logs (ticket_id, action, new_value, performed_by)
    VALUES (v_ticket.id, 'permohonan_dibuat', 'menunggu_semakan', v_actor);

    RETURN v_ticket;
END;
$$;

-- 6. Rewrite resubmit_disposal_ticket ----------------------------------------
DROP FUNCTION IF EXISTS public.resubmit_disposal_ticket(
    UUID, TEXT, public.asset_condition, TEXT, TEXT, public.asset_category,
    public.asset_sub_category, TEXT, TEXT, DATE, NUMERIC);

CREATE FUNCTION public.resubmit_disposal_ticket(
    p_ticket_id UUID,
    p_asset_condition public.asset_condition,
    p_location TEXT DEFAULT NULL,
    p_category public.asset_category DEFAULT NULL,
    p_sub_category public.asset_sub_category DEFAULT NULL,
    p_serial_no TEXT DEFAULT NULL,
    p_asset_type TEXT DEFAULT NULL,
    p_radicare_asset_no TEXT DEFAULT NULL,
    p_purchase_date DATE DEFAULT NULL,
    p_purchase_price NUMERIC DEFAULT NULL
)
RETURNS public.disposal_tickets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_actor UUID := auth.uid();
    v_ticket public.disposal_tickets;
BEGIN
    IF v_actor IS NULL THEN
        RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
    END IF;

    IF NULLIF(BTRIM(p_asset_type), '') IS NULL THEN
        RAISE EXCEPTION 'Asset type is required.' USING ERRCODE = '22023';
    END IF;

    SELECT * INTO v_ticket FROM public.disposal_tickets
    WHERE id = p_ticket_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ticket not found.' USING ERRCODE = 'P0002';
    END IF;

    IF v_ticket.created_by <> v_actor THEN
        RAISE EXCEPTION 'Only the ticket creator can resubmit this ticket.'
            USING ERRCODE = '42501';
    END IF;

    IF v_ticket.status <> 'ditolak'::public.ticket_status THEN
        RAISE EXCEPTION 'Only rejected tickets can be resubmitted.'
            USING ERRCODE = '22023';
    END IF;

    UPDATE public.disposal_tickets
    SET asset_condition = p_asset_condition,
        location = NULLIF(BTRIM(p_location), ''),
        category = p_category,
        sub_category = p_sub_category,
        serial_no = NULLIF(BTRIM(p_serial_no), ''),
        asset_type = BTRIM(p_asset_type),
        radicare_asset_no = NULLIF(BTRIM(p_radicare_asset_no), ''),
        purchase_date = p_purchase_date,
        purchase_price = p_purchase_price,
        status = 'menunggu_semakan',
        disposal_method = NULL,
        rejection_reason = NULL,
        reviewed_by = NULL,
        reviewed_at = NULL,
        completed_by = NULL,
        completed_at = NULL
    WHERE id = p_ticket_id
    RETURNING * INTO v_ticket;

    INSERT INTO public.audit_logs (ticket_id, action, old_value, new_value, performed_by)
    VALUES (v_ticket.id, 'permohonan_dihantar_semula', 'ditolak', 'menunggu_semakan', v_actor);

    RETURN v_ticket;
END;
$$;

-- 7. New attach_disposal_borang_ca RPC ---------------------------------------
CREATE OR REPLACE FUNCTION public.attach_disposal_borang_ca(
    p_ticket_id UUID,
    p_borang_path TEXT
)
RETURNS public.disposal_tickets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_actor UUID := auth.uid();
    v_path TEXT := NULLIF(BTRIM(p_borang_path), '');
    v_ticket public.disposal_tickets;
BEGIN
    IF v_actor IS NULL THEN
        RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
    END IF;

    IF v_path IS NULL THEN
        RAISE EXCEPTION 'Borang CA path is required.' USING ERRCODE = '22023';
    END IF;

    IF public.disposal_file_kind(v_path) <> 'borang_ca'
       OR public.disposal_file_ticket_id(v_path) <> p_ticket_id THEN
        RAISE EXCEPTION 'Borang CA path does not match ticket.' USING ERRCODE = '22023';
    END IF;

    SELECT * INTO v_ticket FROM public.disposal_tickets
    WHERE id = p_ticket_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ticket not found.' USING ERRCODE = 'P0002';
    END IF;

    IF NOT (
        public.current_user_is_asset_staff()
        OR (
            v_ticket.created_by = v_actor
            AND v_ticket.status IN (
                'menunggu_semakan'::public.ticket_status,
                'ditolak'::public.ticket_status
            )
        )
    ) THEN
        RAISE EXCEPTION 'Not allowed to attach Borang CA to this ticket.'
            USING ERRCODE = '42501';
    END IF;

    UPDATE public.disposal_tickets
    SET borang_ca_url = v_path
    WHERE id = p_ticket_id
    RETURNING * INTO v_ticket;

    INSERT INTO public.audit_logs (ticket_id, action, new_value, performed_by)
    VALUES (v_ticket.id, 'borang_ca_dilampirkan', v_path, v_actor);

    RETURN v_ticket;
END;
$$;

-- 8. approve guard: Borang CA required for alat_perubatan ---------------------
CREATE OR REPLACE FUNCTION public.approve_disposal_ticket(p_ticket_id UUID)
RETURNS public.disposal_tickets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_actor UUID := auth.uid();
    v_ticket public.disposal_tickets;
BEGIN
    IF v_actor IS NULL OR NOT public.current_user_is_asset_staff() THEN
        RAISE EXCEPTION 'Only asset staff can approve.' USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_ticket FROM public.disposal_tickets
    WHERE id = p_ticket_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ticket not found.' USING ERRCODE = 'P0002';
    END IF;

    IF v_ticket.status <> 'menunggu_semakan'::public.ticket_status THEN
        RAISE EXCEPTION 'Only tickets awaiting review can be approved.'
            USING ERRCODE = '22023';
    END IF;

    IF v_ticket.sub_category = 'alat_perubatan'::public.asset_sub_category
       AND v_ticket.borang_ca_url IS NULL THEN
        RAISE EXCEPTION 'Borang CA (Laporan Kerosakan Aset) diperlukan sebelum permohonan Alat Perubatan boleh diluluskan.'
            USING ERRCODE = '22023';
    END IF;

    UPDATE public.disposal_tickets
    SET status = 'proses_pelupusan',
        reviewed_by = v_actor,
        reviewed_at = NOW(),
        rejection_reason = NULL
    WHERE id = p_ticket_id
    RETURNING * INTO v_ticket;

    INSERT INTO public.audit_logs (ticket_id, action, old_value, new_value, performed_by)
    VALUES (v_ticket.id, 'semakan_lulus', 'menunggu_semakan', 'proses_pelupusan', v_actor);

    RETURN v_ticket;
END;
$$;

-- 9. Grants -------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.submit_disposal_ticket(
    public.asset_condition, TEXT, public.asset_category, public.asset_sub_category,
    TEXT, TEXT, TEXT, DATE, NUMERIC) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.resubmit_disposal_ticket(
    UUID, public.asset_condition, TEXT, public.asset_category, public.asset_sub_category,
    TEXT, TEXT, TEXT, DATE, NUMERIC) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.attach_disposal_borang_ca(UUID, TEXT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.submit_disposal_ticket(
    public.asset_condition, TEXT, public.asset_category, public.asset_sub_category,
    TEXT, TEXT, TEXT, DATE, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resubmit_disposal_ticket(
    UUID, public.asset_condition, TEXT, public.asset_category, public.asset_sub_category,
    TEXT, TEXT, TEXT, DATE, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.attach_disposal_borang_ca(UUID, TEXT) TO authenticated;
```

> NOTE: `approve_disposal_ticket` above mirrors the existing migration-002 body (verify
> against `supabase/migrations/002_security_boundary.sql:200-258` and copy any helper details
> exactly — only the Borang-CA guard block is new). The companion tracking spec (006) will
> later redefine this function again and must keep this guard.

- [ ] **Step 2: Apply the migration locally and verify**

Run (local dev DB; this re-runs all migrations — local data is reset):
```bash
supabase db reset
```
For the linked cloud project instead, apply the single new file via:
```bash
supabase db push
```
(or paste `005_form_field_changes.sql` into the Supabase SQL Editor).

- [ ] **Step 3: Verify schema in SQL Editor / psql**

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'disposal_tickets'
  AND column_name IN ('asset_name','inventory_id','radicare_asset_no','borang_ca_url','asset_type');
-- Expect: radicare_asset_no, borang_ca_url, asset_type  (NOT asset_name / inventory_id)

SELECT is_nullable FROM information_schema.columns
WHERE table_name='disposal_tickets' AND column_name='asset_type';
-- Expect: NO
```
Expected: asset_name/inventory_id gone; radicare_asset_no/borang_ca_url present; asset_type NOT NULL.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/005_form_field_changes.sql
git commit -m "feat(db): migration 005 — promote asset_type, drop asset_name/inventory_id, add radicare + borang_ca, borang_ca storage kind, approve guard"
```

---

## Task 2: TypeScript types

**Files:**
- Modify: `lib/supabase/types.ts:26-51`

- [ ] **Step 1: Update the `DisposalTicket` interface**

Replace lines 29-30 (`asset_name`, `inventory_id`) and add the two new fields. Final relevant block:

```typescript
export interface DisposalTicket {
  id: string;
  ticket_no: string;
  asset_condition: AssetCondition;
  category: AssetCategory | null;
  sub_category: AssetSubCategory | null;
  serial_no: string | null;
  asset_type: string;            // now required (the asset identity)
  radicare_asset_no: string | null;
  purchase_date: string | null;
  purchase_price: number | null;
  location: string | null;
  status: TicketStatus;
  disposal_method: DisposalMethod | null;
  rejection_reason: string | null;
  image_url: string | null;
  cert_url: string | null;
  borang_ca_url: string | null;
  created_by: string;
  reviewed_by: string | null;
  completed_by: string | null;
  created_at: string;
  reviewed_at: string | null;
  completed_at: string | null;
  updated_at: string;
}
```

- [ ] **Step 2: Run tsc to surface every consumer**

Run: `npx tsc --noEmit` (or `node ./node_modules/typescript/bin/tsc --noEmit` if npx hits the Windows quirk)
Expected: FAIL — errors at the ~16 sites that read `asset_name` / `inventory_id` and the test mocks missing `radicare_asset_no`/`borang_ca_url`. This list drives Tasks 3.

- [ ] **Step 3: Commit (after Task 3 makes tsc clean — do not commit a red tree)**

(Defer commit to end of Task 3.)

---

## Task 3: Repoint display surfaces `asset_name` → `asset_type` + fix test mocks

**Files (modify each where `asset_name` is read; replace with `asset_type`):**
`components/TicketCard.tsx:34`, `components/CertificateGenerator.tsx`, `app/(protected)/semua/page.tsx`, `app/(protected)/semakan/page.tsx`, `lib/dashboard/unit-aset.ts`, `lib/dashboard/types.ts`, `lib/dashboard/pemohon.ts`, `components/dashboards/AttentionTable.tsx`, `components/dashboards/PendingReviewTable.tsx`, `app/(protected)/dashboard/page.tsx`.
**Test mocks (modify):** `components/TicketCard.test.tsx:13-38`, `components/dashboards/AttentionTable.test.tsx`, `lib/dashboard/pemohon.test.ts`.

- [ ] **Step 1: Replace `asset_name` reads with `asset_type` in display code**

Example — `components/TicketCard.tsx:34`:
```tsx
          <span className="truncate">{ticket.asset_type}</span>
```
Apply the equivalent substitution everywhere `ticket.asset_name` / `row.asset_name` / `.asset_name` is read for display. In `lib/dashboard/*.ts`, any `AttentionRow`/`PendingQueueRow` field named `asset_name` should keep its row-field name OR be renamed to `asset_type`; if renamed, update the consuming component + test in lockstep (keep the name consistent across producer, type, component, and test).

- [ ] **Step 2: Fix the test mock objects**

In each `*.test.tsx`/`*.test.ts` mock ticket: remove `asset_name` and `inventory_id`, add `asset_type` (already present in TicketCard mock — keep it), `radicare_asset_no: null`, `borang_ca_url: null`. Example for `components/TicketCard.test.tsx` mock (replace lines 16-17, add the new fields):
```typescript
  // remove: asset_name, inventory_id
  asset_condition: "rosak",
  category: "harta_modal",
  sub_category: "alat_perubatan",
  serial_no: "SN123",
  asset_type: "Kerusi",
  radicare_asset_no: null,
  // ...
  cert_url: null,
  borang_ca_url: null,
```
Also update the assertion `screen.getByText('SM-001')` test if it referenced asset_name (it does not — leave it).

- [ ] **Step 3: Run tsc + vitest to verify green**

Run: `npx tsc --noEmit`
Expected: PASS (0 errors).
Run: `node ./node_modules/vitest/vitest.mjs run`
Expected: PASS (all suites green).

- [ ] **Step 4: Commit**

```bash
git add lib/supabase/types.ts lib components app
git commit -m "refactor: promote asset_type to asset identity (drop asset_name/inventory_id usages), add radicare/borang_ca to types"
```

---

## Task 4: Mohon form — relabels, field add/remove, conditional note, validation

**Files:**
- Modify: `app/(protected)/mohon/page.tsx`

- [ ] **Step 1: Update state declarations (lines 19-28)**

Remove `assetName` (line 19) and `inventoryId` (line 26). Add `radicareAssetNo`:
```tsx
  const [category, setCategory] = useState<AssetCategory>("harta_modal");
  const [subCategory, setSubCategory] = useState<AssetSubCategory>("alat_perubatan");
  const [serialNo, setSerialNo] = useState("");
  const [assetType, setAssetType] = useState("");
  const [radicareAssetNo, setRadicareAssetNo] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [assetCondition, setAssetCondition] = useState<AssetCondition>("rosak");
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
```

- [ ] **Step 2: Update validation (lines 34-37)**

```tsx
    if (!assetType.trim()) {
      toast.error("Sila masukkan jenis/jenama/model aset.");
      return;
    }
```

- [ ] **Step 3: Update the RPC call args (lines 52-66)**

```tsx
      const { data: ticket, error: insertError } = await supabase.rpc(
        "submit_disposal_ticket",
        {
          p_asset_condition: assetCondition,
          p_location: location.trim() || null,
          p_category: category,
          p_sub_category: subCategory,
          p_serial_no: serialNo.trim() || null,
          p_asset_type: assetType.trim(),
          p_radicare_asset_no: radicareAssetNo.trim() || null,
          p_purchase_date: purchaseDate || null,
          p_purchase_price: purchasePrice ? parseFloat(purchasePrice) : null,
        },
      );
```

- [ ] **Step 4: Add the conditional Borang CA note below Sub-Kategori (after line 159)**

```tsx
            {subCategory === "alat_perubatan" && (
              <div className="rounded-md border border-[var(--primary)] bg-[var(--primary-tint)] p-4 space-y-1">
                <p className="text-subhead font-semibold text-[var(--primary)] flex items-center gap-2">
                  <FileText size={16} /> Borang CA (Laporan Kerosakan Aset)
                </p>
                <p className="text-footnote text-[var(--fg-muted)]">
                  Wajib dimuat naik selepas permohonan dihantar, di halaman butiran tiket.
                </p>
              </div>
            )}
```
Add `FileText` to the lucide import on line 5: `import { Send, AlertCircle, Camera, FileText } from "lucide-react";`

- [ ] **Step 5: Relabel "Jenis Aset" and add "No. Aset Radicare" below it (lines 170-186)**

Replace the Jenis Aset input and DELETE the Nama Aset input; add Radicare after Jenis:
```tsx
            {/* Jenis/Jenama/Model Aset */}
            <Input
              label="Jenis/Jenama/Model Aset"
              required
              value={assetType}
              onChange={(e) => setAssetType(e.target.value)}
              placeholder="Cth: Ventilator Dräger Evita V300"
            />

            {/* No. Aset Radicare */}
            <Input
              label="No. Aset Radicare"
              value={radicareAssetNo}
              onChange={(e) => setRadicareAssetNo(e.target.value)}
              placeholder="Cth: RAD-2024-00123"
              helper="Biarkan kosong jika tiada no. aset Radicare."
            />
```
(The former "Nama Aset" `Input` block at lines 179-186 is removed entirely.)

- [ ] **Step 6: Relabel Tarikh + Harga; drop the RM chip (lines 188-216)**

```tsx
            {/* Tarikh Perolehan / Tarikh Diterima */}
            <Input
              label="Tarikh Perolehan / Tarikh Diterima"
              required
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
            />

            {/* Harga Perolehan Asal (RM) */}
            <Input
              label="Harga Perolehan Asal (RM)"
              required
              type="number"
              step="0.01"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              placeholder="0.00"
            />
```
DELETE the entire "No. Inventori" `Input` block (old lines 209-216).

- [ ] **Step 7: Relabel the Foto Aset section heading (line 261)**

```tsx
                Foto Aset (Untuk Dilupuskan)
```

- [ ] **Step 8: Verify build + types**

Run: `npx tsc --noEmit`  → Expected: PASS
Run: `npm run build`      → Expected: build succeeds (route `/mohon` compiles)

- [ ] **Step 9: Commit**

```bash
git add app/(protected)/mohon/page.tsx
git commit -m "feat(mohon): relabel fields, remove Nama Aset + No. Inventori, add No. Aset Radicare + conditional Borang CA note"
```

---

## Task 5: BorangUpload component

**Files:**
- Create: `components/BorangUpload.tsx`

- [ ] **Step 1: Create the component (document upload, no image compression)**

```tsx
"use client";

import { useState, useRef } from "react";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface BorangUploadProps {
  ticketId: string;
  onUploaded: (path: string) => void;
}

const MAX_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED = ["application/pdf", "image/jpeg", "image/png"];

export default function BorangUpload({ ticketId, onUploaded }: BorangUploadProps) {
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED.includes(file.type)) {
      toast.error("Format fail tidak sah. Sila pilih PDF, JPG atau PNG.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Saiz fail terlalu besar. Maksimum 10MB.");
      return;
    }

    setLoading(true);
    try {
      const ext = file.type === "application/pdf" ? "pdf" : file.type === "image/png" ? "png" : "jpg";
      const path = `borang_ca/${ticketId}/borang-ca.${ext}`;

      const { error } = await supabase.storage
        .from("disposal-files")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;

      const { error: attachError } = await supabase.rpc("attach_disposal_borang_ca", {
        p_ticket_id: ticketId,
        p_borang_path: path,
      });
      if (attachError) throw attachError;

      onUploaded(path);
      toast.success("Borang CA berjaya dimuat naik.");
    } catch {
      toast.error("Gagal memuat naik Borang CA.");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className={cn(
          "w-full flex flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed py-8 transition-all active:scale-[0.99]",
          loading
            ? "bg-[var(--muted)] border-[var(--border)] cursor-not-allowed"
            : "bg-[var(--surface)] border-[var(--border)] text-[var(--fg-muted)] hover:border-[var(--primary)] hover:bg-[var(--primary-tint)] hover:text-[var(--primary)]"
        )}
      >
        {loading ? <Loader2 className="h-7 w-7 animate-spin" /> : <FileText className="h-7 w-7" />}
        <span className="text-body font-semibold">
          {loading ? "Sedang memuat naik..." : "Muat Naik Borang CA"}
        </span>
        {!loading && <p className="text-caption opacity-60">Format PDF, JPG atau PNG (Maks 10MB)</p>}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/jpeg,image/png"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`  → Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add components/BorangUpload.tsx
git commit -m "feat: BorangUpload component (PDF/image, borang_ca storage kind, attach RPC)"
```

---

## Task 6: Detail page — Foto relabel + download, Borang CA section + download

**Files:**
- Modify: `app/(protected)/semua/[id]/page.tsx`

- [ ] **Step 1: Add borang state + extend signed-URL fetch (lines 100-131)**

Add state alongside the others:
```tsx
  const [borangUrl, setBorangUrl] = useState<string | null>(null);
```
Extend the `Promise.all` (lines 124-131):
```tsx
      const [photoUrl, certUrl, bUrl] = await Promise.all([
        createSignedDisposalFileUrl(supabase, ticketRow.image_url),
        createSignedDisposalFileUrl(supabase, ticketRow.cert_url),
        createSignedDisposalFileUrl(supabase, ticketRow.borang_ca_url),
      ]);
      setAssetPhotoUrl(photoUrl);
      setCertificateUrl(certUrl);
      setBorangUrl(bUrl);
```
Import `BorangUpload` at the top with the other component imports:
```tsx
import BorangUpload from "@/components/BorangUpload";
```

- [ ] **Step 2: Relabel the Foto display heading + make photo downloadable (lines 262-283)**

In the "Photo Display Section", change the heading text to `Foto Aset (Untuk Dilupuskan)` and wrap the image in a download link, plus add a download button under it:
```tsx
          <div className="mt-8 space-y-3">
            <div className="flex items-center gap-1.5">
              <Camera size={14} className="text-[var(--primary)]" />
              <p className="text-caption font-bold uppercase tracking-wider text-[var(--fg-muted)]">Foto Aset (Untuk Dilupuskan)</p>
            </div>
            <a href={assetPhotoUrl} target="_blank" rel="noopener noreferrer"
               className="relative block w-full aspect-[4/3] rounded-md overflow-hidden border border-[var(--border)] bg-[var(--bg)]">
              <Image src={assetPhotoUrl} alt="Foto aset" fill className="object-cover" unoptimized />
            </a>
            <a href={assetPhotoUrl} target="_blank" rel="noopener noreferrer" className="block">
              <Button variant="secondary" className="w-full gap-2 text-[var(--primary)]">
                <Camera size={16} /> Muat Turun Foto
              </Button>
            </a>
            {/* keep the existing "change photo" PhotoUpload block below for non-selesai */}
          </div>
```
Also relabel the upload-prompt heading at line 256 (`Lampirkan Foto`) to `Lampirkan Foto (Untuk Dilupuskan)`.

- [ ] **Step 3: Add the Borang CA section (conditional on alat_perubatan), after the photo section (~line 283)**

```tsx
        {ticket.sub_category === "alat_perubatan" && (
          <div className="mt-8 space-y-3">
            <div className="flex items-center gap-1.5">
              <FileText size={14} className="text-[var(--primary)]" />
              <p className="text-caption font-bold uppercase tracking-wider text-[var(--fg-muted)]">
                Borang CA (Laporan Kerosakan Aset)
              </p>
            </div>
            {borangUrl ? (
              <a href={borangUrl} target="_blank" rel="noopener noreferrer" className="block">
                <Button variant="secondary" className="w-full gap-2 text-[var(--primary)]">
                  <FileText size={16} /> Muat Turun Borang CA
                </Button>
              </a>
            ) : ticket.status !== "selesai" ? (
              <BorangUpload ticketId={ticket.id} onUploaded={() => loadData()} />
            ) : (
              <p className="text-caption text-[var(--fg-muted)] italic">Borang CA tidak dimuat naik.</p>
            )}
          </div>
        )}
```
Ensure `FileText` is imported from lucide at the top of the file (add if missing).

- [ ] **Step 4: Verify build + types**

Run: `npx tsc --noEmit`  → Expected: PASS
Run: `npm run build`      → Expected: build succeeds

- [ ] **Step 5: Commit**

```bash
git add app/(protected)/semua/[id]/page.tsx
git commit -m "feat(detail): Foto relabel + download, Borang CA upload/download (alat_perubatan), borang signed-url fetch"
```

---

## Task 7: Full verification gate + manual smoke

- [ ] **Step 1: Static gate**

Run: `npx tsc --noEmit`  → Expected: 0 errors
Run: `node ./node_modules/vitest/vitest.mjs run`  → Expected: all suites pass
Run: `npm run build`  → Expected: success

- [ ] **Step 2: Manual smoke (dev server + Supabase with migration 005 applied)**

Run `npm run dev`, log in as a `user`, then:
1. `/mohon`: confirm labels (Jenis/Jenama/Model, Tarikh Perolehan / Tarikh Diterima, Harga Perolehan Asal (RM) with no RM chip, Foto Aset (Untuk Dilupuskan)); No. Aset Radicare present; Nama Aset + No. Inventori gone.
2. Select **Alat Perubatan** → Borang CA note appears below Sub-Kategori; select **Bukan Alat Perubatan** → note disappears.
3. Submit with empty Jenis/Jenama/Model → blocked with toast; fill it → submits, redirects to `/status`.
4. Open the new ticket detail: upload Foto → "Muat Turun Foto" appears + image clickable; for an Alat Perubatan ticket, upload Borang CA → "Muat Turun Borang CA" appears and downloads.
5. As `unit_aset`: try to approve the Alat Perubatan ticket **without** Borang CA → blocked with the Borang CA error; attach Borang CA → approve succeeds.
6. Confirm ticket cards/tables/`/semua`/`/semakan` show the asset by its Jenis/Jenama/Model (asset_type) with no missing-name regressions.

- [ ] **Step 3: Final commit (if any smoke fixes)**

```bash
git add -A
git commit -m "fix(mohon): smoke-test adjustments"
```

---

## Self-Review (completed)

- **Spec coverage:** relabels (T4,T6), remove Nama Aset (T1 drop col + T2/T3 repoint), remove No. Inventori (T1,T4), add Radicare (T1,T2,T4), Borang CA upload+RLS+RPC (T1,T5,T6), approve guard (T1), Foto/Borang downloads (T6), asset_type identity + NOT NULL + backfill (T1,T2,T3). ✓
- **Placeholder scan:** none — all SQL/TSX shown in full.
- **Type consistency:** `radicare_asset_no` / `borang_ca_url` names match across migration, type, RPC args, mocks, detail page. RPC param order in grants matches the CREATE signatures. `asset_type: string` (non-null) consistent with the NOT NULL column.
- **Known dependency:** `approve_disposal_ticket` body must be copied from `002_security_boundary.sql:200-258` with only the guard added (flagged in Task 1).
