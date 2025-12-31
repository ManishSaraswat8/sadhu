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
  console.log(`[AGORA-RECORDING-WEBHOOK] ${step}${detailsStr}`);
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

    // Agora webhook payload structure
    const payload = await req.json();
    logStep('Webhook received', { payload });

    const { eventType, notifyId, resourceId, sid, status, serverResponse } = payload;

    if (!resourceId || !sid) {
      logStep('Missing required fields', { resourceId, sid });
      return new Response(
        JSON.stringify({ error: 'Missing resourceId or sid' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find recording by resource_id and sid
    const { data: recordings, error: recordingError } = await supabase
      .from('session_recordings')
      .select('*')
      .eq('agora_resource_id', resourceId)
      .eq('agora_sid', sid)
      .limit(1);

    if (recordingError) {
      logStep('Error finding recording', { error: recordingError.message });
      throw recordingError;
    }

    if (!recordings || recordings.length === 0) {
      logStep('Recording not found', { resourceId, sid });
      return new Response(
        JSON.stringify({ error: 'Recording not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const recording = recordings[0];
    logStep('Processing webhook', { 
      recording_id: recording.id, 
      event_type: eventType, 
      status 
    });

    // Update recording based on event type
    let updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    switch (eventType) {
      case 'recording_started':
        updateData.status = 'recording';
        updateData.started_at = new Date().toISOString();
        break;

      case 'recording_stopped':
        updateData.status = 'processing';
        updateData.completed_at = new Date().toISOString();
        
        // Extract file information from serverResponse if available
        if (serverResponse?.fileList) {
          const fileList = serverResponse.fileList;
          if (fileList.length > 0) {
            // Store first file URL (can be enhanced to store all files)
            const firstFile = fileList[0];
            updateData.recording_url = firstFile.fileName || firstFile.fileUrl;
            
            // Calculate duration if available
            if (firstFile.trackType === 'audio_and_video' && firstFile.duration) {
              updateData.duration_seconds = firstFile.duration;
            }
          }
        }
        break;

      case 'recording_ready':
        updateData.status = 'completed';
        
        // Extract file information
        if (serverResponse?.fileList) {
          const fileList = serverResponse.fileList;
          if (fileList.length > 0) {
            const firstFile = fileList[0];
            updateData.recording_url = firstFile.fileName || firstFile.fileUrl;
            
            if (firstFile.trackType === 'audio_and_video' && firstFile.duration) {
              updateData.duration_seconds = firstFile.duration;
            }
            
            if (firstFile.size) {
              updateData.file_size_bytes = firstFile.size;
            }
          }
        }
        break;

      case 'recording_failed':
        updateData.status = 'failed';
        break;

      default:
        logStep('Unknown event type', { eventType });
    }

    // Update recording record
    const { error: updateError } = await supabase
      .from('session_recordings')
      .update(updateData)
      .eq('id', recording.id);

    if (updateError) {
      logStep('Error updating recording', { error: updateError.message });
      throw updateError;
    }

    logStep('Recording updated', { recording_id: recording.id, update_data: updateData });

    // If recording is completed, trigger processing function
    if (updateData.status === 'completed' && updateData.recording_url) {
      try {
        // Call process-recording function asynchronously
        const processUrl = `${SUPABASE_URL}/functions/v1/process-recording`;
        fetch(processUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recording_id: recording.id,
            recording_url: updateData.recording_url,
          }),
        }).catch((error) => {
          logStep('Error triggering process-recording', { error });
          // Non-critical error, continue
        });
      } catch (error) {
        logStep('Error calling process-recording', { error });
        // Non-critical error, continue
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        recording_id: recording.id,
        status: updateData.status,
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

