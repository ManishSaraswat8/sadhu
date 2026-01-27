import { formatInTimeZone, toZonedTime, fromZonedTime } from "date-fns-tz";

/**
 * Eastern Time Zone identifier
 */
const EST_TIMEZONE = "America/New_York";

/**
 * Convert a date to Eastern Time (EST/EDT)
 * @param date - Date to convert (can be Date object or ISO string)
 * @returns Date object representing the same moment in Eastern Time
 */
export function toEasternTime(date: Date | string): Date {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return toZonedTime(dateObj, EST_TIMEZONE);
}

/**
 * Convert a date from Eastern Time to UTC
 * @param date - Date in Eastern Time
 * @returns Date object in UTC
 */
export function fromEasternTime(date: Date): Date {
  return fromZonedTime(date, EST_TIMEZONE);
}

/**
 * Format a date/time in Eastern Time
 * @param date - Date to format (can be Date object or ISO string)
 * @param formatString - Format string (using date-fns format tokens)
 * @returns Formatted string in Eastern Time
 */
export function formatEasternTime(
  date: Date | string,
  formatString: string
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return formatInTimeZone(dateObj, EST_TIMEZONE, formatString);
}

/**
 * Format a date/time in Eastern Time with timezone indicator
 * @param date - Date to format (can be Date object or ISO string)
 * @param formatString - Format string (using date-fns format tokens)
 * @returns Formatted string in Eastern Time with EST/EDT suffix
 */
export function formatEasternTimeWithTZ(
  date: Date | string,
  formatString: string
): string {
  const formatted = formatEasternTime(date, formatString);
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const easternDate = toEasternTime(dateObj);
  
  // Determine if it's EDT (Daylight Saving Time) or EST
  // EDT is from second Sunday in March to first Sunday in November
  const year = easternDate.getFullYear();
  const month = easternDate.getMonth();
  const day = easternDate.getDate();
  
  // Simple check: EDT roughly from March to November
  // More accurate: check if DST is active
  const jan = new Date(year, 0, 1);
  const jul = new Date(year, 6, 1);
  const stdOffset = Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
  const isDST = easternDate.getTimezoneOffset() < stdOffset;
  
  const tz = isDST ? "EDT" : "EST";
  return `${formatted} ${tz}`;
}

/**
 * Get current time in Eastern Time
 * @returns Date object representing current time in Eastern Time
 */
export function getCurrentEasternTime(): Date {
  return toEasternTime(new Date());
}

/**
 * Format date for display (common formats)
 */
export const formatDateEastern = (date: Date | string, formatStr: string = "MMM d, yyyy"): string => {
  return formatEasternTime(date, formatStr);
};

export const formatTimeEastern = (date: Date | string, formatStr: string = "h:mm a"): string => {
  return formatEasternTime(date, formatStr);
};

export const formatDateTimeEastern = (date: Date | string, formatStr: string = "EEEE, MMMM d, yyyy 'at' h:mm a"): string => {
  return formatEasternTime(date, formatStr);
};
