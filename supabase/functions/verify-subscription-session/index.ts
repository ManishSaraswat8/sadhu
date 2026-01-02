import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-SUBSCRIPTION-SESSION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { sessionId } = await req.json();
    if (!sessionId) {
      throw new Error("Session ID is required");
    }
    logStep("Session ID received", { sessionId });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
      apiVersion: "2025-08-27.basil" 
    });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['customer', 'subscription'],
    });
    logStep("Session retrieved", { 
      status: session.status, 
      customerEmail: session.customer_email,
      paymentStatus: session.payment_status 
    });

    if (session.status !== 'complete') {
      throw new Error("Checkout session is not complete");
    }

    // Get customer email
    const customerEmail = session.customer_email || 
      (session.customer && typeof session.customer === 'object' ? session.customer.email : null);
    
    if (!customerEmail) {
      throw new Error("Could not retrieve customer email from session");
    }
    logStep("Customer email found", { customerEmail });

    // Create Supabase admin client to create/manage users
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === customerEmail);

    let userId: string;
    let isNewUser = false;
    let tempPassword: string | null = null;

    if (existingUser) {
      logStep("Existing user found", { userId: existingUser.id });
      userId = existingUser.id;
    } else {
      // Create new user with a temporary password
      // Generate a random temporary password
      tempPassword = crypto.randomUUID().slice(0, 16);
      
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: customerEmail,
        password: tempPassword,
        email_confirm: true, // Auto-confirm since they paid
        user_metadata: {
          full_name: session.customer_details?.name || '',
          created_via: 'subscription_checkout',
        }
      });

      if (createError) {
        logStep("Error creating user", { error: createError.message });
        throw new Error(`Failed to create user: ${createError.message}`);
      }

      userId = newUser.user.id;
      isNewUser = true;
      logStep("New user created", { userId });

      // Send password reset email so they can set their own password
      const origin = req.headers.get("origin") || Deno.env.get("SITE_URL") || "http://localhost:8080";
      await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: customerEmail,
        options: {
          redirectTo: `${origin}/update-password`,
        }
      });
      logStep("Password reset email sent");
    }

    return new Response(JSON.stringify({ 
      success: true,
      email: customerEmail,
      isNewUser,
      userId,
      customerName: session.customer_details?.name || null,
    }), {
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
