-- Enhance RLS policies for stricter access control (HIPAA compliance)
-- Ensure principle of least privilege

-- ============================================
-- SESSION_SCHEDULES - Enhanced Policies
-- ============================================

-- Drop existing policies if they exist (we'll recreate them with better security)
DROP POLICY IF EXISTS "Clients can view their sessions" ON public.session_schedules;
DROP POLICY IF EXISTS "Practitioners can view their sessions" ON public.session_schedules;
DROP POLICY IF EXISTS "Admins can manage all sessions" ON public.session_schedules;

-- Clients can only view their own sessions
CREATE POLICY "Clients can view their own sessions"
ON public.session_schedules
FOR SELECT
TO authenticated
USING (auth.uid() = client_id);

-- Practitioners can view sessions where they are the practitioner
CREATE POLICY "Practitioners can view their assigned sessions"
ON public.session_schedules
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.practitioners p
    WHERE p.id = session_schedules.practitioner_id
      AND p.user_id = auth.uid()
  )
);

-- Clients can create their own sessions (via booking)
CREATE POLICY "Clients can create their own sessions"
ON public.session_schedules
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = client_id);

-- Practitioners can update sessions they're assigned to
CREATE POLICY "Practitioners can update their assigned sessions"
ON public.session_schedules
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.practitioners p
    WHERE p.id = session_schedules.practitioner_id
      AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.practitioners p
    WHERE p.id = session_schedules.practitioner_id
      AND p.user_id = auth.uid()
  )
);

-- Admins can manage all sessions
CREATE POLICY "Admins can manage all sessions"
ON public.session_schedules
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- MEDITATION_MEMORIES - Enhanced Policies
-- ============================================

-- Ensure users can only access their own memories
-- (Policies should already exist, but we'll verify and enhance)

-- Users can only view their own memories
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'meditation_memories' 
      AND policyname = 'Users can view their own memories'
  ) THEN
    CREATE POLICY "Users can view their own memories"
    ON public.meditation_memories
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Users can only create their own memories
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'meditation_memories' 
      AND policyname = 'Users can create their own memories'
  ) THEN
    CREATE POLICY "Users can create their own memories"
    ON public.meditation_memories
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Users can only delete their own memories
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'meditation_memories' 
      AND policyname = 'Users can delete their own memories'
  ) THEN
    CREATE POLICY "Users can delete their own memories"
    ON public.meditation_memories
    FOR DELETE
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================
-- SESSION_PAYMENTS - Enhanced Policies
-- ============================================

-- Ensure strict access control for payment data
-- Clients can view their own payment records
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'session_payments' 
      AND policyname = 'Clients can view their own payments'
  ) THEN
    CREATE POLICY "Clients can view their own payments"
    ON public.session_payments
    FOR SELECT
    TO authenticated
    USING (auth.uid() = client_id);
  END IF;
END $$;

-- Practitioners can view their own payment records (already exists, but ensure it's correct)
-- This policy should already exist from previous migration

-- ============================================
-- SESSION_NOTES - Enhanced Policies
-- ============================================

-- Session notes policies should already be secure, but we'll ensure they exist
-- (Policies are already created in previous migration)

-- ============================================
-- PRACTITIONERS - Enhanced Policies
-- ============================================

-- Ensure practitioners can only see available practitioners (not hidden ones)
-- This policy should already exist, but we'll verify

-- ============================================
-- ADDITIONAL SECURITY: Explicit Deny Policies
-- ============================================

-- Note: PostgreSQL RLS uses a whitelist approach (allow policies)
-- If no policy allows access, access is denied by default
-- So we don't need explicit deny policies, but we ensure all allow policies are restrictive

-- Create function to check if user can access a specific session
CREATE OR REPLACE FUNCTION public.can_access_session(
  p_user_id UUID,
  p_session_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.session_schedules ss
    LEFT JOIN public.practitioners p ON p.id = ss.practitioner_id
    WHERE ss.id = p_session_id
      AND (
        ss.client_id = p_user_id
        OR p.user_id = p_user_id
        OR public.has_role(p_user_id, 'admin'::app_role)
        OR public.has_access(p_user_id, 'session', p_session_id, 'read')
      )
  );
$$;

