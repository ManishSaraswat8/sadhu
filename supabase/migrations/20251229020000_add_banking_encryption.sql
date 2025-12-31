-- Enable pgcrypto extension for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create function to encrypt banking information
-- This function uses pgcrypto's pgp_sym_encrypt for AES encryption
CREATE OR REPLACE FUNCTION public.encrypt_banking_info(
  p_account_number TEXT,
  p_routing_number TEXT,
  p_encryption_key TEXT
)
RETURNS TABLE (
  encrypted_account_number TEXT,
  encrypted_routing_number TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Encrypt using pgcrypto's pgp_sym_encrypt
  -- This uses AES encryption with the provided key
  RETURN QUERY
  SELECT
    encode(pgp_sym_encrypt(p_account_number, p_encryption_key), 'base64') as encrypted_account_number,
    encode(pgp_sym_encrypt(p_routing_number, p_encryption_key), 'base64') as encrypted_routing_number;
END;
$$;

-- Create function to decrypt banking information (for admin use only)
-- This should only be accessible to admins via Edge Functions
CREATE OR REPLACE FUNCTION public.decrypt_banking_info(
  p_encrypted_account_number TEXT,
  p_encrypted_routing_number TEXT,
  p_encryption_key TEXT
)
RETURNS TABLE (
  account_number TEXT,
  routing_number TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Decrypt using pgcrypto's pgp_sym_decrypt
  RETURN QUERY
  SELECT
    pgp_sym_decrypt(decode(p_encrypted_account_number, 'base64'), p_encryption_key) as account_number,
    pgp_sym_decrypt(decode(p_encrypted_routing_number, 'base64'), p_encryption_key) as routing_number;
END;
$$;

-- Grant execute permissions to authenticated users (for encryption)
GRANT EXECUTE ON FUNCTION public.encrypt_banking_info(TEXT, TEXT, TEXT) TO authenticated;

-- Only grant decrypt to service role (via Edge Functions with service role key)
-- Regular users should NOT be able to decrypt
-- This is handled via Edge Functions that use SUPABASE_SERVICE_ROLE_KEY

-- Add comment explaining encryption
COMMENT ON FUNCTION public.encrypt_banking_info IS 'Encrypts banking information using pgcrypto AES encryption. Requires BANKING_ENCRYPTION_KEY to be set in Supabase secrets.';
COMMENT ON FUNCTION public.decrypt_banking_info IS 'Decrypts banking information. Should only be called by admin Edge Functions using service role key.';

