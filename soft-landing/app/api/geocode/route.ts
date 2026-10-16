import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type GeocodeResult = {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1: string;
};

type OpenMeteoGeocodeHit = {
  name?: string;
  latitude?: number;
  longitude?: number;
  country?: string;
  admin1?: string;
};

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name")?.trim();
  if (!name) {
    return NextResponse.json({ ok: false, error: "Missing 'name' query parameter" }, { status: 400 });
  }

  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", name);
  url.searchParams.set("count", "5");
  url.searchParams.set("language", "en");

  try {
    const res = await fetch(url, { next: { revalidate: 900 } });
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: `Geocoding service returned ${res.status}` }, { status: 502 });
    }
    const data = (await res.json()) as { results?: OpenMeteoGeocodeHit[] };
    const results: GeocodeResult[] = (data.results ?? []).map((hit) => ({
      name: hit.name ?? "",
      latitude: hit.latitude ?? 0,
      longitude: hit.longitude ?? 0,
      country: hit.country ?? "",
      admin1: hit.admin1 ?? "",
    }));
    return NextResponse.json({ ok: true, results });
  } catch {
    return NextResponse.json({ ok: false, error: "Failed to reach geocoding service" }, { status: 502 });
  }
}
