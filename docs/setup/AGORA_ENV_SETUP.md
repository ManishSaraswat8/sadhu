# Agora Environment Variables Setup

## ⚠️ Important Security Note

**App ID** (`VITE_AGORA_APP_ID`): ✅ **SAFE** to use in frontend - App IDs are meant to be public
**App Certificate** (`VITE_AGORA_APP_CERTIFICATE`): ❌ **NEVER** use in frontend - This is a secret!

The App Certificate should **ONLY** be used in the backend Edge Functions, never exposed to the frontend.

## Frontend (.env file)

Add to your `.env` file:
```env
VITE_AGORA_APP_ID=your_agora_app_id_here
```

**Do NOT add `VITE_AGORA_APP_CERTIFICATE` to frontend `.env`** - it will be exposed in the browser!

## Backend (Supabase Edge Functions)

Set these as Supabase secrets (backend only):

### Option 1: Via Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/dkpxubmenfgmaodsufli/settings/functions
2. Add secrets:
   - `AGORA_APP_ID` = your Agora App ID
   - `AGORA_APP_CERTIFICATE` = your Agora App Certificate

### Option 2: Via CLI
```bash
supabase secrets set AGORA_APP_ID=your_agora_app_id
supabase secrets set AGORA_APP_CERTIFICATE=your_agora_app_certificate
```

Then redeploy the functions:
```bash
supabase functions deploy create-agora-room create-agora-token
```

## How It Works

1. **Frontend** uses `VITE_AGORA_APP_ID` to initialize the Agora SDK (safe to expose)
2. **Backend Edge Functions** use `AGORA_APP_ID` and `AGORA_APP_CERTIFICATE` to generate tokens (secret)
3. Frontend receives the token from the backend and uses it to join the video channel

## Getting Your Agora Credentials

1. Go to [Agora Console](https://console.agora.io/)
2. Select your project
3. Go to Project Management → Project List
4. Click on your project
5. Copy:
   - **App ID** (use in both frontend and backend)
   - **App Certificate** (backend only - never expose to frontend)

