import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CANCEL-SESSION] ${step}${detailsStr}`);
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

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const { session_id, reason, use_grace = false } = await req.json();
    logStep("Request parsed", { session_id, use_grace });

    // Fetch session
    const { data: session, error: sessionError } = await supabaseClient
      .from("session_schedules")
      .select(`
        *,
        cancellation_policy_version,
        cancellation_policy_agreed_at
      `)
      .eq("id", session_id)
      .eq("client_id", user.id)
      .single();

    if (sessionError || !session) {
      throw new Error("Session not found or access denied");
    }

    if (session.status !== "scheduled") {
      throw new Error("Session cannot be cancelled (already completed or cancelled)");
    }

    logStep("Session found", { session_id: session.id, scheduled_at: session.scheduled_at });

    // Calculate hours before session
    const scheduledAt = new Date(session.scheduled_at);
    const now = new Date();
    const hoursBefore = (scheduledAt.getTime() - now.getTime()) / (1000 * 60 * 60);
    logStep("Time calculation", { hours_before: hoursBefore });

    // Fetch active cancellation policy
    let policy = null;
    if (session.cancellation_policy_version) {
      const { data: policyData } = await supabaseClient
        .from("cancellation_policy")
        .select("*")
        .eq("id", session.cancellation_policy_version)
        .single();
      policy = policyData;
    } else {
      // Fallback to active policy
      const { data: policyData } = await supabaseClient
        .from("cancellation_policy")
        .select("*")
        .eq("is_active", true)
        .single();
      policy = policyData;
    }

    if (!policy) {
      throw new Error("Cancellation policy not found");
    }

    logStep("Policy found", { policy_id: policy.id });

    // Check if user has used grace cancellation
    const { data: graceUsed } = await supabaseClient
      .from("session_schedules")
      .select("grace_cancellation_used")
      .eq("client_id", user.id)
      .eq("grace_cancellation_used", true)
      .limit(1)
      .single();

    const hasGraceAvailable = !graceUsed && policy.grace_cancellations_allowed > 0;

    // Determine cancellation type
    let cancellationType: 'standard' | 'late' | 'last_minute' | 'grace' | 'emergency' = 'standard';
    let feeCharged = 0;
    let creditReturned = 0;
    let creditCurrency = 'usd';

    if (use_grace && hasGraceAvailable) {
      cancellationType = 'grace';
      feeCharged = 0;
      creditReturned = 0; // Full credit returned
    } else if (hoursBefore >= policy.standard_cancellation_hours) {
      cancellationType = 'standard';
      feeCharged = 0;
      creditReturned = 0; // Full credit returned
    } else if (hoursBefore >= policy.late_cancellation_hours) {
      cancellationType = 'late';
      // Get currency from session payment
      const { data: payment } = await supabaseClient
        .from("session_payments")
        .select("currency, total_amount")
        .eq("session_id", session_id)
        .single();
      
      creditCurrency = payment?.currency || 'usd';
      feeCharged = creditCurrency === 'cad' 
        ? Number(policy.late_cancellation_fee_cad)
        : Number(policy.late_cancellation_fee_usd);
      creditReturned = (payment?.total_amount || 0) - feeCharged;
    } else {
      cancellationType = 'last_minute';
      feeCharged = 0; // No fee, but credit is forfeited
      creditReturned = 0;
    }

    logStep("Cancellation type determined", { 
      type: cancellationType, 
      fee: feeCharged, 
      credit_returned: creditReturned 
    });

    // Update session status
    const { error: updateError } = await supabaseClient
      .from("session_schedules")
      .update({
        status: "cancelled",
        ...(cancellationType === 'grace' && { grace_cancellation_used: true }),
      })
      .eq("id", session_id);

    if (updateError) throw updateError;

    // Record cancellation
    const { error: cancelError } = await supabaseClient
      .from("session_cancellations")
      .insert({
        session_id: session_id,
        user_id: user.id,
        cancelled_at: now.toISOString(),
        cancellation_type: cancellationType,
        hours_before_session: hoursBefore,
        fee_charged: feeCharged,
        fee_currency: creditCurrency,
        credit_returned: creditReturned,
        credit_currency: creditCurrency,
        reason: reason || null,
        cancellation_policy_version: policy.id,
      });

    if (cancelError) throw cancelError;

    // If credit should be returned, add to user_session_credits
    if (creditReturned > 0) {
      // Get session type to determine credit value
      const { data: sessionType } = await supabaseClient
        .from("session_types")
        .select("id, price_cad, price_usd")
        .eq("duration_minutes", session.duration_minutes)
        .single();

      if (sessionType) {
        await supabaseClient
          .from("user_session_credits")
          .insert({
            user_id: user.id,
            session_type_id: sessionType.id,
            credits_remaining: 1,
            cancellation_policy_agreed_at: session.cancellation_policy_agreed_at,
            cancellation_policy_version: session.cancellation_policy_version,
            metadata: {
              source: 'cancellation_refund',
              original_session_id: session_id,
              cancellation_type: cancellationType,
            },
          });
      }
    }

    logStep("Cancellation completed", { 
      type: cancellationType,
      fee: feeCharged,
      credit_returned: creditReturned
    });

    // Send cancellation notice email (fire and forget)
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      if (supabaseUrl) {
        fetch(`${supabaseUrl}/functions/v1/send-cancellation-notice`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            session_id: session_id,
            cancellation_type: cancellationType,
            credit_returned: creditReturned,
            is_reschedule: false,
          }),
        }).catch((err) => {
          logStep("Failed to send cancellation notice email", { error: String(err) });
        });
      }
    } catch (emailError) {
      logStep("Error triggering cancellation notice email", { error: String(emailError) });
    }

    return new Response(
      JSON.stringify({
        success: true,
        cancellation_type: cancellationType,
        fee_charged: feeCharged,
        credit_returned: creditReturned,
        currency: creditCurrency,
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
        status: 500,
      }
    );
  }
});

