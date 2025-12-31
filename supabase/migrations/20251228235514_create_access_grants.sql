-- Create access_grants table for explicit data sharing permissions
-- Supports consent-based access and temporary access grants
CREATE TABLE public.access_grants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  grantor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, -- User granting access
  grantee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, -- User receiving access
  resource_type TEXT NOT NULL CHECK (resource_type IN ('session', 'memory', 'note', 'profile')),
  resource_id UUID NOT NULL, -- ID of the resource being shared
  permission TEXT NOT NULL CHECK (permission IN ('read', 'write', 'delete')),
  expires_at TIMESTAMP WITH TIME ZONE, -- Optional expiration date
  revoked_at TIMESTAMP WITH TIME ZONE, -- When access was revoked
  reason TEXT, -- Reason for granting access
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (grantor_id, grantee_id, resource_type, resource_id, permission)
);

-- Create indexes
CREATE INDEX idx_access_grants_grantor ON public.access_grants(grantor_id);
CREATE INDEX idx_access_grants_grantee ON public.access_grants(grantee_id);
CREATE INDEX idx_access_grants_resource ON public.access_grants(resource_type, resource_id);
-- Index for active grants (without time-based predicate - now() is not immutable)
CREATE INDEX idx_access_grants_active ON public.access_grants(grantee_id, resource_type, resource_id)
  WHERE revoked_at IS NULL;

-- Enable RLS on access_grants
ALTER TABLE public.access_grants ENABLE ROW LEVEL SECURITY;

-- Grantors can view grants they've created
CREATE POLICY "Grantors can view their grants"
ON public.access_grants
FOR SELECT
USING (auth.uid() = grantor_id);

-- Grantees can view grants they've received
CREATE POLICY "Grantees can view their grants"
ON public.access_grants
FOR SELECT
USING (auth.uid() = grantee_id);

-- Grantors can create grants
CREATE POLICY "Grantors can create grants"
ON public.access_grants
FOR INSERT
WITH CHECK (auth.uid() = grantor_id);

-- Grantors can revoke their grants
CREATE POLICY "Grantors can revoke their grants"
ON public.access_grants
FOR UPDATE
USING (auth.uid() = grantor_id)
WITH CHECK (auth.uid() = grantor_id);

-- Admins can view all grants
CREATE POLICY "Admins can view all grants"
ON public.access_grants
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create function to check if user has access to a resource
CREATE OR REPLACE FUNCTION public.has_access(
  p_user_id UUID,
  p_resource_type TEXT,
  p_resource_id UUID,
  p_permission TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.access_grants
    WHERE grantee_id = p_user_id
      AND resource_type = p_resource_type
      AND resource_id = p_resource_id
      AND permission = p_permission
      AND revoked_at IS NULL
      AND (expires_at IS NULL OR expires_at > now())
  );
$$;

-- Create trigger to update updated_at
CREATE TRIGGER update_access_grants_updated_at
BEFORE UPDATE ON public.access_grants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

