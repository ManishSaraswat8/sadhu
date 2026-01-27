# Client Changes Implementation Plan

This document outlines the implementation plan for all 21 changes requested by the client.

## Overview
Total Changes: 21
Estimated Complexity: High
Areas Affected: Authentication, UI Components, Content, Pricing, FAQ, Database, Routing

---

## Change 1: Sign-up Page - Add Additional Fields
**Priority:** High  
**Files to Modify:**
- `src/pages/Auth.tsx` - Add form fields for Phone Number, Date of Birth, Address
- `src/hooks/useAuth.tsx` - Update signUp function to handle additional fields
- Database migration - Add columns to user profiles table (phone_number, date_of_birth, address)

**Details:**
- Add Phone Number field (with validation)
- Add Date of Birth field (date picker)
- Add Address field (text area or multiple fields)
- Update form validation
- Update database schema to store these fields
- Update user profile display to show these fields

---

## Change 2: Cancellation Policy Update
**Priority:** High  
**Files to Modify:**
- Find cancellation policy component/page
- Update text for "Standard Cancellation Window" and "Last-Minute Cancellations"
- Keep grace cancellations and refund policy sections unchanged

**Details:**
- Standard Cancellation Window: Change to "2 hours before scheduled start time"
- Last-Minute Cancellations: Change to "less than 2 hours = no-show, session forfeited, credit fully deducted"
- Keep existing grace cancellation and refund policy sections

---

## Change 3: Timezone Display - Eastern Standard Time
**Priority:** Medium  
**Files to Modify:**
- All components displaying dates/times
- Create utility function for timezone conversion
- Update date formatting throughout the app

**Details:**
- Ensure all times displayed are in EST/EDT
- Update date formatting utilities
- Check: SessionScheduler, UpcomingSessions, AllSessions, Dashboard, etc.

---

## Change 4: Replace "Session Windows" with "Classes"
**Priority:** Low  
**Files to Modify:**
- Search and replace across codebase
- `src/hooks/useSessionJoinTimer.tsx`
- `docs/implementation/IMPLEMENTATION_STATUS.md`
- Any UI components displaying "Session Windows"

**Details:**
- Find all instances of "Session Windows" or "session window"
- Replace with "Classes" or "classes"
- Update user-facing text

---

## Change 5: Update About Us Text
**Priority:** Medium  
**Files to Modify:**
- `src/components/AboutSection.tsx`

**Details:**
- Replace entire "Our Story" section text with new content from document
- Ensure proper formatting and line breaks
- Maintain expand/collapse functionality

---

## Change 6: Why Guidance Matters Section - Organization & Font Sizing
**Priority:** Medium  
**Files to Modify:**
- `src/components/FeaturesSection.tsx`

**Details:**
- Reorganize layout for cleaner appearance
- Ensure font sizing matches other sections
- Improve visual hierarchy

---

## Change 7: Hero Section - Replace "Learn About Guidance" with "Readiness Test"
**Priority:** High  
**Files to Modify:**
- `src/components/HeroSection.tsx` - Update button text and link
- `src/components/Footer.tsx` - Add Readiness Test link under Product
- Create new page: `src/pages/ReadinessTest.tsx`

**Details:**
- Change button text from "Learn About Guidance" to "Readiness Test"
- Link to `/readiness-test` route
- Create Readiness Test page with 12 questions (from point 21)
- Implement scoring logic (A=0, B=1, C=2, D=3, E=4, Max 48)
- Show results based on score ranges (0-16, 17-32, 33-48)
- Hide scores from user, only show final result
- Add route in App.tsx

---

## Change 8: Homepage CTA - Change Button Text
**Priority:** Low  
**Files to Modify:**
- `src/components/CTASection.tsx`

**Details:**
- Change "Try AI Guide Free" to "Access 3 Free Classes"
- Update link destination if needed

---

## Change 9: Footer - Update Sadhu Board Product Details
**Priority:** Medium  
**Files to Modify:**
- `src/pages/SadhuBoardInfo.tsx` - Update product details section

**Details:**
- Remove "Non-Slip Foundation" section
- Replace with "Secure Case" section
- Add description: "A sadhu board case is a protective, functional carrying system designed to transport, store, and respect a sadhu (nail) board safely and intentionally."
- Adjust font size to match rest of page

---

## Change 10: Remove Price Tag from "Get Your Sadhu Board" Button
**Priority:** Low  
**Files to Modify:**
- `src/pages/SadhuBoardInfo.tsx`

**Details:**
- Find button with text "Get Your Sadhu Board — $169"
- Remove price from button text
- Keep just "Get Your Sadhu Board"

---

## Change 11: Fix "Get Your Sadhu Board" Link Navigation
**Priority:** Medium  
**Files to Modify:**
- `src/pages/SadhuBoardInfo.tsx` or wherever this link appears

**Details:**
- Ensure link scrolls to top of page instead of bottom
- Check anchor behavior and fix navigation

---

## Change 12: Board Purchase Page - Fix Price Display & Refine Layout
**Priority:** Medium  
**Files to Modify:**
- `src/pages/SadhuBoard.tsx`

**Details:**
- Fix price display issues
- Refine page layout for cleaner, more organized appearance
- Ensure price is properly formatted and visible

---

## Change 13: Pricing Page - Update Board Price & Shipping
**Priority:** High  
**Files to Modify:**
- `src/pages/Pricing.tsx`
- Database: Update product price to 229 CAD
- Remove geo-pricing, show only CAD prices

