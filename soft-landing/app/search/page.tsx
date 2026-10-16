import Link from "next/link";
import { SearchClient, type SearchQuery } from "./SearchClient";
import { fetchWeatherDays } from "@/lib/weather";
import type { WeatherDay } from "@/lib/types";
import { HOME_SIZES, type HomeSize } from "@/lib/pricing";
import type { MoverService } from "@/lib/movers";

// Search results depend on query params + live weather; render per request.
export const instant = false;

const SERVICES = new Set<MoverService>(["packing", "storage", "piano", "assembly", "cleaning"]);

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
  const size = str(sp, "size") ?? "";
  const services = str(sp, "services")
    ?.split(",")
    .filter((s): s is MoverService => SERVICES.has(s as MoverService)) ?? [];

  const valid = Boolean(
    date && (HOME_SIZES as string[]).includes(size) && (from.lat || from.lon) && (to.lat || to.lon)
  );

  if (!valid) {
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

  const query: SearchQuery = { from, to, date, size: size as HomeSize, services };
  return <SearchClient query={query} weather={weather} />;
}
