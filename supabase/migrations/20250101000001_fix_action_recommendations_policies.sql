-- Fix INSERT policy to allow null session_id
DROP POLICY IF EXISTS "Practitioners can create recommendations" ON public.action_recommendations;

CREATE POLICY "Practitioners can create recommendations"
ON public.action_recommendations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.practitioners
    WHERE practitioners.id = action_recommendations.practitioner_id
    AND practitioners.user_id = auth.uid()
  )
  AND (
    action_recommendations.session_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.session_schedules
      WHERE session_schedules.id = action_recommendations.session_id
      AND session_schedules.client_id = action_recommendations.client_id
    )
  )
);

-- Also make session_id nullable in the table
ALTER TABLE public.action_recommendations
ALTER COLUMN session_id DROP NOT NULL;

