# User Panel - Remaining Components & Pages

## Overview
This document lists all remaining components and pages needed to complete the user dashboard according to Sitemap.txt requirements.

---

## Dashboard Windows (Main Tabs)

### 1. Getting Started Window ✅ TO CREATE
**File:** `src/components/dashboard/GettingStarted.tsx`
**Route:** `/dashboard` (tab)

**Features:**
- Introductory video player
- Best practices guide
- Quick start checklist
- Link to Step-by-Step guides
- Welcome message for new users

**Content:**
- Video: "How to Get Started with Your Sadhu Board"
- Text guide with images
- Interactive checklist
- Links to resources

---

### 2. Online Sessions Window ✅ TO CREATE
**File:** `src/components/dashboard/OnlineSessions.tsx`
**Route:** `/dashboard` (tab)

**Features:**
- Embedded SessionScheduler component
- Filter by session type (Standing/Laying, 1:1/Group)
- Show upcoming online sessions
- Quick book button
- Session type selector
- Practitioner selection

**Integration:**
- Uses enhanced SessionScheduler component
- Links to SessionPayment page
- Shows session credits status

---

### 3. In-Person Sessions Window ✅ TO CREATE
**File:** `src/components/dashboard/InPersonSessions.tsx`
**Route:** `/dashboard` (tab)

**Features:**
- Location-based session booking
- Map view of available locations (optional)
- Filter by location
- Show in-person session availability
- Address display
- Distance calculation (optional)

**Integration:**
- Uses SessionScheduler with location selection
- Shows physical addresses
- Links to SessionPayment page

---

### 4. Journal Window ✅ EXISTS (needs enhancement)
**File:** `src/pages/Journal.tsx` (already exists)
**Route:** `/dashboard/journal`

**Enhancements Needed:**
- Accept `session_id` as URL param
- Pre-fill journal entry with session details
- Auto-select mood based on session type
- Link journal entries to sessions
- Show session-linked entries separately

---

### 5. Actions Window ✅ TO CREATE
**File:** `src/components/dashboard/ActionsWindow.tsx`
**Route:** `/dashboard` (tab)

**Features:**
- Display action recommendations from practitioners
- Mark actions as complete
- Filter by status (pending, completed, overdue)
- Show due dates
- Action categories (daily practice, mindfulness, physical, emotional)
- Progress tracking
- Completion statistics

**Data Source:**
- `action_recommendations` table
- Linked to sessions

---

## Sidebar Components

### 6. User Profile ✅ TO CREATE
**File:** `src/components/sidebar/UserProfile.tsx`
**Location:** AppSidebar footer or header

**Features:**
- User avatar
- User name/email
- Quick stats (sessions completed, credits remaining)
- Link to Settings
- Logout button

---

### 7. Past Purchases ✅ EXISTS (needs enhancement)
**File:** `src/components/PastPurchases.tsx` (already exists)
**Location:** AppSidebar

**Enhancements Needed:**
- Show session history (completed sessions)
- Link to recordings
- Link to journal entries
- Purchase receipts
- Refund status
- Better organization (tabs: Credits, History, Purchases)

---

### 8. Helpful Videos ✅ TO CREATE
**File:** `src/components/sidebar/HelpfulVideos.tsx`
**Location:** AppSidebar

**Features:**
- List of helpful video resources
- Links to Step-by-Step guides
- Quick access to Getting Started video
- Categorized videos

---

## Session-Related Components

### 9. Liability Waiver Component ✅ TO CREATE
**File:** `src/components/LiabilityWaiver.tsx`

**Features:**
- Display waiver text
- Checkbox or signature pad for agreement
- Store signed waiver
- Show waiver status
- Legal compliance

**Usage:**
- Modal after booking confirmation
- Required before session creation
- Stored in `liability_waivers` table

---

### 10. Session Completion Modal ✅ TO CREATE
**File:** `src/components/SessionCompletionModal.tsx`

**Features:**
- Celebrate session completion
- Quick emotion selector
- Redirect to journal option
- Show next steps
- Link to action recommendations

**Usage:**
- Shown after video session ends
- Redirects to journal with pre-filled entry

---

### 11. Session History Component ✅ TO CREATE
**File:** `src/components/SessionHistory.tsx`

**Features:**
- List of all sessions (completed, upcoming, cancelled)
- Filter by session type
- Filter by date range
- Search by practitioner
- View session details
- Download recordings
- View journal entries
- Link to action recommendations

**Location:**
- Can be a page: `/dashboard/sessions/history`
- Or component in Past Purchases

