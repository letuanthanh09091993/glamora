/** Shared input hygiene for auth + admin forms (defense in depth; DB still validates). */

export function trimText(value: string, maxLen = 5000): string {
  return value.trim().slice(0, maxLen);
}

export function trimSingleLine(value: string, maxLen = 500): string {
  return value.replace(/\s+/g, " ").trim().slice(0, maxLen);
}

export function sanitizeEmail(value: string): string {
  return value.trim().toLowerCase().slice(0, 320);
}
