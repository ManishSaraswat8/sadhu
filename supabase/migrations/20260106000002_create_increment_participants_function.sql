-- Create a function to safely increment group class participant count
-- This bypasses RLS and ensures atomic updates

CREATE OR REPLACE FUNCTION increment_group_class_participants(
  group_class_id UUID,
  increment_by INTEGER DEFAULT 1
)
RETURNS TABLE (
  id UUID,
  current_participants INTEGER,
  max_participants INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the participant count atomically
  UPDATE session_schedules
  SET 
    current_participants = LEAST(
      COALESCE(current_participants, 0) + increment_by,
      max_participants
    ),
    updated_at = now()
  WHERE 
    id = group_class_id
    AND max_participants > 1
    AND status != 'cancelled'
    AND (notes IS NULL OR notes NOT LIKE 'Joined group class%');

  -- Return the updated values
  RETURN QUERY
  SELECT 
    session_schedules.id,
    session_schedules.current_participants,
    session_schedules.max_participants
  FROM session_schedules
  WHERE session_schedules.id = group_class_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_group_class_participants(UUID, INTEGER) TO authenticated;

