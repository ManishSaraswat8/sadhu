# Testing Agora Functions

## Prerequisites
✅ Make sure you've set the environment variables:
- `AGORA_APP_ID`
- `AGORA_APP_CERTIFICATE`

## Method 1: Test via Supabase Dashboard (Easiest)

1. Go to: https://supabase.com/dashboard/project/dkpxubmenfgmaodsufli/functions
2. Click on `create-agora-token` or `create-agora-room`
3. Click "Invoke Function"
4. Use the test payloads below

## Method 2: Test via cURL (Terminal)

### Get your Supabase credentials:
- **Project URL**: Found in Supabase Dashboard → Settings → API
- **Anon Key**: Found in Supabase Dashboard → Settings → API

### Test create-agora-room:

```bash
# Replace YOUR_SUPABASE_URL and YOUR_ANON_KEY
curl -X POST \
  'https://dkpxubmenfgmaodsufli.supabase.co/functions/v1/create-agora-room' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "channelName": "test-channel-123",
    "isGroup": false
  }'
```

### Test create-agora-token:

First, you need to be authenticated. Get a user token:

```bash
# 1. Sign in to get a token (replace email/password)
curl -X POST \
  'https://dkpxubmenfgmaodsufli.supabase.co/auth/v1/token?grant_type=password' \
  -H 'Content-Type: application/json' \
  -H 'apikey: YOUR_ANON_KEY' \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'
```

Then use the access_token from the response:

```bash
# 2. Get Agora token (replace ACCESS_TOKEN from step 1)
curl -X POST \
  'https://dkpxubmenfgmaodsufli.supabase.co/functions/v1/create-agora-token' \
  -H 'Authorization: Bearer ACCESS_TOKEN_FROM_STEP_1' \
  -H 'Content-Type: application/json' \
  -d '{
    "channelName": "test-channel-123",
    "role": "publisher"
  }'
```

## Method 3: Test from Frontend (React)

Create a test component or add to existing code:

```typescript
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Test function
const testAgoraFunctions = async () => {
  const { user } = useAuth();
  
  if (!user) {
    console.error('Must be logged in');
    return;
  }

  try {
    // Test 1: Create room
    console.log('Testing create-agora-room...');
    const { data: roomData, error: roomError } = await supabase.functions.invoke('create-agora-room', {
      body: {
        channelName: `test-${Date.now()}`,
        isGroup: false
      }
    });

    if (roomError) {
      console.error('Room creation error:', roomError);
      return;
    }

    console.log('Room created:', roomData);

    // Test 2: Get token
    console.log('Testing create-agora-token...');
    const { data: tokenData, error: tokenError } = await supabase.functions.invoke('create-agora-token', {
      body: {
        channelName: roomData.channelName,
        role: 'publisher'
      }
    });

    if (tokenError) {
      console.error('Token generation error:', tokenError);
      return;
    }

    console.log('Token generated:', {
      token: tokenData.token.substring(0, 50) + '...',
      appId: tokenData.appId,
      channelName: tokenData.channelName,
      uid: tokenData.uid,
      role: tokenData.role
    });

    console.log('✅ Both functions working!');
  } catch (error) {
    console.error('Test failed:', error);
  }
};
```

## Method 4: Quick Test Script

Run this in your browser console (on your app):

```javascript
// Make sure you're logged in first
const testAgora = async () => {
  const channelName = `test-${Date.now()}`;
  
  // Test room creation
  const roomRes = await fetch('https://dkpxubmenfgmaodsufli.supabase.co/functions/v1/create-agora-room', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('sb-dkpxubmenfgmaodsufli-auth-token')?.split('"')[1] || 'YOUR_TOKEN'}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ channelName, isGroup: false })
  });
  
  const roomData = await roomRes.json();
  console.log('Room:', roomData);
  
  // Test token generation
  const tokenRes = await fetch('https://dkpxubmenfgmaodsufli.supabase.co/functions/v1/create-agora-token', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('sb-dkpxubmenfgmaodsufli-auth-token')?.split('"')[1] || 'YOUR_TOKEN'}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ channelName, role: 'publisher' })
  });
  
  const tokenData = await tokenRes.json();
  console.log('Token:', tokenData);
};

testAgora();
```

## Expected Responses

### create-agora-room response:
```json
{
  "channelName": "test-channel-123",
  "appId": "your_app_id",
  "isGroup": false,
  "message": "Agora channel ready. Use create-agora-token to get access tokens."
}
```

### create-agora-token response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "appId": "your_app_id",
  "channelName": "test-channel-123",
  "uid": 12345,
  "role": "publisher"
}
```

## Common Errors

1. **"Agora credentials not configured"**
   - Set `AGORA_APP_ID` and `AGORA_APP_CERTIFICATE` in Supabase Dashboard

2. **"Authentication required"**
   - Make sure you're logged in and passing the Bearer token

3. **"Invalid or expired token"**
   - Re-authenticate to get a fresh token

4. **"Session not found"**
   - If testing with `sessionId`, make sure the session exists in your database

## Next Steps After Testing

Once functions are working:
1. Integrate into your session booking flow
2. Replace Whereby calls with Agora calls
3. Add Agora SDK to frontend
4. Test actual video sessions

