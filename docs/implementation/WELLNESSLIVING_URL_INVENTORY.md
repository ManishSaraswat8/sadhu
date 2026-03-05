# WellnessLiving URL Inventory

This file defines the URL contract used by the Sadhu frontend for WellnessLiving integration.

## Inventory Status

- Login portal was reachable at `https://www.wellnessliving.com/login/sadhu`.
- Automated extraction of setup URLs can be blocked by anti-bot/captcha behavior.
- The app now reads canonical URLs from `VITE_WL_*` environment variables so production values can be dropped in without code changes.

## URL Contract

- `VITE_WL_APPOINTMENT_WIDGET_SCRIPT_URL`
  - Source: Setup -> Website Widgets -> Appointment -> New widget code
  - Default: `https://widgets.wellnessliving.com/appointments/widget.js`
- `VITE_WL_APPOINTMENT_WIDGET_K_BUSINESS`
  - Source: Appointment widget tag
  - Default: `770196`
- `VITE_WL_APPOINTMENT_WIDGET_K_SKIN`
  - Source: Appointment widget tag
  - Default: `380713`
- `VITE_WL_APPOINTMENT_WIDGET_K_LOCATION`
  - Source: Appointment widget tag
  - Optional, default: empty
- `VITE_WL_APPOINTMENT_LINK_URL`
  - Source: Appointment Button/Link
  - Default: `https://www.wellnessliving.com/rs/appointment-start.html?id_screen=3&is_microsite=0&is_widget=1&id_mode=11&is_all=1&k_business=770196&id_class_tab=3`
- `VITE_WL_BOOK_A_SPOT_WIDGET_SCRIPT_URL`
  - Source: Setup -> Website Widgets -> Book-a-Spot
  - Default: `https://www.wellnessliving.com/rs/skin-widget-static.js`
- `VITE_WL_BOOK_A_SPOT_WIDGET_DATA`
  - Source: Book-a-Spot widget data attribute
  - Default: `k_skin=380714&k_business=770196`
- `VITE_WL_BOOK_A_SPOT_LINK_URL`
  - Source: Book-a-Spot Button/Link
  - Default: `https://www.wellnessliving.com/rs/appointment-start.html?id_screen=3&is_microsite=0&is_widget=1&id_mode=11&is_all=1&k_business=770196&id_class_tab=4`
- `VITE_WL_STORE_WIDGET_SCRIPT_URL`
  - Source: Setup -> Website Widgets -> Store
  - Default: `https://widgets.wellnessliving.com/store/widget.js`
- `VITE_WL_STORE_WIDGET_K_BUSINESS`
  - Source: Store widget tag
  - Default: `770196`
- `VITE_WL_STORE_WIDGET_K_SKIN`
  - Source: Store widget tag
  - Default: `380716`
- `VITE_WL_STORE_WIDGET_K_LOCATION`
  - Source: Store widget tag
  - Optional, default: empty
- `VITE_WL_STORE_LINK_URL`
  - Source: Store Button/Link
  - Default: `https://www.wellnessliving.com/rs/catalog-list.html?k_skin=380716&k_business=770196`
- `VITE_WL_THREE_FREE_CLASS_PAYMENT_URL`
  - Source: Setup -> Purchase Options -> "3 Free Class Pass" -> Advanced
  - Mode: used as highest-priority CTA/payment destination
- `VITE_WL_CLIENT_PORTAL_URL`
  - Source: Setup -> Business -> Business URLs
  - Mode: `wrapperLink`
- `VITE_WL_ARCHIVE_VIDEOS_URL`
  - Source: Setup -> Business URLs or Integrations
  - Mode: `wrapperLink`
- `VITE_WL_THREE_FREE_CLASS_CTA_TEXT`
  - Source: marketing copy
- `VITE_WL_THREE_FREE_CLASS_PRICING_TEXT`
  - Source: pricing copy synced with current pass offer

## Defaults

If a required URL is missing, the UI falls back to the WellnessLiving login URL:

- `https://www.wellnessliving.com/login/sadhu`

If widget script + keys are configured, the dashboard can render native WellnessLiving appointment widgets using:

- `<script type="module" src="https://widgets.wellnessliving.com/appointments/widget.js"></script>`
- `<wl-appointments-widget k_business="..." k_skin="..." k_location=""></wl-appointments-widget>`

Applied widgets for requirement-relevant flows:

- Booking: Appointment widget + Appointment link
- In-person: Book-a-Spot widget + Book-a-Spot link
- 3 Free Classes purchase: Store widget + Store link
