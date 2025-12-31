import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-internal-secret',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// Agora RTC Token generation
function base64UrlEncode(data: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...data));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function generateAgoraToken(
  appId: string,
  appCertificate: string,
  channelName: string,
  uid: number | string,
  role: 'publisher' | 'subscriber' = 'publisher',
  expireTime: number = 3600 // 1 hour default
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const expire = now + expireTime;

  // Agora token structure
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const payload = {
    app_id: appId,
    iat: now,
    exp: expire,
    privilege: {
      1: expire, // Join channel
      2: expire, // Publish audio
      3: expire, // Publish video
      4: expire, // Publish data stream
    },
  };

  // For publisher role, enable publish privileges
  if (role === 'publisher') {
    payload.privilege[2] = expire; // Publish audio
    payload.privilege[3] = expire; // Publish video
  }

  const encodedHeader = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const encodedPayload = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));

  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  // Create HMAC signature
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(appCertificate),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(signatureInput)
  );

  const encodedSignature = base64UrlEncode(new Uint8Array(signature));

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

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
    const AGORA_APP_CERTIFICATE = Deno.env.get('AGORA_APP_CERTIFICATE');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase environment variables');
    }

    if (!AGORA_APP_ID || !AGORA_APP_CERTIFICATE) {
      throw new Error('Agora credentials not configured. Please set AGORA_APP_ID and AGORA_APP_CERTIFICATE in Supabase secrets:\n  supabase secrets set AGORA_APP_ID=your_app_id\n  supabase secrets set AGORA_APP_CERTIFICATE=your_certificate');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Read request body once
    const body = await req.json().catch(() => ({}));
    const { channelName, uid, role, sessionId, isGroup } = body;

    // Check for internal secret (for server-to-server calls)
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
      return new Response(
        JSON.stringify({ error: 'channelName is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
            JSON.stringify({ error: 'You are not authorized to join this session' }),
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
            JSON.stringify({ error: 'You are not authorized to join this group session' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Use provided uid or generate from user ID
    const userUid = uid || (authenticatedUserId ? parseInt(authenticatedUserId.replace(/-/g, '').substring(0, 8), 16) : Math.floor(Math.random() * 1000000));
    const userRole = role || 'publisher'; // Default to publisher (can publish audio/video)
    
    // For group sessions, allow subscriber role for participants who shouldn't publish
    const finalRole = (isGroup && role === 'subscriber') ? 'subscriber' : 'publisher';

    console.log(`Generating Agora token for channel: ${channelName}, uid: ${userUid}, role: ${finalRole}`);

    // Generate token (valid for 1 hour, can be extended)
    const agoraToken = await generateAgoraToken(
      AGORA_APP_ID,
      AGORA_APP_CERTIFICATE,
      channelName,
      userUid,
      finalRole as 'publisher' | 'subscriber',
      3600 // 1 hour expiration
    );

    console.log('Agora token generated successfully');

    return new Response(
      JSON.stringify({
        token: agoraToken,
        appId: AGORA_APP_ID,
        channelName,
        uid: userUid,
        role: finalRole,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error generating Agora token:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

