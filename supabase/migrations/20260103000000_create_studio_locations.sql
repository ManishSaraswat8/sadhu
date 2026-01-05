-- Create studio_locations table for admin-managed in-person session locations
CREATE TABLE public.studio_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT,
  province_state TEXT,
  country TEXT DEFAULT 'CA',
  postal_code TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_studio_locations_active ON public.studio_locations(is_active) WHERE is_active = true;

-- Enable RLS on studio_locations
ALTER TABLE public.studio_locations ENABLE ROW LEVEL SECURITY;

-- Everyone can view active studio locations
CREATE POLICY "Anyone can view active studio locations"
ON public.studio_locations
FOR SELECT
USING (is_active = true);

-- Admins can manage studio locations
CREATE POLICY "Admins can manage studio locations"
ON public.studio_locations
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Create trigger to update updated_at
CREATE TRIGGER update_studio_locations_updated_at
BEFORE UPDATE ON public.studio_locations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add grace_cancellation_used field to track one-time grace cancellations per user
ALTER TABLE public.user_session_credits
ADD COLUMN IF NOT EXISTS grace_cancellation_used BOOLEAN NOT NULL DEFAULT false;

-- Create index for grace cancellation lookups
CREATE INDEX IF NOT EXISTS idx_user_credits_grace_cancellation 
ON public.user_session_credits(user_id, grace_cancellation_used)
WHERE grace_cancellation_used = true;

