# WellnessLiving API Requirements (Phase 1)

This checklist covers what is required to move from portal/widget links to a native API-driven Sadhu experience.

## External Requirements (WellnessLiving)

You must request API access from WellnessLiving first. Ask your WellnessLiving account representative to provide:

- WellnessLiving username
- WellnessLiving password
- Business ID (BID)
- Authorization code
- Authorization ID

Reference: WellnessLiving Developer Portal introduction.

## Product Scope To Confirm (Phase 1)

Confirm these features for first delivery:

1. Retrieve class/schedule availability
2. Book class/session from Sadhu
3. Purchase pass/product (3 Free Class Pass flow)
4. Retrieve client profile and purchases for logged-in user

## Sadhu Backend Requirements

Implement WellnessLiving API calls in server-side functions only (Supabase Edge Functions), never in frontend code.

Required backend pieces:

- API auth/token handling function
- Client lookup/create by email
- Schedule listing endpoint
- Booking endpoint
- Purchase endpoint
- Error normalization and logging

## Sadhu Data Requirements

Add internal mapping fields/tables so Sadhu users map reliably to WellnessLiving users:

- `wl_client_id`
- `wl_business_id`
- sync timestamps and status

## Security Requirements

Store all WellnessLiving API secrets in server environment/secrets only.

- Do not expose BID/auth credentials in `VITE_*` variables
- Keep frontend limited to calling your own secured endpoints

## UX Requirements

Portal-first fallback must remain available while API rollout is in progress:

- If API fails, continue to WellnessLiving portal
- Keep user-facing language simple and non-technical

## Acceptance Criteria

Phase 1 is complete when:

- Logged-in Sadhu user can see schedule from API
- User can complete booking in Sadhu flow
- User can purchase 3 Free Class Pass via API-backed flow (or controlled redirect fallback)
- Failures gracefully route user to portal with clear message
