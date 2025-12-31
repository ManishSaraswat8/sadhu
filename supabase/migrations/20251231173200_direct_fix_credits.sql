-- Direct fix for credits - update all credits for the specific package
-- This is a more direct approach that should definitely work

UPDATE public.user_session_credits
SET 
  session_type_id = (
    SELECT session_type_id 
    FROM public.session_packages 
    WHERE id = '4550ae58-4be7-4e35-ac8b-2a80c7765725'
    LIMIT 1
  ),
  updated_at = now()
WHERE package_id = '4550ae58-4be7-4e35-ac8b-2a80c7765725'
  AND session_type_id IS NULL
  AND credits_remaining > 0;

-- Also update any other credits that have package_id but no session_type_id
-- where the package has a session_type_id
UPDATE public.user_session_credits usc
SET 
  session_type_id = sp.session_type_id,
  updated_at = now()
FROM public.session_packages sp
WHERE usc.package_id = sp.id
  AND usc.session_type_id IS NULL
  AND sp.session_type_id IS NOT NULL
  AND usc.credits_remaining > 0;

