-- Create data_retention_policies table for HIPAA compliance
-- Tracks how long data should be retained and when it should be deleted
CREATE TABLE public.data_retention_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  retention_days INTEGER NOT NULL, -- Number of days to retain data
  auto_delete BOOLEAN NOT NULL DEFAULT false, -- Whether to automatically delete
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (table_name)
);

-- Create index
CREATE INDEX idx_data_retention_policies_table ON public.data_retention_policies(table_name);

-- Enable RLS on data_retention_policies
ALTER TABLE public.data_retention_policies ENABLE ROW LEVEL SECURITY;

-- Only admins can manage retention policies
CREATE POLICY "Only admins can manage retention policies"
ON public.data_retention_policies
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Insert default retention policies
INSERT INTO public.data_retention_policies (table_name, retention_days, auto_delete, description)
VALUES
  ('session_schedules', 2555, false, 'Retain session schedules for 7 years (HIPAA requirement)'),
  ('meditation_memories', 2555, false, 'Retain meditation memories for 7 years'),
  ('session_payments', 2555, false, 'Retain payment records for 7 years (financial records)'),
  ('session_notes', 2555, false, 'Retain session notes for 7 years'),
  ('audit_logs', 2555, false, 'Retain audit logs for 7 years (compliance requirement)'),
  ('user_consents', 2555, false, 'Retain consent records for 7 years')
ON CONFLICT (table_name) DO NOTHING;

-- Create function to get retention policy for a table
CREATE OR REPLACE FUNCTION public.get_retention_policy(p_table_name TEXT)
RETURNS TABLE (
  retention_days INTEGER,
  auto_delete BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT retention_days, auto_delete
  FROM public.data_retention_policies
  WHERE table_name = p_table_name;
$$;

-- Create function to identify records that should be deleted based on retention policy
-- This function can be called by a scheduled job (cron) or Edge Function
CREATE OR REPLACE FUNCTION public.get_expired_records(p_table_name TEXT)
RETURNS TABLE (
  record_id UUID,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_retention_days INTEGER;
  v_auto_delete BOOLEAN;
BEGIN
  -- Get retention policy
  SELECT retention_days, auto_delete
  INTO v_retention_days, v_auto_delete
  FROM public.data_retention_policies
  WHERE table_name = p_table_name;

  -- If no policy or auto_delete is false, return empty
  IF v_retention_days IS NULL OR v_auto_delete = false THEN
    RETURN;
  END IF;

  -- Return records older than retention period
  -- Note: This is a generic function. For specific tables, you may need custom logic
  CASE p_table_name
    WHEN 'session_schedules' THEN
      RETURN QUERY
      SELECT id::UUID, created_at
      FROM public.session_schedules
      WHERE created_at < now() - (v_retention_days || ' days')::INTERVAL;
    WHEN 'meditation_memories' THEN
      RETURN QUERY
      SELECT id::UUID, created_at
      FROM public.meditation_memories
      WHERE created_at < now() - (v_retention_days || ' days')::INTERVAL;
    WHEN 'session_payments' THEN
      RETURN QUERY
      SELECT id::UUID, created_at
      FROM public.session_payments
      WHERE created_at < now() - (v_retention_days || ' days')::INTERVAL;
    WHEN 'session_notes' THEN
      RETURN QUERY
      SELECT id::UUID, created_at
      FROM public.session_notes
      WHERE created_at < now() - (v_retention_days || ' days')::INTERVAL;
    WHEN 'audit_logs' THEN
      RETURN QUERY
      SELECT id::UUID, created_at
      FROM public.audit_logs
      WHERE created_at < now() - (v_retention_days || ' days')::INTERVAL;
    ELSE
      -- Unknown table
      RETURN;
  END CASE;
END;
$$;

-- Create trigger to update updated_at
CREATE TRIGGER update_data_retention_policies_updated_at
BEFORE UPDATE ON public.data_retention_policies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

