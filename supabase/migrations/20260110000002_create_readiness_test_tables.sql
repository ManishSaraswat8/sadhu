-- Create readiness test questions table
CREATE TABLE IF NOT EXISTS public.readiness_test_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create readiness test options table
CREATE TABLE IF NOT EXISTS public.readiness_test_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.readiness_test_questions(id) ON DELETE CASCADE,
  option_value TEXT NOT NULL, -- A, B, C, D, E
  option_label TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(question_id, option_value)
);

-- Create readiness test results table
CREATE TABLE IF NOT EXISTS public.readiness_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  score_min INTEGER NOT NULL,
  score_max INTEGER NOT NULL,
  description TEXT NOT NULL,
  best_use TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CHECK (score_min <= score_max)
);

-- Enable RLS
ALTER TABLE public.readiness_test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.readiness_test_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.readiness_test_results ENABLE ROW LEVEL SECURITY;

-- Everyone can view active readiness test content
CREATE POLICY "Anyone can view active readiness test questions"
ON public.readiness_test_questions
FOR SELECT
USING (is_active = true);

CREATE POLICY "Anyone can view readiness test options"
ON public.readiness_test_options
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.readiness_test_questions 
  WHERE readiness_test_questions.id = readiness_test_options.question_id 
  AND readiness_test_questions.is_active = true
));

CREATE POLICY "Anyone can view active readiness test results"
ON public.readiness_test_results
FOR SELECT
USING (is_active = true);

-- Admins can manage readiness test content
CREATE POLICY "Admins can manage readiness test questions"
ON public.readiness_test_questions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage readiness test options"
ON public.readiness_test_options
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage readiness test results"
ON public.readiness_test_results
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes
CREATE INDEX idx_readiness_questions_order ON public.readiness_test_questions(display_order);
CREATE INDEX idx_readiness_questions_active ON public.readiness_test_questions(is_active);
CREATE INDEX idx_readiness_options_question ON public.readiness_test_options(question_id);
CREATE INDEX idx_readiness_options_order ON public.readiness_test_options(question_id, display_order);
CREATE INDEX idx_readiness_results_order ON public.readiness_test_results(display_order);
CREATE INDEX idx_readiness_results_active ON public.readiness_test_results(is_active);
CREATE INDEX idx_readiness_results_score_range ON public.readiness_test_results(score_min, score_max);

-- Create triggers for updated_at
CREATE TRIGGER update_readiness_questions_updated_at
BEFORE UPDATE ON public.readiness_test_questions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_readiness_options_updated_at
BEFORE UPDATE ON public.readiness_test_options
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_readiness_results_updated_at
BEFORE UPDATE ON public.readiness_test_results
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
