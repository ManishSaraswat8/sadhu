-- Add class_name column to session_schedules for named group classes
-- This allows admins to create classes with custom names like "Letting Go"
ALTER TABLE public.session_schedules 
ADD COLUMN IF NOT EXISTS class_name text;

-- Add comment explaining the field
COMMENT ON COLUMN public.session_schedules.class_name IS 'Custom name for group classes (e.g., "Letting Go"). Only admins can set/edit this.';

-- Create index for faster queries when filtering by class name
CREATE INDEX IF NOT EXISTS idx_session_schedules_class_name ON public.session_schedules(class_name) WHERE class_name IS NOT NULL;

