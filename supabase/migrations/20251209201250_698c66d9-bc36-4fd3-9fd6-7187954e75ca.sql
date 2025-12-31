-- Fix foreign key: practitioner_id should reference practitioners table, not auth.users
ALTER TABLE public.practitioner_assignments 
DROP CONSTRAINT practitioner_assignments_practitioner_id_fkey;

ALTER TABLE public.practitioner_assignments 
ADD CONSTRAINT practitioner_assignments_practitioner_id_fkey 
FOREIGN KEY (practitioner_id) REFERENCES public.practitioners(id) ON DELETE CASCADE;