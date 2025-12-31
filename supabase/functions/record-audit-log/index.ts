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

    // Get request body
    const {
      user_id,
      action,
      table_name,
      record_id,
      ip_address,
      user_agent,
      metadata,
    } = await req.json();

    // Validate required fields
    if (!action || !table_name) {
      throw new Error("action and table_name are required");
    }

    // Get IP address from request if not provided
    const clientIp =
      ip_address ||
      req.headers.get("x-forwarded-for")?.split(",")[0] ||
      req.headers.get("x-real-ip") ||
      "unknown";

    // Get user agent from request if not provided
    const clientUserAgent =
      user_agent || req.headers.get("user-agent") || "unknown";

    // Call the audit log function
    const { error } = await supabaseClient.rpc("log_audit_event", {
      p_user_id: user_id || null,
      p_action: action,
      p_table_name: table_name,
      p_record_id: record_id || null,
      p_ip_address: clientIp,
      p_user_agent: clientUserAgent,
      p_metadata: metadata || {},
    });

    if (error) {
      console.error("Error logging audit event:", error);
      throw error;
    }

    return new Response(
      JSON.stringify({ success: true, message: "Audit log recorded" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Error in record-audit-log:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

