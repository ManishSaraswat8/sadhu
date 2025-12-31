-- Add policy for clients to view their own payment records
CREATE POLICY "Clients can view their own payments" 
ON public.session_payments 
FOR SELECT 
USING (auth.uid() = client_id);