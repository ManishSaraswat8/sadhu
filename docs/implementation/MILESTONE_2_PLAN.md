# Milestone 2: Booking Engine & Agora Integration
**Budget: $500**

## Overview
Complete the full booking flow for single sessions and package deals, integrate Agora API for online video sessions with recording, and complete user and practitioner dashboards according to Sitemap.txt requirements.

---

## Current State Analysis

### ✅ Already Implemented
- Basic session scheduling (SessionScheduler component)
- Agora basic integration (create-agora-room, create-agora-token functions)
- Payment flow with packages (SessionPayment page)
- Session packages (5 and 10 sessions) with credits system
- User dashboard (basic structure with UserLayout)
- Practitioner dashboard (basic tabs structure)
- Past purchases sidebar component
- Session credits tracking (user_session_credits table)
- Session types database (standing/laying, durations, group/1:1)
- Geo-pricing (USD/CAD)

### ❌ Missing/Incomplete
- Liability waiver system
- Full session type selection in booking (standing/laying, 1:1/group)
- In-person sessions booking
- Session recording with Agora
- Post-session journal redirect
- Action recommendations system (practitioner → client)
- Complete practitioner earnings dashboard
- User dashboard windows (Getting Started, Online Sessions, In-Person, Actions)
- Group session correlation (online + in-person)
- Video storage in database
- Session history in past purchases

---

## Implementation Plan

### PHASE 1: Database Schema & Backend (Week 1)

#### 1.1 Liability Waiver System
**Files to Create:**
- `supabase/migrations/YYYYMMDD_create_liability_waivers.sql`
- `supabase/functions/create-liability-waiver/index.ts`
- `supabase/functions/get-liability-waiver-status/index.ts`

**Database Changes:**
```sql
CREATE TABLE public.liability_waivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES public.session_schedules(id) ON DELETE CASCADE,
  waiver_text TEXT NOT NULL,
  signed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, session_id)
);

-- Index for quick lookups
CREATE INDEX idx_liability_waivers_user_id ON public.liability_waivers(user_id);
CREATE INDEX idx_liability_waivers_session_id ON public.liability_waivers(session_id);
```

**Edge Functions:**
- `create-liability-waiver`: Record signed waiver
- `get-liability-waiver-status`: Check if user has signed waiver for session

#### 1.2 Session Recording Storage
**Files to Create:**
- `supabase/migrations/YYYYMMDD_create_session_recordings.sql`

**Database Changes:**
```sql
CREATE TABLE public.session_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.session_schedules(id) ON DELETE CASCADE NOT NULL,
  agora_resource_id TEXT, -- Agora recording resource ID
  agora_sid TEXT, -- Agora recording SID
  recording_url TEXT, -- URL to stored recording
  storage_path TEXT, -- Path in storage bucket
  duration_seconds INTEGER,
  file_size_bytes BIGINT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'recording', 'processing', 'completed', 'failed')),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_session_recordings_session_id ON public.session_recordings(session_id);
CREATE INDEX idx_session_recordings_status ON public.session_recordings(status);
```

#### 1.3 Action Recommendations System
**Files to Create:**
- `supabase/migrations/YYYYMMDD_create_action_recommendations.sql`

**Database Changes:**
```sql
CREATE TABLE public.action_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.session_schedules(id) ON DELETE CASCADE NOT NULL,
  practitioner_id UUID REFERENCES public.practitioners(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  action_type TEXT NOT NULL CHECK (action_type IN ('daily_practice', 'mindfulness', 'physical', 'emotional', 'other')),
  frequency TEXT, -- e.g., "daily", "weekly", "as needed"
  due_date DATE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_action_recommendations_client_id ON public.action_recommendations(client_id);
CREATE INDEX idx_action_recommendations_session_id ON public.action_recommendations(session_id);
CREATE INDEX idx_action_recommendations_practitioner_id ON public.action_recommendations(practitioner_id);
```

#### 1.4 In-Person Sessions Support
**Files to Create:**
- `supabase/migrations/YYYYMMDD_add_in_person_sessions.sql`

