-- ============================================================
-- i-SMARTLUPUS MEDI — Initial Database Schema
-- Migration: 001_initial_schema.sql
-- ============================================================

-- ------------------------------------------------------------
-- EXTENSIONS
-- ------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------
-- CUSTOM TYPES
-- ------------------------------------------------------------
CREATE TYPE user_role AS ENUM ('user', 'unit_aset', 'admin');
CREATE TYPE asset_condition AS ENUM ('rosak', 'usang');
CREATE TYPE ticket_status AS ENUM (
    'menunggu_semakan',
    'proses_pelupusan',
    'selesai',
    'ditolak'
);
CREATE TYPE disposal_method AS ENUM (
    'jualan',
    'lelong',
    'musnah',
    'serah_agensi'
);

-- ------------------------------------------------------------
-- TABLE: profiles
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
    id          UUID        PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    ic_number   TEXT        UNIQUE,
    full_name   TEXT        NOT NULL,
    role        user_role   NOT NULL DEFAULT 'user',
    unit_name   TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- TABLE: ticket_counter
-- Used to generate sequential ticket numbers per year.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ticket_counter (
    year        INT     PRIMARY KEY,
    last_seq    INT     NOT NULL DEFAULT 0
);

-- ------------------------------------------------------------
-- TABLE: disposal_tickets
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS disposal_tickets (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_no           TEXT            UNIQUE,
    asset_name          TEXT            NOT NULL,
    inventory_id        TEXT,
    asset_condition     asset_condition NOT NULL,
    location            TEXT,
    status              ticket_status   NOT NULL DEFAULT 'menunggu_semakan',
    disposal_method     disposal_method,
    rejection_reason    TEXT,
    image_url           TEXT,
    cert_url            TEXT,
    created_by          UUID            NOT NULL REFERENCES profiles (id) ON DELETE RESTRICT,
    reviewed_by         UUID            REFERENCES profiles (id) ON DELETE SET NULL,
    completed_by        UUID            REFERENCES profiles (id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    reviewed_at         TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

ALTER TABLE disposal_tickets ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- TABLE: audit_logs  (IMMUTABLE — no UPDATE or DELETE allowed)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id       UUID        NOT NULL REFERENCES disposal_tickets (id) ON DELETE CASCADE,
    action          TEXT        NOT NULL,
    old_value       TEXT,
    new_value       TEXT        NOT NULL,
    performed_by    UUID        NOT NULL REFERENCES profiles (id) ON DELETE RESTRICT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- ------------------------------------------------------------
-- update_updated_at() — keeps disposal_tickets.updated_at fresh
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_disposal_tickets_updated_at
    BEFORE UPDATE ON disposal_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ------------------------------------------------------------
-- generate_ticket_no() — concurrent-safe sequential ticket
-- number using UPSERT on ticket_counter.
-- Returns format: LPS/YYYY/NNN  (e.g. LPS/2026/001)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_ticket_no()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_year  INT;
    v_seq   INT;
BEGIN
    v_year := EXTRACT(YEAR FROM NOW())::INT;

    INSERT INTO ticket_counter (year, last_seq)
    VALUES (v_year, 1)
    ON CONFLICT (year)
    DO UPDATE SET last_seq = ticket_counter.last_seq + 1
    RETURNING last_seq INTO v_seq;

    RETURN 'LPS/' || v_year::TEXT || '/' || LPAD(v_seq::TEXT, 3, '0');
END;
$$;

-- ------------------------------------------------------------
-- set_ticket_no() — BEFORE INSERT trigger on disposal_tickets
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_ticket_no()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.ticket_no IS NULL THEN
        NEW.ticket_no := generate_ticket_no();
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_disposal_tickets_ticket_no
    BEFORE INSERT ON disposal_tickets
    FOR EACH ROW
    EXECUTE FUNCTION set_ticket_no();

-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================

-- ------------------------------------------------------------
-- profiles RLS
-- ------------------------------------------------------------

-- Users can read their own profile
CREATE POLICY "profiles_select_own"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

-- Admin can read all profiles
CREATE POLICY "profiles_select_admin"
    ON profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- Admin can insert profiles
CREATE POLICY "profiles_insert_admin"
    ON profiles FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- Users can update their own profile
CREATE POLICY "profiles_update_own"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Admin can update all profiles
CREATE POLICY "profiles_update_admin"
    ON profiles FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- ------------------------------------------------------------
-- disposal_tickets RLS
-- ------------------------------------------------------------

-- Regular users can read tickets they created
CREATE POLICY "tickets_select_own"
    ON disposal_tickets FOR SELECT
    USING (created_by = auth.uid());

-- unit_aset and admin can read all tickets
CREATE POLICY "tickets_select_staff"
    ON disposal_tickets FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role IN ('unit_aset', 'admin')
        )
    );

-- Regular users can insert tickets for themselves
CREATE POLICY "tickets_insert_own"
    ON disposal_tickets FOR INSERT
    WITH CHECK (created_by = auth.uid());

-- Regular users can update only their own tickets that have been rejected
CREATE POLICY "tickets_update_own_rejected"
    ON disposal_tickets FOR UPDATE
    USING (
        created_by = auth.uid()
        AND status = 'ditolak'
    )
    WITH CHECK (
        created_by = auth.uid()
    );

-- unit_aset and admin can update any ticket
CREATE POLICY "tickets_update_staff"
    ON disposal_tickets FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role IN ('unit_aset', 'admin')
        )
    );

-- ------------------------------------------------------------
-- audit_logs RLS  (IMMUTABLE — no UPDATE or DELETE policies)
-- ------------------------------------------------------------

-- Readable by anyone who can read the associated ticket
CREATE POLICY "audit_logs_select"
    ON audit_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM disposal_tickets t
            WHERE t.id = audit_logs.ticket_id
              AND (
                  t.created_by = auth.uid()
                  OR EXISTS (
                      SELECT 1 FROM profiles p
                      WHERE p.id = auth.uid() AND p.role IN ('unit_aset', 'admin')
                  )
              )
        )
    );

-- Authenticated users can insert their own audit entries
CREATE POLICY "audit_logs_insert"
    ON audit_logs FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND performed_by = auth.uid()
    );

-- NOTE: No UPDATE or DELETE policies are defined for audit_logs
-- to enforce immutability at the RLS layer.

-- ============================================================
-- STORAGE: disposal-files (private bucket)
-- ============================================================

-- Create the private storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('disposal-files', 'disposal-files', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users can upload files to the bucket
CREATE POLICY "storage_upload_authenticated"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'disposal-files'
        AND auth.uid() IS NOT NULL
    );

-- Authenticated users can read files from the bucket
CREATE POLICY "storage_read_authenticated"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'disposal-files'
        AND auth.uid() IS NOT NULL
    );
