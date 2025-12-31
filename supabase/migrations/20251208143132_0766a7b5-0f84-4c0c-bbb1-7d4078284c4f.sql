-- Create practitioner role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'practitioner', 'user');

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create practitioner_assignments table
CREATE TABLE public.practitioner_assignments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    practitioner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    client_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (practitioner_id, client_id)
);

-- Enable RLS on practitioner_assignments
ALTER TABLE public.practitioner_assignments ENABLE ROW LEVEL SECURITY;

-- Create function to check if user is assigned practitioner
CREATE OR REPLACE FUNCTION public.is_practitioner_of(_practitioner_id uuid, _client_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.practitioner_assignments
    WHERE practitioner_id = _practitioner_id
      AND client_id = _client_id
  )
$$;

-- RLS policies for practitioner_assignments
CREATE POLICY "Users can view their own assignments"
ON public.practitioner_assignments
FOR SELECT
USING (auth.uid() = client_id OR auth.uid() = practitioner_id);

CREATE POLICY "Admins can manage assignments"
ON public.practitioner_assignments
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create action_checklist table
CREATE TABLE public.action_checklist (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    practitioner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    description text,
    completed boolean NOT NULL DEFAULT false,
    due_date date,
    priority integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on action_checklist
ALTER TABLE public.action_checklist ENABLE ROW LEVEL SECURITY;

-- RLS policies for action_checklist
CREATE POLICY "Clients can view their own checklist"
ON public.action_checklist
FOR SELECT
USING (auth.uid() = client_id);

CREATE POLICY "Clients can update completion status only"
ON public.action_checklist
FOR UPDATE
USING (auth.uid() = client_id)
WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Assigned practitioners can manage client checklists"
ON public.action_checklist
FOR ALL
TO authenticated
USING (
    public.is_practitioner_of(auth.uid(), client_id)
    OR public.has_role(auth.uid(), 'admin')
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for action_checklist
CREATE TRIGGER update_action_checklist_updated_at
BEFORE UPDATE ON public.action_checklist
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();