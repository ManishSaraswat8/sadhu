import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { sendPostmarkEmail } from "../_shared/postmark.ts";
import { format, addHours } from "https://esm.sh/date-fns@2.30.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-CLASS-REMINDER] ${step}${detailsStr}`);
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

    // This function can be called in two ways:
    // 1. With a specific session_id to send reminder for that session
    // 2. Without parameters to send reminders for all upcoming sessions (called by cron)
    const { session_id } = await req.json();

    let sessionsToRemind: any[] = [];

    if (session_id) {
      // Send reminder for specific session
      const { data: session } = await supabaseClient
        .from("session_schedules")
        .select(`
          *,
          practitioner:practitioners(id, name),
          client:profiles!session_schedules_client_id_fkey(id, full_name, email)
        `)
        .eq("id", session_id)
        .eq("status", "scheduled")
        .single();

      if (session) {
        sessionsToRemind = [session];
      }
    } else {
      // Find all sessions that need reminders (24 hours before)
      const now = new Date();
      const reminderTime = addHours(now, 24);
      const reminderTimeEnd = addHours(now, 25); // 1 hour window

      const { data: sessions } = await supabaseClient
        .from("session_schedules")
        .select(`
          *,
          practitioner:practitioners(id, name),
          client:profiles!session_schedules_client_id_fkey(id, full_name, email)
        `)
        .eq("status", "scheduled")
        .gte("scheduled_at", reminderTime.toISOString())
        .lte("scheduled_at", reminderTimeEnd.toISOString())
        .is("reminder_sent", null); // Only send if reminder hasn't been sent

      if (sessions) {
        sessionsToRemind = sessions;
      }
    }

    if (sessionsToRemind.length === 0) {
      logStep("No sessions to remind");
      return new Response(
        JSON.stringify({ success: true, reminders_sent: 0 }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const siteUrl = Deno.env.get("SITE_URL") || "https://sadhu.com";
    const templateId = Deno.env.get("POSTMARK_CLASS_REMINDER_TEMPLATE_ID");
    const templateAlias = Deno.env.get("POSTMARK_CLASS_REMINDER_TEMPLATE_ALIAS");

    let remindersSent = 0;
    const errors: string[] = [];

    for (const session of sessionsToRemind) {
      try {
        // Get client email
        let clientEmail = (session.client as any)?.email;
        if (!clientEmail) {
          const { data: authUser } = await supabaseClient.auth.admin.getUserById(session.client_id);
          clientEmail = authUser?.user?.email;
        }

        if (!clientEmail) {
          logStep("Skipping session - no email", { session_id: session.id });
          continue;
        }

        const clientName = (session.client as any)?.full_name || clientEmail.split("@")[0];
        const practitionerName = (session.practitioner as any)?.name || "Your Practitioner";
        const scheduledAt = new Date(session.scheduled_at);
        const sessionDate = format(scheduledAt, "EEEE, MMMM d, yyyy");
        const sessionTime = format(scheduledAt, "h:mm a");
        const duration = session.duration_minutes || 60;
        const isGroup = session.is_group || false;
        const className = session.class_name || null;
        const location = session.session_location || 'online';
        const physicalLocation = session.physical_location || null;

        // Get studio location details if in-person
        let locationDetails = null;
        if (location === 'in_person' && physicalLocation) {
          const { data: studio } = await supabaseClient
            .from("studio_locations")
            .select("name, address, city, province_state")
            .eq("id", physicalLocation)
            .single();
          
          if (studio) {
            locationDetails = `${studio.name}, ${studio.address}, ${studio.city}, ${studio.province_state}`;
          }
        }

        const sessionUrl = `${siteUrl}/sessions/${session.id}`;

        const templateModel = {
          client_name: clientName,
          practitioner_name: practitionerName,
          session_date: sessionDate,
          session_time: sessionTime,
          duration_minutes: duration,
          is_group: isGroup,
          class_name: className,
          location: location === 'online' ? 'Online' : 'In-Person',
          location_details: locationDetails,
          session_url: sessionUrl,
          support_email: "support@sadhu.com",
        };

        let emailResult;
        if (templateId || templateAlias) {
          emailResult = await sendPostmarkEmail({
            to: clientEmail,
            templateId: templateId ? parseInt(templateId) : undefined,
            templateAlias: templateAlias || undefined,
            templateModel,
            tag: "class-reminder",
            metadata: {
              session_id: session.id,
              user_id: session.client_id,
              email_type: "class-reminder",
            },
          });
        } else {
          // Fallback email
          const sessionTypeText = isGroup && className 
            ? `Group Class: ${className}`
            : isGroup 
            ? "Group Class"
            : "1:1 Session";
          
          const locationText = location === 'online' 
            ? "Online (via video call)"
            : locationDetails 
            ? `In-Person at ${locationDetails}`
            : "In-Person";

          emailResult = await sendPostmarkEmail({
            to: clientEmail,
            subject: `Reminder: Your ${sessionTypeText} is Tomorrow`,
            htmlBody: `
              <h1>Session Reminder</h1>
              <p>Hi ${clientName},</p>
              <p>This is a friendly reminder that you have a session coming up:</p>
              <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Session Type:</strong> ${sessionTypeText}</p>
                <p><strong>Practitioner:</strong> ${practitionerName}</p>
                <p><strong>Date:</strong> ${sessionDate}</p>
                <p><strong>Time:</strong> ${sessionTime}</p>
                <p><strong>Duration:</strong> ${duration} minutes</p>
                <p><strong>Location:</strong> ${locationText}</p>
              </div>
              <p><a href="${sessionUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Session Details</a></p>
              <p>We look forward to seeing you!</p>
              <p>If you need to reschedule or cancel, please do so at least 3 hours before your session.</p>
              <p>Best regards,<br>The Sadhu Team</p>
            `,
            textBody: `
              Session Reminder

              Hi ${clientName},

              This is a friendly reminder that you have a session coming up:

              Session Type: ${sessionTypeText}
              Practitioner: ${practitionerName}
              Date: ${sessionDate}
              Time: ${sessionTime}
              Duration: ${duration} minutes
              Location: ${locationText}

              View Session Details: ${sessionUrl}

              We look forward to seeing you!

              If you need to reschedule or cancel, please do so at least 3 hours before your session.

              Best regards,
              The Sadhu Team
            `,
            tag: "class-reminder",
            metadata: {
              session_id: session.id,
              user_id: session.client_id,
              email_type: "class-reminder",
            },
          });
        }

        // Mark reminder as sent
        await supabaseClient
          .from("session_schedules")
          .update({ reminder_sent: new Date().toISOString() })
          .eq("id", session.id);

        remindersSent++;
        logStep("Reminder sent", { 
          session_id: session.id,
          messageId: emailResult.MessageID 
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`Session ${session.id}: ${errorMessage}`);
        logStep("Error sending reminder", { session_id: session.id, error: errorMessage });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        reminders_sent: remindersSent,
        errors: errors.length > 0 ? errors : undefined,
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

