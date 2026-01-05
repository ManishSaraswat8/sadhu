import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SUBSCRIBE-NEWSLETTER] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { email, name, source = 'footer' } = await req.json();

    if (!email) {
      throw new Error("Email is required");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Invalid email format");
    }

    logStep("Processing subscription", { email, name, source });

    // Check if email already exists
    const { data: existing } = await supabaseClient
      .from("newsletter_subscriptions")
      .select("id, is_active, unsubscribed_at")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (existing) {
      // If already subscribed and active, return success
      if (existing.is_active) {
        logStep("Already subscribed", { email });
        return new Response(
          JSON.stringify({
            success: true,
            message: "You're already subscribed to our newsletter!",
            already_subscribed: true,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }

      // If unsubscribed, reactivate
      const { error: updateError } = await supabaseClient
        .from("newsletter_subscriptions")
        .update({
          is_active: true,
          unsubscribed_at: null,
          name: name || null,
          source: source,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (updateError) {
        throw updateError;
      }

      logStep("Subscription reactivated", { email });
      return new Response(
        JSON.stringify({
          success: true,
          message: "Welcome back! You've been resubscribed to our newsletter.",
          reactivated: true,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Create new subscription
    const { data: subscription, error: insertError } = await supabaseClient
      .from("newsletter_subscriptions")
      .insert({
        email: email.toLowerCase().trim(),
        name: name || null,
        source: source,
        is_active: true,
        metadata: {
          subscribed_via: 'website',
          timestamp: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (insertError) {
      logStep("Error creating subscription", { error: insertError.message });
      throw insertError;
    }

    logStep("Subscription created", { email, subscriptionId: subscription.id });

    // Optionally send welcome email via Postmark
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      if (supabaseUrl && Deno.env.get('POSTMARK_SERVER_TOKEN')) {
        fetch(`${supabaseUrl}/functions/v1/send-newsletter-welcome`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email,
            name: name || null,
          }),
        }).catch((err) => {
          logStep("Failed to send newsletter welcome email", { error: String(err) });
        });
      }
    } catch (emailError) {
      logStep("Error triggering newsletter welcome email", { error: String(emailError) });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Successfully subscribed to our newsletter!",
        subscription_id: subscription.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

