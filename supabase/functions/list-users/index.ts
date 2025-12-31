import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[LIST-USERS] ${step}${detailsStr}`);
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

    // Get all users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) throw authError;

    logStep("Users retrieved", { count: authUsers.users.length });

    // Get roles for all users
    const { data: allRoles, error: rolesError2 } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role");

    if (rolesError2) throw rolesError2;

    // Get practitioners
    const { data: practitioners, error: practitionersError } = await supabaseAdmin
      .from("practitioners")
      .select("id, user_id, name");

    if (practitionersError) throw practitionersError;

    // Combine data
    const usersWithRoles = authUsers.users.map((user) => {
      const userRoles = allRoles?.filter((r) => r.user_id === user.id) || [];
      const practitioner = practitioners?.find((p) => p.user_id === user.id) || null;

      return {
        id: user.id,
        email: user.email || "",
        created_at: user.created_at,
        email_confirmed_at: user.email_confirmed_at,
        roles: userRoles.map((r) => ({ role: r.role })),
        practitioner: practitioner ? { id: practitioner.id, name: practitioner.name } : null,
      };
    });

    logStep("Users processed", { count: usersWithRoles.length });

    return new Response(JSON.stringify({ users: usersWithRoles }), {
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

