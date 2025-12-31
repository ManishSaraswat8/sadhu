import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-internal-secret',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const AGORA_APP_ID = Deno.env.get('AGORA_APP_ID');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase environment variables');
    }

    if (!AGORA_APP_ID) {
      throw new Error('AGORA_APP_ID is not configured. Please set it in Supabase secrets: supabase secrets set AGORA_APP_ID=your_app_id');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Read request body once
    const body = await req.json().catch(() => ({}));
    const { channelName, sessionId, isGroup, durationMinutes } = body;

    // Check for internal secret (for server-to-server calls from other edge functions)
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
      
      try {
        const { data: userData, error: authError } = await supabase.auth.getUser(token);

        if (authError) {
          // If error is about missing sub claim, it's likely a service_role token
          // Allow service_role tokens only for testing (when no sessionId is provided)
          if (authError.message?.includes('sub claim') || authError.code === 'bad_jwt') {
            if (sessionId) {
              // If sessionId is provided, we need a real user token
              console.error('Service role token cannot be used with sessionId');
              return new Response(
                JSON.stringify({ 
                  error: 'Invalid token type. When providing sessionId, this function requires a user authentication token, not a service role token.' 
                }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            } else {
              // Allow service_role for testing without sessionId
              console.log('Service role token accepted for testing (no sessionId)');
              isAuthorized = true;
              authenticatedUserId = null; // No user for service_role
            }
          } else {
            console.error('Auth error:', authError);
            return new Response(
              JSON.stringify({ error: `Authentication failed: ${authError.message || 'Invalid token'}` }),
              { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        } else if (userData.user) {
          // Valid user token
          authenticatedUserId = userData.user.id;
          isAuthorized = true;
          console.log('Authenticated user:', authenticatedUserId);
        } else {
          return new Response(
            JSON.stringify({ error: 'User not found in token' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch (err: any) {
        console.error('Token validation error:', err);
        return new Response(
          JSON.stringify({ error: `Token validation failed: ${err.message || 'Unknown error'}` }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    // No valid auth
    else {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!channelName) {
      throw new Error('channelName is required');
    }

    // If sessionId is provided and this is a user call (not internal), verify authorization
    if (sessionId && authenticatedUserId) {
      const { data: session, error: sessionError } = await supabase
        .from('session_schedules')
        .select(`
          client_id, 
          practitioner_id, 
          practitioners!inner(user_id),
          is_group,
          group_sessions(client_id)
        `)
        .eq('id', sessionId)
        .single();

      if (sessionError || !session) {
        console.error('Session lookup error:', sessionError);
        return new Response(
          JSON.stringify({ error: 'Session not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // For 1:1 sessions, check if user is client or practitioner
      if (!session.is_group) {
        const isClient = session.client_id === authenticatedUserId;
        const isPractitioner = (session.practitioners as any)?.user_id === authenticatedUserId;

        if (!isClient && !isPractitioner) {
          console.error('User not authorized for this 1:1 session');
          return new Response(
            JSON.stringify({ error: 'You are not authorized to create a room for this session' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else {
        // For group sessions, check if user is practitioner or in the group participants
        const isPractitioner = (session.practitioners as any)?.user_id === authenticatedUserId;
        const groupParticipants = session.group_sessions || [];
        const isParticipant = groupParticipants.some((gp: any) => gp.client_id === authenticatedUserId);

        if (!isPractitioner && !isParticipant) {
          console.error('User not authorized for this group session');
          return new Response(
            JSON.stringify({ error: 'You are not authorized to create a room for this group session' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    console.log(`Creating Agora room/channel: ${channelName}, isGroup: ${isGroup || false}`);

    // Note: Agora channels are created automatically when the first user joins
    // We just need to return the channel information and app ID
    // The actual channel creation happens client-side when users join

    const channelInfo = {
      channelName,
      appId: AGORA_APP_ID,
      isGroup: isGroup || false,
      // Agora channels don't have explicit creation - they exist when users join
      // We can optionally set channel properties via REST API if needed
    };

    // Update the session_schedules table with the Agora channel name if sessionId provided
    if (sessionId) {
      await supabase
        .from('session_schedules')
        .update({
          room_name: channelName,
          // Agora doesn't have separate host URLs like Whereby
          host_room_url: null,
        })
        .eq('id', sessionId);
    }

    console.log('Agora channel info prepared successfully');

    return new Response(
      JSON.stringify({
        ...channelInfo,
        message: 'Agora channel ready. Use create-agora-token to get access tokens.',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error creating Agora room:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

