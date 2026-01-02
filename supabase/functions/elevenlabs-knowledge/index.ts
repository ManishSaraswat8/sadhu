import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-elevenlabs-secret',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// This endpoint can be used as a knowledge base for ElevenLabs agents
// Configure in ElevenLabs: Agent Settings > Knowledge Base > Custom API
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Handle GET requests (ElevenLabs URL validation/health check)
  if (req.method === 'GET') {
    return new Response(JSON.stringify({
      status: 'ok',
      service: 'Sadhu Meditation Memory Knowledge Base',
      description: 'This endpoint provides semantic memory retrieval for the Sadhu meditation AI guide.',
      auth: 'Requires either Authorization header (JWT) or X-ElevenLabs-Secret header'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');

    if (!OPENAI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Safely parse JSON body
    let body: { query?: string; user_id?: string } = {};
    try {
      const text = await req.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch {
      // Empty or invalid body
    }

    const { query, user_id: bodyUserId } = body;

    if (!query) {
      return new Response(JSON.stringify({ 
        results: [],
        message: "No query provided" 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let userId: string | null = null;

    // Check for ElevenLabs server-to-server auth (shared secret)
    const elevenLabsSecret = req.headers.get('X-ElevenLabs-Secret');
    const authHeader = req.headers.get('Authorization');

    // Option 1: ElevenLabs server calling with shared secret
    if (elevenLabsSecret && ELEVENLABS_API_KEY && elevenLabsSecret === ELEVENLABS_API_KEY) {
      // Server-to-server auth - ElevenLabs is calling, trust the user_id from body
      if (!bodyUserId) {
        return new Response(JSON.stringify({ 
          error: 'user_id is required for server-to-server calls',
          results: [] 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      userId = bodyUserId;
      console.log('Server-to-server auth via ElevenLabs secret, user_id:', userId);
    } 
    // Option 2: Authenticated client calling with JWT
    else if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: userData, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !userData.user) {
        console.error('Auth error:', authError);
        return new Response(
          JSON.stringify({ error: 'Invalid or expired token', results: [] }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      userId = userData.user.id;
      console.log('Client auth via JWT, user_id:', userId);
    }
    // No valid authentication provided
    else {
      return new Response(
        JSON.stringify({ error: 'Authentication required. Provide Authorization header or X-ElevenLabs-Secret.', results: [] }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Knowledge base query for user ${userId}: ${query}`);

    // Generate embedding for the query
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: query,
      }),
    });

    if (!embeddingResponse.ok) {
      const errorText = await embeddingResponse.text();
      console.error('Embedding API error:', errorText);
      throw new Error('Failed to generate embedding');
    }

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data[0].embedding;

    // Search for similar memories
    const { data: memories, error } = await supabase.rpc('match_memories', {
      query_embedding: queryEmbedding,
      match_user_id: userId,
      match_count: 5,
      match_threshold: 0.6,
    });

    if (error) {
      console.error('Memory retrieval error:', error);
      throw error;
    }

    // Format results for ElevenLabs knowledge base
    const results = (memories || []).map((memory: any) => ({
      content: memory.content,
      type: memory.memory_type,
      metadata: memory.metadata,
      relevance: memory.similarity,
    }));

    console.log(`Found ${results.length} relevant memories`);

    // Return in format compatible with ElevenLabs custom knowledge base
    return new Response(JSON.stringify({
      results,
      context: results.map((r: any) => r.content).join('\n\n'),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Knowledge base error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      results: [] 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
