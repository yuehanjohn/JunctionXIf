import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { labelForScore, scoreWeatherDay } from "@/lib/scoring";
import type { WeatherDay } from "@/lib/types";

type OpenMeteoDaily = {
  time?: string[];
  temperature_2m_max?: number[];
  temperature_2m_min?: number[];
  precipitation_sum?: number[];
  snowfall_sum?: number[];
  wind_gusts_10m_max?: number[];
};

function toWeatherDays(daily: OpenMeteoDaily): WeatherDay[] {
  const time = daily.time ?? [];
  const rows: WeatherDay[] = [];
  for (let i = 0; i < time.length; i++) {
    const tMax = daily.temperature_2m_max?.[i] ?? 0;
    const tMin = daily.temperature_2m_min?.[i] ?? 0;
    const precip = daily.precipitation_sum?.[i] ?? 0;
    const snow = daily.snowfall_sum?.[i] ?? 0;
    const gust = daily.wind_gusts_10m_max?.[i] ?? 0;
    const score = scoreWeatherDay({ tMax, tMin, precip, snow, gust });
    rows.push({ date: time[i], tMax, tMin, precip, snow, gust, score, label: labelForScore(score) });
  }
  return rows;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const lat = Number(params.get("lat"));
  const lon = Number(params.get("lon"));
  const days = Math.min(Math.max(Number(params.get("days")) || 7, 1), 7);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ ok: false, error: "lat and lon must be numbers" }, { status: 400 });
  }

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,precipitation_sum,snowfall_sum,wind_gusts_10m_max");
  url.searchParams.set("forecast_days", String(days));
  url.searchParams.set("timezone", "Europe/Helsinki");

  try {
    const res = await fetch(url, { next: { revalidate: 900 } });
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: `Weather service returned ${res.status}` }, { status: 502 });
    }
    const data = (await res.json()) as { daily?: OpenMeteoDaily };
    if (!data.daily?.time) {
      return NextResponse.json({ ok: false, error: "Weather service returned no daily data" }, { status: 502 });
    }
    return NextResponse.json({ ok: true, days: toWeatherDays(data.daily) });
  } catch {
    return NextResponse.json({ ok: false, error: "Failed to reach weather service" }, { status: 502 });
  }
}
