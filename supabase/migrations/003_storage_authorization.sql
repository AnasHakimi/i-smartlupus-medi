-- ============================================================
-- i-SMARTLUPUS - Disposal file storage authorization
-- Migration: 003_storage_authorization.sql
-- ============================================================

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

    IF v_parts[1] NOT IN ('photos', 'certificates') THEN
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

    IF v_parts[1] NOT IN ('photos', 'certificates') THEN
        RETURN NULL;
    END IF;

    RETURN v_parts[1];
END;
$$;

CREATE OR REPLACE FUNCTION public.can_access_disposal_file(p_name TEXT)
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
              t.created_by = auth.uid()
              OR public.current_user_is_asset_staff()
          )
    );
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
                  public.disposal_file_kind(p_name) = 'photos'
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

DROP POLICY IF EXISTS "storage_upload_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "storage_read_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "storage_disposal_files_select_authorized" ON storage.objects;
DROP POLICY IF EXISTS "storage_disposal_files_insert_authorized" ON storage.objects;
DROP POLICY IF EXISTS "storage_disposal_files_update_authorized" ON storage.objects;

CREATE POLICY "storage_disposal_files_select_authorized"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'disposal-files'
        AND public.can_access_disposal_file(name)
    );

CREATE POLICY "storage_disposal_files_insert_authorized"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'disposal-files'
        AND public.can_write_disposal_file(name)
    );

CREATE POLICY "storage_disposal_files_update_authorized"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'disposal-files'
        AND public.can_write_disposal_file(name)
    )
    WITH CHECK (
        bucket_id = 'disposal-files'
        AND public.can_write_disposal_file(name)
    );

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
        RAISE EXCEPTION 'Certificate path is required.'
            USING ERRCODE = '22023';
    END IF;

    IF public.disposal_file_kind(v_cert_url) <> 'certificates'
       OR public.disposal_file_ticket_id(v_cert_url) <> p_ticket_id THEN
        RAISE EXCEPTION 'Certificate path does not match ticket.'
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

CREATE OR REPLACE FUNCTION public.attach_disposal_photo(
    p_ticket_id UUID,
    p_image_path TEXT
)
RETURNS public.disposal_tickets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_actor UUID := auth.uid();
    v_image_path TEXT := NULLIF(BTRIM(p_image_path), '');
    v_ticket public.disposal_tickets;
BEGIN
    IF v_actor IS NULL THEN
        RAISE EXCEPTION 'Authentication required.'
            USING ERRCODE = '42501';
    END IF;

    IF v_image_path IS NULL THEN
        RAISE EXCEPTION 'Image path is required.'
            USING ERRCODE = '22023';
    END IF;

    IF public.disposal_file_kind(v_image_path) <> 'photos'
       OR public.disposal_file_ticket_id(v_image_path) <> p_ticket_id THEN
        RAISE EXCEPTION 'Image path does not match ticket.'
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
        RAISE EXCEPTION 'Not allowed to attach a photo to this ticket.'
            USING ERRCODE = '42501';
    END IF;

    UPDATE public.disposal_tickets
    SET image_url = v_image_path
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
        'foto_aset_dilampirkan',
        v_image_path,
        v_actor
    );

    RETURN v_ticket;
END;
$$;

REVOKE ALL ON FUNCTION public.attach_disposal_certificate(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.attach_disposal_photo(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.attach_disposal_certificate(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.attach_disposal_photo(UUID, TEXT) TO authenticated;