**Database Changes:**
```sql
-- Add location fields to session_schedules
ALTER TABLE public.session_schedules 
ADD COLUMN session_location TEXT CHECK (session_location IN ('online', 'in_person')) DEFAULT 'online',
ADD COLUMN physical_location TEXT, -- Address for in-person sessions
ADD COLUMN location_coordinates POINT, -- PostGIS point for map display
ADD COLUMN max_participants INTEGER DEFAULT 1, -- For group sessions
ADD COLUMN current_participants INTEGER DEFAULT 1;

-- Add correlation field for online/in-person linked sessions
ALTER TABLE public.session_schedules
ADD COLUMN correlated_session_id UUID REFERENCES public.session_schedules(id);

-- Indexes
CREATE INDEX idx_session_schedules_location ON public.session_schedules(session_location);
CREATE INDEX idx_session_schedules_correlated ON public.session_schedules(correlated_session_id);
```

#### 1.5 Practitioner Banking Information
**Files to Create:**
- `supabase/migrations/YYYYMMDD_create_practitioner_banking.sql`

**Database Changes:**
```sql
CREATE TABLE public.practitioner_banking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practitioner_id UUID REFERENCES public.practitioners(id) ON DELETE CASCADE NOT NULL UNIQUE,
  bank_name TEXT NOT NULL,
  account_holder_name TEXT NOT NULL,
  account_number_encrypted TEXT NOT NULL, -- Encrypted with pgcrypto
  routing_number_encrypted TEXT NOT NULL, -- Encrypted
  account_type TEXT NOT NULL CHECK (account_type IN ('checking', 'savings')),
  country TEXT NOT NULL DEFAULT 'CA',
  verified BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS: Only practitioners can view/edit their own banking info
CREATE POLICY "Practitioners can manage own banking"
ON public.practitioner_banking
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.practitioners
    WHERE practitioners.id = practitioner_banking.practitioner_id
    AND practitioners.user_id = auth.uid()
  )
);
```

#### 1.6 Practitioner Contracts
**Files to Create:**
- `supabase/migrations/YYYYMMDD_create_practitioner_contracts.sql`

**Database Changes:**
```sql
CREATE TABLE public.practitioner_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practitioner_id UUID REFERENCES public.practitioners(id) ON DELETE CASCADE NOT NULL,
  contract_version TEXT NOT NULL,
  contract_text TEXT NOT NULL,
  signed_at TIMESTAMP WITH TIME ZONE,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'expired', 'revoked')),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_practitioner_contracts_practitioner_id ON public.practitioner_contracts(practitioner_id);
CREATE INDEX idx_practitioner_contracts_status ON public.practitioner_contracts(status);
```

---

### PHASE 2: Agora Recording Integration (Week 1-2)

#### 2.1 Agora Recording Edge Functions
**Files to Create:**
- `supabase/functions/start-agora-recording/index.ts`
- `supabase/functions/stop-agora-recording/index.ts`
- `supabase/functions/get-recording-status/index.ts`
- `supabase/functions/agora-recording-webhook/index.ts` (for Agora callbacks)

**Implementation Details:**
- Use Agora Cloud Recording API
- Start recording when session begins
- Stop recording when session ends
- Store recording metadata in `session_recordings` table
- Handle recording callbacks via webhook
- Support both individual and composite recording modes

**Required Agora Setup:**
- Enable Cloud Recording in Agora Console
- Configure recording storage (S3 or Agora Cloud Storage)
- Set up webhook endpoint for recording status updates

#### 2.2 Recording Storage Integration
**Files to Create:**
- `supabase/functions/process-recording/index.ts` (processes completed recordings)

**Implementation:**
- Download recordings from Agora storage
- Upload to Supabase Storage bucket (`session-recordings`)
- Update `session_recordings` table with storage path
- Generate signed URLs for secure access

---

### PHASE 3: Enhanced Booking Flow (Week 2)

