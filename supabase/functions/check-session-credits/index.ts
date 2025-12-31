import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } =
      await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    // Get user credits using the function
    const { data: creditsData, error: creditsError } = await supabaseClient
      .rpc("get_user_credits", { p_user_id: user.id });

    if (creditsError) {
      console.error("Error fetching credits:", creditsError);
      throw creditsError;
    }

    // Also get detailed credit records
    const { data: creditRecords, error: recordsError } = await supabaseClient
      .from("user_session_credits")
      .select("*")
      .eq("user_id", user.id)
      .gt("credits_remaining", 0)
      .or("expires_at.is.null,expires_at.gt.now()")
      .order("purchased_at", { ascending: false });

    if (recordsError) {
      console.error("Error fetching credit records:", recordsError);
      // Don't throw, just log - we have summary from function
    }

    return new Response(
      JSON.stringify({
        user_id: user.id,
        total_credits: creditsData?.[0]?.total_credits || 0,
        package_credits: creditsData?.[0]?.package_credits || 0,
        single_credits: creditsData?.[0]?.single_credits || 0,
        credits: creditRecords || [],
        has_credits: (creditsData?.[0]?.total_credits || 0) > 0,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Error in check-session-credits:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

