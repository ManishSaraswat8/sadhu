import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!OPENAI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    // Authenticate the user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header provided' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Verify the user's JWT and get their ID
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData.user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authenticatedUserId = userData.user.id;
    console.log('Authenticated user:', authenticatedUserId);

    const { action, content, memory_type, metadata, query, limit } = await req.json();

    console.log(`Memory store action: ${action} for user: ${authenticatedUserId}`);

    if (action === 'store') {
      // Generate embedding using OpenAI
      const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: content,
        }),
      });

      if (!embeddingResponse.ok) {
        const errorText = await embeddingResponse.text();
        console.error('Embedding API error:', errorText);
        throw new Error('Failed to generate embedding');
      }

      const embeddingData = await embeddingResponse.json();
      const embedding = embeddingData.data[0].embedding;

      // Store memory with embedding - use authenticated user ID
      const { data, error } = await supabase
        .from('meditation_memories')
        .insert({
          user_id: authenticatedUserId,
          content,
          embedding,
          memory_type: memory_type || 'session',
          metadata: metadata || {},
        })
        .select()
        .single();

      if (error) {
        console.error('Database insert error:', error);
        throw error;
      }

      console.log('Memory stored successfully:', data.id);
      return new Response(JSON.stringify({ success: true, memory: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'retrieve') {
      // Generate embedding for query
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
        throw new Error('Failed to generate query embedding');
      }

      const embeddingData = await embeddingResponse.json();
      const queryEmbedding = embeddingData.data[0].embedding;

      // Search for similar memories - use authenticated user ID
      const { data, error } = await supabase.rpc('match_memories', {
        query_embedding: queryEmbedding,
        match_user_id: authenticatedUserId,
        match_count: limit || 5,
        match_threshold: 0.7,
      });

      if (error) {
        console.error('Memory retrieval error:', error);
        throw error;
      }

      console.log(`Retrieved ${data?.length || 0} memories`);
      return new Response(JSON.stringify({ success: true, memories: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'list') {
      // List all memories for the authenticated user
      const { data, error } = await supabase
        .from('meditation_memories')
        .select('id, content, memory_type, metadata, created_at')
        .eq('user_id', authenticatedUserId)
        .order('created_at', { ascending: false })
        .limit(limit || 20);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, memories: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else {
      throw new Error('Invalid action. Use: store, retrieve, or list');
    }

  } catch (error) {
    console.error('Memory store error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
