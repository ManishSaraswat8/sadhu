# Agora Cloud Recording Setup Guide

## Overview
This guide explains how to set up Agora Cloud Recording for session recording functionality.

## Prerequisites
- Agora account (sign up at https://www.agora.io/)
- Agora project with Cloud Recording enabled
- Supabase CLI installed and linked to your project

---

## Step 1: Get Agora Customer ID and Customer Secret

### Option A: From Agora Console RESTful API Section (Recommended)

1. **Log in to Agora Console**
   - Go to https://console.agora.io/
   - Sign in with your Agora account

2. **Navigate to RESTful API Section**
   - Click on your **account name** in the top-right corner (dropdown menu)
   - Select **"RESTful API"** from the dropdown menu
   - This will take you to the RESTful API credentials page

3. **Generate or View Customer ID and Customer Secret**
   - If you already have credentials, you'll see them in a table
   - If you don't have credentials yet:
     - Click the **"Add a secret"** button
     - A new row will appear in the table
     - Click **"OK"** in that row to confirm
     - Once confirmed, click the **"Download"** button under the **"Customer Secret"** column
     - This downloads a `key_and_secret.txt` file

4. **Get Your Credentials**
   - Open the downloaded `key_and_secret.txt` file
   - You'll find:
     - **Customer ID**: Usually a string like `your_customer_id`
     - **Customer Secret**: A secret key (keep this secure!)
   - ⚠️ **Important**: The Customer Secret can only be downloaded **once**. Store it securely!

### Option B: From Agora RESTful API Documentation

1. **Check Agora Documentation**
   - Visit: https://docs.agora.io/en/cloud-recording/cloud_recording_api_rest?platform=RESTful
   - The Customer ID and Secret are used for Basic Authentication
   - Format: `Authorization: Basic base64(customer_id:customer_secret)`

### Option C: Contact Agora Support

If you can't find these credentials:
- Contact Agora support through the console
- They can help you locate or regenerate your Customer ID and Secret

---

## Step 2: Enable Cloud Recording

1. **In Agora Console**
   - Go to your project settings
   - Navigate to **Cloud Recording** section
   - Enable **Cloud Recording** for your project
   - Choose storage option:
     - **Agora Cloud Storage** (easier setup)
     - **Third-party Cloud Storage** (S3, Azure, etc.)

2. **Configure Storage** (if using Agora Cloud Storage)
   - Set up storage bucket
   - Note the region and bucket name
   - These will be used in recording configuration

---

## Step 3: Set Up Webhook (Optional but Recommended)

1. **Get Your Webhook URL**
   - Your webhook URL will be:
     ```
     https://[your-project-ref].supabase.co/functions/v1/agora-recording-webhook
     ```
   - Replace `[your-project-ref]` with your Supabase project reference ID
   - You can find this in Supabase Dashboard → Settings → API

2. **Configure Webhook in Agora Console**
   - Go to **Cloud Recording** → **Webhook Settings**
   - Enter your webhook URL
   - Save the configuration

---

## Step 4: Set Supabase Secrets

Once you have your Customer ID and Customer Secret:

```bash
# Set Customer ID
supabase secrets set AGORA_CUSTOMER_ID=your_actual_customer_id

# Set Customer Secret
supabase secrets set AGORA_CUSTOMER_SECRET=your_actual_customer_secret
```

**Important Notes:**
- Replace `your_actual_customer_id` and `your_actual_customer_secret` with your real credentials
- Don't include quotes around the values
- These secrets are stored securely in Supabase and won't be visible in code

### Verify Secrets Are Set

```bash
# List all secrets (values are hidden for security)
supabase secrets list
```

You should see:
- `AGORA_CUSTOMER_ID`
- `AGORA_CUSTOMER_SECRET`
- `AGORA_APP_ID` (if already set)
- `AGORA_APP_CERTIFICATE` (if already set)

---

## Step 5: Create Supabase Storage Bucket

1. **Via Supabase Dashboard**
   - Go to **Storage** → **Buckets**
   - Click **New Bucket**
   - Name: `session-recordings`
   - Make it **Private** (not public)
   - Click **Create Bucket**

2. **Set Storage Policies** (Optional - RLS handles access)
   - The bucket will use Row Level Security
   - Access is controlled through the `session_recordings` table RLS policies

---

## Step 6: Test the Setup

1. **Deploy the Recording Functions**
   ```bash
   supabase functions deploy start-agora-recording
   supabase functions deploy stop-agora-recording
   supabase functions deploy get-recording-status
   supabase functions deploy agora-recording-webhook
   supabase functions deploy process-recording
   ```

2. **Test Recording Flow**
   - Start a video session
   - Call `start-agora-recording` function
   - Verify recording starts
   - Stop recording
   - Check webhook receives callbacks
   - Verify recording is processed and stored

---

## Troubleshooting

### Issue: "Customer ID or Secret not found"
- **Solution**: Double-check you're using the correct credentials from Agora Console
- Make sure Cloud Recording is enabled for your project

### Issue: "Failed to acquire recording resource"
- **Solution**: 
  - Verify your Agora App ID matches the one in your project
  - Check that Cloud Recording is enabled
  - Ensure you have sufficient Agora credits

### Issue: "Webhook not receiving callbacks"
- **Solution**:
  - Verify webhook URL is correctly configured in Agora Console
  - Check that the `agora-recording-webhook` function is deployed
  - Ensure `verify_jwt = false` in `config.toml` for the webhook function

### Issue: "Storage upload failed"
- **Solution**:
  - Verify `session-recordings` bucket exists in Supabase Storage
  - Check bucket permissions
  - Ensure storage policies allow uploads

---

## Additional Resources

- [Agora Cloud Recording Documentation](https://docs.agora.io/en/cloud-recording/cloud_recording_api_rest?platform=RESTful)
- [Agora Console](https://console.agora.io/)
- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)

---

## Security Notes

⚠️ **Important Security Considerations:**

1. **Never commit secrets to Git**
   - Secrets are stored in Supabase, not in code
   - Use `supabase secrets set` for all sensitive credentials

2. **Rotate secrets regularly**
   - Change Customer Secret periodically
   - Update in Supabase secrets when changed

3. **Monitor usage**
   - Check Agora Console for recording usage
   - Monitor Supabase Storage for file sizes
   - Set up alerts for unusual activity

---

## Next Steps

After completing this setup:
1. ✅ Agora Cloud Recording credentials configured
2. ✅ Webhook URL set up
3. ✅ Supabase Storage bucket created
4. ✅ Edge Functions deployed

You're ready to use Cloud Recording in your sessions! 🎉

