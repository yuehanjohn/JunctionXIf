import Link from "next/link";
import { SearchClient, type SearchQuery } from "./SearchClient";
import { fetchWeatherDays } from "@/lib/weather";
import type { WeatherDay } from "@/lib/types";
import type { HomeSize } from "@/lib/pricing";
import type { MoverService } from "@/lib/movers";

// Search results depend on query params + scored weather; render per request.
export const instant = false;

const SERVICES: Record<MoverService, true> = {
  packing: true,
  storage: true,
  piano: true,
  assembly: true,
  cleaning: true,
};

/** Deep links hand-typed in any case or spacing still resolve: "studio" → "Studio". */
function normalizeSize(raw: string): HomeSize | null {
  const compact = raw.trim().toLowerCase().replace(/\s+/g, "");
  if (compact === "studio") return "Studio";
  if (compact === "1–2rooms" || compact === "1-2rooms") return "1–2 rooms";
  if (compact === "3+rooms") return "3+ rooms";
  if (compact === "house") return "House";
  return null;
}

type Params = Record<string, string | string[] | undefined>;

function num(sp: Params, key: string): number | null {
  const v = Number(sp[key]);
  return Number.isFinite(v) ? v : null;
}

function str(sp: Params, key: string): string | null {
  const v = sp[key];
  return typeof v === "string" && v.length > 0 ? v : null;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const sp = await searchParams;

  const from = {
    name: str(sp, "fromName") ?? "Origin",
    lat: num(sp, "fromLat") ?? 0,
    lon: num(sp, "fromLon") ?? 0,
  };
  const to = {
    name: str(sp, "toName") ?? "Destination",
    lat: num(sp, "toLat") ?? 0,
    lon: num(sp, "toLon") ?? 0,
  };
  const date = str(sp, "date") ?? "";
  const sizeRaw = str(sp, "size");
  const size = sizeRaw ? normalizeSize(sizeRaw) : null;
  // Unknown service tokens are ignored; one valid one is enough.
  const services = str(sp, "services")
    ?.split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is MoverService => SERVICES[s as MoverService] === true) ?? [];

  if (!date || !size || !(from.lat || from.lon) || !(to.lat || to.lon)) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col items-start justify-center gap-4 px-6">
        <p className="font-display text-2xl font-semibold">That search didn’t come through.</p>
        <p className="text-sm text-text-muted">
          The link is missing addresses, a date, or a home size.
        </p>
        <Link
          href="/"
          className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover"
        >
          Start a new search
        </Link>
      </div>
    );
  }

  let weather: WeatherDay[] = [];
  try {
    weather = await fetchWeatherDays(to.lat, to.lon, 16);
  } catch {
    weather = [];
  }

  const query: SearchQuery = { from, to, date, size, services };
  return <SearchClient query={query} weather={weather} />;
}
