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
  console.log(`[SEND-PAYMENT-RECEIPT] ${step}${detailsStr}`);
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

    const { payment_intent_id, checkout_session_id, user_id, email } = await req.json();

    if (!user_id && !email) {
      throw new Error("user_id or email is required");
    }

    // Get user email
    let clientEmail = email;
    if (!clientEmail && user_id) {
      const { data: authUser } = await supabaseClient.auth.admin.getUserById(user_id);
      clientEmail = authUser?.user?.email;
    }

    if (!clientEmail) {
      throw new Error("Client email not found");
    }

    // Get user profile
    let clientName = clientEmail.split("@")[0];
    if (user_id) {
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("full_name")
        .eq("id", user_id)
        .single();
      
      if (profile?.full_name) {
        clientName = profile.full_name;
      }
    }

    // Fetch payment details from Stripe or database
    let paymentDetails: any = null;
    
    if (payment_intent_id) {
      // Try to get from session_payments table
      const { data: payment } = await supabaseClient
        .from("session_payments")
        .select("*")
        .eq("stripe_payment_intent_id", payment_intent_id)
        .single();

      if (payment) {
        paymentDetails = {
          amount: payment.total_amount,
          currency: payment.currency || 'usd',
          description: "Session Payment",
          date: payment.created_at || new Date().toISOString(),
        };
      }
    }

    // If not found in database, try to get from Stripe
    if (!paymentDetails && payment_intent_id) {
      try {
        const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
        if (stripeKey) {
          const Stripe = (await import("https://esm.sh/stripe@18.5.0")).default;
          const stripe = new Stripe(stripeKey);
          
          const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
          paymentDetails = {
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency,
            description: paymentIntent.description || "Payment",
            date: new Date(paymentIntent.created * 1000).toISOString(),
          };
        }
      } catch (stripeError) {
        logStep("Could not fetch from Stripe", { error: String(stripeError) });
      }
    }

    // If still no details, use defaults
    if (!paymentDetails) {
      paymentDetails = {
        amount: 0,
        currency: 'usd',
        description: "Payment",
        date: new Date().toISOString(),
      };
    }

    const paymentDate = format(new Date(paymentDetails.date), "MMMM d, yyyy 'at' h:mm a");
    const amountFormatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: paymentDetails.currency.toUpperCase(),
    }).format(paymentDetails.amount);

    const siteUrl = Deno.env.get("SITE_URL") || "https://sadhu.com";

    // Get Postmark template configuration
    const templateId = Deno.env.get("POSTMARK_PAYMENT_RECEIPT_TEMPLATE_ID");
    const templateAlias = Deno.env.get("POSTMARK_PAYMENT_RECEIPT_TEMPLATE_ALIAS");

    const templateModel = {
      client_name: clientName,
      amount: paymentDetails.amount,
      amount_formatted: amountFormatted,
      currency: paymentDetails.currency.toUpperCase(),
      description: paymentDetails.description,
      payment_date: paymentDate,
      payment_intent_id: payment_intent_id || "N/A",
      receipt_url: `${siteUrl}/wallet`,
      support_email: "support@sadhu.com",
    };

    let emailResult;
    if (templateId || templateAlias) {
      emailResult = await sendPostmarkEmail({
        to: clientEmail,
        templateId: templateId ? parseInt(templateId) : undefined,
        templateAlias: templateAlias || undefined,
        templateModel,
        tag: "payment-receipt",
        metadata: {
          payment_intent_id: payment_intent_id || "",
          user_id: user_id || "",
          email_type: "payment-receipt",
        },
      });
    } else {
      // Fallback email
      emailResult = await sendPostmarkEmail({
        to: clientEmail,
        subject: `Payment Receipt - ${amountFormatted}`,
        htmlBody: `
          <h1>Payment Receipt</h1>
          <p>Hi ${clientName},</p>
          <p>Thank you for your payment. Here is your receipt:</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Amount:</strong> ${amountFormatted}</p>
            <p><strong>Description:</strong> ${paymentDetails.description}</p>
            <p><strong>Date:</strong> ${paymentDate}</p>
            ${payment_intent_id ? `<p><strong>Transaction ID:</strong> ${payment_intent_id}</p>` : ''}
          </div>
          <p><a href="${siteUrl}/wallet" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Payment History</a></p>
          <p>If you have any questions about this payment, contact us at support@sadhu.com</p>
          <p>Best regards,<br>The Sadhu Team</p>
        `,
        textBody: `
          Payment Receipt

          Hi ${clientName},

          Thank you for your payment. Here is your receipt:

          Amount: ${amountFormatted}
          Description: ${paymentDetails.description}
          Date: ${paymentDate}
          ${payment_intent_id ? `Transaction ID: ${payment_intent_id}` : ''}

          View Payment History: ${siteUrl}/wallet

          If you have any questions about this payment, contact us at support@sadhu.com

          Best regards,
          The Sadhu Team
        `,
        tag: "payment-receipt",
        metadata: {
          payment_intent_id: payment_intent_id || "",
          user_id: user_id || "",
          email_type: "payment-receipt",
        },
      });
    }

    logStep("Payment receipt email sent", { 
      messageId: emailResult.MessageID,
      paymentIntentId: payment_intent_id 
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

