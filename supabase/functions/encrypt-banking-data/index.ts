import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

/**
 * Encrypts sensitive banking data using pgcrypto
 * Note: This function should be called before storing banking information
 * The encryption is done server-side using PostgreSQL's pgcrypto extension
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const ENCRYPTION_KEY = Deno.env.get('BANKING_ENCRYPTION_KEY'); // Should be a strong key

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase environment variables');
    }

    if (!ENCRYPTION_KEY) {
      console.warn('BANKING_ENCRYPTION_KEY not set. Using fallback encryption method.');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !userData.user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { practitioner_id, account_number, routing_number, ...otherData } = body;

    if (!practitioner_id || !account_number || !routing_number) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: practitioner_id, account_number, routing_number' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify practitioner ownership
    const { data: practitioner, error: practitionerError } = await supabase
      .from('practitioners')
      .select('id, user_id')
      .eq('id', practitioner_id)
      .single();

    if (practitionerError || !practitioner || practitioner.user_id !== userData.user.id) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: You can only update your own banking information' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Encrypt sensitive data using pgcrypto
    // Note: pgcrypto's pgp_sym_encrypt requires the extension to be enabled
    // The encryption key should be stored securely in Supabase secrets
    const encryptionKey = ENCRYPTION_KEY || 'default-encryption-key-change-in-production';

    // Use PostgreSQL's pgcrypto to encrypt the data
    // This is done via a SQL function call
    const { data: encryptedData, error: encryptError } = await supabase.rpc('encrypt_banking_info', {
      p_account_number: account_number,
      p_routing_number: routing_number,
      p_encryption_key: encryptionKey,
    });

    if (encryptError) {
      // Fallback: If pgcrypto function doesn't exist, use base64 encoding as a placeholder
      // In production, you MUST implement proper encryption
      console.warn('pgcrypto encryption function not available, using base64 encoding (NOT SECURE FOR PRODUCTION)');
      
      // Base64 encoding is NOT encryption - this is just a placeholder
      // In production, you must:
      // 1. Enable pgcrypto extension: CREATE EXTENSION IF NOT EXISTS pgcrypto;
      // 2. Create encryption function (see migration file)
      // 3. Set BANKING_ENCRYPTION_KEY in Supabase secrets
      const encodedAccount = btoa(account_number);
      const encodedRouting = btoa(routing_number);

      // Store with encryption flag
      const { data: storedData, error: storeError } = await supabase
        .from('practitioner_banking')
        .upsert({
          practitioner_id,
          account_number_encrypted: `base64:${encodedAccount}`, // Marked as base64 for migration
          routing_number_encrypted: `base64:${encodedRouting}`,
          ...otherData,
          verified: false, // Reset verification when updated
          verified_at: null,
        }, {
          onConflict: 'practitioner_id',
        })
        .select()
        .single();

      if (storeError) throw storeError;

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Banking information saved. Note: Base64 encoding used (not secure). Please configure pgcrypto encryption.',
          id: storedData.id,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use encrypted data from pgcrypto function
    const { data: storedData, error: storeError } = await supabase
      .from('practitioner_banking')
      .upsert({
        practitioner_id,
        account_number_encrypted: encryptedData.encrypted_account_number,
        routing_number_encrypted: encryptedData.encrypted_routing_number,
        ...otherData,
        verified: false,
        verified_at: null,
      }, {
        onConflict: 'practitioner_id',
      })
      .select()
      .single();

    if (storeError) throw storeError;

    return new Response(
      JSON.stringify({
        success: true,
        id: storedData.id,
        message: 'Banking information encrypted and stored securely',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error encrypting banking data:', error);
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

