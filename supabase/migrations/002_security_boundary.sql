-- ============================================================
-- i-SMARTLUPUS - Security boundary hardening
-- Migration: 002_security_boundary.sql
-- ============================================================

-- ------------------------------------------------------------
-- Helper functions for RLS policies and triggers.
-- SECURITY DEFINER avoids recursive profile-policy lookups.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'admin'
    );
$$;

CREATE OR REPLACE FUNCTION public.current_user_is_asset_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND role IN ('unit_aset', 'admin')
    );
$$;

-- ------------------------------------------------------------
-- Profiles: prevent self-promotion and identity changes.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_profile_immutable_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF COALESCE(auth.role(), '') = 'service_role' THEN
        RETURN NEW;
    END IF;

    IF NEW.id IS DISTINCT FROM OLD.id THEN
        RAISE EXCEPTION 'Profile id cannot be changed.'
            USING ERRCODE = '42501';
    END IF;

    IF (
        NEW.role IS DISTINCT FROM OLD.role
        OR NEW.ic_number IS DISTINCT FROM OLD.ic_number
        OR NEW.created_at IS DISTINCT FROM OLD.created_at
    ) AND NOT public.current_user_is_admin() THEN
        RAISE EXCEPTION 'Only admins can change protected profile fields.'
            USING ERRCODE = '42501';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_immutable_fields ON public.profiles;
CREATE TRIGGER trg_profiles_immutable_fields
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_profile_immutable_fields();

DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;

CREATE POLICY "profiles_select_admin"
    ON public.profiles FOR SELECT
    USING (public.current_user_is_admin());

CREATE POLICY "profiles_insert_admin"
    ON public.profiles FOR INSERT
    WITH CHECK (public.current_user_is_admin());

CREATE POLICY "profiles_update_own"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_admin"
    ON public.profiles FOR UPDATE
    USING (public.current_user_is_admin());

-- ------------------------------------------------------------
-- Ticket counter must not be exposed directly through the API.
-- ------------------------------------------------------------
ALTER TABLE public.ticket_counter ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ticket_counter FROM anon, authenticated;

-- ------------------------------------------------------------
-- Ticket and audit policies: reads remain role-aware, writes move
-- to audited SECURITY DEFINER functions below.
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "tickets_insert_own" ON public.disposal_tickets;
DROP POLICY IF EXISTS "tickets_select_staff" ON public.disposal_tickets;
DROP POLICY IF EXISTS "tickets_update_own_rejected" ON public.disposal_tickets;
DROP POLICY IF EXISTS "tickets_update_staff" ON public.disposal_tickets;

CREATE POLICY "tickets_select_staff"
    ON public.disposal_tickets FOR SELECT
    USING (public.current_user_is_asset_staff());

DROP POLICY IF EXISTS "audit_logs_select" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert" ON public.audit_logs;

CREATE POLICY "audit_logs_select"
    ON public.audit_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.disposal_tickets t
            WHERE t.id = audit_logs.ticket_id
              AND (
                  t.created_by = auth.uid()
                  OR public.current_user_is_asset_staff()
              )
        )
    );

REVOKE INSERT, UPDATE, DELETE ON public.disposal_tickets FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.audit_logs FROM anon, authenticated;

