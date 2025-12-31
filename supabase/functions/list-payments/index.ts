import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[LIST-PAYMENTS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Get auth token - when verify_jwt = true, Supabase validates it automatically
    // But we still need to get the user from the validated token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Create Supabase client with service role for user verification
    // Using service role allows us to verify any user's JWT token
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // Verify user is authenticated - manually validate JWT
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      logStep("Auth error", { error: userError?.message });
      return new Response(
        JSON.stringify({ error: `Authentication error: ${userError?.message || "Invalid token"}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    logStep("User authenticated", { userId: userData.user.id });

    // Create admin client for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // Check if user is admin
    const { data: roles, error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .single();

    if (rolesError || !roles) {
      logStep("Unauthorized access attempt", { userId: userData.user.id });
      return new Response(
        JSON.stringify({ error: "Unauthorized: Admin access required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    logStep("Admin verified", { userId: userData.user.id });

    // Get filter parameters from request body
    let statusFilter = "all";
    let currencyFilter = "all";
    
    try {
      const bodyText = await req.text();
      if (bodyText) {
        const body = JSON.parse(bodyText);
        statusFilter = body.status || "all";
        currencyFilter = body.currency || "all";
      }
    } catch (parseError) {
      // If body parsing fails, use defaults
      logStep("Body parse error, using defaults", { error: parseError instanceof Error ? parseError.message : String(parseError) });
    }
    
    logStep("Filters applied", { statusFilter, currencyFilter });

    // Get payments (without practitioner join - no FK relationship)
    let query = supabaseAdmin
      .from("session_payments")
      .select(`
        *,
        session:session_schedules(id, scheduled_at, duration_minutes, status)
      `)
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    if (currencyFilter !== "all") {
      query = query.eq("currency", currencyFilter);
    }

    const { data: payments, error: paymentsError } = await query;

    if (paymentsError) {
      logStep("Error fetching payments", { error: paymentsError.message });
      throw new Error(`Failed to fetch payments: ${paymentsError.message}`);
    }

    logStep("Payments retrieved", { count: payments?.length || 0 });

    // Get all unique practitioner IDs
    const practitionerIds = [...new Set(payments?.map((p) => p.practitioner_id) || [])];

    // Fetch practitioners separately (no FK relationship in schema)
    const { data: practitioners, error: practitionersError } = await supabaseAdmin
      .from("practitioners")
      .select("id, name")
      .in("id", practitionerIds);

    if (practitionersError) {
      logStep("Error fetching practitioners", { error: practitionersError.message });
      throw new Error(`Failed to fetch practitioners: ${practitionersError.message}`);
    }

    // Create a map of practitioner_id -> name
    const practitionerMap = new Map<string, string>();
    practitioners?.forEach((p) => {
      practitionerMap.set(p.id, p.name);
    });

    logStep("Practitioners retrieved", { count: practitionerMap.size });

    // Enrich payments with practitioner names
    const paymentsWithPractitioners = payments?.map((payment) => ({
      ...payment,
      practitioner: {
        name: practitionerMap.get(payment.practitioner_id) || "Unknown",
      },
    }));

    // Get all unique client IDs
    const clientIds = [...new Set(payments?.map((p) => p.client_id) || [])];

    // Get user emails for all clients
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      logStep("Error fetching users", { error: authError.message });
      throw new Error(`Failed to fetch users: ${authError.message}`);
    }

    // Create a map of user_id -> email
    const userEmailMap = new Map<string, string>();
    authUsers.users.forEach((user) => {
      if (user.email) {
        userEmailMap.set(user.id, user.email);
      }
    });

    logStep("User emails retrieved", { count: userEmailMap.size });

    // Enrich payments with client emails (practitioner already added above)
    const enrichedPayments = paymentsWithPractitioners?.map((payment) => ({
      ...payment,
      client: {
        email: userEmailMap.get(payment.client_id) || "N/A",
      },
    }));

    logStep("Payments enriched", { count: enrichedPayments?.length || 0 });

    return new Response(JSON.stringify({ payments: enrichedPayments }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    // Better error message extraction
    let errorMessage = "An unexpected error occurred";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "string") {
      errorMessage = error;
    } else if (error && typeof error === "object") {
      // Try to extract message from error object
      errorMessage = (error as any).message || (error as any).error || JSON.stringify(error);
    }
    
    logStep("ERROR", { 
      message: errorMessage,
      error: error instanceof Error ? error.stack : String(error),
      errorType: typeof error,
    });
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

