-- Fix specific package credits for 60min Expert 1:1 packages
-- This targets the specific package that was purchased: "5 Session Package - 60min Expert 1:1"

-- First, find the 60min Expert 1:1 session type
DO $$
DECLARE
  v_60min_expert_1to1_id UUID;
  updated_count INTEGER;
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
  
  -- Update credits for packages that match "60min Expert 1:1" pattern
  UPDATE public.user_session_credits usc
  SET 
    session_type_id = v_60min_expert_1to1_id,
    updated_at = now()
  FROM public.session_packages sp
  WHERE usc.package_id = sp.id
    AND usc.session_type_id IS NULL
    AND sp.session_type_id = v_60min_expert_1to1_id
    AND usc.credits_remaining > 0;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % credits for 60min Expert 1:1 packages', updated_count;
  
  -- Also update credits for the specific package ID if it exists
  UPDATE public.user_session_credits
  SET 
    session_type_id = v_60min_expert_1to1_id,
    updated_at = now()
  WHERE package_id = '4550ae58-4be7-4e35-ac8b-2a80c7765725'
    AND session_type_id IS NULL
    AND credits_remaining > 0;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % credits for specific package ID', updated_count;
END $$;

