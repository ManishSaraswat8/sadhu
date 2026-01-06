-- Allow users to update group classes to increment participant count
-- This is needed so users can join group classes by incrementing current_participants
-- on the master group class record

-- Drop policy if it exists (in case we need to recreate it)
DROP POLICY IF EXISTS "Users can update group classes to join" ON public.session_schedules;

-- This policy must be permissive enough to allow any authenticated user to update
-- the current_participants field on master group classes (where client_id might be an admin)
-- We use a permissive policy (OR logic) so it works alongside other UPDATE policies
CREATE POLICY "Users can update group classes to join"
ON public.session_schedules
FOR UPDATE
TO authenticated
USING (
  -- Allow updating if it's a group class (max_participants > 1)
  -- and it's not cancelled
  (max_participants IS NOT NULL AND max_participants > 1)
  AND status != 'cancelled'
  -- Allow updating master classes (notes is null or starts with "Pre-scheduled")
  AND (notes IS NULL OR notes NOT LIKE 'Joined group class%')
)
WITH CHECK (
  -- Ensure they can only update group classes that are not cancelled
  (max_participants IS NOT NULL AND max_participants > 1)
  AND status != 'cancelled'
  -- Ensure we're only updating master classes, not individual bookings
  AND (notes IS NULL OR notes NOT LIKE 'Joined group class%')
);

-- Note: The SELECT policy "Anyone can view group classes" from 20260105000000_allow_view_group_sessions.sql
-- already covers viewing group classes, so we don't need a separate policy here.

