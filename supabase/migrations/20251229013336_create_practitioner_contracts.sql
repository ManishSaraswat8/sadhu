-- Create practitioner_contracts table for managing practitioner contracts
CREATE TABLE public.practitioner_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practitioner_id UUID REFERENCES public.practitioners(id) ON DELETE CASCADE NOT NULL,
  contract_version TEXT NOT NULL,
  contract_text TEXT NOT NULL,
  signed_at TIMESTAMP WITH TIME ZONE,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'expired', 'revoked')),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_practitioner_contracts_practitioner_id ON public.practitioner_contracts(practitioner_id);
CREATE INDEX idx_practitioner_contracts_status ON public.practitioner_contracts(status);
CREATE INDEX idx_practitioner_contracts_active ON public.practitioner_contracts(practitioner_id, status) 
  WHERE status IN ('signed', 'pending');

-- Enable RLS on practitioner_contracts
ALTER TABLE public.practitioner_contracts ENABLE ROW LEVEL SECURITY;

-- Practitioners can view their own contracts
CREATE POLICY "Practitioners can view own contracts"
ON public.practitioner_contracts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.practitioners
    WHERE practitioners.id = practitioner_contracts.practitioner_id
    AND practitioners.user_id = auth.uid()
  )
);

-- Practitioners can sign contracts (update signed_at)
-- Note: Field-level restrictions (signed_at, status changes) should be enforced at application level
CREATE POLICY "Practitioners can sign contracts"
ON public.practitioner_contracts
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.practitioners
    WHERE practitioners.id = practitioner_contracts.practitioner_id
    AND practitioners.user_id = auth.uid()
  )
  AND status = 'pending'
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.practitioners
    WHERE practitioners.id = practitioner_contracts.practitioner_id
    AND practitioners.user_id = auth.uid()
  )
);

-- Admins can manage all contracts
CREATE POLICY "Admins can manage all contracts"
ON public.practitioner_contracts
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create trigger to update updated_at
CREATE TRIGGER update_practitioner_contracts_updated_at
BEFORE UPDATE ON public.practitioner_contracts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

