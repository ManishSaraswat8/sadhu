import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` | ${JSON.stringify(details)}` : "";
  console.log(`[GET-RECORDING-STATUS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const AGORA_APP_ID = Deno.env.get('AGORA_APP_ID');
    const AGORA_CUSTOMER_ID = Deno.env.get('AGORA_CUSTOMER_ID');
    const AGORA_CUSTOMER_SECRET = Deno.env.get('AGORA_CUSTOMER_SECRET');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase environment variables');
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
      logStep('Auth error', { error: authError?.message });
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { session_id, recording_id } = await req.json().catch(() => ({}));

    if (!session_id && !recording_id) {
      return new Response(
        JSON.stringify({ error: 'Either session_id or recording_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get recording from database
    let query = supabase
      .from('session_recordings')
      .select('*, session_schedules!inner(*)');

    if (recording_id) {
      query = query.eq('id', recording_id);
    } else {
      query = query.eq('session_id', session_id);
    }

    const { data: recordings, error: recordingError } = await query
      .order('created_at', { ascending: false })
      .limit(1);

    if (recordingError || !recordings || recordings.length === 0) {
      logStep('Recording not found', { error: recordingError?.message });
      return new Response(
        JSON.stringify({ error: 'Recording not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const recording = recordings[0];
    const session = recording.session_schedules;

    // Verify user has access
    const isPractitioner = session.practitioner_id && (
      await supabase
        .from('practitioners')
        .select('user_id')
        .eq('id', session.practitioner_id)
        .single()
    ).data?.user_id === userData.user.id;

    const isClient = session.client_id === userData.user.id;

    if (!isPractitioner && !isClient) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized to view this recording' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If recording is in progress, get status from Agora API
    let agoraStatus = null;
    if (recording.status === 'recording' && recording.agora_resource_id && recording.agora_sid) {
      try {
        if (AGORA_APP_ID && AGORA_CUSTOMER_ID && AGORA_CUSTOMER_SECRET) {
          const statusUrl = `https://api.agora.io/v1/apps/${AGORA_APP_ID}/cloud_recording/resourceid/${recording.agora_resource_id}/sid/${recording.agora_sid}/mode/individual/query`;
          const auth = btoa(`${AGORA_CUSTOMER_ID}:${AGORA_CUSTOMER_SECRET}`);
          const channelName = `session-${session.id}`;

          const statusResponse = await fetch(statusUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/json',
            },
          });

          if (statusResponse.ok) {
            agoraStatus = await statusResponse.json();
            logStep('Agora status retrieved', { status: agoraStatus });
          }
        }
      } catch (error) {
        logStep('Error fetching Agora status', { error });
        // Continue without Agora status
      }
    }

    return new Response(
      JSON.stringify({
        recording: {
          id: recording.id,
          session_id: recording.session_id,
          status: recording.status,
          agora_resource_id: recording.agora_resource_id,
          agora_sid: recording.agora_sid,
          recording_url: recording.recording_url,
          storage_path: recording.storage_path,
          duration_seconds: recording.duration_seconds,
          file_size_bytes: recording.file_size_bytes,
          started_at: recording.started_at,
          completed_at: recording.completed_at,
          created_at: recording.created_at,
          updated_at: recording.updated_at,
        },
        agora_status: agoraStatus,
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

