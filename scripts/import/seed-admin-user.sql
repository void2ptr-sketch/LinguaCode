-- ============================================
-- Seed: Create admin user
-- ============================================
-- Email: admin@linguacode.local
-- Password: password
-- ============================================

-- Check if admin user exists, create if not
DO $$
DECLARE
    v_user_id UUID;
    v_password_hash TEXT := '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
BEGIN
    -- Insert admin user (if doesn't exist)
    INSERT INTO data.users (id, display_name, email, password_hash, preferences, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'Администратор',
        'admin@linguacode.local',
        v_password_hash,
        '{}'::jsonb,
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO NOTHING
    RETURNING id INTO v_user_id;

    -- If user already exists, get its ID
    IF v_user_id IS NULL THEN
        SELECT id INTO v_user_id FROM data.users WHERE email = 'admin@linguacode.local';
    END IF;

    RAISE NOTICE 'Admin user ID: %', v_user_id;
END $$;
