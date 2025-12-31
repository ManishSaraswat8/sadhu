-- Create action_recommendations table for practitioner recommendations to clients
CREATE TABLE public.action_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.session_schedules(id) ON DELETE CASCADE NOT NULL,
  practitioner_id UUID REFERENCES public.practitioners(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  action_type TEXT NOT NULL CHECK (action_type IN ('daily_practice', 'mindfulness', 'physical', 'emotional', 'other')),
  frequency TEXT, -- e.g., "daily", "weekly", "as needed"
  due_date DATE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_action_recommendations_client_id ON public.action_recommendations(client_id);
CREATE INDEX idx_action_recommendations_session_id ON public.action_recommendations(session_id);
CREATE INDEX idx_action_recommendations_practitioner_id ON public.action_recommendations(practitioner_id);
CREATE INDEX idx_action_recommendations_completed ON public.action_recommendations(completed) WHERE completed = false;

-- Enable RLS on action_recommendations
ALTER TABLE public.action_recommendations ENABLE ROW LEVEL SECURITY;

-- Clients can view their own recommendations
CREATE POLICY "Clients can view their recommendations"
ON public.action_recommendations
FOR SELECT
USING (auth.uid() = client_id);

-- Clients can update completion status
-- Note: Field-level restrictions (only completed/completed_at) should be enforced at application level
CREATE POLICY "Clients can update completion status"
ON public.action_recommendations
FOR UPDATE
USING (auth.uid() = client_id)
WITH CHECK (auth.uid() = client_id);

-- Practitioners can create recommendations for their clients
CREATE POLICY "Practitioners can create recommendations"
ON public.action_recommendations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.practitioners
    WHERE practitioners.id = action_recommendations.practitioner_id
    AND practitioners.user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM public.session_schedules
    WHERE session_schedules.id = action_recommendations.session_id
    AND session_schedules.client_id = action_recommendations.client_id
  )
);

-- Practitioners can update their own recommendations
CREATE POLICY "Practitioners can update their recommendations"
ON public.action_recommendations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.practitioners
    WHERE practitioners.id = action_recommendations.practitioner_id
    AND practitioners.user_id = auth.uid()
  )
);

-- Practitioners can delete their own recommendations
CREATE POLICY "Practitioners can delete their recommendations"
ON public.action_recommendations
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.practitioners
    WHERE practitioners.id = action_recommendations.practitioner_id
    AND practitioners.user_id = auth.uid()
  )
);

-- Admins can manage all recommendations
CREATE POLICY "Admins can manage all recommendations"
ON public.action_recommendations
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create trigger to update updated_at
CREATE TRIGGER update_action_recommendations_updated_at
BEFORE UPDATE ON public.action_recommendations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

