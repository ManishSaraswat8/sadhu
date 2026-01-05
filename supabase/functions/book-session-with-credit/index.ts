import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[BOOK-SESSION-WITH-CREDIT] ${step}${detailsStr}`);
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

    // Get request body
    const { 
      practitioner_id, 
      scheduled_at, 
      duration_minutes,
      session_type_id,
      session_type = 'standing',
      is_group = false,
      session_location = 'online',
      physical_location = null,
      notes = null
    } = await req.json();
    
    logStep("Request body parsed", { 
      practitioner_id, 
      scheduled_at, 
      duration_minutes,
      session_type_id
    });

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.id) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Verify practitioner exists
    const { data: practitioner, error: practitionerError } = await supabaseClient
      .from("practitioners")
      .select("id, name")
      .eq("id", practitioner_id)
      .single();

    if (practitionerError || !practitioner) {
      throw new Error("Practitioner not found");
    }
    logStep("Practitioner found", { practitioner });

    // Find an available credit to use
    // Priority: 1) Package credits (session_type_id is null - can be used for any session)
    //           2) Session-type-specific credits matching this session type (includes duration)
    let creditToUse = null;
    
    // First, try to find a package credit (session_type_id is null - can be used for any duration)
    const { data: packageCredit, error: packageError } = await supabaseClient
      .from("user_session_credits")
      .select("id, credits_remaining, session_type_id, expires_at")
      .eq("user_id", user.id)
      .is("session_type_id", null)
      .gt("credits_remaining", 0)
      .or("expires_at.is.null,expires_at.gt.now()")
      .order("purchased_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!packageError && packageCredit) {
      creditToUse = packageCredit;
      logStep("Found package credit", { creditId: creditToUse.id });
    } else if (session_type_id) {
      // If no package credit, try to find a session-type-specific credit
      // This must match the exact session_type_id (which includes duration_minutes, session_type, and is_group)
      const { data: typeCredit, error: typeError } = await supabaseClient
        .from("user_session_credits")
        .select("id, credits_remaining, session_type_id, expires_at")
        .eq("user_id", user.id)
        .eq("session_type_id", session_type_id)
        .gt("credits_remaining", 0)
        .or("expires_at.is.null,expires_at.gt.now()")
        .order("purchased_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!typeError && typeCredit) {
        creditToUse = typeCredit;
        logStep("Found session-type credit", { creditId: creditToUse.id, sessionTypeId: session_type_id });
      }
    }

    if (!creditToUse) {
      throw new Error("No available credits found for this session type and duration");
    }

    // Generate room name
    const roomName = `session-${practitioner_id.substring(0, 8)}-${user.id.substring(0, 8)}-${Date.now()}`;

    // Create Agora room/channel
    let finalRoomName = roomName;
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      if (supabaseUrl) {
        const agoraResponse = await fetch(`${supabaseUrl}/functions/v1/create-agora-room`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            channelName: roomName,
            isGroup: is_group,
          }),
        });

        if (agoraResponse.ok) {
          const agoraData = await agoraResponse.json();
          if (agoraData?.channelName) {
            finalRoomName = agoraData.channelName;
            logStep("Agora room created", { channelName: finalRoomName });
          }
        }
      }
    } catch (err) {
      logStep("Agora room creation failed, using fallback", { error: err });
    }

    // Create session
    const { data: session, error: sessionError } = await supabaseClient
      .from("session_schedules")
      .insert({
        practitioner_id,
        client_id: user.id,
        scheduled_at,
        duration_minutes,
        room_name: finalRoomName,
        host_room_url: null,
        session_location,
        physical_location,
        status: "scheduled",
        notes,
      })
      .select()
      .single();

    if (sessionError) {
      logStep("Error creating session", { error: sessionError.message });
      throw sessionError;
    }
    logStep("Session created", { sessionId: session.id });

    // Deduct credit
    const { error: deductError } = await supabaseClient
      .from("user_session_credits")
      .update({ 
        credits_remaining: creditToUse.credits_remaining - 1 
      })
      .eq("id", creditToUse.id);

    if (deductError) {
      logStep("Error deducting credit, rolling back session", { error: deductError.message });
      // Rollback session creation if credit deduction fails
      await supabaseClient
        .from("session_schedules")
        .delete()
        .eq("id", session.id);
      throw new Error(`Failed to deduct credit: ${deductError.message}`);
    }
    logStep("Credit deducted", { 
      creditId: creditToUse.id, 
      remaining: creditToUse.credits_remaining - 1 
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
          body: JSON.stringify({ session_id: session.id }),
        }).catch((err) => {
          logStep("Failed to send booking confirmation email", { error: String(err) });
        });
      }
    } catch (emailError) {
      logStep("Error triggering booking confirmation email", { error: String(emailError) });
      // Don't fail the request if email fails
    }

    return new Response(JSON.stringify({ 
      success: true,
      session_id: session.id,
      credits_remaining: creditToUse.credits_remaining - 1
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

