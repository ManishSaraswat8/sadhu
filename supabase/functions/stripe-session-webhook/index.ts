import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-SESSION-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2025-08-27.basil",
  });

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    
    logStep("Webhook received", { hasSignature: !!signature });

    // For now, parse the event directly (webhook signing can be added later)
    const event = JSON.parse(body) as Stripe.Event;
    logStep("Event parsed", { type: event.type });

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      logStep("Checkout session completed", { sessionId: session.id, metadata: session.metadata });

      const metadata = session.metadata;
      if (!metadata?.client_id) {
        logStep("Missing client_id in metadata, skipping");
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      const paymentType = metadata.payment_type || 'single';
      const currency = metadata.currency || session.currency || 'usd';
      const totalAmount = session.amount_total ? session.amount_total / 100 : 0; // Convert from cents

      logStep("Processing payment", { paymentType, currency, totalAmount });

      // Handle package purchases
      if (paymentType === 'package_5' || paymentType === 'package_10') {
        const sessionCount = paymentType === 'package_5' ? 5 : 10;
        const packageId = metadata.package_id;

        if (!packageId) {
          logStep("Package ID missing, trying to find package", { sessionCount });
          // Try to find package by session_count
          const { data: packageData } = await supabaseClient
            .from("session_packages")
            .select("id, session_type_id")
            .eq("session_count", sessionCount)
            .eq("is_active", true)
            .single();

          if (packageData) {
            // Use the package's session_type_id if it exists, otherwise null (generic package)
            const creditSessionTypeId = packageData.session_type_id || null;

            logStep("Creating package credits (fallback)", { 
              packageId: packageData.id, 
              sessionTypeId: creditSessionTypeId,
              isGeneric: !creditSessionTypeId
            });

            // Create user_session_credits entry for the package
            const { error: creditError } = await supabaseClient
              .from("user_session_credits")
              .insert({
                user_id: metadata.client_id,
                package_id: packageData.id,
                session_type_id: creditSessionTypeId, // Use package's session_type_id (null for generic packages)
                credits_remaining: sessionCount,
                stripe_payment_intent_id: session.payment_intent as string || null,
                cancellation_policy_agreed_at: metadata.cancellation_policy_agreed === 'true' ? new Date().toISOString() : null,
                cancellation_policy_version: metadata.cancellation_policy_version || null,
                metadata: {
                  purchased_via: 'stripe_checkout',
                  currency,
                  total_amount: totalAmount,
                },
              });

            if (creditError) {
              logStep("Error creating session credits", { error: creditError.message });
              throw creditError;
            }

            logStep("Package credits created", { 
              userId: metadata.client_id, 
              packageId: packageData.id,
              sessionTypeId: creditSessionTypeId,
              credits: sessionCount,
              isGeneric: !creditSessionTypeId
            });
          } else {
            logStep("Package not found", { sessionCount });
          }
        } else {
          // Fetch package details to get session_type_id (if package is session-type-specific)
          const { data: packageData, error: packageFetchError } = await supabaseClient
            .from("session_packages")
            .select("id, session_type_id")
            .eq("id", packageId)
            .single();

          if (packageFetchError) {
            logStep("Error fetching package", { error: packageFetchError.message, packageId });
            throw packageFetchError;
          }

          // Use the package's session_type_id if it exists, otherwise null (generic package)
          // If package has session_type_id, credits can only be used for that specific session type
          // If package has null session_type_id, credits can be used for any session type
          const creditSessionTypeId = packageData?.session_type_id || null;

          logStep("Creating package credits", { 
            packageId, 
            sessionTypeId: creditSessionTypeId,
            isGeneric: !creditSessionTypeId
          });

          // Create user_session_credits entry for the package
          const { error: creditError } = await supabaseClient
            .from("user_session_credits")
            .insert({
              user_id: metadata.client_id,
              package_id: packageId,
              session_type_id: creditSessionTypeId, // Use package's session_type_id (null for generic packages)
              credits_remaining: sessionCount,
              stripe_payment_intent_id: session.payment_intent as string || null,
              cancellation_policy_agreed_at: metadata.cancellation_policy_agreed === 'true' ? new Date().toISOString() : null,
              cancellation_policy_version: metadata.cancellation_policy_version || null,
              metadata: {
                purchased_via: 'stripe_checkout',
                currency,
                total_amount: totalAmount,
              },
            });

          if (creditError) {
            logStep("Error creating session credits", { error: creditError.message });
            throw creditError;
          }

            logStep("Package credits created", { 
              userId: metadata.client_id, 
              packageId,
              sessionTypeId: creditSessionTypeId,
              credits: sessionCount,
              isGeneric: !creditSessionTypeId
            });
        }

        // Send payment receipt email (fire and forget)
        try {
          const supabaseUrl = Deno.env.get('SUPABASE_URL');
          if (supabaseUrl) {
            fetch(`${supabaseUrl}/functions/v1/send-payment-receipt`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                payment_intent_id: session.payment_intent as string || null,
                checkout_session_id: session.id,
                user_id: metadata.client_id,
                email: session.customer_email,
              }),
            }).catch((err) => {
              logStep("Failed to send payment receipt email", { error: String(err) });
            });
          }
        } catch (emailError) {
          logStep("Error triggering payment receipt email", { error: String(emailError) });
        }

        // Calculate payment splits (75% practitioner, 25% platform) - Note: packages don't have practitioner_id
        // For packages, we might want to defer the split until sessions are used
        // For now, we'll skip payment recording for packages
        logStep("Package purchase completed", { sessionCount });
      } 
      // Handle single session purchases
      else if (paymentType === 'single' && metadata.practitioner_id && metadata.scheduled_at) {
        // Create an Agora room/channel
        let channelName = metadata.room_name; // Fallback to room name if API fails
        
        try {
          const supabaseUrl = Deno.env.get('SUPABASE_URL');
          if (supabaseUrl) {
            // Call our create-agora-room edge function internally
            const agoraResponse = await fetch(`${supabaseUrl}/functions/v1/create-agora-room`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                'Content-Type': 'application/json',
                'X-Internal-Secret': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
              },
              body: JSON.stringify({
                channelName: metadata.room_name,
                isGroup: metadata.is_group === 'true',
                sessionId: null, // Will be set after session creation
              }),
            });

            if (agoraResponse.ok) {
              const agoraData = await agoraResponse.json();
              channelName = agoraData.channelName;
              logStep("Agora room created", { 
                channelName: agoraData.channelName,
                appId: agoraData.appId
              });
            } else {
              const errorText = await agoraResponse.text();
              logStep("Agora API error, using fallback", { status: agoraResponse.status, error: errorText });
            }
          } else {
            logStep("No SUPABASE_URL configured, using fallback channel name");
          }
        } catch (agoraError) {
          logStep("Error creating Agora room, using fallback", { error: String(agoraError) });
        }

        // Create the session in the database
        const { data: sessionData, error: sessionError } = await supabaseClient
          .from("session_schedules")
          .insert({
            practitioner_id: metadata.practitioner_id,
            client_id: metadata.client_id,
            scheduled_at: metadata.scheduled_at,
            duration_minutes: parseInt(metadata.duration_minutes || "60"),
            room_name: channelName,
            host_room_url: null, // Agora doesn't use separate host URLs
            notes: metadata.notes || null,
            status: "scheduled",
            cancellation_policy_agreed_at: metadata.cancellation_policy_agreed === 'true' ? new Date().toISOString() : null,
            cancellation_policy_version: metadata.cancellation_policy_version || null,
          })
          .select()
          .single();

        if (sessionError) {
          logStep("Error creating session", { error: sessionError.message });
          throw sessionError;
        }

        logStep("Session created successfully", { 
          sessionId: sessionData.id, 
          channelName: channelName
        });

        // Send booking confirmation email (fire and forget)
        try {
          const supabaseUrl = Deno.env.get('SUPABASE_URL');
          if (supabaseUrl) {
            fetch(`${supabaseUrl}/functions/v1/send-booking-confirmation`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ session_id: sessionData.id }),
            }).catch((err) => {
              logStep("Failed to send booking confirmation email", { error: String(err) });
            });
          }
        } catch (emailError) {
          logStep("Error triggering booking confirmation email", { error: String(emailError) });
        }

        // Send payment receipt email (fire and forget)
        try {
          const supabaseUrl = Deno.env.get('SUPABASE_URL');
          if (supabaseUrl) {
            fetch(`${supabaseUrl}/functions/v1/send-payment-receipt`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                payment_intent_id: session.payment_intent as string || null,
                checkout_session_id: session.id,
                user_id: metadata.client_id,
                email: session.customer_email,
              }),
            }).catch((err) => {
              logStep("Failed to send payment receipt email", { error: String(err) });
            });
          }
        } catch (emailError) {
          logStep("Error triggering payment receipt email", { error: String(emailError) });
        }

        // Calculate payment splits (75% practitioner, 25% platform)
        const practitionerShare = totalAmount * 0.75;
        const platformShare = totalAmount * 0.25;

        // Record the payment
        const { error: paymentError } = await supabaseClient
          .from("session_payments")
          .insert({
            session_id: sessionData.id,
            practitioner_id: metadata.practitioner_id,
            client_id: metadata.client_id,
            total_amount: totalAmount,
            practitioner_share: practitionerShare,
            platform_share: platformShare,
            currency: currency,
            stripe_payment_intent_id: session.payment_intent as string || null,
            status: 'completed',
          });

        if (paymentError) {
          logStep("Error recording payment", { error: paymentError.message });
          // Don't throw - session was created successfully
        } else {
          logStep("Payment recorded", { 
            totalAmount, 
            practitionerShare, 
            platformShare 
          });
        }
      } else {
        logStep("Unknown payment type or missing required fields", { paymentType, metadata });
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
