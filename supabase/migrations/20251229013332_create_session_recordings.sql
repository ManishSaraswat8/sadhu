-- Create session_recordings table for storing Agora recording metadata
CREATE TABLE public.session_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.session_schedules(id) ON DELETE CASCADE NOT NULL,
  agora_resource_id TEXT, -- Agora recording resource ID
  agora_sid TEXT, -- Agora recording SID
  recording_url TEXT, -- URL to stored recording
  storage_path TEXT, -- Path in Supabase Storage bucket
  duration_seconds INTEGER,
  file_size_bytes BIGINT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'recording', 'processing', 'completed', 'failed')),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_session_recordings_session_id ON public.session_recordings(session_id);
CREATE INDEX idx_session_recordings_status ON public.session_recordings(status);
CREATE INDEX idx_session_recordings_agora_sid ON public.session_recordings(agora_sid) WHERE agora_sid IS NOT NULL;

-- Enable RLS on session_recordings
ALTER TABLE public.session_recordings ENABLE ROW LEVEL SECURITY;

-- Clients can view recordings for their sessions
CREATE POLICY "Clients can view their session recordings"
ON public.session_recordings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.session_schedules
    WHERE session_schedules.id = session_recordings.session_id
    AND session_schedules.client_id = auth.uid()
  )
);

-- Practitioners can view recordings for their sessions
CREATE POLICY "Practitioners can view their session recordings"
ON public.session_recordings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.session_schedules ss
    JOIN public.practitioners p ON p.id = ss.practitioner_id
    WHERE ss.id = session_recordings.session_id
    AND p.user_id = auth.uid()
  )
);

-- Admins can manage all recordings
CREATE POLICY "Admins can manage all recordings"
ON public.session_recordings
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create trigger to update updated_at
CREATE TRIGGER update_session_recordings_updated_at
BEFORE UPDATE ON public.session_recordings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

