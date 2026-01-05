# Postmark Email Integration Setup

This document explains how to set up and configure Postmark for transactional emails in the Sadhu application.

## Overview

The application uses Postmark to send the following transactional emails:
- **Welcome Email**: Sent when a new user account is created
- **Booking Confirmation**: Sent when a session is successfully booked
- **Payment Receipt**: Sent after a successful payment
- **Class Reminder**: Sent 24 hours before a scheduled session
- **Cancellation/Reschedule Notice**: Sent when a session is cancelled or rescheduled

## Prerequisites

1. Create a Postmark account at [https://postmarkapp.com](https://postmarkapp.com)
2. Create a Server in Postmark (you'll get a Server API Token)
3. Create email templates in Postmark (optional, but recommended)

## Environment Variables

Add the following environment variables to your Supabase project:

### Required
- `POSTMARK_SERVER_TOKEN` or `POSTMARK_API_KEY`: Your Postmark Server API Token
- `POSTMARK_FROM_EMAIL`: The email address to send from (must be verified in Postmark)
- `SITE_URL`: Your application URL (e.g., `https://sadhu.com`)

### Optional (Template IDs)
If you're using Postmark templates, you can specify template IDs or aliases:

- `POSTMARK_WELCOME_TEMPLATE_ID` or `POSTMARK_WELCOME_TEMPLATE_ALIAS`
- `POSTMARK_BOOKING_CONFIRMATION_TEMPLATE_ID` or `POSTMARK_BOOKING_CONFIRMATION_TEMPLATE_ALIAS`
- `POSTMARK_PAYMENT_RECEIPT_TEMPLATE_ID` or `POSTMARK_PAYMENT_RECEIPT_TEMPLATE_ALIAS`
- `POSTMARK_CLASS_REMINDER_TEMPLATE_ID` or `POSTMARK_CLASS_REMINDER_TEMPLATE_ALIAS`
- `POSTMARK_CANCELLATION_NOTICE_TEMPLATE_ID` or `POSTMARK_CANCELLATION_NOTICE_TEMPLATE_ALIAS`

## Setting Up Environment Variables in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **Project Settings** > **Edge Functions** > **Secrets**
3. Add each environment variable:
   ```
   POSTMARK_SERVER_TOKEN=your_server_token_here
   POSTMARK_FROM_EMAIL=noreply@sadhu.com
   SITE_URL=https://sadhu.com
   POSTMARK_WELCOME_TEMPLATE_ID=12345678
   POSTMARK_BOOKING_CONFIRMATION_TEMPLATE_ID=12345679
   POSTMARK_PAYMENT_RECEIPT_TEMPLATE_ID=12345680
   POSTMARK_CLASS_REMINDER_TEMPLATE_ID=12345681
   POSTMARK_CANCELLATION_NOTICE_TEMPLATE_ID=12345682
   ```

## Email Templates

### Template Variables

Each email template can use the following variables:

#### Welcome Email
- `name`: User's name
- `email`: User's email address
- `login_url`: URL to login page
- `support_email`: Support email address

#### Booking Confirmation
- `client_name`: Client's name
- `practitioner_name`: Practitioner's name
- `session_date`: Formatted session date (e.g., "Monday, January 15, 2024")
- `session_time`: Formatted session time (e.g., "2:00 PM")
- `duration_minutes`: Session duration in minutes
- `is_group`: Boolean indicating if it's a group class
- `class_name`: Class name (if group class)
- `location`: "Online" or "In-Person"
- `location_details`: Studio address (if in-person)
- `session_url`: URL to view session details
- `support_email`: Support email address

#### Payment Receipt
- `client_name`: Client's name
- `amount`: Payment amount (number)
- `amount_formatted`: Formatted amount (e.g., "$50.00")
- `currency`: Currency code (e.g., "USD" or "CAD")
- `description`: Payment description
- `payment_date`: Formatted payment date
- `payment_intent_id`: Stripe payment intent ID
- `receipt_url`: URL to view receipt
- `support_email`: Support email address

#### Class Reminder
- `client_name`: Client's name
- `practitioner_name`: Practitioner's name
- `session_date`: Formatted session date
- `session_time`: Formatted session time
- `duration_minutes`: Session duration
- `is_group`: Boolean indicating if it's a group class
- `class_name`: Class name (if group class)
- `location`: "Online" or "In-Person"
- `location_details`: Studio address (if in-person)
- `session_url`: URL to view session details
- `support_email`: Support email address

#### Cancellation/Reschedule Notice
- `client_name`: Client's name
- `practitioner_name`: Practitioner's name
- `session_date`: Original session date
- `session_time`: Original session time
- `duration_minutes`: Session duration
- `is_group`: Boolean indicating if it's a group class
- `class_name`: Class name (if group class)
- `action_text`: "cancelled" or "rescheduled"
- `is_reschedule`: Boolean indicating if it's a reschedule
- `cancellation_type`: "standard", "late", "last_minute", or "grace"
- `credit_message`: Message about credit return
- `support_email`: Support email address

## Creating Templates in Postmark

1. Log in to your Postmark account
2. Go to **Templates** > **Create Template**
3. Choose a template type (Standard or Layout)
4. Design your template using the variables listed above
5. Save the template and note the Template ID or create a Template Alias

## Fallback Behavior

If no template ID or alias is configured, the system will send plain HTML/text emails with basic formatting. This ensures emails are always sent even if templates aren't set up.

## Testing

### Manual Testing

You can test each email function by calling the Edge Functions directly:

```bash
# Test welcome email
curl -X POST https://your-project.supabase.co/functions/v1/send-welcome-email \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "user-id", "email": "test@example.com", "name": "Test User"}'

# Test booking confirmation
curl -X POST https://your-project.supabase.co/functions/v1/send-booking-confirmation \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"session_id": "session-id"}'
```

### Automatic Testing

Emails are automatically sent when:
- A user signs up (welcome email)
- A session is booked (booking confirmation)
- A payment is completed (payment receipt)
- A session is cancelled or rescheduled (cancellation notice)
- 24 hours before a session (class reminder - requires cron job)

## Class Reminder Cron Job

To automatically send class reminders 24 hours before sessions, set up a cron job that calls the `send-class-reminder` function:

```bash
# Example cron job (runs every hour)
0 * * * * curl -X POST https://your-project.supabase.co/functions/v1/send-class-reminder \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Alternatively, you can use Supabase's pg_cron extension or an external cron service like GitHub Actions, Vercel Cron, or EasyCron.

## Monitoring

- Check Postmark dashboard for email delivery status
- Review Edge Function logs in Supabase Dashboard
- Check `email_logs` table in database (if logging is enabled)

## Troubleshooting

### Emails Not Sending

1. Verify environment variables are set correctly
2. Check Postmark Server API Token is valid
3. Ensure `POSTMARK_FROM_EMAIL` is verified in Postmark
4. Check Edge Function logs for errors
5. Verify Postmark account has sufficient credits

### Template Not Found

1. Verify template ID or alias is correct
2. Ensure template is published in Postmark
3. Check template variables match the expected format

### Email Delivery Issues

1. Check Postmark bounce/spam reports
2. Verify recipient email addresses are valid
3. Check Postmark account limits and quotas

## Alternative: Flodesk

If you prefer to use Flodesk instead of Postmark, you'll need to:
1. Create a similar utility function for Flodesk API
2. Update all email functions to use Flodesk instead
3. Update environment variables accordingly

The structure is designed to be easily adaptable to other email service providers.

