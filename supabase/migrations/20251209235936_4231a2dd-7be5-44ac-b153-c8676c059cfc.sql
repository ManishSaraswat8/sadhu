-- Fix practitioners table: ensure only authenticated users can view
DROP POLICY IF EXISTS "Authenticated users can view available practitioners" ON public.practitioners;
DROP POLICY IF EXISTS "Anyone can view practitioners" ON public.practitioners;

CREATE POLICY "Authenticated users can view available practitioners"
ON public.practitioners
FOR SELECT
TO authenticated
USING (available = true);

-- Fix practitioner_availability table: require authentication
DROP POLICY IF EXISTS "Anyone can view availability" ON public.practitioner_availability;

CREATE POLICY "Authenticated users can view availability"
ON public.practitioner_availability
FOR SELECT
TO authenticated
USING (true);