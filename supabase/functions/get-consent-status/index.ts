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

    // Get optional consent_type from query params
    const url = new URL(req.url);
    const consentType = url.searchParams.get("consent_type");

    // Build query
    let query = supabaseClient
      .from("user_consents")
      .select("*")
      .eq("user_id", user.id)
      .is("revoked_at", null); // Only active consents

    if (consentType) {
      query = query.eq("consent_type", consentType);
    }

    const { data: consents, error } = await query.order("consent_date", {
      ascending: false,
    });

    if (error) {
      console.error("Error fetching consent status:", error);
      throw error;
    }

    // Format response
    const response: any = {
      user_id: user.id,
      consents: consents || [],
    };

    // If specific consent type requested, return boolean
    if (consentType) {
      response.has_consent =
        consents && consents.length > 0 && consents[0].consented;
    } else {
      // Return consent status for all types
      const consentStatus: Record<string, boolean> = {};
      const allConsentTypes = [
        "data_processing",
        "marketing",
        "session_recording",
        "data_sharing",
        "third_party_sharing",
        "analytics",
      ];

      allConsentTypes.forEach((type) => {
        const consent = consents?.find((c) => c.consent_type === type);
        consentStatus[type] = consent ? consent.consented : false;
      });

      response.consent_status = consentStatus;
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Error in get-consent-status:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

