-- Fix RLS policy to check practitioner's user_id, not the practitioner record id
DROP POLICY IF EXISTS "Admins and practitioners can manage assignments" ON public.practitioner_assignments;

CREATE POLICY "Admins and practitioners can manage assignments" 
ON public.practitioner_assignments 
FOR ALL 
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR EXISTS (
    SELECT 1 FROM practitioners 
    WHERE practitioners.id = practitioner_assignments.practitioner_id 
    AND practitioners.user_id = auth.uid()
  )
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  OR EXISTS (
    SELECT 1 FROM practitioners 
    WHERE practitioners.id = practitioner_assignments.practitioner_id 
    AND practitioners.user_id = auth.uid()
  )
);