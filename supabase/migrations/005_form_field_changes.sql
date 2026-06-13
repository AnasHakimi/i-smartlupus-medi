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
CREATE OR REPLACE FUNCTION public.approve_disposal_ticket(
    p_ticket_id UUID
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
    IF v_actor IS NULL OR NOT public.current_user_is_asset_staff() THEN
        RAISE EXCEPTION 'Only asset staff can approve tickets.'
            USING ERRCODE = '42501';
    END IF;

    SELECT *
    INTO v_ticket
    FROM public.disposal_tickets
    WHERE id = p_ticket_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ticket not found.'
            USING ERRCODE = 'P0002';
    END IF;

    IF v_ticket.status <> 'menunggu_semakan'::public.ticket_status THEN
        RAISE EXCEPTION 'Ticket is not awaiting review.'
            USING ERRCODE = '22023';
    END IF;

    IF v_ticket.sub_category = 'alat_perubatan'::public.asset_sub_category
       AND v_ticket.borang_ca_url IS NULL THEN
        RAISE EXCEPTION 'Borang CA (Laporan Kerosakan Aset) diperlukan sebelum permohonan Alat Perubatan boleh diluluskan.'
            USING ERRCODE = '22023';
    END IF;

    UPDATE public.disposal_tickets
    SET status = 'proses_pelupusan',
        rejection_reason = NULL,
        reviewed_by = v_actor,
        reviewed_at = NOW()
    WHERE id = p_ticket_id
    RETURNING * INTO v_ticket;

    INSERT INTO public.audit_logs (
        ticket_id,
        action,
        old_value,
        new_value,
        performed_by
    )
    VALUES (
        v_ticket.id,
        'semakan_lulus',
        'menunggu_semakan',
        'proses_pelupusan',
        v_actor
    );

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
