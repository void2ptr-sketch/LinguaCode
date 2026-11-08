-- ============================================
-- LinguaCode: Full Data Import from public/data/
-- ============================================
-- Порядок: users → courses → programs → lessons → scenarios → cards
-- ============================================

-- ──────────────────────────────────────────────
-- 1. SYSTEM USER (author for all seed data)
-- ──────────────────────────────────────────────

DO $$
DECLARE
    v_system_user_id UUID;
    v_password_hash TEXT := '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
BEGIN
    -- Insert or get system user
    INSERT INTO data.users (id, display_name, email, password_hash, preferences)
    VALUES (
        md5('linguacode-system-user')::uuid,
        'System',
        'system@linguacode.local',
        v_password_hash,
        '{}'::jsonb
    )
    ON CONFLICT (email) DO UPDATE
    SET password_hash = EXCLUDED.password_hash;

    SELECT id INTO v_system_user_id FROM data.users WHERE email = 'system@linguacode.local';
    RAISE NOTICE 'System user ID: %', v_system_user_id;
END $$;

-- ──────────────────────────────────────────────
-- 2. HELPER FUNCTION: string_id → UUID
-- ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION string_to_uuid(text_id TEXT)
RETURNS UUID AS $$
BEGIN
    -- Use md5 hash to create deterministic UUID
    RETURN md5(text_id)::uuid;
END;
$$ LANGUAGE plpgsql;

-- ──────────────────────────────────────────────
-- 3. CLEAR EXISTING DATA (safe: cascade)
-- ──────────────────────────────────────────────

-- Note: We keep users (system + student)
TRUNCATE data.cards, data.scenarios, data.lessons, data.programs, data.courses RESTART IDENTITY CASCADE;

-- ──────────────────────────────────────────────
-- 4. IMPORT COURSES + PROGRAMS + LESSONS
-- ──────────────────────────────────────────────

-- This section will be populated by the Node.js script
-- See scripts/import-courses.sql generated output
