/** Glamora default IANA timezone for booking slots. */
export const GLAMORA_TIMEZONE = "Asia/Ho_Chi_Minh";

const HCM_OFFSET = "+07:00";

/** Wall-clock date + time (HH:mm or HH:mm:ss) in Asia/Ho_Chi_Minh → UTC ISO string. */
export function localDateTimeToUtcIso(dateIso: string, time: string): string {
  const normalized =
    time.length === 5 ? `${time}:00` : time.length === 8 ? time : `${time}:00`;
  return new Date(`${dateIso}T${normalized}${HCM_OFFSET}`).toISOString();
}

/** Inclusive day bounds in UTC for a calendar date in Asia/Ho_Chi_Minh. */
export function dayBoundsUtc(dateIso: string): { dayStartUtc: string; dayEndUtc: string } {
  return {
    dayStartUtc: localDateTimeToUtcIso(dateIso, "00:00:00"),
    dayEndUtc: localDateTimeToUtcIso(dateIso, "23:59:59"),
  };
}

/** Weekday 0=Sunday .. 6=Saturday for a YYYY-MM-DD date in Asia/Ho_Chi_Minh. */
export function weekdayInGlamoraTimezone(dateIso: string): number {
  const anchor = new Date(`${dateIso}T12:00:00${HCM_OFFSET}`);
  return anchor.getUTCDay();
}
