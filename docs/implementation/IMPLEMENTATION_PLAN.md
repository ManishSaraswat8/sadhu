# Implementation Plan: Auth, Products & Geo-Pricing

## Overview
This document outlines the implementation plan for three critical features:
1. **Supabase Auth & HIPAA-Compliant Database Schema**
2. **Product Sales Pages with Stripe Integration**
3. **Auto-Detected Geo-Pricing (USD/CAD)**

---

## 1. SUPABASE AUTH & HIPAA-COMPLIANT DATABASE SCHEMA

### Current State
✅ Basic Supabase Auth is implemented
✅ Row Level Security (RLS) policies exist for most tables
✅ Role-based access control (admin, practitioner, user)
❌ No audit logging
❌ No HIPAA-specific compliance features
❌ No access tracking
❌ No consent management

### What Needs to Be Done

#### A. Audit Logging System
**Purpose:** Track all access to Protected Health Information (PHI) for HIPAA compliance

**Database Changes:**
1. Create `audit_logs` table:
   - `id` (UUID, primary key)
   - `user_id` (UUID, references auth.users)
   - `action` (TEXT: 'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'VIEW', 'EXPORT')
   - `table_name` (TEXT: which table was accessed)
   - `record_id` (UUID: specific record accessed)
   - `ip_address` (TEXT)
   - `user_agent` (TEXT)
   - `metadata` (JSONB: additional context)
   - `created_at` (TIMESTAMP)

2. Create trigger functions to automatically log:
   - All SELECT queries on PHI tables (session_schedules, meditation_memories, etc.)
   - All INSERT/UPDATE/DELETE operations
   - Access to sensitive data

3. RLS Policy: Only admins can view audit logs

#### B. Enhanced Access Controls
**Purpose:** Implement principle of least privilege

**Database Changes:**
1. Review and tighten existing RLS policies:
   - Ensure practitioners can only see their assigned clients
   - Ensure clients can only see their own data
   - Add explicit deny policies where needed

2. Create `access_grants` table:
   - Track explicit permissions for data sharing
   - Support consent-based access
   - Track expiration dates for temporary access

#### C. Data Encryption & Security
**Purpose:** Ensure data at rest and in transit is protected

**Implementation:**
1. Document encryption status (Supabase handles encryption at rest)
2. Ensure all API endpoints use HTTPS (already done)
3. Add encryption notes to sensitive fields in schema
4. Implement field-level encryption for highly sensitive data (if needed)

#### D. Consent Management
**Purpose:** Track user consent for data processing (HIPAA requirement)

**Database Changes:**
1. Create `user_consents` table:
   - `id` (UUID)
   - `user_id` (UUID)
   - `consent_type` (TEXT: 'data_processing', 'marketing', 'session_recording', etc.)
   - `consented` (BOOLEAN)
   - `consent_date` (TIMESTAMP)
   - `ip_address` (TEXT)
   - `user_agent` (TEXT)
   - `version` (TEXT: consent form version)
   - `revoked_at` (TIMESTAMP, nullable)

2. Create `data_retention_policies` table:
   - Track how long data should be retained
   - Automatic deletion policies

#### E. Session & Access Tracking
**Purpose:** Monitor user sessions and access patterns

**Database Changes:**
1. Enhance existing auth tracking:
   - Log all login/logout events
   - Track session duration
   - Monitor failed login attempts
   - Track password changes

2. Create `user_sessions` table (if not exists):
   - Track active sessions
   - Support session invalidation
   - Track device information

### Migration Files to Create
1. `create_audit_logs_table.sql`
2. `create_audit_triggers.sql`
3. `create_access_grants_table.sql`
4. `create_user_consents_table.sql`
5. `create_data_retention_policies_table.sql`
6. `enhance_rls_policies.sql`

### Edge Functions to Create/Update
1. `audit-log-access` - Log access to sensitive data
2. `get-consent-status` - Check user consent status
3. `record-consent` - Record user consent

---

## 2. PRODUCT SALES PAGES WITH STRIPE INTEGRATION

### Current State
✅ Basic Stripe integration exists (`create-board-payment`, `create-session-payment`)
✅ Sadhu Board product page exists (hardcoded price: $169 USD)
✅ Session payment flow works (direct to Stripe checkout)
❌ No session package support (5 and 10 session packages)
❌ No product management system
❌ No "Past Purchases" sidebar component
❌ Hardcoded Stripe price IDs
❌ Pricing based on practitioner rates (should be fixed pricing per Sitemap)

### What Needs to Be Done

#### A. Product Database Schema
**Purpose:** Store session types, packages, and pricing (CAD/USD)

**Database Changes:**
1. Create `session_types` table (for fixed pricing structure):
   - `id` (UUID, primary key)
   - `name` (TEXT: '20min Intro', '45min Standard', '60min Expert')
   - `duration_minutes` (INTEGER: 20, 45, 60)
   - `session_type` (TEXT: 'standing', 'laying')
   - `is_group` (BOOLEAN: false for 1:1, true for group)
   - `price_cad` (NUMERIC: $55, $100, $130 for single; $48, $90, $120 for group)
   - `price_usd` (NUMERIC: calculated from CAD)
   - `stripe_price_id_cad` (TEXT)
   - `stripe_price_id_usd` (TEXT)
   - `is_active` (BOOLEAN)
   - `created_at`, `updated_at` (TIMESTAMP)

2. Create `session_packages` table:
   - `id` (UUID, primary key)
   - `name` (TEXT: '5 Session Package', '10 Session Package')
   - `session_count` (INTEGER: 5 or 10)
   - `price_cad` (NUMERIC: calculated from session types)
   - `price_usd` (NUMERIC: calculated from CAD)
   - `stripe_price_id_cad` (TEXT)
   - `stripe_price_id_usd` (TEXT)
   - `is_active` (BOOLEAN)
   - `created_at`, `updated_at` (TIMESTAMP)

3. Create `user_session_credits` table (track available sessions):
   - `id` (UUID, primary key)
   - `user_id` (UUID, references auth.users)
   - `package_id` (UUID, references session_packages, nullable for single purchases)
   - `session_type_id` (UUID, references session_types, nullable for packages)
   - `credits_remaining` (INTEGER: number of sessions available)
   - `purchased_at` (TIMESTAMP)
   - `expires_at` (TIMESTAMP, nullable)
   - `stripe_payment_intent_id` (TEXT, for tracking)
   - `created_at`, `updated_at` (TIMESTAMP)

4. Create `products` table (for Sadhu Board):
   - `id` (UUID, primary key)
   - `name` (TEXT: 'Sadhu Board')
   - `slug` (TEXT: 'sadhu-board', unique)
   - `type` (TEXT: 'physical')
   - `price_cad` (NUMERIC: $229)
   - `price_usd` (NUMERIC: calculated)
   - `stripe_price_id_cad` (TEXT)
   - `stripe_price_id_usd` (TEXT)
   - `is_active` (BOOLEAN)
   - `created_at`, `updated_at` (TIMESTAMP)

#### B. Session Payment Page
**Purpose:** Show payment options after booking (single session OR package)

**Page to Create:**
1. **Session Payment Page** (`/sessions/payment`):
   - Display selected session details (practitioner, date, time, type)
   - Show three payment options:
     - **Single Session** - Pay for just this session
     - **5 Session Package** - Buy 5 sessions (better value)
     - **10 Session Package** - Buy 10 sessions (best value)
   - Display prices in user's currency (CAD/USD)
   - Show savings for packages
   - Redirect to Stripe checkout for selected option
   - After payment, redirect back to dashboard

#### C. Past Purchases Sidebar Component
**Purpose:** Show available sessions and purchase history

**Component to Create:**
1. **PastPurchases Component** (for sidebar):
   - Show available session credits (from `user_session_credits`)
   - Display: "You have X sessions available"
   - List recent purchases
   - Show expiration dates (if applicable)
   - Link to view full history (optional modal/page)

#### D. Stripe Integration Updates
**Purpose:** Support session packages and multi-currency

**Edge Functions to Create/Update:**
1. **`create-session-payment`** (UPDATE):
   - Accept `payment_type` ('single', 'package_5', 'package_10')
   - Use fixed pricing from `session_types` table (not practitioner rates)
   - Support currency detection
   - Create `user_session_credits` records for packages

2. **`stripe-session-webhook`** (UPDATE):
   - Handle package purchases
   - Create `user_session_credits` entries
   - Deduct credits when single session is used

3. **`check-session-credits`** (NEW):
   - Check if user has available session credits
   - Return credit balance
   - Used before redirecting to payment

4. **`create-board-payment`** (UPDATE):
   - Use product pricing from database
   - Support currency detection

#### E. Session Booking Flow Update
**Purpose:** Check for credits before requiring payment

**Flow:**
1. User books session
2. Check if user has available credits (`check-session-credits`)
3. If credits available:
   - Show option to use credit OR buy new session/package
   - If using credit, deduct and create session
4. If no credits:
   - Redirect to payment page with options (single/5/10 package)
   - After payment, create session and credits (if package)

### Migration Files to Create
1. `create_session_types_table.sql` - Fixed pricing for session types
2. `create_session_packages_table.sql` - 5 and 10 session packages
3. `create_user_session_credits_table.sql` - Track available sessions
4. `create_products_table.sql` - For Sadhu Board
5. `seed_session_types.sql` - Seed all session types with CAD/USD pricing
6. `seed_session_packages.sql` - Seed 5 and 10 session packages

### Edge Functions to Create/Update
1. `create-session-payment/index.ts` (UPDATE) - Support packages and fixed pricing
2. `stripe-session-webhook/index.ts` (UPDATE) - Handle package purchases
3. `check-session-credits/index.ts` (NEW) - Check available credits
4. `create-board-payment/index.ts` (UPDATE) - Use database pricing

### Frontend Components to Create
1. `SessionPaymentPage.tsx` - Payment options after booking
2. `PastPurchases.tsx` - Sidebar component for available sessions
3. `SessionCreditSelector.tsx` - Component to select single/package option

---

## 3. AUTO-DETECTED GEO-PRICING (USD/CAD)

### Current State
❌ Currency hardcoded to USD
❌ Prices hardcoded in code
❌ No geo-detection
❌ No currency conversion

### What Needs to Be Done

#### A. Geo-Detection System
**Purpose:** Automatically detect user's location and currency

**Implementation:**
1. **Frontend Detection:**
   - Use browser's `Intl` API to detect locale
   - Use IP geolocation service (optional: Cloudflare, MaxMind, or free service)
   - Store user preference in database (allow manual override)

2. **Database Changes:**
   - Add `preferred_currency` to `auth.users` metadata or create `user_preferences` table:
     - `user_id` (UUID)
     - `currency` (TEXT: 'cad', 'usd')
     - `country` (TEXT: 'CA', 'US', etc.)
     - `detected_at` (TIMESTAMP)
     - `updated_at` (TIMESTAMP)

#### B. Currency Conversion & Pricing
**Purpose:** Display and process payments in correct currency

**Implementation:**
1. **Pricing Strategy:**
   - Store prices in both CAD and USD in database
   - Use fixed exchange rate or live rates (recommend fixed for stability)
   - Default exchange rate: 1 CAD = 0.73 USD (approximate)

2. **Frontend Updates:**
   - Display prices in user's detected currency
   - Show currency switcher (optional)
   - Update all price displays throughout app

3. **Stripe Integration:**
   - Create Stripe Price objects for both currencies
   - Use correct price ID based on user's currency
   - Ensure Stripe account supports both currencies

#### C. Edge Functions Updates
**Purpose:** Handle currency-aware payment processing

**Functions to Update:**
1. **`create-product-checkout`**:
   - Accept currency parameter
   - Use correct Stripe price ID
   - Set Stripe checkout currency

2. **`create-session-payment`**:
   - Detect user currency
   - Convert session prices to user's currency
   - Use correct Stripe price ID

3. **`create-board-payment`**:
   - Detect user currency
   - Use correct Stripe price ID for Sadhu Board

#### D. Price Configuration
**Purpose:** Centralize pricing configuration

**Database:**
- Store all prices in `products` and `product_variants` tables
- Support price updates without code changes

**Pricing from Sitemap.txt:**
- **Single Classes (CAD):**
  - 20min Intro: $55 CAD
  - 45min Standard: $100 CAD
  - 60min Expert: $130 CAD
- **Group Classes (CAD):**
  - 20min Intro: $48 CAD
  - 45min Standard: $90 CAD
  - 60min Expert: $120 CAD
- **Sadhu Board:** $229 CAD

**USD Equivalents (using 0.73 rate):**
- 20min Intro Single: ~$40 USD
- 45min Standard Single: ~$73 USD
- 60min Expert Single: ~$95 USD
- 20min Intro Group: ~$35 USD
- 45min Standard Group: ~$66 USD
- 60min Expert Group: ~$88 USD
- Sadhu Board: ~$167 USD

### Migration Files to Create
1. `create_user_preferences_table.sql`
2. `add_currency_to_products.sql`

### Edge Functions to Create/Update
1. `detect-user-currency/index.ts` (NEW)
2. `create-product-checkout/index.ts` (UPDATE)
3. `create-session-payment/index.ts` (UPDATE)
4. `create-board-payment/index.ts` (UPDATE)

### Frontend Updates
1. Add currency detection hook: `useCurrency.tsx`
2. Update all price displays to use currency
3. Add currency context provider
4. Update product pages to show correct currency

---

## IMPLEMENTATION ORDER

### Phase 1: Foundation (Week 1)
1. ✅ Create audit logging system
2. ✅ Create user preferences table
3. ✅ Create products schema
4. ✅ Seed initial products

### Phase 2: Geo-Pricing (Week 1-2)
1. ✅ Implement currency detection
2. ✅ Update all payment functions for multi-currency
3. ✅ Update frontend to display correct currency
4. ✅ Test currency switching

### Phase 3: Session Packages & Payment (Week 2-3)
1. ✅ Create session types and packages tables
2. ✅ Create session payment page with package options
3. ✅ Update session booking flow to check credits
4. ✅ Create Past Purchases sidebar component
5. ✅ Update Stripe functions for packages

### Phase 4: HIPAA Compliance (Week 3-4)
1. ✅ Implement audit triggers
2. ✅ Create consent management
3. ✅ Enhance RLS policies
4. ✅ Add access tracking

### Phase 5: Testing & Refinement (Week 4)
1. ✅ Test all payment flows
2. ✅ Test currency detection
3. ✅ Test audit logging
4. ✅ Security review

---

## FILES TO CREATE/MODIFY

### Database Migrations (New)
1. `supabase/migrations/YYYYMMDD_create_audit_logs.sql`
2. `supabase/migrations/YYYYMMDD_create_audit_triggers.sql`
3. `supabase/migrations/YYYYMMDD_create_user_preferences.sql`
4. `supabase/migrations/YYYYMMDD_create_session_types.sql`
5. `supabase/migrations/YYYYMMDD_create_session_packages.sql`
6. `supabase/migrations/YYYYMMDD_create_user_session_credits.sql`
7. `supabase/migrations/YYYYMMDD_create_products.sql`
8. `supabase/migrations/YYYYMMDD_create_user_consents.sql`
9. `supabase/migrations/YYYYMMDD_seed_session_types.sql`
10. `supabase/migrations/YYYYMMDD_seed_session_packages.sql`

### Edge Functions (New)
1. `supabase/functions/detect-user-currency/index.ts`
2. `supabase/functions/check-session-credits/index.ts`
3. `supabase/functions/record-consent/index.ts`

### Edge Functions (Update)
1. `supabase/functions/create-session-payment/index.ts` - Add currency support, fixed pricing, package support
2. `supabase/functions/create-board-payment/index.ts` - Add currency support, use database pricing
3. `supabase/functions/stripe-session-webhook/index.ts` - Handle package purchases, create credits

### Frontend Pages (New)
1. `src/pages/SessionPayment.tsx` - Payment options after booking (single/5/10 package)

### Frontend Components (New)
1. `src/components/PastPurchases.tsx` - Sidebar component for available sessions
2. `src/components/SessionCreditSelector.tsx` - Select payment option (single/package)
3. `src/components/CurrencySelector.tsx` - Optional currency switcher
4. `src/hooks/useCurrency.tsx` - Currency detection hook
5. `src/hooks/useSessionCredits.tsx` - Check available session credits
6. `src/contexts/CurrencyContext.tsx` - Currency context provider

### Frontend Updates
1. Update `SadhuBoard.tsx` - Use product data from database, currency support
2. Update `SessionScheduler.tsx` - Check credits before payment, redirect to payment page
3. Update `AppSidebar.tsx` - Add PastPurchases component
4. Update all price displays throughout app - Use currency context

---

## TESTING CHECKLIST

### Geo-Pricing
- [ ] Currency auto-detected for US users (USD)
- [ ] Currency auto-detected for Canadian users (CAD)
- [ ] Prices display correctly in both currencies
- [ ] Stripe checkout uses correct currency
- [ ] Payments process in correct currency

### Product Sales
- [ ] Session payment page shows single/5/10 package options
- [ ] Package pricing displays correctly in CAD/USD
- [ ] Single session purchase works
- [ ] 5-session package purchase works
- [ ] 10-session package purchase works
- [ ] Session credits are created after package purchase
- [ ] Credits are deducted when session is booked
- [ ] Past Purchases sidebar shows available credits
- [ ] Sadhu Board uses database pricing with currency support

### HIPAA Compliance
- [ ] Audit logs capture all PHI access
- [ ] RLS policies prevent unauthorized access
- [ ] Consent can be recorded and revoked
- [ ] Access grants work correctly
- [ ] Admin can view audit logs

---

## NOTES

1. **Stripe Setup Required:**
   - Create Price objects in Stripe for all products in both CAD and USD
   - Update price IDs in database after creation
   - Ensure Stripe account supports multi-currency

2. **Exchange Rate:**
   - Recommend using fixed rate for stability
   - Can be updated in database/config as needed
   - Consider using Stripe's exchange rates for real-time conversion (optional)

3. **HIPAA Compliance:**
   - This implementation provides foundation for HIPAA compliance
   - Full HIPAA compliance requires additional legal, policy, and technical measures
   - Consider consulting with HIPAA compliance expert

4. **Testing:**
   - Test with Stripe test mode first
   - Test currency detection with VPN/proxy
   - Test all payment flows thoroughly
   - Test audit logging with various user roles

