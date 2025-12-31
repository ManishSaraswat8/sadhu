-- Allow practitioners to create sessions for their assigned clients
CREATE POLICY "Practitioners can create sessions for assigned clients" 
ON public.session_schedules 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM practitioners 
    WHERE practitioners.id = session_schedules.practitioner_id 
    AND practitioners.user_id = auth.uid()
  )
);