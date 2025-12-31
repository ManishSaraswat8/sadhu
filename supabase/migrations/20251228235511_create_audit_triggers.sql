-- Create audit triggers for PHI tables
-- These automatically log all access to sensitive data

-- Function to get current user ID from JWT
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid();
$$;

-- Function to get client IP from request (if available)
-- Note: This will be NULL for direct database access, but Edge Functions can pass it
CREATE OR REPLACE FUNCTION public.get_client_ip()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT NULL; -- Will be set by Edge Functions via metadata
$$;

-- Trigger function for SELECT operations (viewing data)
CREATE OR REPLACE FUNCTION public.audit_select_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := public.get_current_user_id();
  
  -- Log SELECT operation
  PERFORM public.log_audit_event(
    p_user_id := v_user_id,
    p_action := 'SELECT',
    p_table_name := TG_TABLE_NAME,
    p_record_id := NEW.id, -- For SELECT, we log the record being viewed
    p_metadata := jsonb_build_object(
      'operation', 'SELECT',
      'table', TG_TABLE_NAME
    )
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NEW; -- Don't fail the SELECT operation
END;
$$;

-- Trigger function for INSERT operations
CREATE OR REPLACE FUNCTION public.audit_insert_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := public.get_current_user_id();
  
  -- Log INSERT operation
  PERFORM public.log_audit_event(
    p_user_id := v_user_id,
    p_action := 'INSERT',
    p_table_name := TG_TABLE_NAME,
    p_record_id := NEW.id,
    p_metadata := jsonb_build_object(
      'operation', 'INSERT',
      'table', TG_TABLE_NAME,
      'data', to_jsonb(NEW) - 'embedding' -- Exclude large vector data
    )
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NEW; -- Don't fail the INSERT operation
END;
$$;

-- Trigger function for UPDATE operations
CREATE OR REPLACE FUNCTION public.audit_update_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := public.get_current_user_id();
  
  -- Log UPDATE operation
  PERFORM public.log_audit_event(
    p_user_id := v_user_id,
    p_action := 'UPDATE',
    p_table_name := TG_TABLE_NAME,
    p_record_id := NEW.id,
    p_metadata := jsonb_build_object(
      'operation', 'UPDATE',
      'table', TG_TABLE_NAME,
      'old_data', to_jsonb(OLD) - 'embedding',
      'new_data', to_jsonb(NEW) - 'embedding'
    )
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NEW; -- Don't fail the UPDATE operation
END;
$$;

-- Trigger function for DELETE operations
CREATE OR REPLACE FUNCTION public.audit_delete_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := public.get_current_user_id();
  
  -- Log DELETE operation
  PERFORM public.log_audit_event(
    p_user_id := v_user_id,
    p_action := 'DELETE',
    p_table_name := TG_TABLE_NAME,
    p_record_id := OLD.id,
    p_metadata := jsonb_build_object(
      'operation', 'DELETE',
      'table', TG_TABLE_NAME,
      'deleted_data', to_jsonb(OLD) - 'embedding'
    )
  );
  
  RETURN OLD;
EXCEPTION
  WHEN OTHERS THEN
    RETURN OLD; -- Don't fail the DELETE operation
END;
$$;

-- Create triggers for session_schedules (PHI table)
CREATE TRIGGER audit_session_schedules_insert
  AFTER INSERT ON public.session_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_insert_trigger();

CREATE TRIGGER audit_session_schedules_update
  AFTER UPDATE ON public.session_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_update_trigger();

CREATE TRIGGER audit_session_schedules_delete
  AFTER DELETE ON public.session_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_delete_trigger();

-- Create triggers for meditation_memories (PHI table)
CREATE TRIGGER audit_meditation_memories_insert
  AFTER INSERT ON public.meditation_memories
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_insert_trigger();

CREATE TRIGGER audit_meditation_memories_update
  AFTER UPDATE ON public.meditation_memories
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_update_trigger();

CREATE TRIGGER audit_meditation_memories_delete
  AFTER DELETE ON public.meditation_memories
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_delete_trigger();

-- Create triggers for session_payments (PHI table)
CREATE TRIGGER audit_session_payments_insert
  AFTER INSERT ON public.session_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_insert_trigger();

CREATE TRIGGER audit_session_payments_update
  AFTER UPDATE ON public.session_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_update_trigger();

-- Create triggers for session_notes (PHI table)
CREATE TRIGGER audit_session_notes_insert
  AFTER INSERT ON public.session_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_insert_trigger();

CREATE TRIGGER audit_session_notes_update
  AFTER UPDATE ON public.session_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_update_trigger();

CREATE TRIGGER audit_session_notes_delete
  AFTER DELETE ON public.session_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_delete_trigger();

-- Note: SELECT triggers are not created automatically as they would fire too frequently
-- Instead, we'll log SELECT operations from Edge Functions and application code
-- where we can include IP address and user agent information

