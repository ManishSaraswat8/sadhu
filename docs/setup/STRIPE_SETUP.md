# Stripe Setup Guide

This guide explains how to configure Stripe API keys for payment processing.

## Required Stripe Keys

You need **only one** Stripe key:
- `STRIPE_SECRET_KEY` - Your Stripe Secret Key (starts with `sk_test_` for test mode or `sk_live_` for production)

**Note:** The Stripe Publishable Key is **NOT required** because:
- All Stripe operations are handled server-side through Edge Functions
- The frontend redirects users to Stripe's hosted checkout pages
- There's no client-side Stripe.js integration needed

## Where Stripe is Used

The following Edge Functions use Stripe:

1. **create-session-payment** - Creates Stripe checkout sessions for individual sessions and packages
2. **create-board-payment** - Creates Stripe checkout sessions for Sadhu Board purchases
3. **stripe-session-webhook** - Handles Stripe webhook events (payment confirmations)
4. **create-checkout** - Creates Stripe checkout sessions for subscriptions
5. **customer-portal** - Creates Stripe customer portal sessions for subscription management
6. **check-subscription** - Checks user subscription status via Stripe API

## How to Set Stripe Keys

### Method 1: Using Supabase CLI (Recommended)

1. **Get your Stripe Secret Key**:
   - Go to [Stripe Dashboard](https://dashboard.stripe.com/)
   - Navigate to **Developers** > **API keys**
   - Copy your **Secret key** (starts with `sk_test_` for test or `sk_live_` for production)

2. **Set the secret using Supabase CLI**:
   ```bash
   supabase secrets set STRIPE_SECRET_KEY=sk_test_your_secret_key_here
   ```

   Or for production:
   ```bash
   supabase secrets set STRIPE_SECRET_KEY=sk_live_your_secret_key_here
   ```

3. **Verify the secret was set**:
   ```bash
   supabase secrets list
   ```

### Method 2: Using Supabase Dashboard

1. **Go to your Supabase project dashboard**:
   - Navigate to [Supabase Dashboard](https://supabase.com/dashboard)
   - Select your project

2. **Navigate to Edge Functions secrets**:
   - Go to **Project Settings** (gear icon in sidebar)
   - Click on **Edge Functions** in the left menu
   - Scroll to **Secrets** section

3. **Add the secret**:
   - Click **Add new secret**
   - Name: `STRIPE_SECRET_KEY`
   - Value: Your Stripe Secret Key (starts with `sk_test_` or `sk_live_`)
   - Click **Save**

## Stripe Webhook Setup

**⚠️ IMPORTANT:** The webhook is required for payments to be recorded in your database!

For detailed webhook setup instructions, see: **[STRIPE_WEBHOOK_SETUP.md](./STRIPE_WEBHOOK_SETUP.md)**

**Quick Setup:**
1. Your webhook URL: `https://dkpxubmenfgmaodsufli.supabase.co/functions/v1/stripe-session-webhook`
2. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/test/webhooks)
3. Click "Add endpoint" and paste the URL above
4. Select event: `checkout.session.completed`
5. Click "Add endpoint"

**Without the webhook, payments complete in Stripe but won't create sessions or credits in your database!**

## Testing

After setting up Stripe keys:

1. **Test a payment flow**:
   - Go to `/sessions/payment` in your app
   - Try to purchase a session or package
   - Use Stripe test card: `4242 4242 4242 4242`
   - Any future expiry date and any CVC

2. **Check Edge Function logs**:
   ```bash
   supabase functions logs create-session-payment
   ```
   Or view in Supabase Dashboard > Edge Functions > Logs

3. **Verify webhook is receiving events**:
   ```bash
   supabase functions logs stripe-session-webhook
   ```

## Stripe Test vs Production Keys

- **Test Mode**: Use keys starting with `sk_test_` for development
- **Production Mode**: Use keys starting with `sk_live_` for live payments

**Important**: Never commit Stripe keys to version control. Always use Supabase secrets.

## Troubleshooting

### Error: "STRIPE_SECRET_KEY is not set"
- Make sure you've set the secret using `supabase secrets set`
- Verify with `supabase secrets list`
- Redeploy functions if needed: `supabase functions deploy`

### Error: "Invalid API Key"
- Check that you copied the full key (it's long, starts with `sk_test_` or `sk_live_`)
- Make sure there are no extra spaces or newlines
- Verify you're using the correct key (test vs production)

### Webhook not receiving events
- Verify the webhook URL is correct in Stripe Dashboard
- Check that the webhook endpoint is deployed
- View webhook logs in Stripe Dashboard > Webhooks > Your endpoint > Events

### Payments not completing
- Check Edge Function logs for errors
- Verify webhook is configured and receiving events
- Check that `stripe-session-webhook` function is deployed and working

## Security Best Practices

1. **Never expose secret keys**:
   - Never commit `STRIPE_SECRET_KEY` to git
   - Never log the key in Edge Functions
   - Only use Supabase secrets for storage

2. **Use webhook signature verification** (for production):
   - Add `STRIPE_WEBHOOK_SECRET` to verify webhook events
   - Update `stripe-session-webhook` to verify signatures

3. **Use environment-specific keys**:
   - Use test keys for development
   - Use production keys only in production environment

4. **Rotate keys regularly**:
   - Rotate keys if compromised
   - Update in Supabase secrets immediately

## Additional Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Supabase Edge Functions Secrets](https://supabase.com/docs/guides/functions/secrets)

