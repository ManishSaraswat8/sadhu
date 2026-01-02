# Client Feedback Implementation Status

## ✅ Completed

1. ✅ **Remove AI Meditation from user dashboard** - Removed from sidebar and dashboard
2. ✅ **Remove welcome back window and welcome video** - Removed from Dashboard.tsx
3. ✅ **Remove 'manage checklist' button from Practitioner Clients** - Removed, kept only in Action Plan

## 🔄 In Progress

2. **Rename 'Sessions' to 'Classes'** - Started, need to continue throughout app

## 📋 Pending (High Priority)

### 4. Pricing & Currency Fixes (CRITICAL)
- **Issue**: Pricing varies by practitioner and user, inconsistent currency display
- **Solution**: 
  - Make pricing consistent per class type/duration (not per practitioner)
  - Remove price display during booking flow
  - Use class credits from wallet instead
  - Show helper text with USD equivalent when in CAD
  - Add option to switch currency

### 6. Payment Flow Fix (CRITICAL)
- **Issue**: Payment prompt even when credits exist in wallet
- **Solution**:
  - Automatically use credits from wallet when booking
  - Make wallet the ONLY place for purchases
  - Remove payment prompts from booking flow
  - Add Sadhu Board purchase to wallet

### 5. In-Person Booking Locations
- **Issue**: User prompted to enter address, should show studio locations
- **Solution**:
  - Create studio_locations table (admin managed)
  - Show dropdown of studio locations instead of address input
  - Remove address input field

### 7. User Verification Flow
- **Issue**: Unclear verification messaging
- **Solution**:
  - Better messaging: "Please verify your email"
  - Redirect to login after verification
  - Clear call-to-action

### 3. Rescheduling Functionality
- **Issue**: Can't see rescheduling option
- **Solution**:
  - Add "Reschedule" button to upcoming sessions
  - Create reschedule flow (similar to booking)

## Notes

- "Purchase History" renamed to "Wallet" in sidebar and page title
- Need to continue renaming "Sessions" to "Classes" throughout
- Currency consistency is critical - affects user trust