#### 3.1 Enhanced SessionScheduler Component
**Files to Update:**
- `src/components/SessionScheduler.tsx`

**New Features:**
1. **Session Type Selection:**
   - Radio buttons or tabs for: Standing / Laying
   - Toggle for: 1:1 / Group
   - Duration selection (20min, 45min, 60min) based on type

2. **In-Person Session Support:**
   - Location selector (if in-person)
   - Address input/selection
   - Map integration (optional - Google Maps or Mapbox)

3. **Group Session Support:**
   - Show available slots for group sessions
   - Display current participants / max participants
   - Join existing group session option

4. **Liability Waiver Integration:**
   - Show waiver modal after booking confirmation
   - Require signature before session creation
   - Store signed waiver

**Component Structure:**
```tsx
<SessionScheduler>
  <Step1: Select Session Type>
    - Online / In-Person toggle
    - Standing / Laying
    - 1:1 / Group
    - Duration (auto-selected based on type)
  </Step1>
  
  <Step2: Select Practitioner>
    - Filter by availability
    - Show specialization
    - Show ratings/reviews (if implemented)
  </Step2>
  
  <Step3: Select Date & Time>
    - Calendar view
    - Available time slots
    - Show group session availability
  </Step3>
  
  <Step4: Confirm & Sign Waiver>
    - Session summary
    - Liability waiver display
    - Signature pad or checkbox
    - Confirm booking
  </Step4>
</SessionScheduler>
```

#### 3.2 Liability Waiver Component
**Files to Create:**
- `src/components/LiabilityWaiver.tsx`
- `src/components/SignaturePad.tsx` (optional - for signature capture)

**Features:**
- Display waiver text
- Checkbox or signature pad for agreement
- Store signed waiver via Edge Function
- Show waiver status in session details

#### 3.3 Session Booking Flow Updates
**Files to Update:**
- `src/components/SessionScheduler.tsx`
- `src/pages/SessionPayment.tsx`

**Flow:**
1. User selects session type, practitioner, date/time
2. System checks for available credits
3. If no credits → redirect to payment page
4. If credits available → proceed to waiver
5. After waiver signed → create session
6. Redirect to session confirmation page

---

### PHASE 4: User Dashboard Windows (Week 2-3)

#### 4.1 Getting Started Window
**Files to Create:**
- `src/components/dashboard/GettingStarted.tsx`

**Features:**
- Introductory video player
- Best practices guide
- Quick start checklist
- Link to Step-by-Step guides

**Content:**
- Video: "How to Get Started with Your Sadhu Board"
- Text guide with images
- Interactive checklist

#### 4.2 Online Sessions Window
**Files to Create:**
- `src/components/dashboard/OnlineSessions.tsx`

**Features:**
- Embedded SessionScheduler component
- Filter by session type
- Show upcoming online sessions
- Quick book button

#### 4.3 In-Person Sessions Window
**Files to Create:**
- `src/components/dashboard/InPersonSessions.tsx`

**Features:**
- Location-based session booking
- Map view of available locations
- Filter by location
- Show in-person session availability

#### 4.4 Actions Window
**Files to Create:**
- `src/components/dashboard/ActionsWindow.tsx`

**Features:**
- Display action recommendations from practitioners
- Mark actions as complete
- Filter by status (pending, completed)
- Show due dates
- Action categories

#### 4.5 Updated Dashboard Page
**Files to Update:**
- `src/pages/Dashboard.tsx`

**New Structure:**
```tsx
<Dashboard>
  <Tabs>
    <Tab: Getting Started>
      <GettingStarted />
    </Tab>
    
    <Tab: Online Sessions>
      <OnlineSessions />
    </Tab>
    
    <Tab: In-Person Sessions>
      <InPersonSessions />
    </Tab>
    
    <Tab: Journal>
      <Link to="/dashboard/journal" />
    </Tab>
    
    <Tab: Actions>
      <ActionsWindow />
    </Tab>
  </Tabs>
</Dashboard>
```

---

### PHASE 5: Practitioner Dashboard Completion (Week 3)

