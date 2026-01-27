-- Update cancellation policy defaults to 2 hours
ALTER TABLE public.cancellation_policy 
ALTER COLUMN standard_cancellation_hours SET DEFAULT 2,
ALTER COLUMN late_cancellation_hours SET DEFAULT 2;

-- Update existing active policy if it exists (optional - admin can update via UI)
-- This will only update if there's an active policy with old values
UPDATE public.cancellation_policy
SET 
  standard_cancellation_hours = 2,
  late_cancellation_hours = 2,
  updated_at = now()
WHERE is_active = true 
  AND (standard_cancellation_hours != 2 OR late_cancellation_hours != 2);
