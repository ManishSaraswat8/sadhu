-- Add DELETE policies for session_schedules table

-- Allow clients to cancel their own scheduled sessions
CREATE POLICY "Clients can cancel their sessions"
ON public.session_schedules
FOR DELETE
USING (
  auth.uid() = client_id 
  AND status = 'scheduled'
);

-- Allow practitioners to cancel sessions they're assigned to
CREATE POLICY "Practitioners can cancel their sessions"
ON public.session_schedules
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM practitioners
    WHERE practitioners.id = session_schedules.practitioner_id
    AND practitioners.user_id = auth.uid()
  )
  AND status = 'scheduled'
);

-- Allow admins to delete any sessions
CREATE POLICY "Admins can delete any sessions"
ON public.session_schedules
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));