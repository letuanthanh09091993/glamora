import type { Language } from "@/lib/i18n";
import { t } from "@/lib/i18n";

/** Ho Chi Minh City districts / Thu Duc city / suburban districts (excludes filter sentinel `all`). */
export const HCM_DISTRICT_KEYS = [
  "q1",
  "q3",
  "q4",
  "q5",
  "q6",
  "q7",
  "q8",
  "q10",
  "q11",
  "q12",
  "binh_thanh",
  "tan_binh",
  "tan_phu",
  "phu_nhuan",
  "go_vap",
  "binh_tan",
  "thu_duc",
  "binh_chanh",
  "hoc_mon",
  "cu_chi",
  "nha_be",
  "can_gio",
] as const;

export type HcmDistrictKey = (typeof HCM_DISTRICT_KEYS)[number];

const KEY_SET = new Set<string>(HCM_DISTRICT_KEYS);

export function districtOptionLabel(language: Language, key: string): string {
  return t(language, `artistsPage.districtOptions.${key}`);
}

/** Saved profile line (follows current UI language). */
export function districtKeysToDisplayLine(language: Language, keys: string[]): string {
  const ordered = HCM_DISTRICT_KEYS.filter((k) => keys.includes(k));
  const extras = keys.filter((k) => !KEY_SET.has(k));
  const parts = [...ordered.map((k) => districtOptionLabel(language, k)), ...extras];
  return parts.join(", ");
}

/** Vietnamese query for geocoding (stable across languages). */
export function districtKeysToGeocodeQuery(keys: string[]): string {
  if (!keys.length) return "";
  const ordered = HCM_DISTRICT_KEYS.filter((k) => keys.includes(k));
  if (!ordered.length) return "";
  const labels = ordered.map((k) => t("VN", `artistsPage.districtOptions.${k}`));
  return `${labels.join(", ")}, TP. Hồ Chí Minh, Việt Nam`;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Best-effort migration from legacy free-text `location` (e.g. "Quận 1, 3, Thủ Đức").
 */
export function inferDistrictKeysFromLocation(raw: string): string[] {
  if (!raw.trim()) return [];
  const segments = raw.split(/[,;]+/).map((s) => s.trim()).filter(Boolean);
  const found = new Set<string>();

  for (const seg of segments) {
    const ns = normalize(seg);
    if (!ns) continue;

    if (/^\d+$/.test(ns)) {
      const qkey = `q${ns}`;
      if (KEY_SET.has(qkey)) found.add(qkey);
      continue;
    }

    let matched = false;
    for (const key of HCM_DISTRICT_KEYS) {
      const vi = normalize(t("VN", `artistsPage.districtOptions.${key}`));
      const en = normalize(t("EN", `artistsPage.districtOptions.${key}`));
      if (ns === vi || ns === en) {
        found.add(key);
        matched = true;
        break;
      }
      if (vi.length >= 3 && (vi.includes(ns) || ns.includes(vi))) {
        found.add(key);
        matched = true;
        break;
      }
      if (en.length >= 3 && (en.includes(ns) || ns.includes(en))) {
        found.add(key);
        matched = true;
        break;
      }
    }
    if (!matched) {
      const m = ns.match(/^quan\s*(\d{1,2})$/) ?? ns.match(/^district\s*(\d{1,2})$/);
      if (m) {
        const qkey = `q${m[1]}`;
        if (KEY_SET.has(qkey)) found.add(qkey);
      }
    }
  }

  return HCM_DISTRICT_KEYS.filter((k) => found.has(k));
}
