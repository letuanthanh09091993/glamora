import type { ServicePackageRow } from "@/lib/auth-types";
import { formatPriceCell } from "@/lib/vnd-format";

export type { ServicePackageRow };

/** Short text for cards/lists; falls back to legacy `pricing` string. */
export function servicePackagesToSummary(
  packages: ServicePackageRow[] | undefined,
  legacyPricing?: string,
): string {
  if (!packages?.length) return legacyPricing?.trim() ?? "";
  const parts = packages
    .map((p) => {
      const n = p.name.trim();
      const pr = p.price.trim();
      const prDisp = formatPriceCell(p.price);
      const d = p.detail.trim();
      if (n && pr) return d ? `${n}: ${prDisp} (${d})` : `${n}: ${prDisp}`;
      if (n && d) return `${n} — ${d}`;
      if (pr && d) return `${prDisp} — ${d}`;
      if (n) return n;
      if (pr) return prDisp;
      if (d) return d;
      return "";
    })
    .filter(Boolean);
  return parts.join(" · ");
}

export function normalizeServicePackages(rows: ServicePackageRow[]): ServicePackageRow[] {
  return rows.filter((r) => r.name.trim() || r.price.trim() || r.detail.trim());
}
