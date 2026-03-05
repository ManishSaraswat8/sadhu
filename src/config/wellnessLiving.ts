export type WellnessDisplayMode = "wrapperLink" | "embedWidget";

export interface WellnessWidgetConfig {
  type: "moduleTag" | "legacySkin";
  scriptUrl: string;
  tagName?: string;
  attributes?: Record<string, string>;
  legacyData?: string;
}

export interface WellnessEndpoint {
  key: "booking" | "inPerson" | "threeFreeClassPass" | "clientPortal" | "archiveVideos";
  title: string;
  description: string;
  sourceLocation: string;
  mode: WellnessDisplayMode;
  url: string;
  widget?: WellnessWidgetConfig;
}

const WELLNESS_LIVING_LOGIN_URL = "https://www.wellnessliving.com/login/sadhu";

const getRequiredUrl = (value: string | undefined): string => {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : WELLNESS_LIVING_LOGIN_URL;
};

const getOptionalUrl = (value: string | undefined): string => value?.trim() || "";

const getModuleWidget = (
  scriptUrl: string,
  tagName: string,
  attributes: Record<string, string>,
): WellnessWidgetConfig | undefined => {
  if (!scriptUrl || !tagName) {
    return undefined;
  }

  return {
    type: "moduleTag",
    scriptUrl,
    tagName,
    attributes,
  };
};

const getLegacyWidget = (
  scriptUrl: string,
  legacyData: string,
): WellnessWidgetConfig | undefined => {
  if (!scriptUrl || !legacyData) {
    return undefined;
  }

  return {
    type: "legacySkin",
    scriptUrl,
    legacyData,
  };
};

const APPOINTMENT_LINK_URL_DEFAULT =
  "https://www.wellnessliving.com/rs/appointment-start.html?id_screen=3&is_microsite=0&is_widget=1&id_mode=11&is_all=1&k_business=770196&id_class_tab=3";
const BOOK_A_SPOT_LINK_URL_DEFAULT =
  "https://www.wellnessliving.com/rs/appointment-start.html?id_screen=3&is_microsite=0&is_widget=1&id_mode=11&is_all=1&k_business=770196&id_class_tab=4";
const STORE_LINK_URL_DEFAULT =
  "https://www.wellnessliving.com/rs/catalog-list.html?k_skin=380716&k_business=770196";

const appointmentWidget = getModuleWidget(
  getOptionalUrl(import.meta.env.VITE_WL_APPOINTMENT_WIDGET_SCRIPT_URL) ||
    "https://widgets.wellnessliving.com/appointments/widget.js",
  "wl-appointments-widget",
  {
    k_business: getOptionalUrl(import.meta.env.VITE_WL_APPOINTMENT_WIDGET_K_BUSINESS) || "770196",
    k_skin: getOptionalUrl(import.meta.env.VITE_WL_APPOINTMENT_WIDGET_K_SKIN) || "380713",
    k_location: getOptionalUrl(import.meta.env.VITE_WL_APPOINTMENT_WIDGET_K_LOCATION) || "",
  },
);

const bookASpotWidget = getLegacyWidget(
  getOptionalUrl(import.meta.env.VITE_WL_BOOK_A_SPOT_WIDGET_SCRIPT_URL) ||
    "https://www.wellnessliving.com/rs/skin-widget-static.js",
  getOptionalUrl(import.meta.env.VITE_WL_BOOK_A_SPOT_WIDGET_DATA) ||
    "k_skin=380714&k_business=770196",
);

const storeWidget = getModuleWidget(
  getOptionalUrl(import.meta.env.VITE_WL_STORE_WIDGET_SCRIPT_URL) ||
    "https://widgets.wellnessliving.com/store/widget.js",
  "wl-store-widget",
  {
    k_business: getOptionalUrl(import.meta.env.VITE_WL_STORE_WIDGET_K_BUSINESS) || "770196",
    k_skin: getOptionalUrl(import.meta.env.VITE_WL_STORE_WIDGET_K_SKIN) || "380716",
    k_location: getOptionalUrl(import.meta.env.VITE_WL_STORE_WIDGET_K_LOCATION) || "",
  },
);

export const wellnessLivingThreeFreeClasses = {
  ctaText: import.meta.env.VITE_WL_THREE_FREE_CLASS_CTA_TEXT?.trim() || "Access 3 Free Classes",
  pricingText:
    import.meta.env.VITE_WL_THREE_FREE_CLASS_PRICING_TEXT?.trim() ||
    "Current 3 Free Classes pricing and checkout are in the WellnessLiving Store.",
  url:
    getOptionalUrl(import.meta.env.VITE_WL_THREE_FREE_CLASS_PAYMENT_URL) ||
    getOptionalUrl(import.meta.env.VITE_WL_STORE_LINK_URL) ||
    STORE_LINK_URL_DEFAULT,
};

export const wellnessLivingEndpoints: WellnessEndpoint[] = [
  {
    key: "booking",
    title: "Book Classes",
    description: "Browse available class times and reserve your spot.",
    sourceLocation: "Setup -> Integrations -> Widgets",
    mode: appointmentWidget ? "embedWidget" : "wrapperLink",
    url:
      getOptionalUrl(import.meta.env.VITE_WL_APPOINTMENT_LINK_URL) ||
      APPOINTMENT_LINK_URL_DEFAULT,
    widget: appointmentWidget,
  },
  {
    key: "inPerson",
    title: "In-Person Sessions",
    description: "Use Book-a-Spot to reserve in-person classes.",
    sourceLocation: "Setup -> Website Widgets -> Book-a-Spot",
    mode: bookASpotWidget ? "embedWidget" : "wrapperLink",
    url:
      getOptionalUrl(import.meta.env.VITE_WL_BOOK_A_SPOT_LINK_URL) ||
      BOOK_A_SPOT_LINK_URL_DEFAULT,
    widget: bookASpotWidget,
  },
  {
    key: "threeFreeClassPass",
    title: "3 Free Class Pass",
    description: "Claim the introductory pass through WellnessLiving Store checkout.",
    sourceLocation: "Setup -> Website Widgets -> Store",
    mode: storeWidget ? "embedWidget" : "wrapperLink",
    url: wellnessLivingThreeFreeClasses.url,
    widget: storeWidget,
  },
  {
    key: "clientPortal",
    title: "Client Portal",
    description: "Manage profile details, purchases, and reservations.",
    sourceLocation: "Setup -> Business -> Business URLs",
    mode: "wrapperLink",
    url:
      getOptionalUrl(import.meta.env.VITE_WL_CLIENT_PORTAL_URL) ||
      WELLNESS_LIVING_LOGIN_URL,
  },
  {
    key: "archiveVideos",
    title: "Archive Videos",
    description: "Access class archive videos. Falls back to Sadhu archive when unavailable.",
    sourceLocation: "Setup -> Business URLs or Integrations",
    mode: "wrapperLink",
    url: getOptionalUrl(import.meta.env.VITE_WL_ARCHIVE_VIDEOS_URL),
  },
];

export const wellnessLivingInventoryMeta = {
  loginUrl: WELLNESS_LIVING_LOGIN_URL,
  collectedAt: new Date().toISOString(),
  status:
    "Automated login can be blocked by captcha/anti-bot challenges; set VITE_WL_* env vars to finalize canonical production URLs.",
};
