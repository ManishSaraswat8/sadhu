# Agora Testing Setup - Quick Guide

## ⚠️ Important Notes

1. **Messages API Errors**: The `ERR_BLOCKED_BY_CLIENT` errors from `statscollector.sd-rtn.com` are **harmless**. They're just ad blockers blocking Agora's analytics. Video functionality works fine - **ignore these errors**.

2. **Security Warning**: The hardcoded credentials in Edge Functions are **ONLY for testing**. **REMOVE them before production** and use Supabase secrets instead.

## Option 1: Hardcode for Testing (Quick Test)

1. Edit `supabase/functions/create-agora-room/index.ts`:
   - Find: `const AGORA_APP_ID = Deno.env.get('AGORA_APP_ID') || 'YOUR_AGORA_APP_ID_HERE';`
   - Replace `YOUR_AGORA_APP_ID_HERE` with your actual App ID

2. Edit `supabase/functions/create-agora-token/index.ts`:
   - Find: `const AGORA_APP_ID = Deno.env.get('AGORA_APP_ID') || 'YOUR_AGORA_APP_ID_HERE';`
   - Replace `YOUR_AGORA_APP_ID_HERE` with your actual App ID
   - Find: `const AGORA_APP_CERTIFICATE = Deno.env.get('AGORA_APP_CERTIFICATE') || 'YOUR_AGORA_APP_CERTIFICATE_HERE';`
   - Replace `YOUR_AGORA_APP_CERTIFICATE_HERE` with your actual App Certificate

3. Deploy the functions:
```bash
supabase functions deploy create-agora-room create-agora-token
```

4. **IMPORTANT**: Remove the hardcoded values before production!

## Option 2: Use Supabase Secrets (Recommended for Production)

1. Set the secrets via CLI:
```bash
supabase secrets set AGORA_APP_ID=your_actual_app_id
supabase secrets set AGORA_APP_CERTIFICATE=your_actual_app_certificate
```

2. Remove the hardcoded fallback values from the Edge Functions

3. Redeploy:
```bash
supabase functions deploy create-agora-room create-agora-token
```

## Getting Your Agora Credentials

1. Go to [Agora Console](https://console.agora.io/)
2. Select your project
3. Go to Project Management → Project List
4. Click on your project
5. Copy:
   - **App ID** (e.g., `15b937fdfd824dfc896c9210fcce7565`)
   - **App Certificate** (long string)

## Testing

1. Create a test session from the UI
2. Copy the share link
3. Open it in another browser/device
4. Both should see video

## Notes

- App ID is safe to expose (it's meant to be public)
- App Certificate is secret - keep it in backend only (Edge Functions)
- The messages API errors are harmless - just ad blockers

