-- Allow anyone to view group classes (max_participants > 1)
-- This is needed so users can see and join admin-created group classes
-- even though they don't have client_id matching their user_id

CREATE POLICY "Anyone can view group classes"
ON public.session_schedules
FOR SELECT
TO authenticated
USING (
  (max_participants IS NOT NULL AND max_participants > 1)
  AND status != 'cancelled'
);

