-- Remove all group classes (sessions with max_participants > 1)
-- This is a cleanup migration to remove old test data

-- First, remove any correlations that reference group classes
UPDATE public.session_schedules
SET correlated_session_id = NULL
WHERE correlated_session_id IN (
  SELECT id FROM public.session_schedules
  WHERE max_participants > 1
);

-- Delete all group classes
DELETE FROM public.session_schedules
WHERE max_participants > 1;

