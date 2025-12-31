-- Add cancelled_at column to session_schedules table
ALTER TABLE public.session_schedules
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;

-- Add index for faster queries on cancelled sessions
CREATE INDEX IF NOT EXISTS idx_session_schedules_cancelled_at 
ON public.session_schedules(cancelled_at) 
WHERE cancelled_at IS NOT NULL;

