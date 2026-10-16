import { connection } from "next/server";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CloudOff,
  Droplets,
  Home,
  PackageOpen,
  ShieldCheck,
  Snowflake,
  Sparkles,
  TriangleAlert,
  Wind,
} from "lucide-react";
import { Badge, Button, Card, CardTitle, cx } from "@/components/ui";
import { labelForScore, scoreWeatherDay } from "@/lib/scoring";
import { getPlan } from "@/lib/store";
import type { WeatherDay } from "@/lib/types";
import { PlanTasks } from "./plan-tasks";

// Reads the in-memory plan store + live weather per request.
export const instant = false;

type OpenMeteoDaily = {
  time?: string[];
  temperature_2m_max?: number[];
  temperature_2m_min?: number[];
  precipitation_sum?: number[];
  snowfall_sum?: number[];
  wind_gusts_10m_max?: number[];
};

// Same Open-Meteo request shape as GET /api/weather, reused server-side so the
// dashboard renders with fresh data instead of fetching its own API route.
async function fetchWeatherDays(
  lat: number,
  lon: number,
  days: number
): Promise<WeatherDay[] | null> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set(
    "daily",
    "temperature_2m_max,temperature_2m_min,precipitation_sum,snowfall_sum,wind_gusts_10m_max"
  );
  url.searchParams.set("forecast_days", String(days));
  url.searchParams.set("timezone", "Europe/Helsinki");

  try {
    const res = await fetch(url, { next: { revalidate: 900 } });
    if (!res.ok) return null;
    const data = (await res.json()) as { daily?: OpenMeteoDaily };
    const time = data.daily?.time ?? [];
    if (time.length === 0) return null;
    return time.map((date, i) => {
      const tMax = data.daily?.temperature_2m_max?.[i] ?? 0;
      const tMin = data.daily?.temperature_2m_min?.[i] ?? 0;
      const precip = data.daily?.precipitation_sum?.[i] ?? 0;
      const snow = data.daily?.snowfall_sum?.[i] ?? 0;
      const gust = data.daily?.wind_gusts_10m_max?.[i] ?? 0;
      const score = scoreWeatherDay({ tMax, tMin, precip, snow, gust });
      return { date, tMax, tMin, precip, snow, gust, score, label: labelForScore(score) };
    });
  } catch {
    return null;
  }
}

function formatDay(dateStr: string, opts?: Intl.DateTimeFormatOptions): string {
  return new Date(`${dateStr}T12:00:00Z`).toLocaleDateString("en-GB", {
    timeZone: "Europe/Helsinki",
    ...opts,
  });
}

function EmptyPlan() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col justify-center px-6 py-16">
      <Card className="p-10 text-center">
        <PackageOpen className="mx-auto h-10 w-10 text-text-muted" strokeWidth={1.5} />
        <h1 className="mt-4 font-display text-2xl font-semibold text-foreground">
          We couldn't find that moving plan
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-text-muted">
          The link may be off by a character, or the plan has moved on. Starting a
          new plan takes a minute — your checklist and weather outlook will be
          ready when you are.
        </p>
        <Link href="/onboarding" className="mt-6 inline-flex">
          <Button>Start a new plan</Button>
        </Link>
      </Card>
    </main>
  );
}

