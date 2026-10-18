import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export type GeocodeResult = {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1: string;
  admin2: string;
  population: number | null;
};

/** Mock city table — Finnish cities/districts plus a few neighbours for ranking realism. No network. */
const MOCK_PLACES: GeocodeResult[] = [
  { name: "Helsinki", latitude: 60.16986, longitude: 24.9384, country: "Finland", admin1: "Uusimaa", admin2: "Helsinki", population: 684585 },
  { name: "Espoo", latitude: 60.20549, longitude: 24.65558, country: "Finland", admin1: "Uusimaa", admin2: "Espoo", population: 313298 },
  { name: "Tampere", latitude: 61.49775, longitude: 23.76103, country: "Finland", admin1: "Pirkanmaa", admin2: "Tampere", population: 255810 },
  { name: "Vantaa", latitude: 60.29337, longitude: 25.03779, country: "Finland", admin1: "Uusimaa", admin2: "Vantaa", population: 243193 },
  { name: "Oulu", latitude: 65.01209, longitude: 25.46508, country: "Finland", admin1: "North Ostrobothnia", admin2: "Oulu", population: 212627 },
  { name: "Turku", latitude: 60.45148, longitude: 22.26869, country: "Finland", admin1: "Southwest Finland", admin2: "Turku", population: 202017 },
  { name: "Jyväskylä", latitude: 62.24147, longitude: 25.72088, country: "Finland", admin1: "Central Finland", admin2: "Jyväskylä", population: 145809 },
  { name: "Kuopio", latitude: 62.89238, longitude: 27.67703, country: "Finland", admin1: "North Savo", admin2: "Kuopio", population: 123739 },
  { name: "Lahti", latitude: 60.98267, longitude: 25.66151, country: "Finland", admin1: "Päijät-Häme", admin2: "Lahti", population: 120315 },
  { name: "Pori", latitude: 61.48542, longitude: 21.79683, country: "Finland", admin1: "Satakunta", admin2: "Pori", population: 83592 },
  { name: "Joensuu", latitude: 62.60118, longitude: 29.76316, country: "Finland", admin1: "North Karelia", admin2: "Joensuu", population: 77732 },
  { name: "Lappeenranta", latitude: 61.05871, longitude: 28.18872, country: "Finland", admin1: "South Karelia", admin2: "Lappeenranta", population: 72721 },
  { name: "Hämeenlinna", latitude: 60.99696, longitude: 24.46434, country: "Finland", admin1: "Kanta-Häme", admin2: "Hämeenlinna", population: 68109 },
  { name: "Rovaniemi", latitude: 66.50175, longitude: 25.73576, country: "Finland", admin1: "Lapland", admin2: "Rovaniemi", population: 65921 },
  { name: "Porvoo", latitude: 60.39233, longitude: 25.66453, country: "Finland", admin1: "Uusimaa", admin2: "Porvoo", population: 51128 },
  { name: "Vaasa", latitude: 63.096, longitude: 21.61577, country: "Finland", admin1: "Ostrobothnia", admin2: "Vaasa", population: 68593 },
  { name: "Kallio", latitude: 60.1841, longitude: 24.9553, country: "Finland", admin1: "Uusimaa", admin2: "Helsinki", population: null },
  { name: "Töölö", latitude: 60.1864, longitude: 24.9286, country: "Finland", admin1: "Uusimaa", admin2: "Helsinki", population: null },
  { name: "Kallio", latitude: 63.8385, longitude: 24.4167, country: "Finland", admin1: "North Ostrobothnia", admin2: "Haapajärvi", population: 120 },
  { name: "Stockholm", latitude: 59.32938, longitude: 18.06871, country: "Sweden", admin1: "Stockholm", admin2: "Stockholm", population: 1515017 },
  { name: "Oslo", latitude: 59.91387, longitude: 10.75225, country: "Norway", admin1: "Oslo", admin2: "Oslo", population: 709037 },
  { name: "Tallinn", latitude: 59.43696, longitude: 24.75357, country: "Estonia", admin1: "Harju", admin2: "Tallinn", population: 453000 },
];

/** Case-insensitive substring match over the mock table (name and city parts). */
function searchMockPlaces(name: string): GeocodeResult[] {
  const q = name.toLowerCase();
  return MOCK_PLACES.filter(
    (p) => p.name.toLowerCase().includes(q) || p.admin2.toLowerCase().includes(q)
  );
}

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name")?.trim();
  if (!name) {
    return NextResponse.json({ ok: false, error: "Missing 'name' query parameter" }, { status: 400 });
  }
  const results = await geocodeQuery(name);
  return NextResponse.json({ ok: true, results });
}

async function geocodeQuery(name: string): Promise<GeocodeResult[]> {
  let hits = searchMockPlaces(name);

  // Raw query found nothing: retry with candidate sub-queries ("Kallio, Helsinki" -> "Kallio", then "Helsinki").
  let matchedPart: string | null = null;
  if (hits.length === 0) {
    for (const part of subQueries(name)) {
      const partHits = searchMockPlaces(part);
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
      const refHits = searchMockPlaces(other);
      if (refHits.length > 0) {
        reference = { latitude: refHits[0].latitude, longitude: refHits[0].longitude };
        break;
      }
    }
  }
  // Ranking policy:
  // - Multi-part query with a reference point: distance to the reference dominates;
  //   population only breaks exact distance ties (district near Helsinki).
  // - Single-part query: population descending — cities outrank villages and islets.
  //   Missing population sorts last; ties keep table order (stable sort).
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
    .map((h) => ({ ...h }))
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

function distanceKm(hit: { latitude: number; longitude: number }, reference: { latitude: number; longitude: number }): number {
  const lat1 = hit.latitude * (Math.PI / 180);
  const lat2 = reference.latitude * (Math.PI / 180);
  const dLat = (reference.latitude - hit.latitude) * (Math.PI / 180);
  const dLon = (reference.longitude - hit.longitude) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * 6371 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
