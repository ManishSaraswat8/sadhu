-- Create helper function to assign admin role to a user
-- This function bypasses RLS and can be called by service role
CREATE OR REPLACE FUNCTION public.assign_admin_role(p_user_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_result JSONB;
BEGIN
  -- Find user by email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_user_email
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found with email: ' || p_user_email
    );
  END IF;

  -- Insert admin role (ON CONFLICT will handle if role already exists)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'admin'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'email', p_user_email,
    'message', 'Admin role assigned successfully'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Create helper function to assign admin role by user ID
CREATE OR REPLACE FUNCTION public.assign_admin_role_by_id(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_email TEXT;
  v_result JSONB;
BEGIN
  -- Verify user exists
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = p_user_id
  LIMIT 1;

  IF v_user_email IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found with ID: ' || p_user_id
    );
  END IF;

  -- Insert admin role (ON CONFLICT will handle if role already exists)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, 'admin'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'email', v_user_email,
    'message', 'Admin role assigned successfully'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

