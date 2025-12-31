-- Allow practitioners to also manage their own client assignments
DROP POLICY IF EXISTS "Admins can manage assignments" ON public.practitioner_assignments;

CREATE POLICY "Admins and practitioners can manage assignments" 
ON public.practitioner_assignments 
FOR ALL 
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR auth.uid() = practitioner_id
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  OR auth.uid() = practitioner_id
);