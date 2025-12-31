-- Create liability_waivers table for storing signed liability waivers
CREATE TABLE public.liability_waivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES public.session_schedules(id) ON DELETE CASCADE,
  waiver_text TEXT NOT NULL,
  signed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, session_id)
);

-- Index for quick lookups
CREATE INDEX idx_liability_waivers_user_id ON public.liability_waivers(user_id);
CREATE INDEX idx_liability_waivers_session_id ON public.liability_waivers(session_id);

-- Enable RLS on liability_waivers
ALTER TABLE public.liability_waivers ENABLE ROW LEVEL SECURITY;

-- Users can view their own waivers
CREATE POLICY "Users can view their own waivers"
ON public.liability_waivers
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own waivers
CREATE POLICY "Users can create their own waivers"
ON public.liability_waivers
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all waivers
CREATE POLICY "Admins can view all waivers"
ON public.liability_waivers
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Practitioners can view waivers for their sessions
CREATE POLICY "Practitioners can view client waivers"
ON public.liability_waivers
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.session_schedules ss
    JOIN public.practitioners p ON p.id = ss.practitioner_id
    WHERE ss.id = liability_waivers.session_id
    AND p.user_id = auth.uid()
  )
);

