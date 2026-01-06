-- Cleanup script to remove all sessions for a specific user
-- This will:
-- 1. Find the user by email (update the email below)
-- 2. Delete all their individual booking records
-- 3. Reset current_participants on master group classes they booked

-- IMPORTANT: Update the email address below to match the user's email
DO $$
DECLARE
  target_user_id UUID;
  deleted_count INTEGER;
  reset_count INTEGER;
BEGIN
  -- Find user by email (update this email address)
  -- For "manish saraswat", update the email below
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email ILIKE '%manish%' OR email ILIKE '%saraswat%'
  LIMIT 1;

  IF target_user_id IS NULL THEN
    RAISE NOTICE 'User not found. Please update the email in the script.';
    RETURN;
  END IF;

  RAISE NOTICE 'Found user_id: %', target_user_id;

  -- First, find all master group classes that have individual bookings from this user
  -- and decrement their current_participants count
  WITH user_bookings AS (
    SELECT 
      CASE 
        WHEN notes LIKE 'Joined group class: %' THEN
          SUBSTRING(notes FROM 'Joined group class: ([a-f0-9-]+)')
        ELSE NULL
      END as master_class_id
    FROM session_schedules
    WHERE client_id = target_user_id
      AND notes LIKE 'Joined group class: %'
  )
  UPDATE session_schedules
  SET current_participants = GREATEST(0, (current_participants - 1))
  WHERE id IN (
    SELECT DISTINCT master_class_id::UUID
    FROM user_bookings
    WHERE master_class_id IS NOT NULL
  )
  AND max_participants > 1
  AND (notes IS NULL OR notes NOT LIKE 'Joined group class%');

  GET DIAGNOSTICS reset_count = ROW_COUNT;
  RAISE NOTICE 'Reset participant count on % master group classes', reset_count;

  -- Delete all sessions where this user is the client
  DELETE FROM session_schedules
  WHERE client_id = target_user_id;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % sessions for user', deleted_count;

  RAISE NOTICE 'Cleanup complete!';
END $$;

