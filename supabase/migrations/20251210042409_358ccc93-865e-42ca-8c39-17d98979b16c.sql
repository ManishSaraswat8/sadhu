-- Add explicit INSERT policy for session_payments - only admins can insert
-- Note: Edge functions use service role key which bypasses RLS
CREATE POLICY "Only admins can create payments"
ON public.session_payments
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));