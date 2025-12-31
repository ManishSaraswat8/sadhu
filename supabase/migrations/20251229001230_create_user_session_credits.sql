-- Create user_session_credits table to track available sessions
-- Tracks when users purchase packages or individual sessions
CREATE TABLE public.user_session_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  package_id UUID REFERENCES public.session_packages(id) ON DELETE SET NULL, -- NULL for single purchases
  session_type_id UUID REFERENCES public.session_types(id) ON DELETE SET NULL, -- NULL for packages (can be used for any type)
  credits_remaining INTEGER NOT NULL DEFAULT 1 CHECK (credits_remaining >= 0),
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE, -- Optional expiration
  stripe_payment_intent_id TEXT, -- For tracking the purchase
  order_id TEXT, -- Optional: link to order if we create orders table later
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_user_session_credits_user_id ON public.user_session_credits(user_id);
CREATE INDEX idx_user_session_credits_active ON public.user_session_credits(user_id, credits_remaining)
  WHERE credits_remaining > 0;
CREATE INDEX idx_user_session_credits_expires ON public.user_session_credits(expires_at)
  WHERE expires_at IS NOT NULL;

-- Enable RLS on user_session_credits
ALTER TABLE public.user_session_credits ENABLE ROW LEVEL SECURITY;

-- Users can view their own credits
CREATE POLICY "Users can view their own credits"
ON public.user_session_credits
FOR SELECT
USING (auth.uid() = user_id);

-- Users cannot directly insert/update credits (only via Edge Functions)
-- Edge Functions with service role can manage credits

-- Admins can view all credits
CREATE POLICY "Admins can view all credits"
ON public.user_session_credits
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create function to get available credits for a user
CREATE OR REPLACE FUNCTION public.get_user_credits(p_user_id UUID)
RETURNS TABLE (
  total_credits INTEGER,
  package_credits INTEGER,
  single_credits INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COALESCE(SUM(credits_remaining), 0)::INTEGER as total_credits,
    COALESCE(SUM(CASE WHEN package_id IS NOT NULL THEN credits_remaining ELSE 0 END), 0)::INTEGER as package_credits,
    COALESCE(SUM(CASE WHEN package_id IS NULL THEN credits_remaining ELSE 0 END), 0)::INTEGER as single_credits
  FROM public.user_session_credits
  WHERE user_id = p_user_id
    AND credits_remaining > 0
    AND (expires_at IS NULL OR expires_at > now());
$$;

-- Create trigger to update updated_at
CREATE TRIGGER update_user_session_credits_updated_at
BEFORE UPDATE ON public.user_session_credits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

