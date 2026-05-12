import { NextResponse } from "next/server";
import {
  normalizeFromGoogleGeocodeJson,
  normalizeFromNominatim,
  type NominatimReverseJson,
} from "@/lib/nearby-match";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const latRaw = searchParams.get("lat");
  const lonRaw = searchParams.get("lon");
  if (!latRaw || !lonRaw) {
    return NextResponse.json({ error: "missing_coordinates" }, { status: 400 });
  }
  const lat = Number(latRaw);
  const lon = Number(lonRaw);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return NextResponse.json({ error: "invalid_coordinates" }, { status: 400 });
  }

  const googleKey = process.env.GOOGLE_MAPS_API_KEY;

  if (googleKey) {
    try {
      const gUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${encodeURIComponent(`${lat},${lon}`)}&key=${encodeURIComponent(googleKey)}&language=vi`;
      const gRes = await fetch(gUrl, { next: { revalidate: 0 } });
      if (gRes.ok) {
        const gJson = (await gRes.json()) as unknown;
        const normalized = normalizeFromGoogleGeocodeJson(gJson);
        if (normalized?.hints.length) {
          return NextResponse.json({ ...normalized, source: "google" as const });
        }
      }
    } catch {
      /* fall through to OSM */
    }
  }

  const osmUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
  try {
    const res = await fetch(osmUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent": "GlamoraMarketplace/1.0 (contact: https://example.invalid/dev-contact)",
      },
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      return NextResponse.json({ error: "upstream_failed" }, { status: 502 });
    }
    const data = (await res.json()) as NominatimReverseJson;
    const normalized = normalizeFromNominatim(data);
    if (!normalized.hints.length) {
      return NextResponse.json({ error: "no_hints" }, { status: 502 });
    }
    return NextResponse.json({ ...normalized, source: "nominatim" as const });
  } catch {
    return NextResponse.json({ error: "geocode_failed" }, { status: 502 });
  }
}
