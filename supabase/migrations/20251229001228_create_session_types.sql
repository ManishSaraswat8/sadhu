-- Create session_types table for fixed pricing structure
-- Replaces dynamic pricing based on practitioner rates
CREATE TABLE public.session_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL, -- '20min Intro', '45min Standard', '60min Expert'
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes IN (20, 45, 60)),
  session_type TEXT NOT NULL CHECK (session_type IN ('standing', 'laying')),
  is_group BOOLEAN NOT NULL DEFAULT false, -- false for 1:1, true for group
  price_cad NUMERIC(10, 2) NOT NULL,
  price_usd NUMERIC(10, 2) NOT NULL,
  stripe_price_id_cad TEXT, -- Stripe Price ID for CAD
  stripe_price_id_usd TEXT, -- Stripe Price ID for USD
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (duration_minutes, session_type, is_group)
);

-- Create indexes
CREATE INDEX idx_session_types_active ON public.session_types(is_active) WHERE is_active = true;
CREATE INDEX idx_session_types_duration ON public.session_types(duration_minutes);
CREATE INDEX idx_session_types_type ON public.session_types(session_type);

-- Enable RLS on session_types
ALTER TABLE public.session_types ENABLE ROW LEVEL SECURITY;

-- Everyone can view active session types
CREATE POLICY "Anyone can view active session types"
ON public.session_types
FOR SELECT
USING (is_active = true);

-- Admins can manage session types
CREATE POLICY "Admins can manage session types"
ON public.session_types
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Create trigger to update updated_at
CREATE TRIGGER update_session_types_updated_at
BEFORE UPDATE ON public.session_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

