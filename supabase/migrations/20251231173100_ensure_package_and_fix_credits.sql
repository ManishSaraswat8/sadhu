-- Ensure the package has session_type_id set, then fix credits
-- This handles the case where the package might not have session_type_id yet

DO $$
DECLARE
  v_60min_expert_1to1_id UUID;
  v_package_id UUID := '4550ae58-4be7-4e35-ac8b-2a80c7765725';
  updated_package BOOLEAN := false;
  updated_credits INTEGER := 0;
BEGIN
  -- Get the session_type_id for 60min Expert 1:1 (standing, not group)
  SELECT id INTO v_60min_expert_1to1_id
  FROM public.session_types
  WHERE duration_minutes = 60
    AND session_type = 'standing'
    AND is_group = false
    AND is_active = true
  LIMIT 1;
  
  IF v_60min_expert_1to1_id IS NULL THEN
    RAISE EXCEPTION 'Could not find 60min Expert 1:1 session type';
  END IF;
  
  RAISE NOTICE 'Found 60min Expert 1:1 session_type_id: %', v_60min_expert_1to1_id;
  
  -- First, ensure the package has the correct session_type_id
  UPDATE public.session_packages
  SET 
    session_type_id = v_60min_expert_1to1_id,
    updated_at = now()
  WHERE id = v_package_id
    AND (session_type_id IS NULL OR session_type_id != v_60min_expert_1to1_id);
  
  GET DIAGNOSTICS updated_credits = ROW_COUNT;
  
  IF updated_credits > 0 THEN
    RAISE NOTICE 'Updated package % with session_type_id', v_package_id;
  ELSE
    RAISE NOTICE 'Package % already has correct session_type_id', v_package_id;
  END IF;
  
  -- Now update all credits for this package
  UPDATE public.user_session_credits
  SET 
    session_type_id = v_60min_expert_1to1_id,
    updated_at = now()
  WHERE package_id = v_package_id
    AND (session_type_id IS NULL OR session_type_id != v_60min_expert_1to1_id)
    AND credits_remaining > 0;
  
  GET DIAGNOSTICS updated_credits = ROW_COUNT;
  RAISE NOTICE 'Updated % credits for package %', updated_credits, v_package_id;
  
  -- Also update any other credits for 60min Expert 1:1 packages
  UPDATE public.user_session_credits usc
  SET 
    session_type_id = v_60min_expert_1to1_id,
    updated_at = now()
  FROM public.session_packages sp
  WHERE usc.package_id = sp.id
    AND sp.session_type_id = v_60min_expert_1to1_id
    AND usc.session_type_id IS NULL
    AND usc.credits_remaining > 0;
  
  GET DIAGNOSTICS updated_credits = ROW_COUNT;
  RAISE NOTICE 'Total additional credits updated: %', updated_credits;
END $$;

