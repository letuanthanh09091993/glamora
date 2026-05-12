import { NextResponse } from "next/server";

/** Forward geocode — Google first (same API key as reverse), then Nominatim. */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ error: "missing_query" }, { status: 400 });
  }

  const googleKey = process.env.GOOGLE_MAPS_API_KEY;

  if (googleKey) {
    try {
      const gUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q)}&region=vn&language=vi&key=${encodeURIComponent(googleKey)}`;
      const gRes = await fetch(gUrl, { next: { revalidate: 0 } });
      const gJson = (await gRes.json()) as {
        status?: string;
        results?: Array<{ geometry?: { location?: { lat: number; lng: number } } }>;
      };
      if (gJson.status === "OK" && gJson.results?.[0]?.geometry?.location) {
        const { lat, lng } = gJson.results[0].geometry.location;
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          return NextResponse.json({ lat, lng, source: "google" as const });
        }
      }
    } catch {
      /* fallback */
    }
  }

  try {
    const osmUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`;
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
    const arr = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!arr?.length) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    const lat = Number(arr[0].lat);
    const lng = Number(arr[0].lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ error: "invalid_result" }, { status: 502 });
    }
    return NextResponse.json({ lat, lng, source: "nominatim" as const });
  } catch {
    return NextResponse.json({ error: "geocode_failed" }, { status: 502 });
  }
}
