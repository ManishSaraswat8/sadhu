# Stripe Webhook Setup Guide

This guide explains how to set up Stripe webhooks so payments are automatically recorded in your database.

## Why Webhooks Are Needed

When a user completes payment in Stripe Checkout, Stripe needs to notify your application. The webhook is what triggers:
- Creating session schedules in the database
- Recording payments in `session_payments` table
- Creating session credits for package purchases
- Setting up Agora video rooms

**Without the webhook, payments complete in Stripe but nothing happens in your database!**

## Step-by-Step Setup

### Step 1: Get Your Webhook URL

Your webhook URL is:
```
https://dkpxubmenfgmaodsufli.supabase.co/functions/v1/stripe-session-webhook
```

**Note:** Replace `dkpxubmenfgmaodsufli` with your actual Supabase project ID if different.

### Step 2: Configure Webhook in Stripe Dashboard

1. **Go to Stripe Dashboard**:
   - Visit [https://dashboard.stripe.com/test/webhooks](https://dashboard.stripe.com/test/webhooks) (for test mode)
   - Or [https://dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks) (for production)

2. **Click "Add endpoint"** (top right)

3. **Enter your webhook URL**:
   ```
   https://dkpxubmenfgmaodsufli.supabase.co/functions/v1/stripe-session-webhook
   ```

4. **Select events to listen to**:
   - Click "Select events"
   - Choose "Select events to listen to"
   - Search and select:
     - ✅ `checkout.session.completed` (REQUIRED)
     - ✅ `checkout.session.async_payment_succeeded` (optional, for delayed payments)
     - ✅ `checkout.session.async_payment_failed` (optional, for failed payments)
   - Click "Add events"

5. **Click "Add endpoint"**

### Step 3: Get Webhook Signing Secret (Recommended)

After creating the webhook:

1. **Click on your webhook endpoint** in the list
2. **Find "Signing secret"** section
3. **Click "Reveal"** and copy the secret (starts with `whsec_`)

4. **Add to Supabase secrets**:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
   ```

   Or via Dashboard:
   - Go to Supabase Dashboard > Project Settings > Edge Functions > Secrets
   - Add new secret: `STRIPE_WEBHOOK_SECRET` = `whsec_your_secret_here`

### Step 4: Test the Webhook

1. **Make a test payment**:
   - Go to your app and complete a test payment
   - Use test card: `4242 4242 4242 4242`
   - Any future expiry date, any CVC

2. **Check webhook logs in Stripe**:
   - Go to Stripe Dashboard > Webhooks > Your endpoint
   - Click on "Events" tab
   - You should see `checkout.session.completed` events
   - Click on an event to see details
   - Check if it was successful (green) or failed (red)

3. **Check Edge Function logs**:
   ```bash
   supabase functions logs stripe-session-webhook
   ```
   
   Or in Supabase Dashboard:
   - Go to Edge Functions > stripe-session-webhook > Logs
   - Look for log entries showing payment processing

4. **Verify in database**:
   - Check `session_schedules` table for new sessions
   - Check `session_payments` table for payment records
   - Check `user_session_credits` table for package credits

## Troubleshooting

### Webhook Not Receiving Events

**Check 1: Webhook URL is correct**
- Verify the URL in Stripe Dashboard matches your Supabase function URL
- Make sure there are no typos
- URL should be: `https://YOUR_PROJECT_ID.supabase.co/functions/v1/stripe-session-webhook`

**Check 2: Webhook is enabled**
- In Stripe Dashboard > Webhooks, make sure your endpoint shows "Enabled"
- If it shows "Disabled", click on it and enable it

**Check 3: Events are selected**
- Make sure `checkout.session.completed` is selected
- Go to your webhook endpoint > Events tab
- Verify the event is listed

**Check 4: Function is deployed**
```bash
supabase functions deploy stripe-session-webhook
```

### Webhook Receiving Events But Not Processing

**Check 1: Function logs**
```bash
supabase functions logs stripe-session-webhook --tail
```

Look for errors like:
- "Missing client_id in metadata" - means metadata wasn't passed correctly
- "Practitioner not found" - means practitioner_id is invalid
- Database errors - check the specific error message

**Check 2: Metadata is correct**
- The webhook needs `client_id` in metadata
- For single sessions, it also needs `practitioner_id` and `scheduled_at`
- Check the `create-session-payment` function to ensure metadata is being set

**Check 3: Database permissions**
- Make sure RLS policies allow the service role to insert into:
  - `session_schedules`
  - `session_payments`
  - `user_session_credits`

### Testing Webhook Locally (Advanced)

If you want to test webhooks locally during development:

1. **Use Stripe CLI**:
   ```bash
   # Install Stripe CLI
   brew install stripe/stripe-cli/stripe
   
   # Login
   stripe login
   
   # Forward webhooks to local function
   stripe listen --forward-to localhost:54321/functions/v1/stripe-session-webhook
   ```

2. **Use ngrok** (alternative):
   ```bash
   # Install ngrok
   brew install ngrok
   
   # Start tunnel
   ngrok http 54321
   
   # Use the ngrok URL in Stripe webhook settings
   ```

## Webhook Events Flow

Here's what happens when a payment completes:

1. **User completes payment** in Stripe Checkout
2. **Stripe sends webhook** to your endpoint
3. **Webhook function processes**:
   - For **single sessions**: Creates `session_schedules` entry and `session_payments` record
   - For **packages**: Creates `user_session_credits` entries
4. **Database is updated** with payment and session information

## Security: Webhook Signature Verification

Currently, the webhook doesn't verify signatures. For production, you should add signature verification:

1. **Get webhook secret** (as shown in Step 3)
2. **Update the webhook function** to verify signatures (we can add this if needed)

For now, the webhook works without signature verification, but it's recommended for production.

## Quick Checklist

- [ ] Webhook endpoint created in Stripe Dashboard
- [ ] Webhook URL is correct: `https://dkpxubmenfgmaodsufli.supabase.co/functions/v1/stripe-session-webhook`
- [ ] Event `checkout.session.completed` is selected
- [ ] Webhook is enabled (not disabled)
- [ ] `stripe-session-webhook` function is deployed
- [ ] Test payment completed
- [ ] Webhook event appears in Stripe Dashboard
- [ ] Function logs show successful processing
- [ ] Database has new session/payment records

## Need Help?

If webhook still isn't working:

1. **Check Stripe Dashboard** > Webhooks > Your endpoint > Events
   - Look for failed events (red)
   - Click on failed events to see error details

2. **Check Supabase Function Logs**:
   ```bash
   supabase functions logs stripe-session-webhook --tail
   ```

3. **Verify metadata**:
   - Make a test payment
   - In Stripe Dashboard > Payments > Your payment > Metadata
   - Verify `client_id`, `practitioner_id`, `scheduled_at` are present

4. **Test webhook manually**:
   - In Stripe Dashboard > Webhooks > Your endpoint
   - Click "Send test webhook"
   - Select `checkout.session.completed`
   - Check if it succeeds