---

### 12. Enhanced SessionScheduler ✅ EXISTS (needs major update)
**File:** `src/components/SessionScheduler.tsx` (already exists)

**Updates Needed:**
1. **Session Type Selection:**
   - Radio buttons/tabs: Standing / Laying
   - Toggle: 1:1 / Group
   - Duration selection (20min, 45min, 60min) based on type

2. **In-Person Support:**
   - Location selector
   - Address input/selection
   - Map integration (optional)

3. **Group Session Support:**
   - Show available slots for group sessions
   - Display current/max participants
   - Join existing group session option

4. **Liability Waiver Integration:**
   - Show waiver modal after booking
   - Require signature before session creation

---

## Payment & Booking Flow

### 13. Session Payment Page ✅ EXISTS (needs minor updates)
**File:** `src/pages/SessionPayment.tsx` (already exists)

**Updates Needed:**
- Ensure it handles all session types
- Show liability waiver requirement
- Better package comparison

---

### 14. Booking Confirmation Page ✅ TO CREATE
**File:** `src/pages/BookingConfirmation.tsx`
**Route:** `/sessions/confirmation/:sessionId`

**Features:**
- Session details summary
- Practitioner information
- Date/time confirmation
- Location (if in-person)
- Calendar add button
- Email confirmation sent
- Next steps

---

## Settings & Profile

### 15. Settings Page ✅ EXISTS (needs enhancement)
**File:** `src/pages/Settings.tsx` (already exists)

**Enhancements Needed:**
- User profile editing
- Notification preferences
- Privacy settings
- Linked accounts
- Download data option

---

### 16. User Profile Page ✅ TO CREATE (optional)
**File:** `src/pages/Profile.tsx`
**Route:** `/dashboard/profile`

**Features:**
- Profile picture upload
- Name editing
- Bio/description
- Preferences
- Account settings

---

## Summary Table

| Component/Page | Status | Priority | File Path |
|---------------|--------|----------|-----------|
| Getting Started Window | ❌ To Create | High | `src/components/dashboard/GettingStarted.tsx` |
| Online Sessions Window | ❌ To Create | High | `src/components/dashboard/OnlineSessions.tsx` |
| In-Person Sessions Window | ❌ To Create | High | `src/components/dashboard/InPersonSessions.tsx` |
| Actions Window | ❌ To Create | High | `src/components/dashboard/ActionsWindow.tsx` |
| Journal Window | ✅ Exists | Medium | `src/pages/Journal.tsx` (needs enhancement) |
| User Profile (Sidebar) | ❌ To Create | Medium | `src/components/sidebar/UserProfile.tsx` |
| Past Purchases | ✅ Exists | Medium | `src/components/PastPurchases.tsx` (needs enhancement) |
| Helpful Videos | ❌ To Create | Low | `src/components/sidebar/HelpfulVideos.tsx` |
| Liability Waiver | ❌ To Create | High | `src/components/LiabilityWaiver.tsx` |
| Session Completion Modal | ❌ To Create | High | `src/components/SessionCompletionModal.tsx` |
| Session History | ❌ To Create | Medium | `src/components/SessionHistory.tsx` |
| Enhanced SessionScheduler | ✅ Exists | High | `src/components/SessionScheduler.tsx` (major update) |
| Session Payment | ✅ Exists | Low | `src/pages/SessionPayment.tsx` (minor updates) |
| Booking Confirmation | ❌ To Create | Medium | `src/pages/BookingConfirmation.tsx` |
| Settings | ✅ Exists | Low | `src/pages/Settings.tsx` (enhancements) |
| User Profile Page | ❌ To Create | Low | `src/pages/Profile.tsx` (optional) |

---

## Implementation Order (Recommended)

### Phase 1: Core Booking Flow
1. Enhanced SessionScheduler (with session type selection)
2. Liability Waiver component
3. Booking Confirmation page

### Phase 2: Dashboard Windows
4. Getting Started Window
5. Online Sessions Window
6. In-Person Sessions Window
7. Actions Window

### Phase 3: Post-Session Flow
8. Session Completion Modal
9. Enhanced Journal (session-linked)
10. Session History component

### Phase 4: Enhancements
11. Enhanced Past Purchases
12. User Profile sidebar component
13. Helpful Videos sidebar
14. Settings enhancements

---

## Notes

- All components should use `UserLayout` for consistency
- Mobile responsiveness is required for all components
- Loading states and error handling must be implemented
- All user-facing text should be clear and user-friendly
- Consider accessibility (ARIA labels, keyboard navigation)

