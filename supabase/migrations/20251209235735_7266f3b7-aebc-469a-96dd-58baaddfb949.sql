-- Create a dedicated extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move the vector extension to the extensions schema
ALTER EXTENSION vector SET SCHEMA extensions;

-- Grant usage on the extensions schema to relevant roles
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;