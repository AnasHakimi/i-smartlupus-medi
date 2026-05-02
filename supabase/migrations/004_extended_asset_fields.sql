-- ============================================================
-- i-SMARTLUPUS - Extended asset fields for disposal tickets
-- Migration: 004_extended_asset_fields.sql
-- ============================================================

-- 1. Create Enums
CREATE TYPE public.asset_category AS ENUM (
    'harta_modal',
    'aset_bernilai_rendah'
);

CREATE TYPE public.asset_sub_category AS ENUM (
    'alat_perubatan',
    'bukan_alat_perubatan'
);

-- 2. Add columns to disposal_tickets
ALTER TABLE public.disposal_tickets
    ADD COLUMN category public.asset_category,
    ADD COLUMN sub_category public.asset_sub_category,
    ADD COLUMN serial_no TEXT,
    ADD COLUMN asset_type TEXT,
    ADD COLUMN purchase_date DATE,
    ADD COLUMN purchase_price NUMERIC(15, 2);

-- 3. Update submit_disposal_ticket
CREATE OR REPLACE FUNCTION public.submit_disposal_ticket(
    p_asset_name TEXT,
    p_asset_condition public.asset_condition,
    p_inventory_id TEXT DEFAULT NULL,
    p_location TEXT DEFAULT NULL,
    p_category public.asset_category DEFAULT NULL,
    p_sub_category public.asset_sub_category DEFAULT NULL,
    p_serial_no TEXT DEFAULT NULL,
    p_asset_type TEXT DEFAULT NULL,
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
        RAISE EXCEPTION 'Authentication required.'
            USING ERRCODE = '42501';
    END IF;

    IF NULLIF(BTRIM(p_asset_name), '') IS NULL THEN
        RAISE EXCEPTION 'Asset name is required.'
            USING ERRCODE = '22023';
    END IF;

    INSERT INTO public.disposal_tickets (
        asset_name,
        inventory_id,
        asset_condition,
        location,
        category,
        sub_category,
        serial_no,
        asset_type,
        purchase_date,
        purchase_price,
        created_by
    )
    VALUES (
        BTRIM(p_asset_name),
        NULLIF(BTRIM(p_inventory_id), ''),
        p_asset_condition,
        NULLIF(BTRIM(p_location), ''),
        p_category,
        p_sub_category,
        NULLIF(BTRIM(p_serial_no), ''),
        NULLIF(BTRIM(p_asset_type), ''),
        p_purchase_date,
        p_purchase_price,
        v_actor
    )
    RETURNING * INTO v_ticket;

    INSERT INTO public.audit_logs (
        ticket_id,
        action,
        new_value,
        performed_by
    )
    VALUES (
        v_ticket.id,
        'permohonan_dibuat',
        'menunggu_semakan',
        v_actor
    );

    RETURN v_ticket;
END;
$$;

-- 4. Update resubmit_disposal_ticket
CREATE OR REPLACE FUNCTION public.resubmit_disposal_ticket(
    p_ticket_id UUID,
    p_asset_name TEXT,
    p_asset_condition public.asset_condition,
    p_inventory_id TEXT DEFAULT NULL,
    p_location TEXT DEFAULT NULL,
    p_category public.asset_category DEFAULT NULL,
    p_sub_category public.asset_sub_category DEFAULT NULL,
    p_serial_no TEXT DEFAULT NULL,
    p_asset_type TEXT DEFAULT NULL,
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
        RAISE EXCEPTION 'Authentication required.'
            USING ERRCODE = '42501';
    END IF;

    IF NULLIF(BTRIM(p_asset_name), '') IS NULL THEN
        RAISE EXCEPTION 'Asset name is required.'
            USING ERRCODE = '22023';
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

    IF v_ticket.created_by <> v_actor THEN
        RAISE EXCEPTION 'Only the ticket creator can resubmit this ticket.'
            USING ERRCODE = '42501';
    END IF;

    IF v_ticket.status <> 'ditolak'::public.ticket_status THEN
        RAISE EXCEPTION 'Only rejected tickets can be resubmitted.'
            USING ERRCODE = '22023';
    END IF;

    UPDATE public.disposal_tickets
    SET asset_name = BTRIM(p_asset_name),
        inventory_id = NULLIF(BTRIM(p_inventory_id), ''),
        asset_condition = p_asset_condition,
        location = NULLIF(BTRIM(p_location), ''),
        category = p_category,
        sub_category = p_sub_category,
        serial_no = NULLIF(BTRIM(p_serial_no), ''),
        asset_type = NULLIF(BTRIM(p_asset_type), ''),
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

    INSERT INTO public.audit_logs (
        ticket_id,
        action,
        old_value,
        new_value,
        performed_by
    )
    VALUES (
        v_ticket.id,
        'permohonan_dihantar_semula',
        'ditolak',
        'menunggu_semakan',
        v_actor
    );

    RETURN v_ticket;
END;
$$;

-- 5. Re-grant permissions
REVOKE ALL ON FUNCTION public.submit_disposal_ticket(TEXT, public.asset_condition, TEXT, TEXT, public.asset_category, public.asset_sub_category, TEXT, TEXT, DATE, NUMERIC) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.resubmit_disposal_ticket(UUID, TEXT, public.asset_condition, TEXT, TEXT, public.asset_category, public.asset_sub_category, TEXT, TEXT, DATE, NUMERIC) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.submit_disposal_ticket(TEXT, public.asset_condition, TEXT, TEXT, public.asset_category, public.asset_sub_category, TEXT, TEXT, DATE, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resubmit_disposal_ticket(UUID, TEXT, public.asset_condition, TEXT, TEXT, public.asset_category, public.asset_sub_category, TEXT, TEXT, DATE, NUMERIC) TO authenticated;
