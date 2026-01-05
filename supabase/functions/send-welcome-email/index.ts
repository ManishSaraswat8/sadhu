import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { sendPostmarkEmail } from "../_shared/postmark.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-WELCOME-EMAIL] ${step}${detailsStr}`);
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

    const { user_id, email, name } = await req.json();

    if (!user_id || !email) {
      throw new Error("user_id and email are required");
    }

    logStep("Sending welcome email", { user_id, email });

    // Get user profile if available
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("full_name")
      .eq("id", user_id)
      .single();

    const userName = name || profile?.full_name || email.split("@")[0];

    // Get site URL for links
    const siteUrl = Deno.env.get("SITE_URL") || "https://sadhu.com";

    // Send welcome email via Postmark
    // You can use either templateId (numeric) or templateAlias (string)
    // Replace with your actual Postmark template ID or alias
    const templateId = Deno.env.get("POSTMARK_WELCOME_TEMPLATE_ID");
    const templateAlias = Deno.env.get("POSTMARK_WELCOME_TEMPLATE_ALIAS");

    const templateModel = {
      name: userName,
      email: email,
      login_url: `${siteUrl}/auth?mode=login`,
      support_email: "support@sadhu.com",
    };

    let emailResult;
    if (templateId || templateAlias) {
      emailResult = await sendPostmarkEmail({
        to: email,
        templateId: templateId ? parseInt(templateId) : undefined,
        templateAlias: templateAlias || undefined,
        templateModel,
        tag: "welcome",
        metadata: {
          user_id: user_id,
          email_type: "welcome",
        },
      });
    } else {
      // Fallback to plain email if no template is configured
      emailResult = await sendPostmarkEmail({
        to: email,
        subject: "Welcome to Sadhu!",
        htmlBody: `
          <h1>Welcome to Sadhu, ${userName}!</h1>
          <p>Thank you for joining our community. We're excited to have you on this journey.</p>
          <p>You can now book sessions with our practitioners and start your wellness journey.</p>
          <p><a href="${siteUrl}/auth?mode=login">Log in to your account</a></p>
          <p>If you have any questions, feel free to reach out to us at support@sadhu.com</p>
          <p>Best regards,<br>The Sadhu Team</p>
        `,
        textBody: `
          Welcome to Sadhu, ${userName}!

          Thank you for joining our community. We're excited to have you on this journey.

          You can now book sessions with our practitioners and start your wellness journey.

          Log in to your account: ${siteUrl}/auth?mode=login

          If you have any questions, feel free to reach out to us at support@sadhu.com

          Best regards,
          The Sadhu Team
        `,
        tag: "welcome",
        metadata: {
          user_id: user_id,
          email_type: "welcome",
        },
      });
    }

    logStep("Welcome email sent", { messageId: emailResult.MessageID });

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

