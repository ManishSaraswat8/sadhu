-- Add reminder_sent column to track when class reminders have been sent
ALTER TABLE public.session_schedules
ADD COLUMN IF NOT EXISTS reminder_sent TIMESTAMP WITH TIME ZONE;

-- Create index for efficient reminder queries
CREATE INDEX IF NOT EXISTS idx_session_schedules_reminder_sent 
ON public.session_schedules(status, scheduled_at, reminder_sent)
WHERE status = 'scheduled';

-- Function to send welcome email when user is created
CREATE OR REPLACE FUNCTION public.send_welcome_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the send-welcome-email edge function
  -- Note: This requires pg_net extension or we can use http extension
  -- For now, we'll use a database trigger that can be called from application code
  -- The actual email sending will be handled by the edge function
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call welcome email function (optional - can also be called from application)
-- Note: Supabase doesn't support direct HTTP calls from triggers without extensions
-- So we'll handle this in the application code instead

-- Create a function to log email events (optional, for tracking)
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  session_id UUID REFERENCES public.session_schedules(id) ON DELETE SET NULL,
  template_id TEXT,
  message_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on email_logs
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own email logs
CREATE POLICY "Users can view their own email logs"
  ON public.email_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Service role can manage all email logs
CREATE POLICY "Service role can manage email logs"
  ON public.email_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create index for email logs
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON public.email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_email_type ON public.email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON public.email_logs(created_at);

