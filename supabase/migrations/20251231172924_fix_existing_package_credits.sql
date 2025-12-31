-- Fix existing package credits to use their package's session_type_id
-- This migration updates credits that were created before the webhook fix
-- Only updates credits where the package has a specific session_type_id

-- First, let's see what we're working with
DO $$
DECLARE
  credit_record RECORD;
  package_record RECORD;
  updated_count INTEGER := 0;
BEGIN
  -- Loop through all credits with package_id but no session_type_id
  FOR credit_record IN 
    SELECT id, package_id, user_id, credits_remaining
    FROM public.user_session_credits
    WHERE package_id IS NOT NULL
      AND session_type_id IS NULL
      AND credits_remaining > 0
  LOOP
    -- Get the package details
    SELECT id, name, session_type_id INTO package_record
    FROM public.session_packages
    WHERE id = credit_record.package_id;
    
    -- If package exists and has a session_type_id, update the credit
    IF package_record.id IS NOT NULL AND package_record.session_type_id IS NOT NULL THEN
      UPDATE public.user_session_credits
      SET 
        session_type_id = package_record.session_type_id,
        updated_at = now()
      WHERE id = credit_record.id;
      
      updated_count := updated_count + 1;
      
      RAISE NOTICE 'Updated credit % for package % (session_type_id: %)', 
        credit_record.id, 
        package_record.name, 
        package_record.session_type_id;
    ELSE
      RAISE NOTICE 'Skipping credit % - package % has no session_type_id (generic package)', 
        credit_record.id, 
        COALESCE(package_record.name, 'NOT FOUND');
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Migration complete: Updated % package credits', updated_count;
END $$;

