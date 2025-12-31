-- Add in-person session support to session_schedules table
ALTER TABLE public.session_schedules 
ADD COLUMN IF NOT EXISTS session_location TEXT CHECK (session_location IN ('online', 'in_person')) DEFAULT 'online',
ADD COLUMN IF NOT EXISTS physical_location TEXT, -- Address for in-person sessions
ADD COLUMN IF NOT EXISTS location_coordinates POINT, -- PostGIS point for map display (requires PostGIS extension)
ADD COLUMN IF NOT EXISTS max_participants INTEGER DEFAULT 1, -- For group sessions
ADD COLUMN IF NOT EXISTS current_participants INTEGER DEFAULT 1;

-- Add correlation field for online/in-person linked sessions
ALTER TABLE public.session_schedules
ADD COLUMN IF NOT EXISTS correlated_session_id UUID REFERENCES public.session_schedules(id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_session_schedules_location ON public.session_schedules(session_location);
CREATE INDEX IF NOT EXISTS idx_session_schedules_correlated ON public.session_schedules(correlated_session_id) WHERE correlated_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_session_schedules_max_participants ON public.session_schedules(max_participants) WHERE max_participants > 1;

-- Update existing sessions to have default location
UPDATE public.session_schedules
SET session_location = 'online'
WHERE session_location IS NULL;