export default async function PlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await connection();
  const plan = getPlan(id);
  if (!plan) return <EmptyPlan />;

  const weather = await fetchWeatherDays(plan.toLat, plan.toLon, 7);
  const bestDay = weather?.reduce((best, day) => (day.score > best.score ? day : best));
  const moveDay = weather?.find((day) => day.date === plan.moveDate) ?? null;
  const riskyMoveDay = moveDay && moveDay.label === "risky" ? moveDay : null;
  const alternativeDay =
    riskyMoveDay && weather && weather.length > 1
      ? weather
          .filter((day) => day.date !== plan.moveDate)
          .reduce((best, day) => (day.score > best.score ? day : best))
      : null;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header>
        <p className="text-sm text-text-muted">Your moving plan</p>
        <h1 className="mt-1 flex flex-wrap items-center gap-3 font-display text-3xl font-semibold text-foreground">
          {plan.fromName}
          <ArrowRight className="h-6 w-6 text-text-muted" />
          {plan.toName}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-text-muted">
          <Badge tone="neutral">
            <CalendarDays className="h-3.5 w-3.5" />
            {formatDay(plan.moveDate, { weekday: "long", day: "numeric", month: "long" })}
          </Badge>
          <Badge tone="neutral">
            <Home className="h-3.5 w-3.5" />
            {plan.homeSize}
          </Badge>
        </div>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>Weather this week in {plan.toName}</CardTitle>
              {bestDay && (
                <p className="text-sm text-text-muted">
                  <Sparkles className="mr-1 inline h-4 w-4 text-accent" />
                  Best day this week:{" "}
                  <span className="font-medium text-foreground">
                    {formatDay(bestDay.date, { weekday: "long", day: "numeric", month: "short" })}
                  </span>{" "}
                  <Badge tone={bestDay.label} className="ml-1">
                    {bestDay.label}
                  </Badge>
                </p>
              )}
            </div>

            {weather ? (
              <>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                  {weather.map((day) => (
                    <div
                      key={day.date}
                      className={cx(
                        "rounded-lg border p-3",
                        day.date === plan.moveDate ? "border-primary/50" : "border-border"
                      )}
                    >
                      <p className="text-xs font-medium uppercase text-text-muted">
                        {formatDay(day.date, { weekday: "short" })}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        {Math.round(day.tMax)}°{" "}
                        <span className="font-normal text-text-muted">
                          {Math.round(day.tMin)}°
                        </span>
                      </p>
                      <ul className="mt-2 space-y-1 text-xs text-text-muted">
                        <li className="flex items-center gap-1">
                          <Droplets className="h-3 w-3" />
                          {day.precip.toFixed(1)} mm
                        </li>
                        <li className="flex items-center gap-1">
                          <Snowflake className="h-3 w-3" />
                          {day.snow.toFixed(1)} cm
                        </li>
                        <li className="flex items-center gap-1">
                          <Wind className="h-3 w-3" />
                          {Math.round(day.gust)} km/h
                        </li>
                      </ul>
                      <div className="mt-2 flex items-center justify-between">
                        <Badge tone={day.label}>{day.label}</Badge>
                        <span className="text-xs text-text-muted">{day.score}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-text-muted">
                  {weather.some((day) => day.date === plan.moveDate)
                    ? "Highlighted card is your moving day. "
                    : "Your moving day is outside the 7-day forecast — check back closer to it. "}
                  Scores weigh ice, wind and rain — the things that make
                  carrying boxes hard.
                </p>
              </>
            ) : (
              <p className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-3 text-sm text-text-muted">
                <CloudOff className="h-4 w-4" />
                The weather outlook couldn't load just now. It will be back on your
                next visit — your checklist doesn't depend on it.
              </p>
            )}
          </Card>

          {riskyMoveDay && (
            <Card className="border-amber-200 bg-amber-50/60 p-6">
              <div className="flex items-start gap-4">
                <div className="mt-0.5 rounded-lg bg-amber-100 p-2.5">
                  <TriangleAlert className="h-5 w-5 text-amber-700" />
                </div>
                <div>
                  <CardTitle>Your moving day looks slippery</CardTitle>
                  <p className="mt-1 text-sm leading-relaxed text-foreground/80">
                    {formatDay(riskyMoveDay.date, {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}{" "}
                    shows {riskyMoveDay.snow > 0 ? "snow" : "rain"} and near-freezing
                    temperatures — sidewalks, stairs and loading zones turn to ice.
                    No need to worry:{" "}
                    {alternativeDay
                      ? `if you can shift the boxes, ${formatDay(alternativeDay.date, {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        })} looks like the calmest day this week.`
                      : "laying grit and keeping a thermos of hot drinks goes a long way."}
                  </p>
                </div>
              </div>
            </Card>
          )}

          <PlanTasks
            planId={plan.id}
            moveDate={plan.moveDate}
            initialItems={plan.checklist}
          />
        </div>

        <aside className="space-y-6">
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="mt-0.5 rounded-lg bg-accent/10 p-2.5">
                <ShieldCheck className="h-5 w-5 text-accent" />
              </div>
              <div>
                <CardTitle>Your things travel covered</CardTitle>
                <p className="mt-1 text-sm leading-relaxed text-text-muted">
                  On moving day your home insurance goes with you — boxes,
                  furniture and the fragile things are covered while they travel
                  between your old home and the new one.
                </p>
                <p className="mt-3 text-sm leading-relaxed text-text-muted">
                  One habit prevents most of the damage:{" "}
                  <span className="font-medium text-foreground">
                    wrap fragile items in towels and blankets.
                  </span>{" "}
                  Roughly one in five movers reports something broken or missing —
                  a soft layer around dishes and glassware is the simplest way to
                  stay out of that group.
                </p>
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </main>
  );
}
