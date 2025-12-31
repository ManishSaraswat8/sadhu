-- Create settings table for platform configuration
CREATE TABLE public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'payment', 'security', 'email', 'features')),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_settings_key ON public.settings(key);
CREATE INDEX idx_settings_category ON public.settings(category);

-- Enable RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Everyone can view settings (for public settings like site name)
CREATE POLICY "Anyone can view settings"
ON public.settings
FOR SELECT
USING (true);

-- Only admins can manage settings
CREATE POLICY "Admins can manage settings"
ON public.settings
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create trigger to update updated_at
CREATE TRIGGER update_settings_updated_at
BEFORE UPDATE ON public.settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.settings (key, value, description, category) VALUES
('site_name', '"Sadhu"', 'Platform name', 'general'),
('site_description', '"Meditation and wellness platform"', 'Platform description', 'general'),
('support_email', '"support@sadhu.com"', 'Support contact email', 'general'),
('default_currency', '"usd"', 'Default currency for pricing', 'payment'),
('maintenance_mode', 'false', 'Enable/disable maintenance mode', 'general'),
('allow_registrations', 'true', 'Allow new user registrations', 'general'),
('privacy_email', '"privacy@sadhu.com"', 'Privacy contact email', 'general')
ON CONFLICT (key) DO NOTHING;