-- ------------------------------------------------------------
-- Authoritative workflow functions.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_disposal_ticket(
    p_asset_name TEXT,
    p_asset_condition public.asset_condition,
    p_inventory_id TEXT DEFAULT NULL,
    p_location TEXT DEFAULT NULL
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
        created_by
    )
    VALUES (
        BTRIM(p_asset_name),
        NULLIF(BTRIM(p_inventory_id), ''),
        p_asset_condition,
        NULLIF(BTRIM(p_location), ''),
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

CREATE OR REPLACE FUNCTION public.reject_disposal_ticket(
    p_ticket_id UUID,
    p_rejection_reason TEXT
)
RETURNS public.disposal_tickets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_actor UUID := auth.uid();
    v_reason TEXT := NULLIF(BTRIM(p_rejection_reason), '');
    v_ticket public.disposal_tickets;
BEGIN
    IF v_actor IS NULL OR NOT public.current_user_is_asset_staff() THEN
        RAISE EXCEPTION 'Only asset staff can reject tickets.'
            USING ERRCODE = '42501';
    END IF;

    IF v_reason IS NULL THEN
        RAISE EXCEPTION 'Rejection reason is required.'
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

    IF v_ticket.status <> 'menunggu_semakan'::public.ticket_status THEN
        RAISE EXCEPTION 'Ticket is not awaiting review.'
            USING ERRCODE = '22023';
    END IF;

    UPDATE public.disposal_tickets
    SET status = 'ditolak',
        rejection_reason = v_reason,
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
        'semakan_ditolak',
        'menunggu_semakan',
        'ditolak',
        v_actor
    );

    RETURN v_ticket;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_disposal_ticket(
    p_ticket_id UUID,
    p_disposal_method public.disposal_method
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
        RAISE EXCEPTION 'Only asset staff can complete tickets.'
            USING ERRCODE = '42501';
    END IF;

    IF p_disposal_method IS NULL THEN
        RAISE EXCEPTION 'Disposal method is required.'
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

    IF v_ticket.status <> 'proses_pelupusan'::public.ticket_status THEN
        RAISE EXCEPTION 'Ticket is not in disposal process.'
            USING ERRCODE = '22023';
    END IF;

    UPDATE public.disposal_tickets
    SET status = 'selesai',
        disposal_method = p_disposal_method,
        completed_by = v_actor,
        completed_at = NOW()
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
        'pelupusan_selesai',
        'proses_pelupusan',
        'selesai',
        v_actor
    );

    RETURN v_ticket;
END;
$$;

CREATE OR REPLACE FUNCTION public.resubmit_disposal_ticket(
    p_ticket_id UUID,
    p_asset_name TEXT,
    p_asset_condition public.asset_condition,
    p_inventory_id TEXT DEFAULT NULL,
    p_location TEXT DEFAULT NULL
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

CREATE OR REPLACE FUNCTION public.attach_disposal_certificate(
    p_ticket_id UUID,
    p_cert_url TEXT
)
RETURNS public.disposal_tickets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_actor UUID := auth.uid();
    v_cert_url TEXT := NULLIF(BTRIM(p_cert_url), '');
    v_ticket public.disposal_tickets;
BEGIN
    IF v_actor IS NULL OR NOT public.current_user_is_asset_staff() THEN
        RAISE EXCEPTION 'Only asset staff can attach certificates.'
            USING ERRCODE = '42501';
    END IF;

    IF v_cert_url IS NULL THEN
        RAISE EXCEPTION 'Certificate URL is required.'
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

    IF v_ticket.status <> 'selesai'::public.ticket_status THEN
        RAISE EXCEPTION 'Only completed tickets can receive certificates.'
            USING ERRCODE = '22023';
    END IF;

    UPDATE public.disposal_tickets
    SET cert_url = v_cert_url
    WHERE id = p_ticket_id
    RETURNING * INTO v_ticket;

    INSERT INTO public.audit_logs (
        ticket_id,
        action,
        new_value,
        performed_by
    )
    VALUES (
        v_ticket.id,
        'sijil_dijana',
        v_cert_url,
        v_actor
    );

    RETURN v_ticket;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_disposal_ticket(TEXT, public.asset_condition, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.approve_disposal_ticket(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reject_disposal_ticket(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.complete_disposal_ticket(UUID, public.disposal_method) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.resubmit_disposal_ticket(UUID, TEXT, public.asset_condition, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.attach_disposal_certificate(UUID, TEXT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.submit_disposal_ticket(TEXT, public.asset_condition, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_disposal_ticket(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_disposal_ticket(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_disposal_ticket(UUID, public.disposal_method) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resubmit_disposal_ticket(UUID, TEXT, public.asset_condition, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.attach_disposal_certificate(UUID, TEXT) TO authenticated;