#### 5.1 Enhanced Earnings Dashboard
**Files to Update:**
- `src/components/practitioner/PractitionerMyEarnings.tsx`

**New Features:**
1. **Earnings Overview:**
   - Current period earnings (last 2 weeks)
   - Pending payout amount
   - Total earnings (last year)
   - Earnings chart/graph

2. **Session History:**
   - List of sessions with earnings
   - Filter by date range
   - Export to CSV

3. **Payout History:**
   - Past payouts (every 2 weeks)
   - Payout dates
   - Transaction IDs
   - Status (pending, paid, failed)

4. **Banking Information:**
   - Add/edit banking details
   - Secure form with encryption
   - Verification status

#### 5.2 Banking Information Component
**Files to Create:**
- `src/components/practitioner/PractitionerBanking.tsx`

**Features:**
- Form for banking details
- Encryption on frontend before sending
- Verification status display
- Edit banking info

#### 5.3 Contract Management
**Files to Create:**
- `src/components/practitioner/PractitionerContract.tsx`

**Features:**
- Display current contract
- Sign contract digitally
- View contract history
- Download contract PDF

#### 5.4 Action Recommendations Management
**Files to Create:**
- `src/components/practitioner/ActionRecommendationsManager.tsx`

**Features:**
- Create action recommendations for clients
- Template library (pre-defined actions)
- Assign to specific sessions
- Track completion status

#### 5.5 Practitioner Sidebar
**Files to Create:**
- `src/components/practitioner/PractitionerSidebar.tsx`

**Navigation Items:**
- Dashboard
- Sessions
- Clients
- Availability
- Earnings
- Settings
- Contract

---

### PHASE 6: Post-Session Flow (Week 3)

#### 6.1 Post-Session Journal Redirect
**Files to Update:**
- `src/pages/VideoSession.tsx`

**Implementation:**
- After session ends, show modal:
  - "Session Complete!"
  - "Would you like to journal your experience?"
  - Button: "Go to Journal" → redirects to `/dashboard/journal` with pre-filled entry
  - Button: "Maybe Later" → closes modal

#### 6.2 Session Completion Handler
**Files to Create:**
- `src/components/SessionCompletionModal.tsx`

**Features:**
- Celebrate session completion
- Quick emotion selector
- Redirect to journal option
- Show next steps

#### 6.3 Auto-Journal Entry Creation
**Files to Update:**
- `src/pages/Journal.tsx`

**Features:**
- Accept session_id as URL param
- Pre-fill journal entry with session details
- Auto-select mood based on session type
- Save entry with session reference

---

### PHASE 7: Session History & Past Purchases (Week 3-4)

#### 7.1 Enhanced Past Purchases Component
**Files to Update:**
- `src/components/PastPurchases.tsx`

**New Features:**
1. **Session History:**
   - List of completed sessions
   - Session type, date, practitioner
   - Link to recording (if available)
   - Link to journal entry

2. **Available Credits:**
   - Show remaining credits
   - Expiration dates
   - Usage history

3. **Purchase History:**
   - Past package purchases
   - Receipts/download links
   - Refund status

#### 7.2 Session History Component
**Files to Create:**
- `src/components/SessionHistory.tsx`

**Features:**
- Filter by session type
- Filter by date range
- Search by practitioner
- View session details
- Download recordings
- View journal entries

---

### PHASE 8: Group Session Correlation (Week 4)

#### 8.1 Admin Group Session Management
**Files to Create:**
- `src/pages/AdminGroupSessions.tsx`

**Features:**
- Create correlated online + in-person sessions
- Link sessions together
- Manage participant limits
- View correlation status

#### 8.2 Group Session Display
**Files to Update:**
- `src/components/SessionScheduler.tsx`

**Features:**
- Show if session has correlated in-person/online version
- Display both options
- Allow booking either or both

---

## File Structure Summary

