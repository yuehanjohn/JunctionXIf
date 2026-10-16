import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type GeocodeResult = {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1: string;
  admin2: string;
  population: number | null;
};

type OpenMeteoGeocodeHit = {
  name?: string;
  latitude?: number;
  longitude?: number;
  country?: string;
  admin1?: string;
  admin2?: string;
  population?: number;
};

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name")?.trim();
  if (!name) {
    return NextResponse.json({ ok: false, error: "Missing 'name' query parameter" }, { status: 400 });
  }

  try {
    const results = await geocodeQuery(name);
    return NextResponse.json({ ok: true, results });
  } catch {
    return NextResponse.json({ ok: false, error: "Failed to reach geocoding service" }, { status: 502 });
  }
}

async function geocodeQuery(name: string): Promise<GeocodeResult[]> {
  let hits = await fetchOpenMeteo(name);

  // Raw query found nothing: retry with candidate sub-queries ("Kallio, Helsinki" -> "Kallio", then "Helsinki").
  let matchedPart: string | null = null;
  if (hits.length === 0) {
    for (const part of subQueries(name)) {
      const partHits = await fetchOpenMeteo(part);
      if (partHits.length > 0) {
        hits = partHits;
        matchedPart = part;
        break;
      }
    }
  }
  if (hits.length === 0) {
    return [];
  }

  // If a multi-part query matched via one part only, disambiguate using the other part's location:
  // "Kallio, Helsinki" -> the Kallio district nearest to Helsinki, not the one in North Ostrobothnia.
  let reference: { latitude: number; longitude: number } | null = null;
  if (matchedPart !== null) {
    const others = name
      .split(/,|\s+/)
      .map((p) => p.trim())
      .filter((p) => p.length >= 2 && p !== matchedPart);
    for (const other of others) {
      const refHits = await fetchOpenMeteo(other);
      if (refHits.length > 0 && typeof refHits[0].latitude === "number" && typeof refHits[0].longitude === "number") {
        reference = { latitude: refHits[0].latitude, longitude: refHits[0].longitude };
        break;
      }
    }
  }
  // Ranking policy:
  // - Multi-part query with a geocoded reference point: distance to the reference
  //   dominates; population only breaks exact distance ties (district near Helsinki).
  // - Single-part query: population descending — cities outrank villages and islets
  //   ("Kallio" district over the 600 km away Ostrobothnia village, Tampere city
  //   over the Tampereensaari islet). Missing population sorts last; ties keep
  //   upstream API order (stable sort).
  // Finland-first always runs as the final stable pass, preserving the order above
  // within each country group.
  if (reference) {
    hits = [...hits].sort((a, b) => {
      const d = distanceKm(a, reference) - distanceKm(b, reference);
      if (d !== 0) return d;
      return (b.population ?? 0) - (a.population ?? 0);
    });
  } else {
    hits = [...hits].sort((a, b) => (b.population ?? 0) - (a.population ?? 0));
  }
  return hits
    .map(mapHit)
    .sort((a, b) => Number(b.country === "Finland") - Number(a.country === "Finland"));
}

// Candidate retry parts: "Kallio, Helsinki" -> ["Kallio", "Helsinki"].
function subQueries(name: string): string[] {
  const parts = name
    .split(/,|\s+/)
    .map((p) => p.trim())
    .filter((p) => p.length >= 2);
  const seen: Record<string, true> = {};
  const unique: string[] = [];
  for (const p of parts) {
    if (!seen[p]) {
      seen[p] = true;
      unique.push(p);
    }
  }
  return unique;
}

function distanceKm(hit: OpenMeteoGeocodeHit, reference: { latitude: number; longitude: number }): number {
  const lat1 = (hit.latitude ?? 0) * (Math.PI / 180);
  const lat2 = reference.latitude * (Math.PI / 180);
  const dLat = (reference.latitude - (hit.latitude ?? 0)) * (Math.PI / 180);
  const dLon = (reference.longitude - (hit.longitude ?? 0)) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * 6371 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function fetchOpenMeteo(name: string): Promise<OpenMeteoGeocodeHit[]> {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", name);
  url.searchParams.set("count", "10");
  url.searchParams.set("language", "en");

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Geocoding service returned ${res.status}`);
  }
  const data = (await res.json()) as { results?: OpenMeteoGeocodeHit[] };
  return data.results ?? [];
}

function mapHit(hit: OpenMeteoGeocodeHit): GeocodeResult {
  return {
    name: hit.name ?? "",
    latitude: hit.latitude ?? 0,
    longitude: hit.longitude ?? 0,
    country: hit.country ?? "",
    admin1: hit.admin1 ?? "",
    admin2: hit.admin2 ?? "",
    population: typeof hit.population === "number" ? hit.population : null,
  };
}
