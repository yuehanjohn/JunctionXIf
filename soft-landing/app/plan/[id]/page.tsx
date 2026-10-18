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
  Truck,
  Wind,
} from "lucide-react";
import { Badge, Button, Card, CardTitle, cx } from "@/components/ui";
import { CONTENTS_VALUE, euro, euroCents } from "@/lib/pricing";
import { ensureSeededPlan, getPlan, type PlanSeed } from "@/lib/store";
import { fetchWeatherBundle, type WeatherBundle } from "@/lib/weather";
import type { WeatherHour } from "@/lib/types";
import { PlanTasks } from "./plan-tasks";

// Reads the plan store + scored weather per request.
export const instant = false;

const fmtHour = (hour: number) => `${String(hour).padStart(2, "0")}:00`;

// Same tone classes as the score dots on the search results.
function hourTone(label: WeatherHour["label"]) {
  return label === "good" ? "bg-emerald-600" : label === "ok" ? "bg-amber-500" : "bg-red-600";
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
          We couldn’t find that moving plan
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

type PlanSearchParams = Record<string, string | string[] | undefined>;

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// "Open the checklist" from the search results links to /plan/s with the search
// context as query params; the plan is then created (idempotently) from them.
function seedFromSearchParams(sp: PlanSearchParams): PlanSeed | null {
  const fromName = firstParam(sp.from);
  const toName = firstParam(sp.to);
  const moveDate = firstParam(sp.date);
  const homeSize = firstParam(sp.size);
  const fromLat = Number(firstParam(sp.fromLat));
  const fromLon = Number(firstParam(sp.fromLon));
  const toLat = Number(firstParam(sp.toLat));
  const toLon = Number(firstParam(sp.toLon));
  if (!fromName || !toName || !homeSize || !moveDate || !DATE_PATTERN.test(moveDate)) return null;
  if (![fromLat, fromLon, toLat, toLon].every(Number.isFinite)) return null;
  return { fromName, fromLat, fromLon, toName, toLat, toLon, moveDate, homeSize };
}

export default async function PlanPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<PlanSearchParams>;
}) {
  await connection();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const isDemo = id === "demo";
  let plan = getPlan(id);
  if (!plan && id === "s") {
    const seed = seedFromSearchParams(sp);
    if (seed) plan = ensureSeededPlan(seed);
  }
  if (!plan) return <EmptyPlan />;

  let bundle: WeatherBundle | null = null;
  try {
    bundle = await fetchWeatherBundle(plan.toLat, plan.toLon, 16);
  } catch {
    bundle = null; // the checklist works without weather
  }
  const weather = bundle?.days ?? null;
  const weekDays = weather?.slice(0, 7) ?? null; // the grid shows one week
  const bestDay = weekDays?.reduce((best, day) => (day.score > best.score ? day : best));
  const moveDay = weather?.find((day) => day.date === plan.moveDate) ?? null;
  const riskyMoveDay = moveDay && moveDay.label === "risky" ? moveDay : null;
  const alternativeDay =
    riskyMoveDay && weather && weather.length > 1
      ? weather
          .filter((day) => day.date !== plan.moveDate)
          .reduce((best, day) => (day.score > best.score ? day : best))
      : null;
  const moveHours =
    bundle?.hours.filter(
      (h) => h.time.slice(0, 10) === plan.moveDate && h.hour >= 8 && h.hour <= 20
    ) ?? [];
  const moveWindow = bundle?.windows.find((w) => w.date === plan.moveDate) ?? null;

  // Booking context: contents value only resolves for canonical home sizes,
  // so hand-typed or legacy plans fall back to the generic coverage card.
  const bookingContents = plan.booking
    ? ((CONTENTS_VALUE as Record<string, number | undefined>)[plan.homeSize] ?? null)
    : null;
  const bookingSearchHref =
    plan.booking && bookingContents !== null
      ? `/search?${new URLSearchParams({
          fromName: plan.fromName,
          fromLat: String(plan.fromLat),
          fromLon: String(plan.fromLon),
          toName: plan.toName,
          toLat: String(plan.toLat),
          toLon: String(plan.toLon),
          date: plan.moveDate,
          size: plan.homeSize,
        })}`
      : null;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header>
        <p className="text-sm text-text-muted">{isDemo ? "Example plan" : "Your moving plan"}</p>
        {isDemo && (
          <p className="mt-2 max-w-prose text-sm leading-relaxed text-text-muted">
            This is a filled-in sample so you can see how a plan reads. Run your
            own search and your checklist will be paced around your real dates
            and addresses.
          </p>
        )}
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
          {plan.booking && (
            <Badge tone="good">
              <Truck className="h-3.5 w-3.5" />
              Crew held · {plan.booking.moverName} · {euro(plan.booking.price)}
            </Badge>
          )}
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

            {weekDays ? (
              <>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                  {weekDays.map((day) => (
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
                  {weekDays.some((day) => day.date === plan.moveDate)
                    ? "Highlighted card is your moving day. "
                    : moveDay
                      ? "Your moving day is beyond the week above — its hour-by-hour outlook is below. "
                      : "Your moving day is outside the 16-day forecast — check back closer to it. "}
                  Scores weigh ice, wind and rain — the things that make
                  carrying boxes hard.
                </p>
                {moveHours.length > 0 && (
                  <div className="mt-6 border-t border-border pt-5">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <CardTitle>Moving-day hours · 08:00–20:00</CardTitle>
                      {moveWindow && (
                        <p className="text-sm text-text-muted">
                          Best stretch{" "}
                          <span className="font-medium text-foreground">
                            {fmtHour(moveWindow.startHour)}–{fmtHour(moveWindow.endHour)}
                          </span>{" "}
                          is outlined.
                        </p>
                      )}
                    </div>
                    <div className="mt-4 flex gap-1.5">
                      {moveHours.map((h) => {
                        const inBest =
                          moveWindow !== null &&
                          h.hour >= moveWindow.startHour &&
                          h.hour < moveWindow.endHour;
                        return (
                          <div
                            key={h.time}
                            title={`${fmtHour(h.hour)} · ${Math.round(h.t)}°C · ${h.precip.toFixed(1)} mm · gusts ${Math.round((h.gust / 3.6) * 10) / 10} m/s`}
                            className={cx(
                              "min-w-0 flex-1 rounded-md border px-1 py-1.5 text-center",
                              inBest ? "border-primary" : "border-border"
                            )}
                          >
                            <span
                              className={cx("mx-auto block h-2 w-full max-w-6 rounded-full", hourTone(h.label))}
                            />
                            <span className="tnum mt-1 block text-[11px] leading-none text-text-muted">
                              {fmtHour(h.hour)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <p className="mt-3 text-xs text-text-muted">
                      <span className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-600" />
                      dry &amp; calm
                      <span className="mx-1 inline-block h-2 w-2 rounded-full bg-amber-500" />
                      usable
                      <span className="mx-1 inline-block h-2 w-2 rounded-full bg-red-600" />
                      risky.{" "}
                      {moveWindow
                        ? "The outlined stretch is the best ≥3 h window that day."
                        : "No dry ≥3 h window that day — start in the morning and watch the forecast."}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <p className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-3 text-sm text-text-muted">
                <CloudOff className="h-4 w-4" />
                The weather outlook couldn’t load just now. It will be back on your
                next visit — your checklist doesn’t depend on it.
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
                        })} looks like the calmest day ahead.`
                      : "laying grit and keeping a thermos of hot drinks goes a long way."}
                  </p>
                </div>
              </div>
            </Card>
          )}

          <PlanTasks
            planId={plan.id}
            initialItems={plan.checklist}
          />
        </div>

        <aside className="space-y-6">
          {plan.booking && bookingContents !== null ? (
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="mt-0.5 rounded-lg bg-accent/10 p-2.5">
                  <ShieldCheck className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <CardTitle>Your crew and your cover</CardTitle>
                  <p className="mt-1 text-sm leading-relaxed text-text-muted">
                    <span className="font-medium text-foreground">{plan.booking.moverName}</span>{" "}
                    is held at{" "}
                    <span className="tnum font-medium text-foreground">{euro(plan.booking.price)}</span>{" "}
                    for{" "}
                    {formatDay(plan.moveDate, {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                    .
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-text-muted">
                    Your ~{euro(bookingContents)} of contents are insured at both addresses on
                    moving day — transit is included as standard, not an upsell. The cover
                    then moves into the new home with you.
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-text-muted">
                    If Home Insurance for the new home was quoted at{" "}
                    <span className="tnum font-medium text-foreground">
                      {euroCents(plan.booking.insuranceMonthly)}/mo
                    </span>{" "}
                    when you held the crew.{" "}
                    {bookingSearchHref && (
                      <Link href={bookingSearchHref} className="font-medium text-accent hover:underline">
                        Adjust the quote
                      </Link>
                    )}
                  </p>
                </div>
              </div>
            </Card>
          ) : (
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
          )}
        </aside>
      </div>
    </main>
  );
}
