/** Lowercase ASCII-ish fold for Vietnamese + Latin matching. */
export function normalizeVi(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .trim();
}

/** Build extra spellings for major VN cities from OSM-style hint strings. */
export function expandRegionHints(hints: string[]): string[] {
  const out = new Set<string>();
  for (const h of hints) {
    const t = h.trim();
    if (t) out.add(t);
  }
  const blob = normalizeVi([...out].join(" "));

  if (/(ho chi minh|binh duong|dong nai|ba ria|thanh pho ho chi minh)/.test(blob)) {
    [
      "TP.HCM",
      "TP HCM",
      "TPHCM",
      "HCM",
      "Ho Chi Minh",
      "Hồ Chí Minh",
      "Sài Gòn",
      "Saigon",
      "SG",
      "Quận 1",
      "Q1",
      "HCMC",
    ].forEach((x) => out.add(x));
  }
  if (/(ha noi|hanoi|thanh pho ha noi)/.test(blob)) {
    ["Hà Nội", "Ha Noi", "HN", "Hanoi", "Ba Đình", "Hoàn Kiếm"].forEach((x) => out.add(x));
  }
  if (/(da nang|danang|thanh pho da nang)/.test(blob)) {
    ["Đà Nẵng", "Da Nang", "DN"].forEach((x) => out.add(x));
  }
  if (/(hai phong|haiphong)/.test(blob)) {
    ["Hải Phòng", "Hai Phong", "HP"].forEach((x) => out.add(x));
  }
  if (/(can tho|cantho)/.test(blob)) {
    ["Cần Thơ", "Can Tho", "CT"].forEach((x) => out.add(x));
  }

  return [...out];
}

export type NominatimReverseJson = {
  display_name?: string;
  address?: Partial<Record<string, string>>;
};

/** Client + API: normalized area hints and a short label for the UI. */
export type ReverseGeocodeNormalized = {
  hints: string[];
  label: string;
};

export function hintsFromNominatim(data: NominatimReverseJson): string[] {
  const a = data.address ?? {};
  const raw = [
    a.city,
    a.town,
    a.village,
    a.hamlet,
    a.municipality,
    a.city_district,
    a.state_district,
    a.suburb,
    a.neighbourhood,
    a.quarter,
    a.district,
    a.borough,
    a.county,
    a.state,
    a.region,
  ].filter((x): x is string => typeof x === "string" && x.trim().length > 0);

  const fromDisplay = data.display_name?.split(",").map((x) => x.trim()).slice(0, 6) ?? [];
  const merged = [...raw, ...fromDisplay];
  const unique = [...new Set(merged.map((x) => x.trim()).filter(Boolean))];
  return expandRegionHints(unique);
}

export function primaryLocationLabel(data: NominatimReverseJson): string {
  const a = data.address ?? {};
  const city =
    a.city ||
    a.town ||
    a.village ||
    a.municipality ||
    a.state_district ||
    a.city_district ||
    a.county;
  const state = a.state || a.region;
  if (city && state && normalizeVi(city) !== normalizeVi(state)) return `${city}, ${state}`;
  if (city) return city;
  if (data.display_name) return data.display_name.split(",").slice(0, 2).join(",").trim();
  return "";
}

export function normalizeFromNominatim(data: NominatimReverseJson): ReverseGeocodeNormalized {
  const hints = hintsFromNominatim(data);
  const label = primaryLocationLabel(data) || hints[0] || "";
  return { hints, label };
}

/** Google Maps Geocoding API JSON (reverse). */
export type GoogleGeocodeApiJson = {
  status?: string;
  error_message?: string;
  results?: Array<{
    formatted_address?: string;
    address_components?: Array<{
      long_name?: string;
      short_name?: string;
      types?: string[];
    }>;
  }>;
};

const GOOGLE_ORDERED_HINT_TYPES = [
  "neighborhood",
  "sublocality_level_1",
  "sublocality_level_2",
  "sublocality",
  "locality",
  "administrative_area_level_2",
  "administrative_area_level_1",
] as const;

/**
 * Parse Google reverse-geocode response into hints aligned with profile `location` text (e.g. Quận 1, TP.HCM).
 */
export function normalizeFromGoogleGeocodeJson(data: unknown): ReverseGeocodeNormalized | null {
  if (!data || typeof data !== "object") return null;
  const d = data as GoogleGeocodeApiJson;
  if (d.status !== "OK" || !d.results?.length) return null;

  const r = d.results[0];
  const comps = r.address_components ?? [];
  const firstOfType = new Map<string, string>();
  for (const c of comps) {
    const name = c.long_name?.trim();
    if (!name) continue;
    for (const t of c.types ?? []) {
      if (!firstOfType.has(t)) firstOfType.set(t, name);
    }
  }

  const ordered: string[] = [];
  for (const t of GOOGLE_ORDERED_HINT_TYPES) {
    const v = firstOfType.get(t);
    if (v && !ordered.includes(v)) ordered.push(v);
  }

  const fromFormatted =
    r.formatted_address
      ?.split(",")
      .map((x) => x.trim())
      .filter((x) => x.length > 1 && !/^\d{5,}$/.test(x))
      .slice(0, 8) ?? [];

  const merged = [...ordered, ...fromFormatted];
  const unique = [...new Set(merged.filter(Boolean))];
  const hints = expandRegionHints(unique);

  let label = "";
  if (ordered.length >= 2) {
    label = `${ordered[0]}, ${ordered[ordered.length - 1]}`;
  } else if (ordered.length === 1) {
    label = ordered[0];
  } else if (fromFormatted.length) {
    label = fromFormatted.slice(0, 2).join(", ");
  } else {
    label = hints[0] ?? "";
  }

  return { hints, label: label.trim() };
}

export function profileMatchesNearbyHints(profileLocation: string | undefined, hints: string[]): boolean {
  if (!hints.length) return true;
  if (!profileLocation?.trim()) return false;
  const pl = normalizeVi(profileLocation);
  for (const h of hints) {
    const nh = normalizeVi(h);
    if (nh.length < 2) continue;
    if (pl.includes(nh)) return true;
    const tokens = pl.split(/[,·/|]/).map((x) => x.trim()).filter(Boolean);
    if (tokens.some((tok) => tok.includes(nh) || nh.includes(tok))) return true;
  }
  return false;
}
