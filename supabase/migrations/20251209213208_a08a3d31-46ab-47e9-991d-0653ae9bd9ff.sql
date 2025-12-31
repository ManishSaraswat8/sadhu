-- Create table to track session payments and practitioner payouts
CREATE TABLE public.session_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.session_schedules(id) ON DELETE CASCADE,
  practitioner_id UUID NOT NULL,
  client_id UUID NOT NULL,
  total_amount NUMERIC NOT NULL,
  practitioner_share NUMERIC NOT NULL,
  platform_share NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  stripe_payment_intent_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  paid_out_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.session_payments ENABLE ROW LEVEL SECURITY;

-- Admins can view and manage all payments
CREATE POLICY "Admins can manage all payments"
ON public.session_payments
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Practitioners can view their own payment records
CREATE POLICY "Practitioners can view their payments"
ON public.session_payments
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM practitioners
  WHERE practitioners.id = session_payments.practitioner_id
  AND practitioners.user_id = auth.uid()
));

-- Create trigger for updated_at
CREATE TRIGGER update_session_payments_updated_at
BEFORE UPDATE ON public.session_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();