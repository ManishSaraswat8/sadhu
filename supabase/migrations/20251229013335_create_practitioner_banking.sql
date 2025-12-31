-- Create practitioner_banking table for storing encrypted banking information
-- Note: Encryption should be handled at the application level before storing
CREATE TABLE public.practitioner_banking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practitioner_id UUID REFERENCES public.practitioners(id) ON DELETE CASCADE NOT NULL UNIQUE,
  bank_name TEXT NOT NULL,
  account_holder_name TEXT NOT NULL,
  account_number_encrypted TEXT NOT NULL, -- Should be encrypted before insertion
  routing_number_encrypted TEXT NOT NULL, -- Should be encrypted before insertion
  account_type TEXT NOT NULL CHECK (account_type IN ('checking', 'savings')),
  country TEXT NOT NULL DEFAULT 'CA',
  verified BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_practitioner_banking_practitioner_id ON public.practitioner_banking(practitioner_id);
CREATE INDEX idx_practitioner_banking_verified ON public.practitioner_banking(verified) WHERE verified = true;

-- Enable RLS on practitioner_banking
ALTER TABLE public.practitioner_banking ENABLE ROW LEVEL SECURITY;

-- Practitioners can view and manage their own banking info
CREATE POLICY "Practitioners can manage own banking"
ON public.practitioner_banking
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.practitioners
    WHERE practitioners.id = practitioner_banking.practitioner_id
    AND practitioners.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.practitioners
    WHERE practitioners.id = practitioner_banking.practitioner_id
    AND practitioners.user_id = auth.uid()
  )
);

-- Admins can view all banking info (for payout processing)
CREATE POLICY "Admins can view all banking"
ON public.practitioner_banking
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create trigger to update updated_at
CREATE TRIGGER update_practitioner_banking_updated_at
BEFORE UPDATE ON public.practitioner_banking
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

