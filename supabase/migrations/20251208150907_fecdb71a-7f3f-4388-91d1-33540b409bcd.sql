-- Create practitioners profile table
CREATE TABLE public.practitioners (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    name text NOT NULL,
    bio text,
    specialization text,
    avatar_url text,
    hourly_rate decimal(10,2),
    available boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on practitioners
ALTER TABLE public.practitioners ENABLE ROW LEVEL SECURITY;

-- Everyone can view practitioners
CREATE POLICY "Anyone can view practitioners"
ON public.practitioners
FOR SELECT
USING (available = true);

-- Practitioners can update their own profile
CREATE POLICY "Practitioners can update own profile"
ON public.practitioners
FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can manage practitioners
CREATE POLICY "Admins can manage practitioners"
ON public.practitioners
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create session_schedules table
CREATE TABLE public.session_schedules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    practitioner_id uuid REFERENCES public.practitioners(id) ON DELETE CASCADE NOT NULL,
    client_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    scheduled_at timestamp with time zone NOT NULL,
    duration_minutes integer NOT NULL DEFAULT 60,
    room_name text NOT NULL UNIQUE,
    status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    notes text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on session_schedules
ALTER TABLE public.session_schedules ENABLE ROW LEVEL SECURITY;

-- Clients can view their own sessions
CREATE POLICY "Clients can view their sessions"
ON public.session_schedules
FOR SELECT
USING (auth.uid() = client_id);

-- Practitioners can view sessions assigned to them
CREATE POLICY "Practitioners can view assigned sessions"
ON public.session_schedules
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.practitioners 
        WHERE practitioners.id = session_schedules.practitioner_id 
        AND practitioners.user_id = auth.uid()
    )
);

-- Clients can create sessions
CREATE POLICY "Clients can book sessions"
ON public.session_schedules
FOR INSERT
WITH CHECK (auth.uid() = client_id);

-- Clients can update their own sessions (cancel)
CREATE POLICY "Clients can update their sessions"
ON public.session_schedules
FOR UPDATE
USING (auth.uid() = client_id);

-- Practitioners can update their sessions (status)
CREATE POLICY "Practitioners can update their sessions"
ON public.session_schedules
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.practitioners 
        WHERE practitioners.id = session_schedules.practitioner_id 
        AND practitioners.user_id = auth.uid()
    )
);

-- Create practitioner_availability table for scheduling
CREATE TABLE public.practitioner_availability (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    practitioner_id uuid REFERENCES public.practitioners(id) ON DELETE CASCADE NOT NULL,
    day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday
    start_time time NOT NULL,
    end_time time NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (practitioner_id, day_of_week, start_time)
);

-- Enable RLS on practitioner_availability
ALTER TABLE public.practitioner_availability ENABLE ROW LEVEL SECURITY;

-- Anyone can view availability
CREATE POLICY "Anyone can view availability"
ON public.practitioner_availability
FOR SELECT
USING (true);

-- Practitioners can manage their own availability
CREATE POLICY "Practitioners can manage own availability"
ON public.practitioner_availability
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.practitioners 
        WHERE practitioners.id = practitioner_availability.practitioner_id 
        AND practitioners.user_id = auth.uid()
    )
);

-- Trigger for updated_at
CREATE TRIGGER update_practitioners_updated_at
BEFORE UPDATE ON public.practitioners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_session_schedules_updated_at
BEFORE UPDATE ON public.session_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();