### New Database Migrations
```
supabase/migrations/
  YYYYMMDD_create_liability_waivers.sql
  YYYYMMDD_create_session_recordings.sql
  YYYYMMDD_create_action_recommendations.sql
  YYYYMMDD_add_in_person_sessions.sql
  YYYYMMDD_create_practitioner_banking.sql
  YYYYMMDD_create_practitioner_contracts.sql
```

### New Edge Functions
```
supabase/functions/
  create-liability-waiver/index.ts
  get-liability-waiver-status/index.ts
  start-agora-recording/index.ts
  stop-agora-recording/index.ts
  get-recording-status/index.ts
  agora-recording-webhook/index.ts
  process-recording/index.ts
  create-action-recommendation/index.ts
  update-action-status/index.ts
```

### New Frontend Components
```
src/components/
  LiabilityWaiver.tsx
  SignaturePad.tsx (optional)
  SessionCompletionModal.tsx
  SessionHistory.tsx
  
  dashboard/
    GettingStarted.tsx
    OnlineSessions.tsx
    InPersonSessions.tsx
    ActionsWindow.tsx
  
  practitioner/
    PractitionerBanking.tsx
    PractitionerContract.tsx
    ActionRecommendationsManager.tsx
    PractitionerSidebar.tsx
```

### Updated Components
```
src/components/
  SessionScheduler.tsx (major update)
  PastPurchases.tsx (enhanced)

src/pages/
  Dashboard.tsx (restructured with tabs)
  VideoSession.tsx (post-session flow)
  Journal.tsx (session-linked entries)
  PractitionerDashboard.tsx (complete sidebar)
```

---

## Testing Checklist

### Booking Flow
- [ ] Single session booking (online, standing, 1:1)
- [ ] Single session booking (online, laying, 1:1)
- [ ] Group session booking (online)
- [ ] In-person session booking
- [ ] Package purchase flow
- [ ] Credit usage flow
- [ ] Liability waiver signing
- [ ] Session type selection

### Agora Integration
- [ ] Video session join (1:1)
- [ ] Video session join (group)
- [ ] Recording start/stop
- [ ] Recording storage
- [ ] Recording playback
- [ ] Shareable links

### Practitioner Dashboard
- [ ] Earnings display
- [ ] Banking info management
- [ ] Contract signing
- [ ] Action recommendations creation
- [ ] Session management

### User Dashboard
- [ ] Getting Started window
- [ ] Online Sessions window
- [ ] In-Person Sessions window
- [ ] Actions window
- [ ] Session history
- [ ] Past purchases

---

## Estimated Timeline

- **Week 1:** Database schema + Agora recording setup
- **Week 2:** Enhanced booking flow + User dashboard windows
- **Week 3:** Practitioner dashboard completion + Post-session flow
- **Week 4:** Group session correlation + Testing + Polish

**Total: 4 weeks**

---

## Dependencies & Prerequisites

1. **Agora Cloud Recording:**
   - Agora account with Cloud Recording enabled
   - Storage bucket configured (S3 or Agora Cloud)
   - Webhook endpoint configured

2. **Stripe:**
   - Stripe account configured
   - Webhook endpoints set up

3. **Supabase:**
   - Storage bucket for recordings
   - Edge Functions deployed
   - Database migrations applied

4. **Optional:**
   - Google Maps API (for in-person location display)
   - Signature pad library (for waiver signatures)

---

## Success Criteria

✅ Users can book single sessions and packages with full session type selection
✅ Liability waivers are signed and stored for all sessions
✅ Agora video sessions work for 1:1 and group sessions
✅ Sessions are recorded and stored securely
✅ Post-session journal redirect works
✅ Practitioners can create action recommendations
✅ Practitioner earnings dashboard is complete with banking info
✅ User dashboard has all required windows
✅ Session history is displayed in past purchases
✅ Group sessions can be correlated (online + in-person)

---

## Notes

- All sensitive data (banking info) must be encrypted
- Recordings should be stored securely with access controls
- Liability waivers must be legally compliant
- Consider GDPR/privacy requirements for recordings
- Implement proper error handling for Agora API calls
- Add loading states for all async operations
- Ensure mobile responsiveness for all new components

