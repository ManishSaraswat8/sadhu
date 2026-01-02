-- Create practitioner_applications table
CREATE TABLE public.practitioner_applications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    city text NOT NULL,
    country text NOT NULL,
    years_experience text NOT NULL,
    specializations text[] NOT NULL,
    certifications text,
    current_practice text NOT NULL,
    personal_story text NOT NULL,
    why_join text NOT NULL,
    availability text NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by uuid REFERENCES auth.users(id),
    reviewed_at timestamp with time zone,
    review_notes text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.practitioner_applications ENABLE ROW LEVEL SECURITY;

-- Anyone can insert applications (public form)
CREATE POLICY "Anyone can submit applications"
ON public.practitioner_applications
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Admins can view and manage all applications
CREATE POLICY "Admins can manage applications"
ON public.practitioner_applications
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create index for status filtering
CREATE INDEX idx_practitioner_applications_status ON public.practitioner_applications(status);
CREATE INDEX idx_practitioner_applications_created_at ON public.practitioner_applications(created_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_practitioner_applications_updated_at
BEFORE UPDATE ON public.practitioner_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

