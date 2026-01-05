# Client Feedback Implementation Plan

## Completed ✅
1. ✅ Landing page: Moved "Who Can Benefit" below "Our Story"
2. ✅ Landing page: Removed "This Practice is for you if:" text, kept only bullet points
3. ✅ Landing page: Made "This practice is not for you if:" section smaller
4. ✅ Landing page: Cleaned up "Why Guidance Matters" section
5. ✅ Footer: Removed duplicate pricing link

## In Progress 🔄

### 4. Payment Flow Redesign
**Requirements:**
- Remove pricing display during booking
- Create Online/In-Person windows (tabs)
- Online window: Calendar with scheduled group classes + 1:1 booking option
- In-Person window: Studio location selection + calendar with group classes + 1:1 booking option
- Only show pricing if no credits in wallet (prompt to buy)

**Implementation:**
- Redesign `SessionScheduler.tsx` to use tabs for Online/In-Person
- Create calendar view showing scheduled group classes
- Add 1:1 booking option when practitioner available
- Remove all pricing displays from booking flow
- Add credit check - if no credits, show "Buy Credits" prompt

### 5. Wallet Page Updates
**Requirements:**
- 3 tabs: 20 MIN, 45 MIN, 60 MIN
- Each tab shows package options with discounted prices
- Option to purchase Sadhu Board
- History of purchases
- Display available credits by duration

**Implementation:**
- Redesign `PurchaseHistory.tsx` (Wallet page)
- Add Tabs component for 20/45/60 MIN
- Fetch and display packages for each duration
- Add Sadhu Board purchase option
- Show credit availability summary
- Display purchase history

### 6. Currency Display Fix
**Requirements:**
- Show CAD for Canada users
- Show USD for everyone else

**Implementation:**
- Update `useCurrency` hook to properly detect Canada
- Ensure all pricing displays use correct currency
- Update booking flow to use correct currency

### 7. Rescheduling Functionality
**Requirements:**
- Reschedule button available to users per scheduling policy
- Admin can reschedule anytime
- Cancellation policy:
  - Standard: Cancel up to 3 hours before → credit returned
  - Last-minute (< 3 hours): Credit forfeited
  - Grace cancellation: One-time per client for emergencies

**Implementation:**
- Add reschedule button to session cards
- Create reschedule dialog/modal
- Implement cancellation policy logic
- Track grace cancellations per user
- Add admin override for rescheduling

## Database Changes Needed
- Add `grace_cancellation_used` boolean to user profiles or separate table
- Add `studio_locations` table for in-person locations
- Add admin interface for managing studio locations

## Files to Modify
1. `src/components/SessionScheduler.tsx` - Major redesign
2. `src/pages/PurchaseHistory.tsx` - Complete redesign as Wallet
3. `src/hooks/useCurrency.tsx` - Fix currency detection
4. `src/components/AllSessions.tsx` - Add reschedule button
5. `src/pages/AdminGroupSessions.tsx` - Add studio location management
6. New: `src/components/RescheduleDialog.tsx`
7. New: `src/components/StudioLocationSelector.tsx`

