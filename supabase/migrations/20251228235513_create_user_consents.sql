-- Create user_consents table for HIPAA compliance
-- Tracks user consent for data processing, marketing, session recording, etc.
CREATE TABLE public.user_consents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  consent_type TEXT NOT NULL CHECK (consent_type IN (
    'data_processing',
    'marketing',
    'session_recording',
    'data_sharing',
    'third_party_sharing',
    'analytics'
  )),
  consented BOOLEAN NOT NULL DEFAULT false,
  consent_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT, -- IP address when consent was given
  user_agent TEXT, -- User agent when consent was given
  version TEXT, -- Version of consent form/terms
  revoked_at TIMESTAMP WITH TIME ZONE, -- When consent was revoked (if applicable)
  revoked_ip_address TEXT, -- IP address when consent was revoked
  metadata JSONB DEFAULT '{}', -- Additional consent details
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, consent_type) -- One consent record per type per user
);

-- Create indexes
CREATE INDEX idx_user_consents_user_id ON public.user_consents(user_id);
CREATE INDEX idx_user_consents_consent_type ON public.user_consents(consent_type);
CREATE INDEX idx_user_consents_consented ON public.user_consents(consented) WHERE consented = true;

-- Enable RLS on user_consents
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

-- Users can view their own consents
CREATE POLICY "Users can view their own consents"
ON public.user_consents
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create/update their own consents
CREATE POLICY "Users can manage their own consents"
ON public.user_consents
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins can view all consents (for compliance reporting)
CREATE POLICY "Admins can view all consents"
ON public.user_consents
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create trigger to update updated_at
CREATE TRIGGER update_user_consents_updated_at
BEFORE UPDATE ON public.user_consents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to check if user has given consent
CREATE OR REPLACE FUNCTION public.has_consent(
  p_user_id UUID,
  p_consent_type TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT consented AND revoked_at IS NULL
      FROM public.user_consents
      WHERE user_id = p_user_id
        AND consent_type = p_consent_type
      ORDER BY consent_date DESC
      LIMIT 1
    ),
    false
  );
$$;

