-- Seed practitioners for testing
-- IMPORTANT: This seeder assumes users already exist in auth.users
-- To create practitioners:
-- 1. First create users via Supabase Auth UI or signup flow
-- 2. Then run this migration to create practitioner profiles
-- 
-- OR use the helper function below with existing user emails

-- Helper function to create practitioner profile from existing user email
CREATE OR REPLACE FUNCTION create_practitioner_from_email(
  p_email TEXT,
  p_name TEXT,
  p_bio TEXT DEFAULT NULL,
  p_specialization TEXT DEFAULT NULL,
  p_half_hour_rate NUMERIC DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id UUID;
  v_practitioner_id UUID;
BEGIN
  -- Find user by email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % does not exist. Please create the user first via Supabase Auth.', p_email;
  END IF;

  -- Check if practitioner profile already exists
  SELECT id INTO v_practitioner_id
  FROM public.practitioners
  WHERE user_id = v_user_id;

  IF v_practitioner_id IS NOT NULL THEN
    RAISE NOTICE 'Practitioner profile already exists for user %', p_email;
    RETURN v_practitioner_id;
  END IF;

  -- Assign practitioner role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'practitioner'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Create practitioner profile
  INSERT INTO public.practitioners (
    user_id,
    name,
    bio,
    specialization,
    half_hour_rate,
    avatar_url,
    available
  ) VALUES (
    v_user_id,
    p_name,
    p_bio,
    p_specialization,
    p_half_hour_rate,
    p_avatar_url,
    true
  ) RETURNING id INTO v_practitioner_id;

  RETURN v_practitioner_id;
END;
$$;

-- Seed practitioners (only if users exist)
-- Replace emails with actual user emails from your auth.users table
-- Or create users first, then run this
DO $$
DECLARE
  v_practitioner_id UUID;
BEGIN
  -- Practitioner 1: Sarah Chen - Meditation & Mindfulness
  -- Replace 'practitioner1@sadhu.com' with an existing user email
  BEGIN
    v_practitioner_id := create_practitioner_from_email(
      'practitioner1@sadhu.com',
      'Sarah Chen',
      'With over 10 years of experience in meditation and mindfulness practices, I specialize in helping clients find inner peace and manage stress through traditional and modern techniques.',
      'Meditation & Mindfulness',
      75.00,
      NULL
    );
    RAISE NOTICE 'Created practitioner: Sarah Chen';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipped Sarah Chen: %', SQLERRM;
  END;

  -- Practitioner 2: Michael Thompson - Breathwork & Yoga
  BEGIN
    v_practitioner_id := create_practitioner_from_email(
      'practitioner2@sadhu.com',
      'Michael Thompson',
      'Certified yoga instructor and breathwork specialist. I combine ancient wisdom with contemporary approaches to help you achieve physical and mental balance.',
      'Breathwork & Yoga',
      80.00,
      NULL
    );
    RAISE NOTICE 'Created practitioner: Michael Thompson';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipped Michael Thompson: %', SQLERRM;
  END;

  -- Practitioner 3: Emma Rodriguez - Pain Management & Bodywork
  BEGIN
    v_practitioner_id := create_practitioner_from_email(
      'practitioner3@sadhu.com',
      'Emma Rodriguez',
      'Specialized in pain management and therapeutic bodywork. I guide clients through practices that help them understand and work with physical discomfort in transformative ways.',
      'Pain Management & Bodywork',
      85.00,
      NULL
    );
    RAISE NOTICE 'Created practitioner: Emma Rodriguez';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipped Emma Rodriguez: %', SQLERRM;
  END;

  -- Practitioner 4: James Wilson - Traditional Sadhu Practices
  BEGIN
    v_practitioner_id := create_practitioner_from_email(
      'practitioner4@sadhu.com',
      'James Wilson',
      'Trained in traditional Sadhu meditation practices. I offer authentic guidance for those seeking to deepen their practice and connect with ancient wisdom traditions.',
      'Traditional Sadhu Practices',
      70.00,
      NULL
    );
    RAISE NOTICE 'Created practitioner: James Wilson';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipped James Wilson: %', SQLERRM;
  END;

  -- Practitioner 5: Lisa Park - Stress Reduction & Wellness
  BEGIN
    v_practitioner_id := create_practitioner_from_email(
      'practitioner5@sadhu.com',
      'Lisa Park',
      'Wellness coach focusing on stress reduction and holistic health. I help clients integrate meditation practices into their daily lives for lasting transformation.',
      'Stress Reduction & Wellness',
      65.00,
      NULL
    );
    RAISE NOTICE 'Created practitioner: Lisa Park';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipped Lisa Park: %', SQLERRM;
  END;

END $$;

-- Add some availability for practitioners (Monday-Friday, 9 AM - 5 PM)
INSERT INTO public.practitioner_availability (practitioner_id, day_of_week, start_time, end_time)
SELECT 
  p.id,
  day,
  '09:00'::time,
  '17:00'::time
FROM public.practitioners p
CROSS JOIN generate_series(1, 5) AS day -- Monday (1) to Friday (5)
WHERE p.available = true
ON CONFLICT (practitioner_id, day_of_week, start_time) DO NOTHING;

-- Clean up function (optional - you can keep it for future use)
-- DROP FUNCTION IF EXISTS create_test_practitioner(TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT);

