-- Create session_packages table for 5 and 10 session packages
CREATE TABLE public.session_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL, -- '5 Session Package', '10 Session Package'
  session_count INTEGER NOT NULL CHECK (session_count IN (5, 10)),
  price_cad NUMERIC(10, 2) NOT NULL,
  price_usd NUMERIC(10, 2) NOT NULL,
  stripe_price_id_cad TEXT, -- Stripe Price ID for CAD
  stripe_price_id_usd TEXT, -- Stripe Price ID for USD
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (session_count)
);

-- Create indexes
CREATE INDEX idx_session_packages_active ON public.session_packages(is_active) WHERE is_active = true;
CREATE INDEX idx_session_packages_count ON public.session_packages(session_count);

-- Enable RLS on session_packages
ALTER TABLE public.session_packages ENABLE ROW LEVEL SECURITY;

-- Everyone can view active packages
CREATE POLICY "Anyone can view active packages"
ON public.session_packages
FOR SELECT
USING (is_active = true);

-- Admins can manage packages
CREATE POLICY "Admins can manage packages"
ON public.session_packages
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Create trigger to update updated_at
CREATE TRIGGER update_session_packages_updated_at
BEFORE UPDATE ON public.session_packages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

