import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-internal-secret',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` | ${JSON.stringify(details)}` : "";
  console.log(`[PROCESS-RECORDING] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check for internal secret (for server-to-server calls)
    const internalSecret = req.headers.get('X-Internal-Secret');
    const authHeader = req.headers.get('Authorization');

    // Allow internal calls or authenticated admin calls
    if (internalSecret !== SUPABASE_SERVICE_ROLE_KEY && authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: userData, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !userData.user) {
        return new Response(
          JSON.stringify({ error: 'Invalid authentication' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if user is admin
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userData.user.id)
        .eq('role', 'admin')
        .single();

      if (!roles) {
        return new Response(
          JSON.stringify({ error: 'Admin access required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else if (internalSecret !== SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { recording_id, recording_url } = await req.json();

    if (!recording_id) {
      return new Response(
        JSON.stringify({ error: 'recording_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logStep('Processing recording', { recording_id, recording_url });

    // Get recording record
    const { data: recording, error: recordingError } = await supabase
      .from('session_recordings')
      .select('*')
      .eq('id', recording_id)
      .single();

    if (recordingError || !recording) {
      logStep('Recording not found', { error: recordingError?.message });
      return new Response(
        JSON.stringify({ error: 'Recording not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (recording.status !== 'completed') {
      return new Response(
        JSON.stringify({ error: 'Recording is not completed yet' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the recording URL (from webhook or parameter)
    const fileUrl = recording_url || recording.recording_url;

    if (!fileUrl) {
      return new Response(
        JSON.stringify({ error: 'Recording URL not available' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logStep('Downloading recording', { file_url: fileUrl });

    // Download recording from Agora storage
    // Note: This assumes Agora provides a direct download URL
    // For S3 storage, you would use AWS SDK to download
    const downloadResponse = await fetch(fileUrl);

    if (!downloadResponse.ok) {
      logStep('Download failed', { status: downloadResponse.status });
      throw new Error(`Failed to download recording: ${downloadResponse.statusText}`);
    }

    const fileBuffer = await downloadResponse.arrayBuffer();
    const fileName = `session-${recording.session_id}-${Date.now()}.mp4`;
    const storagePath = `session-recordings/${recording.session_id}/${fileName}`;

    logStep('Uploading to Supabase Storage', { storage_path: storagePath });

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('session-recordings')
      .upload(storagePath, fileBuffer, {
        contentType: 'video/mp4',
        upsert: false,
      });

    if (uploadError) {
      logStep('Upload failed', { error: uploadError.message });
      throw uploadError;
    }

    logStep('Upload successful', { path: storagePath });

    // Generate signed URL for secure access
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('session-recordings')
      .createSignedUrl(storagePath, 3600 * 24 * 365); // 1 year expiration

    if (signedUrlError) {
      logStep('Signed URL generation failed', { error: signedUrlError.message });
    }

    // Update recording record with storage path
    const { error: updateError } = await supabase
      .from('session_recordings')
      .update({
        storage_path: storagePath,
        recording_url: signedUrlData?.signedUrl || fileUrl, // Use signed URL if available
        updated_at: new Date().toISOString(),
      })
      .eq('id', recording_id);

    if (updateError) {
      logStep('Error updating recording', { error: updateError.message });
      throw updateError;
    }

    logStep('Recording processed successfully', { recording_id, storage_path: storagePath });

    return new Response(
      JSON.stringify({
        success: true,
        recording_id,
        storage_path: storagePath,
        recording_url: signedUrlData?.signedUrl || fileUrl,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep('Error', { error: errorMessage });
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

