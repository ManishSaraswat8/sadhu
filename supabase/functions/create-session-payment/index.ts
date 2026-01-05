import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-SESSION-PAYMENT] ${step}${detailsStr}`);
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

    // Get request body - supports both old format (for backward compatibility) and new format
    const { 
      practitioner_id, 
      scheduled_at, 
      duration_minutes, 
      notes,
      // New fields for packages and fixed pricing
      payment_type = 'single', // 'single', 'package_5', 'package_10'
      session_type_id, // UUID of session_type (for fixed pricing)
      session_type = 'standing', // 'standing' or 'laying' (fallback if session_type_id not provided)
      is_group = false, // fallback if session_type_id not provided
      currency, // Optional: 'cad' or 'usd', will detect if not provided
      cancellation_policy_agreed = false, // Whether user agreed to cancellation policy
      cancellation_policy_version = null // UUID of the cancellation policy version
    } = await req.json();
    
    logStep("Request body parsed", { 
      practitioner_id, 
      scheduled_at, 
      duration_minutes, 
      payment_type,
      session_type_id 
    });

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Detect user currency if not provided
    let userCurrency = currency || 'usd'; // Default to USD
    if (!currency) {
      const { data: preferences } = await supabaseClient
        .from("user_preferences")
        .select("currency")
        .eq("user_id", user.id)
        .single();
      
      if (preferences?.currency) {
        userCurrency = preferences.currency;
      } else {
        // Try to detect from browser locale (would need to be passed from frontend)
        // For now, default to USD
        userCurrency = 'usd';
      }
    }
    logStep("Currency detected", { currency: userCurrency });

    let sessionPrice: number;
    let productName: string;
    let productDescription: string;
    let packageId: string | null = null;
    let sessionTypeId: string | null = null;
    let practitioner = null;

    // Determine pricing based on payment_type
    if (payment_type === 'package_5' || payment_type === 'package_10') {
      // Package purchases don't require a practitioner - skip practitioner check
      // Package purchase
      const sessionCount = payment_type === 'package_5' ? 5 : 10;
      
      // Try to find a package matching the session type first
      let packageData = null;
      let packageError = null;
      
      // If we have session_type_id, try to find a matching package
      if (session_type_id) {
        const { data, error } = await supabaseClient
          .from("session_packages")
          .select("*")
          .eq("session_count", sessionCount)
          .eq("session_type_id", session_type_id)
          .eq("is_active", true)
          .maybeSingle();
        
        if (!error && data) {
          packageData = data;
        }
      }
      
      // If no matching package found, try to find a generic one (without session_type_id)
      if (!packageData) {
        const { data, error } = await supabaseClient
          .from("session_packages")
          .select("*")
          .eq("session_count", sessionCount)
          .is("session_type_id", null)
          .eq("is_active", true)
          .maybeSingle();
        
        if (!error && data) {
          packageData = data;
        } else {
          packageError = error;
        }
      }
      
      // If still no package, try any active package with the right session count
      if (!packageData) {
        const { data, error } = await supabaseClient
          .from("session_packages")
          .select("*")
          .eq("session_count", sessionCount)
          .eq("is_active", true)
          .limit(1)
          .maybeSingle();
        
        if (!error && data) {
          packageData = data;
        } else {
          packageError = error;
        }
      }

      if (packageError || !packageData) {
        logStep("Package lookup failed", { sessionCount, session_type_id, error: packageError });
        throw new Error(`Package with ${sessionCount} sessions not found`);
      }

      packageId = packageData.id;
      sessionPrice = userCurrency === 'cad' 
        ? Math.round(packageData.price_cad * 100) // Convert to cents
        : Math.round(packageData.price_usd * 100);
      
      productName = packageData.name;
      productDescription = `${sessionCount} session package - Use for any session type`;
      
      logStep("Package pricing", { packageId, sessionPrice, currency: userCurrency });
    } else {
      // Single session purchase - use fixed pricing from session_types
      if (!session_type_id && (!duration_minutes || !session_type)) {
        throw new Error("For single session, provide either session_type_id or duration_minutes + session_type");
      }

      let sessionTypeData;
      
      if (session_type_id) {
        // Use provided session_type_id
        const { data, error } = await supabaseClient
          .from("session_types")
          .select("*")
          .eq("id", session_type_id)
          .eq("is_active", true)
          .single();
        
        if (error || !data) {
          throw new Error("Session type not found");
        }
        sessionTypeData = data;
        sessionTypeId = data.id;
      } else {
        // Fallback: find session type by duration, type, and is_group
        const { data, error } = await supabaseClient
          .from("session_types")
          .select("*")
          .eq("duration_minutes", duration_minutes)
          .eq("session_type", session_type)
          .eq("is_group", is_group)
          .eq("is_active", true)
          .single();
        
        if (error || !data) {
          throw new Error(`Session type not found for ${duration_minutes}min ${session_type} ${is_group ? 'group' : '1:1'}`);
        }
        sessionTypeData = data;
        sessionTypeId = data.id;
      }

      // For single session purchases, we need a practitioner
      if (!practitioner_id) {
        throw new Error("Practitioner ID is required for single session purchases");
      }

      // Fetch practitioner details (needed for session creation)
      const { data: practitionerData, error: practitionerError } = await supabaseClient
        .from("practitioners")
        .select("id, name")
        .eq("id", practitioner_id)
        .single();

      if (practitionerError || !practitionerData) {
        throw new Error("Practitioner not found");
      }
      practitioner = practitionerData;
      logStep("Practitioner found", { practitioner });

      sessionPrice = userCurrency === 'cad'
        ? Math.round(sessionTypeData.price_cad * 100) // Convert to cents
        : Math.round(sessionTypeData.price_usd * 100);
      
      productName = `${sessionTypeData.name} Session${sessionTypeData.is_group ? ' (Group)' : ' (1:1)'} with ${practitioner.name}`;
      productDescription = `${sessionTypeData.duration_minutes}-minute ${sessionTypeData.session_type} session on ${new Date(scheduled_at).toLocaleString()}`;
      
      logStep("Session type pricing", { sessionTypeId, sessionPrice, currency: userCurrency });
    }

    if (sessionPrice <= 0) {
      throw new Error("Invalid session price");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check if Stripe customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }
    logStep("Customer lookup complete", { customerId });

    // Generate room name for video session (only for single sessions)
    const roomName = payment_type === 'single' 
      ? `session-${practitioner_id.substring(0, 8)}-${user.id.substring(0, 8)}-${Date.now()}`
      : null;

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: userCurrency,
            product_data: {
              name: productName,
              description: productDescription,
            },
            unit_amount: sessionPrice,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/dashboard?session_booked=true&payment_type=${payment_type}`,
      cancel_url: `${req.headers.get("origin")}/sessions?cancelled=true`,
      metadata: {
        ...(practitioner_id && { practitioner_id }),
        client_id: user.id,
        payment_type,
        currency: userCurrency,
        ...(scheduled_at && { scheduled_at }),
        ...(duration_minutes && { duration_minutes: duration_minutes.toString() }),
        ...(roomName && { room_name: roomName }),
        ...(notes && { notes }),
        ...(packageId && { package_id: packageId }),
        ...(sessionTypeId && { session_type_id: sessionTypeId }),
        ...(session_type && { session_type }),
        ...(is_group !== undefined && { is_group: is_group.toString() }),
        ...(cancellation_policy_agreed && { cancellation_policy_agreed: 'true' }),
        ...(cancellation_policy_version && { cancellation_policy_version: cancellation_policy_version }),
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url, payment_type });

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
