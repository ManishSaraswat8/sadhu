import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Price IDs for Sadhu Meditation subscription
const PRICES = {
  monthly: "price_1Sc5uaD1c5lrjxLar4W2tRor", // $14.99/month
  annual: "price_1Sc5usD1c5lrjxLamY1kCJqU",  // $143.88/year ($11.99/month)
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const { priceType } = await req.json();
    const priceId = priceType === "annual" ? PRICES.annual : PRICES.monthly;
    logStep("Price selected", { priceType, priceId });

    // Try to get authenticated user, but allow guest checkout
    let user = null;
    let customerId: string | undefined;
    
    const authHeader = req.headers.get("Authorization");
    if (authHeader && authHeader !== "Bearer null" && authHeader !== "Bearer undefined") {
      const token = authHeader.replace("Bearer ", "");
      if (token && token !== "null" && token !== "undefined") {
        const { data } = await supabaseClient.auth.getUser(token);
        user = data.user;
        logStep("User authenticated", { userId: user?.id, email: user?.email });
      }
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
      apiVersion: "2025-08-27.basil" 
    });
    
    // If user is authenticated, check for existing Stripe customer
    if (user?.email) {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        logStep("Found existing customer", { customerId });
      } else {
        logStep("No existing customer found, will create new");
      }
    } else {
      logStep("Guest checkout - no authenticated user");
    }

    const origin = req.headers.get("origin") || "https://lovable.dev";
    
    // Create checkout session - for guests, Stripe will collect email
    const sessionConfig: any = {
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      subscription_data: {
        trial_period_days: 7,
      },
      success_url: `${origin}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/subscribe?canceled=true`,
    };

    // If we have a customer, use their ID, otherwise let Stripe collect email
    if (customerId) {
      sessionConfig.customer = customerId;
    } else if (user?.email) {
      sessionConfig.customer_email = user.email;
    }
    // For guests, Stripe will show email input field automatically

    const session = await stripe.checkout.sessions.create(sessionConfig);

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
