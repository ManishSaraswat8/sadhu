import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-BOARD-PAYMENT] ${step}${detailsStr}`);
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

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    // Get currency from request body (frontend should send it)
    const { currency } = await req.json();
    logStep("Request parsed", { currency });

    // Detect currency if not provided
    let userCurrency = currency || 'usd';
    let userEmail: string | undefined;

    // Try to get user from auth header (if authenticated)
    const authHeader = req.headers.get("Authorization");
    if (authHeader && authHeader !== "Bearer null" && authHeader !== "Bearer undefined") {
      const token = authHeader.replace("Bearer ", "");
      if (token && token !== "null" && token !== "undefined") {
        const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
        if (!userError && userData.user) {
          userEmail = userData.user.email;
          
          // Get currency from user preferences
          if (!currency) {
            const { data: preferences } = await supabaseClient
              .from("user_preferences")
              .select("currency")
              .eq("user_id", userData.user.id)
              .single();

            if (preferences?.currency) {
              userCurrency = preferences.currency;
            }
          }
        }
      }
    }
    
    logStep("Currency determined", { currency: userCurrency, email: userEmail });

    // Get product from database
    const { data: product, error: productError } = await supabaseClient
      .from("products")
      .select("*")
      .eq("slug", "sadhu-board")
      .eq("is_active", true)
      .single();

    if (productError || !product) {
      throw new Error("Sadhu Board product not found in database");
    }
    logStep("Product found", { productId: product.id, name: product.name });

    // Get price based on currency
    const price = userCurrency === 'cad' ? product.price_cad : product.price_usd;
    const priceInCents = Math.round(price * 100);

    logStep("Price calculated", { price, priceInCents, currency: userCurrency });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check if customer exists
    let customerId: string | undefined;
    if (userEmail) {
      const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        logStep("Found existing customer", { customerId });
      }
    }

    // Use Stripe Price ID if available, otherwise use price_data
    const lineItems: any[] = [];
    
    if (userCurrency === 'cad' && product.stripe_price_id_cad) {
      lineItems.push({
        price: product.stripe_price_id_cad,
        quantity: 1,
      });
      logStep("Using Stripe Price ID (CAD)", { priceId: product.stripe_price_id_cad });
    } else if (userCurrency === 'usd' && product.stripe_price_id_usd) {
      lineItems.push({
        price: product.stripe_price_id_usd,
        quantity: 1,
      });
      logStep("Using Stripe Price ID (USD)", { priceId: product.stripe_price_id_usd });
    } else {
      // Fallback to price_data if Stripe Price IDs not set
      lineItems.push({
        price_data: {
          currency: userCurrency,
          product_data: {
            name: product.name,
            description: product.description || undefined,
            ...(product.image_url && { images: [product.image_url] }),
          },
          unit_amount: priceInCents,
        },
        quantity: 1,
      });
      logStep("Using price_data (Price IDs not configured)");
    }

    // Create checkout session for one-time payment
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : userEmail,
      line_items: lineItems,
      mode: "payment",
      success_url: `${req.headers.get("origin")}/sadhu-board?success=true`,
      cancel_url: `${req.headers.get("origin")}/sadhu-board?canceled=true`,
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'IE', 'PT', 'NZ'],
      },
      metadata: {
        product_id: product.id,
        product_slug: product.slug,
        currency: userCurrency,
      },
    });

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
