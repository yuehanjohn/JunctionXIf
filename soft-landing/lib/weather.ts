import { labelForScore, scoreWeatherDay } from "./scoring";
import type { WeatherDay } from "./types";

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

/** Live 16-day forecast scored for moving conditions. Server-side only. */
export async function fetchWeatherDays(lat: number, lon: number, days = 16): Promise<WeatherDay[]> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,precipitation_sum,snowfall_sum,wind_gusts_10m_max");
  url.searchParams.set("forecast_days", String(days));
  url.searchParams.set("timezone", "Europe/Helsinki");

  const res = await fetch(url, { next: { revalidate: 900 } });
  if (!res.ok) throw new Error(`Weather service returned ${res.status}`);
  const data = (await res.json()) as { daily?: OpenMeteoDaily };
  if (!data.daily?.time) throw new Error("Weather service returned no daily data");
  return toWeatherDays(data.daily);
}
