import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-internal-secret',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const wherebyApiKey = Deno.env.get('WHEREBY_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!wherebyApiKey) {
      throw new Error('WHEREBY_API_KEY is not configured');
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check for internal secret (for server-to-server calls from other edge functions like stripe-session-webhook)
    const internalSecret = req.headers.get('X-Internal-Secret');
    const authHeader = req.headers.get('Authorization');

    let isAuthorized = false;
    let authenticatedUserId: string | null = null;

    // Option 1: Internal call from another edge function (trusted)
    if (internalSecret && internalSecret === SUPABASE_SERVICE_ROLE_KEY) {
      isAuthorized = true;
      console.log('Internal server-to-server call authorized');
    }
    // Option 2: Authenticated user call
    else if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: userData, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !userData.user) {
        console.error('Auth error:', authError);
        return new Response(
          JSON.stringify({ error: 'Invalid or expired token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      authenticatedUserId = userData.user.id;
      isAuthorized = true;
      console.log('Authenticated user:', authenticatedUserId);
    }
    // No valid auth
    else {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { roomName, sessionId } = await req.json();
    
    if (!roomName) {
      throw new Error('roomName is required');
    }

    // If sessionId is provided and this is a user call (not internal), verify authorization
    if (sessionId && authenticatedUserId) {
      const { data: session, error: sessionError } = await supabase
        .from('session_schedules')
        .select('client_id, practitioner_id, practitioners!inner(user_id)')
        .eq('id', sessionId)
        .single();

      if (sessionError || !session) {
        console.error('Session lookup error:', sessionError);
        return new Response(
          JSON.stringify({ error: 'Session not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if the authenticated user is either the client or the practitioner
      const isClient = session.client_id === authenticatedUserId;
      const isPractitioner = (session.practitioners as any)?.user_id === authenticatedUserId;

      if (!isClient && !isPractitioner) {
        console.error('User not authorized for this session');
        return new Response(
          JSON.stringify({ error: 'You are not authorized to create a room for this session' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log('Creating Whereby room:', roomName);

    // Calculate end date (2 hours from now)
    const endDate = new Date();
    endDate.setHours(endDate.getHours() + 2);

    // Create a Whereby meeting room
    const response = await fetch('https://api.whereby.dev/v1/meetings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${wherebyApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roomNamePrefix: roomName,
        roomMode: 'normal',
        endDate: endDate.toISOString(),
        fields: ['hostRoomUrl', 'roomUrl'],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Whereby API error:', errorText);
      throw new Error(`Whereby API error: ${response.status} - ${errorText}`);
    }

    const meeting = await response.json();
    console.log('Whereby room created successfully:', meeting.meetingId);

    // Update the session_schedules table with the Whereby room URL if sessionId provided
    if (sessionId) {
      await supabase
        .from('session_schedules')
        .update({ 
          room_name: meeting.roomUrl,
          host_room_url: meeting.hostRoomUrl 
        })
        .eq('id', sessionId);
    }

    return new Response(
      JSON.stringify({
        roomUrl: meeting.roomUrl,
        hostRoomUrl: meeting.hostRoomUrl,
        meetingId: meeting.meetingId,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error creating Whereby room:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
