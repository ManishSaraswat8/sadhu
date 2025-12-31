-- Add policy for practitioners to view their own recommendations
CREATE POLICY "Practitioners can view their recommendations"
ON public.action_recommendations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.practitioners
    WHERE practitioners.id = action_recommendations.practitioner_id
    AND practitioners.user_id = auth.uid()
  )
);

