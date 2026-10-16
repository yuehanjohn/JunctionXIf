import { labelForScore, scoreWeatherDay } from "./scoring";
import type { MovingWindow, WeatherDay, WeatherHour } from "./types";

type OpenMeteoDaily = {
  time?: string[];
  temperature_2m_max?: number[];
  temperature_2m_min?: number[];
  precipitation_sum?: number[];
  snowfall_sum?: number[];
  wind_gusts_10m_max?: number[];
};

type OpenMeteoHourly = {
  time?: string[];
  temperature_2m?: number[];
  precipitation?: number[];
  snowfall?: number[];
  wind_gusts_10m?: number[];
};

export type WeatherBundle = {
  days: WeatherDay[];
  hours: WeatherHour[];
  windows: MovingWindow[];
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

function toWeatherHours(hourly: OpenMeteoHourly): WeatherHour[] {
  const time = hourly.time ?? [];
  const rows: WeatherHour[] = [];
  for (let i = 0; i < time.length; i++) {
    const hour = Number(time[i].slice(11, 13));
    if (!Number.isInteger(hour)) continue;
    const t = hourly.temperature_2m?.[i] ?? 0;
    const precip = hourly.precipitation?.[i] ?? 0;
    const snow = hourly.snowfall?.[i] ?? 0;
    const gust = hourly.wind_gusts_10m?.[i] ?? 0;
    // The hour's temperature is both its high and its low, so the same daily
    // scorer (freeze + gust + precipitation penalties) works unchanged.
    const score = scoreWeatherDay({ tMax: t, tMin: t, precip, snow, gust });
    rows.push({ time: time[i], hour, t, precip, snow, gust, score, label: labelForScore(score) });
  }
  return rows;
}

// Loading happens in daylight. An hour can carry boxes when it scores at least
// "ok", gusts stay under 35 km/h, and — the Finnish special — nothing falls
// from the sky near freezing. A window is a contiguous run of at least three
// such hours whose precipitation totals stay low.
const WINDOW_FIRST_HOUR = 8; // 08:00 local
const WINDOW_LAST_HOUR = 20; // 20:00 local, exclusive
const MIN_WINDOW_HOURS = 3;
const MAX_WINDOW_PRECIP_MM = 2;
const MAX_WINDOW_SNOW_CM = 1;
const MIN_WINDOW_SCORE = 55;

function hourIsUsable(hour: WeatherHour): boolean {
  return (
    hour.hour >= WINDOW_FIRST_HOUR &&
    hour.hour < WINDOW_LAST_HOUR &&
    hour.score >= MIN_WINDOW_SCORE &&
    hour.gust < 35 &&
    !(hour.t <= 1 && (hour.precip > 0 || hour.snow > 0))
  );
}

// The worst hour defines the window; ties prefer longer, drier, earlier spans.
function betterWindow(a: MovingWindow, b: MovingWindow): boolean {
  if (a.score !== b.score) return a.score > b.score;
  const lenA = a.endHour - a.startHour;
  const lenB = b.endHour - b.startHour;
  if (lenA !== lenB) return lenA > lenB;
  if (a.precip !== b.precip) return a.precip < b.precip;
  return a.startHour < b.startHour;
}

function bestWindowInRun(run: WeatherHour[], date: string): MovingWindow | null {
  let best: MovingWindow | null = null;
  for (let start = 0; start < run.length; start++) {
    let precip = 0;
    let snow = 0;
    let maxGust = 0;
    let minScore = 100;
    for (let end = start; end < run.length; end++) {
      const h = run[end];
      precip += h.precip;
      snow += h.snow;
      if (h.gust > maxGust) maxGust = h.gust;
      if (h.score < minScore) minScore = h.score;
      if (end - start + 1 < MIN_WINDOW_HOURS) continue;
      if (precip > MAX_WINDOW_PRECIP_MM || snow > MAX_WINDOW_SNOW_CM) continue;
      const candidate: MovingWindow = {
        date,
        startHour: run[start].hour,
        endHour: h.hour + 1,
        precip,
        snow,
        maxGust,
        score: minScore,
        label: labelForScore(minScore),
      };
      if (best === null || betterWindow(candidate, best)) best = candidate;
    }
  }
  return best;
}

/** Best ≥3 h loading window per day from scored hourly rows (08:00–20:00 local). */
export function bestWindowsByDay(hours: WeatherHour[]): MovingWindow[] {
  const byDate = new Map<string, WeatherHour[]>();
  for (const h of hours) {
    const date = h.time.slice(0, 10);
    const dayHours = byDate.get(date);
    if (dayHours) dayHours.push(h);
    else byDate.set(date, [h]);
  }
  const windows: MovingWindow[] = [];
  for (const [date, dayHours] of byDate) {
    dayHours.sort((a, b) => a.hour - b.hour);
    let best: MovingWindow | null = null;
    let run: WeatherHour[] = [];
    const consider = () => {
      if (run.length === 0) return;
      const window = bestWindowInRun(run, date);
      if (window && (best === null || betterWindow(window, best))) best = window;
      run = [];
    };
    for (const h of dayHours) {
      if (hourIsUsable(h)) run.push(h);
      else consider();
    }
    consider();
    if (best !== null) windows.push(best);
  }
  return windows;
}

/** Current wall-clock time in the forecast timezone, as "YYYY-MM-DDTHH:00". */
function helsinkiNowStamp(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Helsinki",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const value = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}T${value("hour")}:00`;
}

/** Daily scores + hourly rows + best loading window per day, one API call. */
export async function fetchWeatherBundle(lat: number, lon: number, days = 16): Promise<WeatherBundle> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,precipitation_sum,snowfall_sum,wind_gusts_10m_max");
  url.searchParams.set("hourly", "temperature_2m,precipitation,snowfall,wind_gusts_10m");
  url.searchParams.set("forecast_days", String(days));
  url.searchParams.set("timezone", "Europe/Helsinki");

  const res = await fetch(url, { next: { revalidate: 900 } });
  if (!res.ok) throw new Error(`Weather service returned ${res.status}`);
  const data = (await res.json()) as { daily?: OpenMeteoDaily; hourly?: OpenMeteoHourly };
  if (!data.daily?.time) throw new Error("Weather service returned no daily data");

  const hours = data.hourly?.time ? toWeatherHours(data.hourly) : [];
  // Windows never look backwards: at 15:00 the best window today starts now,
  // not at a dry morning that already happened.
  const upcoming = hours.filter((h) => h.time >= helsinkiNowStamp());
  const windows = upcoming.length > 0 ? bestWindowsByDay(upcoming) : [];
  return {
    days: toWeatherDays(data.daily).map((day) => ({
      ...day,
      bestWindow: windows.find((w) => w.date === day.date) ?? null,
    })),
    hours,
    windows,
  };
}

/** Live 16-day forecast scored for moving conditions. Server-side only. */
export async function fetchWeatherDays(lat: number, lon: number, days = 16): Promise<WeatherDay[]> {
  return (await fetchWeatherBundle(lat, lon, days)).days;
}
