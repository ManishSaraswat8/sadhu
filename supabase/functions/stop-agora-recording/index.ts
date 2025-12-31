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
  console.log(`[STOP-AGORA-RECORDING] ${step}${detailsStr}`);
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

    if (!AGORA_APP_ID || !AGORA_CUSTOMER_ID || !AGORA_CUSTOMER_SECRET) {
      throw new Error('Agora Cloud Recording credentials not configured.');
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

    const { session_id, recording_id } = await req.json();

    if (!session_id && !recording_id) {
      return new Response(
        JSON.stringify({ error: 'Either session_id or recording_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get recording record
    let query = supabase.from('session_recordings').select('*, session_schedules!inner(*)');
    
    if (recording_id) {
      query = query.eq('id', recording_id);
    } else {
      query = query.eq('session_id', session_id);
    }

    const { data: recordings, error: recordingError } = await query
      .in('status', ['recording', 'pending'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (recordingError || !recordings || recordings.length === 0) {
      logStep('Recording not found', { error: recordingError?.message });
      return new Response(
        JSON.stringify({ error: 'Active recording not found' }),
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
        JSON.stringify({ error: 'Unauthorized to stop recording for this session' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!recording.agora_resource_id || !recording.agora_sid) {
      return new Response(
        JSON.stringify({ error: 'Recording metadata incomplete' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logStep('Stopping recording', {
      recording_id: recording.id,
      resource_id: recording.agora_resource_id,
      sid: recording.agora_sid,
    });

    // Determine recording mode (default to individual)
    const recordingMode = 'individual'; // Can be enhanced to store this in DB

    // Stop recording via Agora API
    const stopUrl = `https://api.agora.io/v1/apps/${AGORA_APP_ID}/cloud_recording/resourceid/${recording.agora_resource_id}/sid/${recording.agora_sid}/mode/${recordingMode}/stop`;
    const auth = btoa(`${AGORA_CUSTOMER_ID}:${AGORA_CUSTOMER_SECRET}`);

    // Get channel name from session or recording metadata
    const channelName = `session-${session.id}`;

    const stopBody = {
      cname: channelName,
      uid: '0',
      clientRequest: {},
    };

    logStep('Calling Agora stop API', { url: stopUrl });
    const stopResponse = await fetch(stopUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stopBody),
    });

    if (!stopResponse.ok) {
      const errorText = await stopResponse.text();
      logStep('Stop recording failed', { status: stopResponse.status, error: errorText });
      
      // Update status to failed even if API call failed
      await supabase
        .from('session_recordings')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', recording.id);
      
      throw new Error(`Failed to stop recording: ${errorText}`);
    }

    const stopData = await stopResponse.json();
    logStep('Recording stopped', { response: stopData });

    // Update recording status
    const { error: updateError } = await supabase
      .from('session_recordings')
      .update({
        status: 'processing',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', recording.id);

    if (updateError) {
      logStep('Error updating recording status', { error: updateError.message });
    }

    return new Response(
      JSON.stringify({
        success: true,
        recording_id: recording.id,
        status: 'processing',
        message: 'Recording stopped successfully. Processing will complete shortly.',
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

