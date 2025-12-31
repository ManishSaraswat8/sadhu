-- Create videos table for managing website videos
CREATE TABLE public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL, -- YouTube, Vimeo, or direct video URL
  thumbnail_url TEXT, -- Optional thumbnail image URL
  duration TEXT, -- e.g., "5:30"
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('essential', 'tutorials', 'guide', 'general', 'step-by-step')),
  display_location TEXT NOT NULL DEFAULT 'sidebar' CHECK (display_location IN ('sidebar', 'step-by-step', 'both')),
  icon_name TEXT, -- Icon identifier (e.g., 'Play', 'Video', 'BookOpen')
  icon_color TEXT DEFAULT 'bg-primary/10 text-primary', -- Tailwind color classes
  display_order INTEGER NOT NULL DEFAULT 0, -- For ordering videos
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_videos_category ON public.videos(category);
CREATE INDEX idx_videos_display_location ON public.videos(display_location);
CREATE INDEX idx_videos_is_active ON public.videos(is_active) WHERE is_active = true;
CREATE INDEX idx_videos_display_order ON public.videos(display_order);

-- Enable RLS
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- Everyone can view active videos
CREATE POLICY "Anyone can view active videos"
ON public.videos
FOR SELECT
USING (is_active = true);

-- Admins can manage all videos
CREATE POLICY "Admins can manage all videos"
ON public.videos
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create trigger to update updated_at
CREATE TRIGGER update_videos_updated_at
BEFORE UPDATE ON public.videos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default videos (migrating from hardcoded data)
INSERT INTO public.videos (title, description, video_url, category, display_location, icon_name, icon_color, display_order) VALUES
('Getting Started', 'Essential guide to begin your practice', '/dashboard', 'essential', 'sidebar', 'Play', 'bg-primary/10 text-primary', 1),
('Step-by-Step Guides', 'Comprehensive tutorials', '/step-by-step', 'tutorials', 'sidebar', 'Video', 'bg-blue-500/10 text-blue-500', 2),
('Best Practices', 'Expert tips and techniques', '/step-by-step', 'guide', 'sidebar', 'BookOpen', 'bg-green-500/10 text-green-500', 3),
('Getting Started with Your Sadhu Board', 'Learn how to properly set up and begin your practice', '#', 'step-by-step', 'step-by-step', 'Play', 'bg-primary/10 text-primary', 1),
('Standing Practice Fundamentals', 'Master the art of standing meditation on your board', '#', 'step-by-step', 'step-by-step', 'Play', 'bg-primary/10 text-primary', 2),
('Laying Practice Techniques', 'Explore deeper relaxation with laying positions', '#', 'step-by-step', 'step-by-step', 'Play', 'bg-primary/10 text-primary', 3),
('Hand Practice for Focus', 'Use hand placement for targeted grounding', '#', 'step-by-step', 'step-by-step', 'Play', 'bg-primary/10 text-primary', 4),
('Breath Work Integration', 'Combine breathing techniques with your practice', '#', 'step-by-step', 'step-by-step', 'Play', 'bg-primary/10 text-primary', 5);

