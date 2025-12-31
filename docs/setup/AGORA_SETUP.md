# Agora Integration Setup Guide

## Overview
This project now includes Agora video integration for both 1:1 and group sessions. Two edge functions have been created:

1. **`create-agora-token`** - Generates Agora RTC tokens for users to join video channels
2. **`create-agora-room`** - Creates/manages Agora channel information (channels are auto-created when first user joins)

## Required Environment Variables

You need to set these in your Supabase project settings:

1. **AGORA_APP_ID** - Your Agora App ID (get from Agora Console)
2. **AGORA_APP_CERTIFICATE** - Your Agora App Certificate (get from Agora Console)

### How to Get Agora Credentials:

1. Go to [Agora Console](https://console.agora.io/)
2. Create a new project or select existing one
3. Go to Project Management → Project List
4. Click on your project
5. Copy the **App ID** and **App Certificate**

### Setting Environment Variables in Supabase:

1. Go to Supabase Dashboard → Project Settings → Edge Functions
2. Add secrets:
   - `AGORA_APP_ID` = your Agora App ID
   - `AGORA_APP_CERTIFICATE` = your Agora App Certificate

Or via CLI:
```bash
supabase secrets set AGORA_APP_ID=your_app_id
supabase secrets set AGORA_APP_CERTIFICATE=your_app_certificate
```

## Edge Functions

### 1. create-agora-token

**Purpose:** Generates Agora RTC tokens for authentication

**Endpoint:** `POST /functions/v1/create-agora-token`

**Request Body:**
```json
{
  "channelName": "session-abc123",
  "uid": 12345,  // Optional: user ID (auto-generated if not provided)
  "role": "publisher",  // Optional: "publisher" or "subscriber" (default: "publisher")
  "sessionId": "uuid",  // Optional: session ID for authorization check
  "isGroup": false  // Optional: true for group sessions
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "appId": "your_app_id",
  "channelName": "session-abc123",
  "uid": 12345,
  "role": "publisher"
}
```

**Authorization:**
- Requires authenticated user (Bearer token)
- Or internal secret for server-to-server calls
- Verifies user has access to the session if `sessionId` is provided

### 2. create-agora-room

**Purpose:** Creates/manages Agora channel information

**Endpoint:** `POST /functions/v1/create-agora-room`

**Request Body:**
```json
{
  "channelName": "session-abc123",
  "sessionId": "uuid",  // Optional: session ID for authorization check
  "isGroup": false,  // Optional: true for group sessions
  "durationMinutes": 60  // Optional: session duration
}
```

**Response:**
```json
{
  "channelName": "session-abc123",
  "appId": "your_app_id",
  "isGroup": false,
  "message": "Agora channel ready. Use create-agora-token to get access tokens."
}
```

**Authorization:**
- Requires authenticated user (Bearer token)
- Or internal secret for server-to-server calls
- Verifies user has access to the session if `sessionId` is provided

## Usage Flow

### For 1:1 Sessions:

1. **Create session in database** (with `is_group: false`)
2. **Call `create-agora-room`** to set up channel info
3. **Call `create-agora-token`** for each participant (client and practitioner)
4. **Use tokens in frontend** to join Agora channel

### For Group Sessions:

1. **Create session in database** (with `is_group: true`)
2. **Add participants to `group_sessions` table**
3. **Call `create-agora-room`** to set up channel info
4. **Call `create-agora-token`** for each participant
5. **Use tokens in frontend** to join Agora channel

## Frontend Integration

### Example: Getting Token and Joining Channel

```typescript
// 1. Create/get channel
const { data: roomData } = await supabase.functions.invoke('create-agora-room', {
  body: {
    channelName: `session-${sessionId}`,
    sessionId: sessionId,
    isGroup: false
  }
});

// 2. Get token for current user
const { data: tokenData } = await supabase.functions.invoke('create-agora-token', {
  body: {
    channelName: roomData.channelName,
    sessionId: sessionId,
    role: 'publisher' // or 'subscriber' for group participants who shouldn't publish
  }
});

// 3. Use Agora SDK to join channel
import AgoraRTC from 'agora-rtc-sdk-ng';

const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
await client.join(
  tokenData.appId,
  tokenData.channelName,
  tokenData.token,
  tokenData.uid
);
```

## Security Notes

1. **Tokens expire after 1 hour** - You may need to refresh tokens for longer sessions
2. **Authorization is verified** - Users can only get tokens for sessions they're authorized for
3. **App Certificate is secret** - Never expose it in frontend code
4. **Channel names should be unique** - Use session IDs or UUIDs

## Differences from Whereby

- **No explicit room creation** - Agora channels are created automatically when first user joins
- **Token-based auth** - Requires token generation for each user
- **Supports group sessions** - Can handle multiple participants
- **Role-based permissions** - Can set users as publishers or subscribers

## Next Steps

1. Set up Agora credentials in Supabase
2. Deploy edge functions: `supabase functions deploy create-agora-token create-agora-room`
3. Update frontend to use Agora SDK instead of Whereby
4. Test with both 1:1 and group sessions

## Recording (Future)

For session recording, you'll need to create additional functions:
- `start-agora-recording` - Start recording via Agora REST API
- `stop-agora-recording` - Stop recording
- `agora-recording-webhook` - Handle recording completion callbacks

