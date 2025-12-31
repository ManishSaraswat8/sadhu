-- Create cancellation_policy table
CREATE TABLE IF NOT EXISTS public.cancellation_policy (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  policy_text TEXT NOT NULL,
  standard_cancellation_hours INTEGER NOT NULL DEFAULT 12,
  late_cancellation_hours INTEGER NOT NULL DEFAULT 5,
  late_cancellation_fee_usd NUMERIC(10, 2) NOT NULL DEFAULT 25.00,
  late_cancellation_fee_cad NUMERIC(10, 2) NOT NULL DEFAULT 34.25,
  grace_cancellations_allowed INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.cancellation_policy ENABLE ROW LEVEL SECURITY;

-- Admins can manage cancellation policy
CREATE POLICY "Admins can manage cancellation policy"
ON public.cancellation_policy
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Everyone can view active cancellation policy
CREATE POLICY "Everyone can view active cancellation policy"
ON public.cancellation_policy
FOR SELECT
USING (is_active = true);

-- Create trigger for updated_at
CREATE TRIGGER update_cancellation_policy_updated_at
BEFORE UPDATE ON public.cancellation_policy
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default cancellation policy
INSERT INTO public.cancellation_policy (
  policy_text,
  standard_cancellation_hours,
  late_cancellation_hours,
  late_cancellation_fee_usd,
  late_cancellation_fee_cad,
  grace_cancellations_allowed,
  is_active
) VALUES (
  'We understand that schedules change. To ensure fairness to both our clients and practitioners, the following cancellation policy applies to all sessions and classes:

Standard Cancellation Window

Clients may cancel a booked session up to 12 hours before the scheduled start time.

• Cancellations made within this window will result in the full class credit being returned to the client''s wallet for future use.

Late Cancellations (12–5 Hours Before Class)

If a session is canceled less than 12 hours but more than 5 hours prior to the scheduled start time:

• A $25 late cancellation fee will be charged
• The remaining value of the class credit will be returned to the client''s wallet

Last-Minute Cancellations (Less Than 5 Hours)

Cancellations made less than 5 hours before the scheduled start time are considered a no-show:

• The session will be forfeited
• The class credit will be fully deducted and not returned

Grace Cancellation & Emergencies

We recognize that genuine emergencies happen.

• We offer a one-time grace cancellation per client, or may waive penalties in cases of legitimate last-minute emergencies (such as illness or family crises)
• These exceptions are granted at our discretion, evaluated case-by-case, and are not guaranteed

How to Cancel

• All cancellations must be made directly through our booking system
• Cancellations made via email, phone, social media, or direct messages will not be considered valid

Refunds/Transfers: In general, class passes, memberships, and workshops are non-refundable and non-transferable.',
  12,
  5,
  25.00,
  34.25,
  1,
  true
);

-- Add cancellation tracking to session_schedules
ALTER TABLE public.session_schedules
ADD COLUMN IF NOT EXISTS cancellation_policy_agreed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancellation_policy_version UUID REFERENCES public.cancellation_policy(id),
ADD COLUMN IF NOT EXISTS grace_cancellation_used BOOLEAN NOT NULL DEFAULT false;

-- Add cancellation tracking to user_session_credits
ALTER TABLE public.user_session_credits
ADD COLUMN IF NOT EXISTS cancellation_policy_agreed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancellation_policy_version UUID REFERENCES public.cancellation_policy(id);

-- Create table to track cancellation history
CREATE TABLE IF NOT EXISTS public.session_cancellations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.session_schedules(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  cancelled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  cancellation_type TEXT NOT NULL CHECK (cancellation_type IN ('standard', 'late', 'last_minute', 'grace', 'emergency')),
  hours_before_session NUMERIC(10, 2),
  fee_charged NUMERIC(10, 2),
  fee_currency TEXT NOT NULL DEFAULT 'usd',
  credit_returned NUMERIC(10, 2),
  credit_currency TEXT NOT NULL DEFAULT 'usd',
  reason TEXT,
  approved_by UUID REFERENCES auth.users(id),
  cancellation_policy_version UUID REFERENCES public.cancellation_policy(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.session_cancellations ENABLE ROW LEVEL SECURITY;

-- Users can view their own cancellations
CREATE POLICY "Users can view their own cancellations"
ON public.session_cancellations
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all cancellations
CREATE POLICY "Admins can view all cancellations"
ON public.session_cancellations
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Practitioners can view cancellations for their sessions
CREATE POLICY "Practitioners can view their session cancellations"
ON public.session_cancellations
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.session_schedules ss
  JOIN public.practitioners p ON p.id = ss.practitioner_id
  WHERE ss.id = session_cancellations.session_id
  AND p.user_id = auth.uid()
));

