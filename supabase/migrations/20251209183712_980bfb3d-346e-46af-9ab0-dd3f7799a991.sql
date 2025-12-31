-- Rename hourly_rate to half_hour_rate
ALTER TABLE public.practitioners 
RENAME COLUMN hourly_rate TO half_hour_rate;

-- Add comment for clarity
COMMENT ON COLUMN public.practitioners.half_hour_rate IS 'Rate per 30-minute session';