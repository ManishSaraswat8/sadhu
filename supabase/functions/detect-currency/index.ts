import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` | ${JSON.stringify(details)}` : "";
  console.log(`[DETECT-CURRENCY] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    logStep("Function started");

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const user = userData.user;
    logStep("User authenticated", { userId: user.id });

    // Get request body (optional - can detect from headers or use provided)
    let body: { currency?: string; country?: string } = {};
    try {
      const bodyText = await req.text();
      if (bodyText) {
        body = JSON.parse(bodyText);
      }
    } catch {
      // Body is optional
    }

    // Detect currency if not provided
    let detectedCurrency = body.currency as 'cad' | 'usd' | undefined;
    let detectedCountry = body.country;

    if (!detectedCurrency) {
      // Try to get from user preferences first
      const { data: preferences } = await supabaseClient
        .from("user_preferences")
        .select("currency, country")
        .eq("user_id", user.id)
        .single();

      if (preferences?.currency) {
        detectedCurrency = preferences.currency as 'cad' | 'usd';
        detectedCountry = preferences.country || detectedCountry;
        logStep("Currency from preferences", { currency: detectedCurrency });
      } else {
        // Default detection logic (frontend should handle this, but fallback here)
        detectedCurrency = 'usd';
        logStep("Currency defaulted to USD");
      }
    }

    // Save/update preference
    const { error: upsertError } = await supabaseClient
      .from("user_preferences")
      .upsert({
        user_id: user.id,
        currency: detectedCurrency,
        country: detectedCountry || (detectedCurrency === 'cad' ? 'CA' : 'US'),
        detected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (upsertError) {
      logStep("Error saving preference", { error: upsertError.message });
      // Non-critical, continue
    } else {
      logStep("Preference saved", { currency: detectedCurrency });
    }

    return new Response(
      JSON.stringify({
        currency: detectedCurrency,
        country: detectedCountry || (detectedCurrency === 'cad' ? 'CA' : 'US'),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("Error", { error: errorMessage });
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

