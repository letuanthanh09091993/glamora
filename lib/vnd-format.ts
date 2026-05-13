/** Keep only digits for stored price values. */
export function vndDigitsOnly(raw: string): string {
  return raw.replace(/\D/g, "");
}

/** Vietnamese-style grouping with dots (e.g. 1.500.000). */
export function formatVndDots(digits: string): string {
  const d = vndDigitsOnly(digits);
  if (!d) return "";
  return d.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** If `raw` is digits-only (VND amount stored compact), format with dots + ₫; else return trimmed text. */
export function formatPriceCell(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  if (/^\d+$/.test(t)) return `${formatVndDots(t)} ₫`;
  return t;
}
