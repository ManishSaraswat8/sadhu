-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view available practitioners" ON public.practitioners;

-- Create a new policy that actually requires authentication
CREATE POLICY "Authenticated users can view available practitioners" 
ON public.practitioners 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND available = true);