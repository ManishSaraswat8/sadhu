-- Create session configuration settings
-- These allow admins to configure available options for duration, practice type, and format

-- Insert default session configuration into settings table
INSERT INTO public.settings (key, value, description, category) VALUES
('session_durations', '{"options": [20, 45, 60], "default": 45}', 'Available session durations in minutes', 'features'),
('session_practice_types', '{"options": ["standing", "laying"], "labels": {"standing": "Standing", "laying": "Laying"}}', 'Available practice types', 'features'),
('session_formats', '{"options": [{"value": false, "label": "1:1 Session"}, {"value": true, "label": "Group Session"}]}', 'Available session formats', 'features')
ON CONFLICT (key) DO NOTHING;

