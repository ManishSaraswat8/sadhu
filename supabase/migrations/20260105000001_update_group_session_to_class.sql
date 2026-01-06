-- Update session_formats configuration to use "Group Class" instead of "Group Session"
UPDATE public.settings
SET value = jsonb_set(
  value,
  '{options}',
  jsonb_build_array(
    jsonb_build_object('value', false, 'label', '1:1 Session'),
    jsonb_build_object('value', true, 'label', 'Group Class')
  )
)
WHERE key = 'session_formats';

