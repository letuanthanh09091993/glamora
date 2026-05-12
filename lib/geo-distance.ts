import type { Language } from "@/lib/i18n";

const EARTH_RADIUS_KM = 6371;

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

export function distanceKmToAccount(
  viewer: { lat: number; lon: number },
  account: { latitude?: number; longitude?: number },
): number | null {
  const { latitude: plat, longitude: plon } = account;
  if (
    plat == null ||
    plon == null ||
    !Number.isFinite(plat) ||
    !Number.isFinite(plon)
  ) {
    return null;
  }
  return haversineKm(viewer.lat, viewer.lon, plat, plon);
}

/** Nearby lists: real coords first (closest), profiles without coords keep stable order after. */
export function sortByDistanceKm<T extends { latitude?: number; longitude?: number }>(
  items: T[],
  viewer: { lat: number; lon: number },
): T[] {
  return [...items].sort((a, b) => {
    const da = distanceKmToAccount(viewer, a);
    const db = distanceKmToAccount(viewer, b);
    if (da != null && db != null) return da - db;
    if (da != null) return -1;
    if (db != null) return 1;
    return 0;
  });
}

export function formatApproxDistanceKm(km: number, lang: Language): string {
  const n = km < 10 ? km.toFixed(1) : String(Math.round(km));
  return lang === "VN" ? `≈ ${n} km` : `~ ${n} km`;
}
