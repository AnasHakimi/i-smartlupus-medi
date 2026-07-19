-- ============================================================
-- i-SMARTLUPUS - Email login migration
-- Migration: 006_email_login_drop_ic.sql
--   * email becomes the login identity (real email, not synthetic {ic}@ic.local)
--   * drop ic_number entirely (PDPA data minimization — IC is sensitive PII,
--     not used on any disposal certificate/form)
--   * rewrite the profile-immutability trigger to protect email instead of ic_number
-- ============================================================

-- 1. Add email column (populated at registration; nullable for existing rows,
--    but all data is wiped post-migration so this starts clean).
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Rewrite the immutability trigger to drop the ic_number reference.
--    email replaces ic_number as the admin-only protected identity field.
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
        OR NEW.email IS DISTINCT FROM OLD.email
        OR NEW.created_at IS DISTINCT FROM OLD.created_at
    ) AND NOT public.current_user_is_admin() THEN
        RAISE EXCEPTION 'Only admins can change protected profile fields.'
            USING ERRCODE = '42501';
    END IF;

    RETURN NEW;
END;
$$;

-- 3. Drop ic_number (also drops its UNIQUE index from 001_initial_schema).
ALTER TABLE public.profiles DROP COLUMN IF EXISTS ic_number;
