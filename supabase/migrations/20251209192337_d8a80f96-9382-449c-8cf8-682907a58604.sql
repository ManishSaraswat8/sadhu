-- Add host_room_url column to session_schedules for practitioner enhanced controls
ALTER TABLE public.session_schedules 
ADD COLUMN host_room_url text;