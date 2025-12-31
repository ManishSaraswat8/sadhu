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
  console.log(`[START-AGORA-RECORDING] ${step}${detailsStr}`);
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
      throw new Error('Agora Cloud Recording credentials not configured. Please set AGORA_CUSTOMER_ID and AGORA_CUSTOMER_SECRET in Supabase secrets.');
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

    const { session_id, channel_name, recording_mode = 'individual' } = await req.json();

    if (!session_id || !channel_name) {
      return new Response(
        JSON.stringify({ error: 'session_id and channel_name are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logStep('Starting recording', { session_id, channel_name, recording_mode });

    // Verify session exists and user has access
    const { data: session, error: sessionError } = await supabase
      .from('session_schedules')
      .select('id, practitioner_id, client_id, scheduled_at, duration_minutes')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      logStep('Session not found', { error: sessionError?.message });
      return new Response(
        JSON.stringify({ error: 'Session not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is practitioner or client
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
        JSON.stringify({ error: 'Unauthorized to start recording for this session' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if recording already exists
    const { data: existingRecording } = await supabase
      .from('session_recordings')
      .select('id, status, agora_sid')
      .eq('session_id', session_id)
      .in('status', ['pending', 'recording'])
      .single();

    if (existingRecording) {
      logStep('Recording already exists', { recording_id: existingRecording.id });
      return new Response(
        JSON.stringify({
          success: true,
          recording_id: existingRecording.id,
          status: existingRecording.status,
          agora_sid: existingRecording.agora_sid,
          message: 'Recording already in progress',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 1: Acquire resource
    const acquireUrl = `https://api.agora.io/v1/apps/${AGORA_APP_ID}/cloud_recording/acquire`;
    const acquireAuth = btoa(`${AGORA_CUSTOMER_ID}:${AGORA_CUSTOMER_SECRET}`);

    const acquireBody = {
      cname: channel_name,
      uid: '0', // Recording service uses uid 0
      clientRequest: {
        resourceExpiredHour: 24,
      },
    };

    logStep('Acquiring resource', { url: acquireUrl });
    const acquireResponse = await fetch(acquireUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${acquireAuth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(acquireBody),
    });

    if (!acquireResponse.ok) {
      const errorText = await acquireResponse.text();
      logStep('Acquire failed', { status: acquireResponse.status, error: errorText });
      throw new Error(`Failed to acquire recording resource: ${errorText}`);
    }

    const acquireData = await acquireResponse.json();
    const resourceId = acquireData.resourceId;

    if (!resourceId) {
      throw new Error('Failed to acquire resource ID from Agora');
    }

    logStep('Resource acquired', { resource_id: resourceId });

    // Step 2: Start recording
    const startUrl = `https://api.agora.io/v1/apps/${AGORA_APP_ID}/cloud_recording/resourceid/${resourceId}/mode/${recording_mode}/start`;
    
    const webhookUrl = `${SUPABASE_URL}/functions/v1/agora-recording-webhook`;
    
    const startBody = {
      cname: channel_name,
      uid: '0',
      clientRequest: {
        token: '', // Can be empty if channel is not token-enabled
        recordingConfig: {
          maxIdleTime: 30,
          streamTypes: 2, // Record audio and video
          audioProfile: 1, // Standard audio profile
          channelType: 0, // Communication channel
          videoStreamType: 0, // Low stream
          subscribeVideoUids: [], // Record all users
          subscribeAudioUids: [], // Record all users
        },
        storageConfig: {
          vendor: 0, // Agora Cloud Storage (0) or S3 (1)
          region: 0, // Region ID
          bucket: '', // Will be configured in Agora Console
          accessKey: '',
          secretKey: '',
          fileNamePrefix: [`session_${session_id}`],
        },
        recordingFileConfig: {
          avFileType: ['hls', 'mp4'], // Record in both formats
        },
      },
    };

    logStep('Starting recording', { url: startUrl });
    const startResponse = await fetch(startUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${acquireAuth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(startBody),
    });

    if (!startResponse.ok) {
      const errorText = await startResponse.text();
      logStep('Start recording failed', { status: startResponse.status, error: errorText });
      throw new Error(`Failed to start recording: ${errorText}`);
    }

    const startData = await startResponse.json();
    const sid = startData.sid;

    if (!sid) {
      throw new Error('Failed to get recording SID from Agora');
    }

    logStep('Recording started', { sid, resource_id: resourceId });

    // Create recording record in database
    const { data: recording, error: recordingError } = await supabase
      .from('session_recordings')
      .insert({
        session_id,
        agora_resource_id: resourceId,
        agora_sid: sid,
        status: 'recording',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (recordingError) {
      logStep('Error creating recording record', { error: recordingError.message });
      // Recording is started in Agora, but we failed to save metadata
      // Try to stop the recording
      try {
        await fetch(`https://api.agora.io/v1/apps/${AGORA_APP_ID}/cloud_recording/resourceid/${resourceId}/sid/${sid}/mode/${recording_mode}/stop`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${acquireAuth}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ cname: channel_name, uid: '0', clientRequest: {} }),
        });
      } catch (stopError) {
        logStep('Failed to stop recording after DB error', { error: stopError });
      }
      throw recordingError;
    }

    logStep('Recording record created', { recording_id: recording.id });

    return new Response(
      JSON.stringify({
        success: true,
        recording_id: recording.id,
        resource_id: resourceId,
        sid,
        status: 'recording',
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

