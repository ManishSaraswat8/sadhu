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

    // Get request body
    const {
      consent_type,
      consented,
      version,
      metadata,
    } = await req.json();

    // Validate required fields
    if (!consent_type || typeof consented !== "boolean") {
      throw new Error("consent_type and consented are required");
    }

    // Validate consent_type
    const validConsentTypes = [
      "data_processing",
      "marketing",
      "session_recording",
      "data_sharing",
      "third_party_sharing",
      "analytics",
    ];
    if (!validConsentTypes.includes(consent_type)) {
      throw new Error(`Invalid consent_type. Must be one of: ${validConsentTypes.join(", ")}`);
    }

    // Get IP address and user agent
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0] ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const clientUserAgent = req.headers.get("user-agent") || "unknown";

    // Insert or update consent record
    const consentData: any = {
      user_id: user.id,
      consent_type,
      consented,
      version: version || "1.0",
      ip_address: clientIp,
      user_agent: clientUserAgent,
      metadata: metadata || {},
    };

    // If revoking consent, set revoked_at
    if (!consented) {
      consentData.revoked_at = new Date().toISOString();
      consentData.revoked_ip_address = clientIp;
    }

    const { data, error } = await supabaseClient
      .from("user_consents")
      .upsert(consentData, {
        onConflict: "user_id,consent_type",
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Error recording consent:", error);
      throw error;
    }

    // Log audit event
    await supabaseClient.rpc("log_audit_event", {
      p_user_id: user.id,
      p_action: consented ? "INSERT" : "UPDATE",
      p_table_name: "user_consents",
      p_record_id: data.id,
      p_ip_address: clientIp,
      p_user_agent: clientUserAgent,
      p_metadata: {
        consent_type,
        consented,
        action: consented ? "consent_given" : "consent_revoked",
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        consent: data,
        message: consented
          ? "Consent recorded successfully"
          : "Consent revoked successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Error in record-consent:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

