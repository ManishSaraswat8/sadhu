-- Drop the existing public access policy
DROP POLICY IF EXISTS "Anyone can view practitioners" ON public.practitioners;

-- Create a new policy that only allows authenticated users to view practitioners
CREATE POLICY "Authenticated users can view available practitioners"
ON public.practitioners
FOR SELECT
TO authenticated
USING (available = true);

-- Admins can still view all practitioners (including unavailable ones)
-- This policy already exists from the original setup