-- Create FAQ sections table
CREATE TABLE IF NOT EXISTS public.faq_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create FAQ questions table
CREATE TABLE IF NOT EXISTS public.faq_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES public.faq_sections(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.faq_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_questions ENABLE ROW LEVEL SECURITY;

-- Everyone can view active FAQ sections and questions
CREATE POLICY "Anyone can view active FAQ sections"
ON public.faq_sections
FOR SELECT
USING (is_active = true);

CREATE POLICY "Anyone can view active FAQ questions"
ON public.faq_questions
FOR SELECT
USING (is_active = true AND EXISTS (
  SELECT 1 FROM public.faq_sections 
  WHERE faq_sections.id = faq_questions.section_id 
  AND faq_sections.is_active = true
));

-- Admins can manage FAQ sections
CREATE POLICY "Admins can manage FAQ sections"
ON public.faq_sections
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can manage FAQ questions
CREATE POLICY "Admins can manage FAQ questions"
ON public.faq_questions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes
CREATE INDEX idx_faq_sections_order ON public.faq_sections(display_order);
CREATE INDEX idx_faq_sections_active ON public.faq_sections(is_active);
CREATE INDEX idx_faq_questions_section ON public.faq_questions(section_id);
CREATE INDEX idx_faq_questions_order ON public.faq_questions(section_id, display_order);
CREATE INDEX idx_faq_questions_active ON public.faq_questions(is_active);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_faq_sections_updated_at
BEFORE UPDATE ON public.faq_sections
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_faq_questions_updated_at
BEFORE UPDATE ON public.faq_questions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
