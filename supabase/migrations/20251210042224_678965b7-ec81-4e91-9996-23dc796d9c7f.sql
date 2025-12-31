-- Create a separate session_notes table with visibility controls
CREATE TABLE public.session_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.session_schedules(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  content TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'shared')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.session_notes ENABLE ROW LEVEL SECURITY;

-- Authors can always see their own notes
CREATE POLICY "Authors can view their own notes"
ON public.session_notes
FOR SELECT
USING (auth.uid() = author_id);

-- Shared notes visible to session participants
CREATE POLICY "Participants can view shared notes"
ON public.session_notes
FOR SELECT
USING (
  visibility = 'shared' 
  AND EXISTS (
    SELECT 1 FROM public.session_schedules ss
    LEFT JOIN public.practitioners p ON p.id = ss.practitioner_id
    WHERE ss.id = session_notes.session_id
    AND (ss.client_id = auth.uid() OR p.user_id = auth.uid())
  )
);

-- Authors can create notes for sessions they participate in
CREATE POLICY "Participants can create notes"
ON public.session_notes
FOR INSERT
WITH CHECK (
  auth.uid() = author_id
  AND EXISTS (
    SELECT 1 FROM public.session_schedules ss
    LEFT JOIN public.practitioners p ON p.id = ss.practitioner_id
    WHERE ss.id = session_notes.session_id
    AND (ss.client_id = auth.uid() OR p.user_id = auth.uid())
  )
);

-- Authors can update their own notes
CREATE POLICY "Authors can update their own notes"
ON public.session_notes
FOR UPDATE
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);

-- Authors can delete their own notes
CREATE POLICY "Authors can delete their own notes"
ON public.session_notes
FOR DELETE
USING (auth.uid() = author_id);

-- Admins can manage all notes
CREATE POLICY "Admins can manage all notes"
ON public.session_notes
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add timestamp trigger
CREATE TRIGGER update_session_notes_updated_at
BEFORE UPDATE ON public.session_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment explaining the legacy notes field
COMMENT ON COLUMN public.session_schedules.notes IS 'DEPRECATED: Use session_notes table for new notes. This field kept for backward compatibility.';