**Details:**
- Change board price to $229 CAD
- Add "Free shipping worldwide" text
- Remove currency switcher or disable geo-pricing
- Show only CAD prices

---

## Change 14: Pricing Page - Update AI Meditation Guide Section
**Priority:** High  
**Files to Modify:**
- `src/pages/Pricing.tsx`

**Details:**
- Change title from "AI Meditation Guide" to "Sadhu Meditation Guide"
- Update pricing: $49.99/month or $43.99/month billed annually
- Update features:
  - Unlimited Monthly Group Classes
  - Journal
  - 3 Class Pass Trial

---

## Change 15: Update 1:1 Session Bullet Points
**Priority:** Medium  
**Files to Modify:**
- `src/pages/Pricing.tsx`

**Details:**
- Update bullet points to:
  - 1:1 Personalized Video Classes
  - Personalized Recommendations
  - 30 or 60 Minute Classes
  - Follow-ups

---

## Change 16: FAQ - Update "Online vs. In-Person" Section
**Priority:** High  
**Files to Modify:**
- `src/pages/FAQ.tsx`

**Details:**
- Change section title from "Online vs In-Person" to "Sadhu Meditation Guide vs. 1:1 Guidance"
- Replace all questions and answers with new content from document
- Add all new Q&A pairs as specified

---

## Change 17: FAQ - Update Contraindications Question
**Priority:** High  
**Files to Modify:**
- `src/pages/FAQ.tsx`

**Details:**
- Change question from "Are there any contraindications?" to "Are there people who should not practice Sadhu board at all?"
- Replace entire answer with new comprehensive content
- Include all categories: Do NOT use, Conditions requiring medical clearance, etc.

---

## Change 18: FAQ - Update Recording and Privacy Section
**Priority:** High  
**Files to Modify:**
- `src/pages/FAQ.tsx`

**Details:**
- Replace entire "Recordings & Privacy" section with new content
- Update all Q&A pairs as specified in document
- Ensure all 9 questions are included

---

## Change 19: FAQ - Update Logistics & Commitment Section
**Details:**
- Replace all questions in "Logistics & Commitment" section
- Update with new content about owning board, borrowing, sharing, hygiene

---

## Change 20: FAQ - Add New Section: Pricing, Subscription & Cancellation
**Priority:** High  
**Files to Modify:**
- `src/pages/FAQ.tsx`

**Details:**
- Add new FAQ section titled "Pricing, Subscription & Cancellation"
- Add all 10 questions and answers from document
- Include pricing details, subscription info, cancellation policies

---

## Change 21: Footer & Readiness Test Implementation
**Priority:** High  
**Files to Modify:**
- `src/components/Footer.tsx` - Add Readiness Test link
- Create `src/pages/ReadinessTest.tsx` - Full test implementation

**Details:**
- Add "Readiness Test" link to footer under Product section
- Create complete Readiness Test page with:
  - 12 questions with A-E options
  - Scoring logic (internal, not shown to user)
  - Three result categories based on score ranges
  - Clean UI for question display
  - Result display without showing scores

---

## Implementation Order

### Phase 1: Critical UI & Content Changes (High Priority)
1. Change 7: Hero Section & Readiness Test (create new page)
2. Change 13: Pricing Page - Board price & shipping
3. Change 14: Pricing Page - Subscription update
4. Change 16-20: FAQ Updates (all sections)
5. Change 21: Readiness Test full implementation

### Phase 2: Authentication & User Data (High Priority)
6. Change 1: Sign-up page additional fields
7. Change 2: Cancellation policy update

### Phase 3: Content & Text Updates (Medium Priority)
8. Change 5: About Us text
9. Change 6: Why Guidance Matters section
10. Change 8: CTA button text
11. Change 9: Footer product details
12. Change 10-11: Board info page fixes
13. Change 12: Board purchase page refinement
14. Change 15: 1:1 session bullet points

### Phase 4: Technical Updates (Medium/Low Priority)
15. Change 3: Timezone display (EST)
16. Change 4: Replace "Session Windows" with "Classes"

---

## Database Changes Required

1. **User Profile Table:**
   - Add `phone_number` (text, nullable)
   - Add `date_of_birth` (date, nullable)
   - Add `address` (text, nullable)

2. **Products Table:**
   - Update `price_cad` to 229 for Sadhu Board
   - May need to update pricing logic

---

## New Files to Create

1. `src/pages/ReadinessTest.tsx` - Readiness test page
2. Database migration for user profile fields
3. Utility function for EST timezone conversion (if needed)

---

## Testing Checklist

- [ ] Sign-up form accepts all new fields
- [ ] Cancellation policy displays correctly
- [ ] All times show in EST
- [ ] "Session Windows" replaced with "Classes"
- [ ] About Us text updated
- [ ] Hero section button links to Readiness Test
- [ ] Readiness Test page works correctly
- [ ] Pricing page shows correct prices
- [ ] FAQ sections updated correctly
- [ ] Footer links work
- [ ] Board purchase page displays correctly
- [ ] All text changes applied

---

## Notes

- Some changes may require database migrations
- Timezone changes may affect existing session scheduling logic
- Readiness Test is a new feature requiring full implementation
- FAQ changes are extensive and need careful review
- Pricing changes may affect Stripe integration
