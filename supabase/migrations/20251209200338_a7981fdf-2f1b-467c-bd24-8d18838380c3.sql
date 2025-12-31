-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can manage assignments" ON public.practitioner_assignments;
DROP POLICY IF EXISTS "Users can view their own assignments" ON public.practitioner_assignments;

-- Recreate as permissive policies (default)
CREATE POLICY "Admins can manage assignments" 
ON public.practitioner_assignments 
FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own assignments" 
ON public.practitioner_assignments 
FOR SELECT 
TO authenticated
USING ((auth.uid() = client_id) OR (auth.uid() = practitioner_id));