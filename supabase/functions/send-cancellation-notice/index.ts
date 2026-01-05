import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { sendPostmarkEmail } from "../_shared/postmark.ts";
import { format } from "https://esm.sh/date-fns@2.30.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-CANCELLATION-NOTICE] ${step}${detailsStr}`);
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

    const { session_id, cancellation_type, credit_returned, is_reschedule = false } = await req.json();

    if (!session_id) {
      throw new Error("session_id is required");
    }

    // Fetch session details
    const { data: session, error: sessionError } = await supabaseClient
      .from("session_schedules")
      .select(`
        *,
        practitioner:practitioners(id, name),
        client:profiles!session_schedules_client_id_fkey(id, full_name, email)
      `)
      .eq("id", session_id)
      .single();

    if (sessionError || !session) {
      throw new Error("Session not found");
    }

    // Get client email
    let clientEmail = (session.client as any)?.email;
    if (!clientEmail) {
      const { data: authUser } = await supabaseClient.auth.admin.getUserById(session.client_id);
      clientEmail = authUser?.user?.email;
    }

    if (!clientEmail) {
      throw new Error("Client email not found");
    }

    const clientName = (session.client as any)?.full_name || clientEmail.split("@")[0];
    const practitionerName = (session.practitioner as any)?.name || "Your Practitioner";
    const scheduledAt = new Date(session.scheduled_at);
    const sessionDate = format(scheduledAt, "EEEE, MMMM d, yyyy");
    const sessionTime = format(scheduledAt, "h:mm a");
    const duration = session.duration_minutes || 60;
    const isGroup = session.is_group || false;
    const className = session.class_name || null;

    const siteUrl = Deno.env.get("SITE_URL") || "https://sadhu.com";
    const templateId = Deno.env.get("POSTMARK_CANCELLATION_NOTICE_TEMPLATE_ID");
    const templateAlias = Deno.env.get("POSTMARK_CANCELLATION_NOTICE_TEMPLATE_ALIAS");

    // Determine message based on cancellation type and whether it's a reschedule
    let subjectPrefix = is_reschedule ? "Session Rescheduled" : "Session Cancelled";
    let actionText = is_reschedule ? "rescheduled" : "cancelled";
    let creditMessage = "";

    if (!is_reschedule) {
      if (cancellation_type === 'standard' || cancellation_type === 'grace') {
        creditMessage = "Your class credit has been returned to your wallet and is available for future use.";
      } else if (cancellation_type === 'late') {
        creditMessage = credit_returned > 0 
          ? `A partial credit of $${credit_returned.toFixed(2)} has been returned to your wallet.`
          : "No credit was returned due to late cancellation.";
      } else {
        creditMessage = "No credit was returned due to last-minute cancellation (less than 3 hours before the session).";
      }
    }

    const templateModel = {
      client_name: clientName,
      practitioner_name: practitionerName,
      session_date: sessionDate,
      session_time: sessionTime,
      duration_minutes: duration,
      is_group: isGroup,
      class_name: className,
      action_text: actionText,
      is_reschedule: is_reschedule,
      cancellation_type: cancellation_type || 'standard',
      credit_message: creditMessage,
      support_email: "support@sadhu.com",
    };

    let emailResult;
    if (templateId || templateAlias) {
      emailResult = await sendPostmarkEmail({
        to: clientEmail,
        templateId: templateId ? parseInt(templateId) : undefined,
        templateAlias: templateAlias || undefined,
        templateModel,
        tag: is_reschedule ? "reschedule-notice" : "cancellation-notice",
        metadata: {
          session_id: session_id,
          user_id: session.client_id,
          email_type: is_reschedule ? "reschedule-notice" : "cancellation-notice",
          cancellation_type: cancellation_type || 'standard',
        },
      });
    } else {
      // Fallback email
      const sessionTypeText = isGroup && className 
        ? `Group Class: ${className}`
        : isGroup 
        ? "Group Class"
        : "1:1 Session";

      emailResult = await sendPostmarkEmail({
        to: clientEmail,
        subject: `${subjectPrefix}: ${sessionTypeText} with ${practitionerName}`,
        htmlBody: `
          <h1>Session ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}</h1>
          <p>Hi ${clientName},</p>
          <p>Your session has been ${actionText}. Here are the details:</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Session Type:</strong> ${sessionTypeText}</p>
            <p><strong>Practitioner:</strong> ${practitionerName}</p>
            <p><strong>Original Date:</strong> ${sessionDate}</p>
            <p><strong>Original Time:</strong> ${sessionTime}</p>
            <p><strong>Duration:</strong> ${duration} minutes</p>
          </div>
          ${creditMessage ? `<p>${creditMessage}</p>` : ''}
          <p>If you have any questions, contact us at support@sadhu.com</p>
          <p>Best regards,<br>The Sadhu Team</p>
        `,
        textBody: `
          Session ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}

          Hi ${clientName},

          Your session has been ${actionText}. Here are the details:

          Session Type: ${sessionTypeText}
          Practitioner: ${practitionerName}
          Original Date: ${sessionDate}
          Original Time: ${sessionTime}
          Duration: ${duration} minutes

          ${creditMessage ? creditMessage : ''}

          If you have any questions, contact us at support@sadhu.com

          Best regards,
          The Sadhu Team
        `,
        tag: is_reschedule ? "reschedule-notice" : "cancellation-notice",
        metadata: {
          session_id: session_id,
          user_id: session.client_id,
          email_type: is_reschedule ? "reschedule-notice" : "cancellation-notice",
          cancellation_type: cancellation_type || 'standard',
        },
      });
    }

    logStep(`${is_reschedule ? 'Reschedule' : 'Cancellation'} notice sent`, { 
      messageId: emailResult.MessageID,
      sessionId: session_id 
    });

    return new Response(
      JSON.stringify({
        success: true,
        messageId: emailResult.MessageID,
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

