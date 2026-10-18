"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Lock,
  ShieldCheck,
  Star,
  Timer,
  Umbrella,
  X,
} from "lucide-react";
import { Button, Input } from "@/components/ui";
import { MOVERS, SERVICE_LABELS, type Mover, type MoverService } from "@/lib/movers";
import {
  BUILD_ERAS,
  DEFAULT_PROFILE,
  DEDUCTIBLES,
  HOME_INSURANCE,
  HOME_TYPES,
  bestDay,
  euro,
  euroCents,
  homeInsurancePricing,
  missingServices,
  quote,
  slotsLeft,
  type BuildEra,
  type Deductible,
  type HomeProfile,
  type HomeSize,
  type Quote,
} from "@/lib/pricing";
import type { Booking, WeatherDay } from "@/lib/types";

// If P&C Insurance brand: circle-mark blue sampled from if.fi's own logo asset,
// and the direct link to the home-insurance product section on if.fi.
const IF_BLUE = "#0054F0";
const IF_HOME_INSURANCE_URL =
  "https://www.if.fi/henkiloasiakkaat/vakuutukset/kotivakuutus";

export type SearchQuery = {
  from: { name: string; lat: number; lon: number };
  to: { name: string; lat: number; lon: number };
  date: string;
  size: HomeSize;
  services: MoverService[];
};

type SortKey = "price" | "rating" | "damage";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "price", label: "Cheapest" },
  { key: "rating", label: "Top rated" },
  { key: "damage", label: "Fewest damage claims" },
];

const fmtDay = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short" });
const fmtShort = new Intl.DateTimeFormat("en-GB", { weekday: "short" });
const fmtDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
const fmtHour = (hour: number) => `${String(hour).padStart(2, "0")}:00`;

function scoreTone(label: WeatherDay["label"]) {
  return label === "good" ? "bg-emerald-600" : label === "ok" ? "bg-amber-500" : "bg-red-600";
}

function damageTone(rate: number) {
  return rate <= 0.5 ? "text-emerald-700" : rate <= 1.2 ? "text-amber-700" : "text-red-700";
}

function Segmented({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="kicker">{label}</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
            className={
              "rounded-md border px-2.5 py-1 text-xs transition-colors " +
              (value === o.value
                ? "border-primary bg-primary text-white"
                : "border-border bg-card text-foreground hover:border-text-muted")
            }
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SearchClient({ query, weather }: { query: SearchQuery; weather: WeatherDay[] }) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = React.useState(query.date);
  const [sort, setSort] = React.useState<SortKey>("price");
  const [chosenId, setChosenId] = React.useState<string | null>(null);

  // Keep local state in sync when the URL date changes (browser back/forward).
  // Render-phase adjustment — the documented alternative to a sync effect.
  const [lastUrlDate, setLastUrlDate] = React.useState(query.date);
  if (lastUrlDate !== query.date) {
    setLastUrlDate(query.date);
    setSelectedDate(query.date);
  }

  // Day clicks update the URL date — every price, saving and warning on this
  // page recomputes for the new day — while local state keeps clicks instant.
  function selectDate(date: string) {
    setSelectedDate(date);
    const params = new URLSearchParams({
      fromName: query.from.name,
      fromLat: String(query.from.lat),
      fromLon: String(query.from.lon),
      toName: query.to.name,
      toLat: String(query.to.lat),
      toLon: String(query.to.lon),
      date,
      size: query.size,
      services: query.services.join(","),
    });
    router.push(`/search?${params.toString()}`, { scroll: false });
  }

  // Checklist follows the search — and the day the visitor actually picked.
  function planHrefFor(date: string) {
    return `/plan/s?${new URLSearchParams({
      from: query.from.name,
      fromLat: String(query.from.lat),
      fromLon: String(query.from.lon),
      to: query.to.name,
      toLat: String(query.to.lat),
      toLon: String(query.to.lon),
      date,
      size: query.size,
    })}`;
  }
  const planHref = planHrefFor(selectedDate);

  const scoreFor = React.useCallback(
    (date: string) => weather.find((d) => d.date === date)?.score,
    [weather]
  );

  const quotes = React.useMemo(() => {
    const map = new Map<string, Quote>();
    for (const mover of MOVERS) {
      map.set(
        mover.id,
        quote(mover, {
          from: query.from,
          to: query.to,
          homeSize: query.size,
          date: selectedDate,
          services: query.services,
          dayScore: scoreFor(selectedDate),
        })
      );
    }
    return map;
  }, [query, selectedDate, scoreFor]);

  const best = React.useMemo(() => bestDay(weather, query.date), [weather, query.date]);

  // Keep the strip honest: the best day is centered on load, the picked day
  // follows clicks — no manual scrolling to find the recommendation.
  const stripRef = React.useRef<HTMLDivElement | null>(null);
  const userPicked = React.useRef(false);
  const centerDay = React.useCallback((date: string, smooth: boolean) => {
    const strip = stripRef.current;
    const el = strip?.querySelector<HTMLElement>(`[data-date="${date}"]`);
    if (strip && el) {
      strip.scrollTo({
        left: el.offsetLeft - strip.clientWidth / 2 + el.clientWidth / 2,
        behavior: smooth ? "smooth" : "auto",
      });
    }
  }, []);
  const bestDate = best?.date;
  React.useEffect(() => {
    if (!bestDate) return;
    // Center now, then again once layout/fonts settle — measuring before
    // first paint can leave the best day clipped at the strip's right edge.
    centerDay(bestDate, false);
    const raf = requestAnimationFrame(() => centerDay(bestDate, false));
    const settle = window.setTimeout(() => centerDay(bestDate, false), 150);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(settle);
    };
  }, [bestDate, centerDay]);
  React.useEffect(() => {
    if (!userPicked.current) {
      userPicked.current = true;
      return;
    }
    centerDay(selectedDate, true);
  }, [selectedDate, centerDay]);

  // Slot availability per operator for the picked day — deterministic, so the
  // server render and hydration always agree.
  const slotsByMover = React.useMemo(() => {
    const out: Record<string, number> = {};
    for (const mover of MOVERS) out[mover.id] = slotsLeft(mover, selectedDate);
    return out;
  }, [selectedDate]);

  const cheapestToday = React.useMemo(
    () =>
      Math.min(
        ...MOVERS.filter((m) => (slotsByMover[m.id] ?? 0) > 0).map(
          (m) => quotes.get(m.id)?.total ?? Infinity
        )
      ),
    [quotes, slotsByMover]
  );

  // Skyscanner mechanic: every day in the strip carries the cheapest total any
  // operator with open slots quotes for it — price points, scarcity, all live.
  const priceByDay = React.useMemo(() => {
    const prices: Record<string, number> = {};
    const full: Record<string, boolean> = {};
    for (const day of weather) {
      let min = Infinity;
      for (const mover of MOVERS) {
        if (slotsLeft(mover, day.date) === 0) continue;
        const t = quote(mover, {
          from: query.from,
          to: query.to,
          homeSize: query.size,
          date: day.date,
          services: query.services,
          dayScore: day.score,
        }).total;
        if (t < min) min = t;
      }
      if (Number.isFinite(min)) prices[day.date] = min;
      else full[day.date] = true;
    }
    return { prices, full };
  }, [weather, query]);
  const fullByDay = priceByDay.full;

  // Cheapest day to move (price-led); the best-weather day stays a separate,
  // honest recommendation in the header.
  const cheapestDay = React.useMemo(() => {
    let out: { date: string; price: number } | null = null;
    for (const day of weather) {
      if (day.date < query.date) continue;
      const price = priceByDay.prices[day.date];
      if (price === undefined) continue;
      if (!out || price < out.price) out = { date: day.date, price };
    }
    return out;
  }, [weather, priceByDay, query.date]);
  const cheapestSavings =
    cheapestDay &&
    cheapestDay.date !== selectedDate &&
    Number.isFinite(cheapestToday)
      ? cheapestToday - cheapestDay.price
      : null;
  // Weather-led fallback: only shown when the picked day is already the
  // cheapest, so the visitor never sees two competing savings claims.
  const bestPrice = best ? priceByDay.prices[best.date] : undefined;
  const bestSavings =
    best &&
    bestPrice !== undefined &&
    best.date !== selectedDate &&
    Number.isFinite(cheapestToday)
      ? cheapestToday - bestPrice
      : null;

  const outOfForecast =
    weather.length > 0 &&
    (selectedDate < weather[0].date || selectedDate > weather[weather.length - 1].date);

  const ranked = React.useMemo(() => {
    const rows = MOVERS.map((mover) => ({
      mover,
      quote: quotes.get(mover.id)!,
      slots: slotsByMover[mover.id] ?? 0,
    }));
    const by = (a: (typeof rows)[number], b: (typeof rows)[number]) => {
      if (sort === "price") return a.quote.total - b.quote.total;
      if (sort === "rating") return b.mover.rating - a.mover.rating;
      return a.mover.damageRate - b.mover.damageRate;
    };
    // Sold-out crews drop below every open one, like a sold-out flight.
    const open = rows.filter((r) => r.slots > 0).sort(by);
    const full = rows.filter((r) => r.slots === 0).sort(by);
    return [...open, ...full];
  }, [quotes, sort, slotsByMover]);

  const chosenMover = chosenId ? (MOVERS.find((m) => m.id === chosenId) ?? null) : null;
  const chosenQuote = chosenId ? (quotes.get(chosenId) ?? null) : null;

  // Lead capture for the home-insurance recommendation below the results.
  const [email, setEmail] = React.useState("");
  const [sent, setSent] = React.useState(false);

  // Personalised quote inputs — every change recomputes the premium instantly.
  const [profile, setProfile] = React.useState<HomeProfile>(DEFAULT_PROFILE);

  // Holding a crew books it into the checklist plan; the day it was held for
  // is pinned so the "open the checklist" hand-off lands on the right plan.
  const [bookedDate, setBookedDate] = React.useState<string | null>(null);
  const [bookingError, setBookingError] = React.useState<string | null>(null);
  async function choose(mover: Mover, q: Quote) {
    setChosenId(mover.id);
    setBookedDate(selectedDate);
    setBookingError(null);
    const booking: Booking = {
      moverId: mover.id,
      moverName: mover.name,
      price: q.total,
      insuranceMonthly: homeInsurancePricing(query.size, profile).monthly,
      heldAt: new Date().toISOString(),
    };
    try {
      const res = await fetch("/api/plan/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seed: {
            fromName: query.from.name,
            fromLat: query.from.lat,
            fromLon: query.from.lon,
            toName: query.to.name,
            toLat: query.to.lat,
            toLon: query.to.lon,
            moveDate: selectedDate,
            homeSize: query.size,
          },
          booking,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch {
      setBookingError(
        "Couldn't sync the booking to your checklist — the comparison still works; open the checklist from the day you booked."
      );
    }
  }

  // The If promotion stays hidden: one quiet, neutral row the user opens on
  // their own — no scroll hijack, no banner. Choosing a crew is the one
  // deliberate exception: it opens and leads to the cover section, since that
  // is the natural next decision after picking a mover.
  const [offerOpen, setOfferOpen] = React.useState(false);
  // null = not running; 0..2 = current "calculating" step; the panel itself
  // only mounts once the sequence finishes, then we scroll straight to it.
  const [calcStep, setCalcStep] = React.useState<number | null>(null);
  const offerRef = React.useRef<HTMLElement | null>(null);
  const hadChoice = React.useRef(false);
  React.useEffect(() => {
    if (!chosenId || hadChoice.current) return;
    hadChoice.current = true;
    setOfferOpen(true);
    setCalcStep(0);
  }, [chosenId]);
  React.useEffect(() => {
    if (calcStep === null) return;
    const t = setTimeout(
      () => setCalcStep((s) => (s === null || s + 1 >= 3 ? null : s + 1)),
      1000
    );
    return () => clearTimeout(t);
  }, [calcStep]);
  // Scroll to the insurance slot as soon as the calculating placeholder mounts
  // — the animation plays where the panel will appear, then the panel takes
  // its place. Scrolling in the same tick as setOfferOpen(true) would land on
  // the quiet row above it.
  React.useEffect(() => {
    if (!chosenId || !offerOpen) return;
    // Anchor the insurance slot to the viewport top on the placeholder's
    // mount frame, at every animation step, and on the placeholder→panel
    // swap: the panel is much taller than the placeholder, and the browser's
    // scroll anchoring would otherwise leave it half off-screen. Instant
    // scrollIntoView completes synchronously, so the placeholder's unmount
    // can't cancel it.
    offerRef.current?.scrollIntoView({ block: "start" });
  }, [chosenId, offerOpen, calcStep]);
  const offerPricing = homeInsurancePricing(query.size, profile);
  const greenDay = weather.find((d) => d.date === selectedDate)?.label === "good";

  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <header className="border-b border-border bg-card">
        <div className="mx-auto w-full max-w-6xl px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              New search
            </Link>
            <Link
              href={planHref}
              className="inline-flex items-center gap-2 rounded-md border border-accent/30 bg-accent/10 px-3.5 py-2 text-base font-semibold text-accent transition-colors hover:bg-accent/20"
            >
              Open the checklist
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
          <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
              {query.from.name} → {query.to.name}
            </h1>
            <span className="text-sm text-text-muted">
              {fmtDay.format(new Date(`${selectedDate}T12:00:00Z`))} · {query.size}
              {query.services.length > 0 && ` · ${query.services.map((s) => SERVICE_LABELS[s]).join(", ")}`}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        {/* Weather day picker */}
        <section aria-label="Moving conditions by day">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="kicker">Moving conditions · next 16 days at destination</h2>
            <p className="text-xs text-text-muted">
              {best && (
                <button
                  onClick={() => selectDate(best.date)}
                  className="group transition-colors hover:text-foreground"
                >
                  Best day:{" "}
                  <span className="font-semibold text-accent group-hover:underline">
                    {fmtDay.format(new Date(`${best.date}T12:00:00Z`))}
                  </span>
                </button>
              )}
              {best && cheapestDay && " · "}
              {cheapestDay && (
                <button
                  onClick={() => selectDate(cheapestDay.date)}
                  className="group transition-colors hover:text-foreground"
                >
                  Cheapest:{" "}
                  <span className="font-semibold text-accent group-hover:underline">
                    {fmtDay.format(new Date(`${cheapestDay.date}T12:00:00Z`))} · from{" "}
                    {euro(cheapestDay.price)}
                  </span>
                </button>
              )}
            </p>
          </div>
          {weather.length > 0 ? (
            <div ref={stripRef} className="relative mt-3 flex gap-2 overflow-x-auto pb-2">
              {weather.map((day) => {
                const active = day.date === selectedDate;
                const price = priceByDay.prices[day.date];
                const isCheapest = cheapestDay?.date === day.date;
                return (
                  <button
                    key={day.date}
                    data-date={day.date}
                    aria-pressed={active}
                    onClick={() => selectDate(day.date)}
                    className={
                      "w-24 shrink-0 rounded-md border p-2 text-left transition-colors " +
                      (active
                        ? "border-primary bg-primary text-white"
                        : "border-border bg-card hover:border-text-muted")
                    }
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">{fmtShort.format(new Date(`${day.date}T12:00:00Z`))}</span>
                      <span className="flex items-center gap-1">
                        {isCheapest && (
                          <span
                            title="Cheapest day in the window"
                            className={"text-[10px] font-bold " + (active ? "text-white" : "text-accent")}
                          >
                            €
                          </span>
                        )}
                        {best?.date === day.date && (
                          <Star className={"h-3 w-3 " + (active ? "fill-white text-white" : "fill-accent text-accent")} />
                        )}
                      </span>
                    </div>
                    <div className={"tnum text-xs " + (active ? "text-white/70" : "text-text-muted")}>
                      {fmtDate.format(new Date(`${day.date}T12:00:00Z`))}
                    </div>
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${scoreTone(day.label)}`} />
                      <span className="tnum text-xs font-semibold">{day.score}</span>
                    </div>
                    {price !== undefined ? (
                      <div className={"tnum mt-1 text-[11px] font-semibold " + (active ? "text-white" : "text-accent")}>
                        from {euro(price)}
                      </div>
                    ) : (
                      <div className={"mt-1 text-[11px] font-medium " + (active ? "text-white/70" : "text-text-muted")}>
                        Fully booked
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="mt-3 text-sm text-text-muted">
              Forecast unavailable — prices below exclude weather adjustments.
            </p>
          )}
          {outOfForecast && (
            <p className="mt-2 flex items-start gap-2 rounded-md border border-border bg-card p-3 text-sm leading-relaxed text-text-muted">
              <Umbrella className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <span>
                <strong className="text-foreground">
                  {fmtDay.format(new Date(`${selectedDate}T12:00:00Z`))} is{" "}
                  {selectedDate > weather[weather.length - 1].date ? "beyond" : "outside"} the
                  16-day forecast
                </strong>{" "}
                — prices are final, weather check opens closer to the day.
              </span>
            </p>
          )}
          {cheapestSavings !== null && cheapestSavings > 0 && cheapestDay && (
            <p className="mt-2 flex items-center gap-2 text-sm">
              <Umbrella className="h-4 w-4 text-accent" />
              <span>
                Cheapest day:{" "}
                <button
                  onClick={() => selectDate(cheapestDay.date)}
                  className="group transition-colors hover:text-foreground"
                >
                  <strong className="text-accent group-hover:underline">
                    {fmtDay.format(new Date(`${cheapestDay.date}T12:00:00Z`))}
                  </strong>
                </button>{" "}
                — moving then saves{" "}
                <strong className="tnum text-accent">{euro(cheapestSavings)}</strong> on the
                same crew (no weekend factor)
                {best?.date === cheapestDay.date && " — and it has the best conditions in the window"}.
              </span>
            </p>
          )}
          {cheapestSavings === null && bestSavings !== null && bestSavings > 0 && best && (
            <p className="mt-2 flex items-center gap-2 text-sm">
              <Umbrella className="h-4 w-4 text-accent" />
              Moving on{" "}
              <strong>
                {fmtDay.format(new Date(`${best.date}T12:00:00Z`))}
              </strong>{" "}
              instead saves{" "}
              <strong className="tnum text-accent">{euro(bestSavings)}</strong> on the cheapest
              crew — better conditions, no weekend factor.
            </p>
          )}
          {(() => {
            const sel = weather.find((d) => d.date === selectedDate);
            if (!sel || sel.label !== "risky") return null;
            return (
              <p className="mt-2 flex items-start gap-2 rounded-md border border-orange-200 bg-orange-50 p-3 text-sm leading-relaxed text-orange-900">
                <Umbrella className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  <strong>Risky moving day — conditions {sel.score}/100.</strong> Icy
                  loading zones mean the winter-handling fees you see below and a
                  higher chance of something breaking. Ask whether the crew you
                  pick moves bookings to a safer day at no cost if the forecast
                  worsens.
                </span>
              </p>
            );
          })()}
          {(() => {
            const sel = weather.find((d) => d.date === selectedDate);
            if (!sel) return null;
            const win = sel.bestWindow;
            if (win) {
              return (
                <p className="mt-2 flex items-center gap-2 text-sm">
                  <Timer className="h-4 w-4 shrink-0 text-accent" />
                  <span>
                    Best loading window{" "}
                    <strong>{fmtDay.format(new Date(`${win.date}T12:00:00Z`))}</strong> ·{" "}
                    <strong className="tnum">
                      {fmtHour(win.startHour)}–{fmtHour(win.endHour)}
                    </strong>{" "}
                    · {win.precip.toFixed(1)} mm rain
                    {win.snow > 0 && <> · {win.snow.toFixed(1)} cm snow</>} · gusts up to{" "}
                    {Math.round((win.maxGust / 3.6) * 10) / 10} m/s
                  </span>
                </p>
              );
            }
            // Hourly data loaded (some other day has a window) but not this one —
            // say so honestly and point at the best window in the next 3 days.
            if (!weather.some((d) => d.bestWindow)) return null;
            const limit = new Date(`${selectedDate}T12:00:00Z`);
            limit.setUTCDate(limit.getUTCDate() + 3);
            const limitDate = limit.toISOString().slice(0, 10);
            const alt = weather
              .filter((d) => d.date > selectedDate && d.date <= limitDate && d.bestWindow)
              .map((d) => d.bestWindow!)
              .sort(
                (a, b) =>
                  b.score - a.score ||
                  b.endHour - b.startHour - (a.endHour - a.startHour) ||
                  a.date.localeCompare(b.date)
              )[0];
            if (!alt) return null;
            return (
              <p className="mt-2 flex items-center gap-2 text-sm text-text-muted">
                <Timer className="h-4 w-4 shrink-0" />
                <span>
                  No dry window ≥3 h on{" "}
                  {fmtDay.format(new Date(`${selectedDate}T12:00:00Z`))} — consider{" "}
                  <strong className="text-foreground">
                    {fmtDay.format(new Date(`${alt.date}T12:00:00Z`))} {fmtHour(alt.startHour)}–
                    {fmtHour(alt.endHour)}
                  </strong>{" "}
                  (best of the next 3 days).
                </span>
              </p>
            );
          })()}
        </section>

        {/* Sort tabs */}
        <div className="mt-8 flex gap-1 border-b border-border">
          {SORTS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSort(s.key)}
              className={
                "-mb-px border-b-2 px-4 py-2.5 text-sm transition-colors " +
                (sort === s.key
                  ? "border-accent font-semibold text-foreground"
                  : "border-transparent text-text-muted hover:text-foreground")
              }
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="mt-6 flex flex-col gap-4">
          {ranked.map(({ mover, quote: q, slots }, i) => (
            <MoverCard
              key={mover.id}
              mover={mover}
              quote={q}
              rank={i === 0 && sort === "price" && slots > 0 ? "Cheapest" : null}
              requestedServices={query.services}
              date={selectedDate}
              slots={slots}
              soldOutAlt={
                slots === 0 && cheapestDay && cheapestDay.date !== selectedDate
                  ? {
                      label: fmtDay.format(new Date(`${cheapestDay.date}T12:00:00Z`)),
                      price: cheapestDay.price,
                      onSelect: () => selectDate(cheapestDay.date),
                    }
                  : null
              }
              chosen={chosenId === mover.id}
              onChoose={() => choose(mover, q)}
            />
          ))}
        </div>

        {/* If home insurance — the hidden promotion: invisible until the user has
            discovered the operators and picked a crew; then the cover section
            appears, opens and scrolls into view. Before that moment there is no
            insurance surface at all. */}
        {chosenId && (
        <section aria-label="Home cover for the new home" className="mt-10 [overflow-anchor:none]">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-md border border-border bg-card px-4 py-3 text-sm">
            <span className="flex min-w-0 items-center gap-1.5 text-text-muted">
              <ShieldCheck className="h-4 w-4 shrink-0" style={{ color: IF_BLUE }} />
              {chosenMover && chosenQuote
                ? `${chosenMover.name} held at ${euro(chosenQuote.total)} — the new home still needs cover from the first night.`
                : "The one thing a mover comparison can't include: cover for your things in the new home."}
            </span>
            {greenDay && (
              <span className="text-xs font-medium text-emerald-700">
                Green-day move — €20 off your first year
              </span>
            )}
            <span className="tnum ml-auto text-xs text-text-muted">
              home cover from {euroCents(HOME_INSURANCE.base)}/mo
            </span>
            <button
              type="button"
              aria-expanded={offerOpen}
              onClick={() => setOfferOpen((v) => !v)}
              className="text-xs font-semibold hover:underline"
              style={{ color: IF_BLUE }}
            >
              {offerOpen ? "Hide quote" : "Show quote"}
            </button>
          </div>
          {bookingError && (
            <p className="mt-3 max-w-2xl rounded-md border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
              {bookingError}
            </p>
          )}

          {offerOpen && calcStep !== null && (
          <section
            ref={offerRef}
            aria-label="Calculating the best home insurance"
            className="fade-rise mt-3 scroll-mt-6 rounded-lg border border-border bg-card p-6 md:p-8"
          >
            <div>
              <p className="kicker flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Comparing offers for your new home
              </p>
            </div>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight">
              Calculating the best home insurance for your new home…
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm leading-relaxed">
              {[
                "Scanning vetted home insurers in Finland",
                "Matching cover to your contents value",
                "Applying your moving-day profile and deductible",
              ].map((step, i) => (
                <li
                  key={step}
                  className={
                    "flex items-center gap-2 transition-opacity duration-500 " +
                    (i < calcStep ? "text-foreground" : "text-text-muted opacity-40")
                  }
                >
                  {i < calcStep ? (
                    <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-text-muted" />
                  )}
                  {step}
                </li>
              ))}
            </ul>
          </section>
          )}

          {offerOpen && calcStep === null && (
          <section
            ref={offerRef}
            aria-label="If home insurance for the new home"
            className="fade-rise mt-3 scroll-mt-6 rounded-lg border border-border bg-card p-6 md:p-8"
          >
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/if-logo.png"
                alt="If"
                width={44}
                height={44}
                className="h-11 w-11 shrink-0 rounded-full"
              />
              <p className="kicker flex items-center gap-2" style={{ color: IF_BLUE }}>
                <ShieldCheck className="h-4 w-4" />
                If Home Insurance · for the new home
              </p>
            </div>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight">
              Found the best home insurance for your new home.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-muted">
              {chosenMover && chosenQuote
                ? `You held ${chosenMover.name} at ${euro(chosenQuote.total)}. If Home Insurance takes it from there: your belongings are insured at both addresses on moving day — transit included as standard — and the cover moves into the new home with you.`
                : "Comparing movers is free. The quote for your new home follows the same open rule as every price on this page: a small base plus a fixed amount per started €10 000 of contents. Nothing estimated, nothing buried."}{" "}
              Answer three questions and the premium moves with you — every factor printed.
            </p>
            {bookingError && (
              <p className="mt-3 max-w-2xl rounded-md border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
                {bookingError}
              </p>
            )}

            <div className="mt-6 grid gap-6 md:grid-cols-[1fr_280px]">
              <ul className="space-y-2.5 text-sm leading-relaxed">
                <li className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: IF_BLUE }} />
                  <span>
                    Belongings insured at <strong>both addresses</strong> on moving day —
                    transport included, so nothing falls between the two homes.
                  </span>
                </li>
                <li className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: IF_BLUE }} />
                  <span>
                    Transit included as standard: boxes, furniture and the fragile things
                    are insured between the old home and the new one — no separate
                    transport policy, no upsell.
                  </span>
                </li>
                <li className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: IF_BLUE }} />
                  <span>
                    Water and fire damage — the two most common claims in Finnish homes —
                    covered from the first night in your new place.
                  </span>
                </li>
                <li className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: IF_BLUE }} />
                  <span>
                    Your existing no-claims bonus transfers with you; no new waiting period.
                  </span>
                </li>
              </ul>

              <div className="rounded-md border border-border bg-card p-5">
                <p className="kicker">Your premium</p>
                <p className="tnum mt-1 font-display text-3xl font-semibold">
                  {euroCents(offerPricing.monthly)}
                  <span className="text-base font-normal text-text-muted">/mo</span>
                  <span className="tnum ml-2 text-sm font-normal text-text-muted">
                    {euroCents(offerPricing.monthly * 12)}/yr
                  </span>
                </p>
                {greenDay && (
                  <p className="mt-2 rounded-md bg-emerald-50 px-3 py-2 text-xs leading-relaxed text-emerald-800">
                    <strong className="tnum">€20 off your first year</strong> — your moving
                    day has the best weather in the window, so year 1 costs{" "}
                    <strong className="tnum">{euroCents(offerPricing.monthly * 12 - 20)}</strong>{" "}
                    instead of {euroCents(offerPricing.monthly * 12)}.
                  </p>
                )}
                <div className="mt-3 space-y-2.5">
                  <Segmented
                    label="Home type"
                    value={profile.homeType}
                    options={HOME_TYPES.map((t) => ({ value: t.value, label: t.label }))}
                    onChange={(v) => setProfile((p) => ({ ...p, homeType: v as HomeProfile["homeType"] }))}
                  />
                  <Segmented
                    label="Build year"
                    value={profile.era}
                    options={BUILD_ERAS.map((e) => ({ value: e.value, label: e.label }))}
                    onChange={(v) => setProfile((p) => ({ ...p, era: v as HomeProfile["era"] }))}
                  />
                  <Segmented
                    label="Deductible (omavastuu)"
                    value={String(profile.deductible)}
                    options={DEDUCTIBLES.map((d) => ({ value: String(d.value), label: d.label }))}
                    onChange={(v) => setProfile((p) => ({ ...p, deductible: Number(v) as Deductible }))}
                  />
                </div>
                <dl className="tnum mt-3 space-y-1 border-t border-border pt-2 text-xs leading-relaxed text-text-muted">
                  {offerPricing.lines.map((line) => (
                    <div key={line.label} className="flex justify-between gap-2">
                      <dt className="shrink-0 font-medium text-foreground/70">{line.label}</dt>
                      <dd className="text-right">{line.note}</dd>
                    </div>
                  ))}
                  {greenDay && (
                    <div className="flex justify-between gap-2">
                      <dt className="shrink-0 font-medium text-foreground/70">Green-day discount</dt>
                      <dd className="text-right">−€20 off year 1</dd>
                    </div>
                  )}
                </dl>
                {sent ? (
                  <p className="mt-4 rounded-md bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-800">
                    Sent — the full comparison and this quote are on their way to{" "}
                    <strong>{email}</strong>. Demo: no real mail is sent; in production this
                    creates your If quote and hands it to an advisor.
                  </p>
                ) : (
                  <form
                    className="mt-4 space-y-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      setSent(true);
                    }}
                  >
                    <Input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      aria-label="Email for the quote"
                    />
                    <Button type="submit" className="w-full">
                      Get this quote by email
                    </Button>
                  </form>
                )}
              </div>
            </div>

            {/* The factual hook — If's market position, stated once, verifiably */}
            <p className="mt-6 border-t border-border pt-5 text-sm leading-relaxed text-foreground">
              <strong>If is the largest property &amp; casualty insurer in the Nordic
              countries.</strong>{" "}
              The home you just searched for is exactly the risk the region's
              biggest home insurer prices every day, across every Nordic market.
            </p>
            <a
              href={IF_HOME_INSURANCE_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: IF_BLUE }}
            >
              Found the best home insurance for your new home
              <ArrowRight className="h-4 w-4" />
            </a>

            {/* Quiet cross-sell: only visible once the user has opened the cover */}
            <div className="mt-5 border-t border-border pt-5">
              <p className="kicker text-text-muted">Often taken alongside, when you move</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {[
                  {
                    title: "Car insurance",
                    detail: "Moving week is towing week — the drive between the two homes is its own risk.",
                  },
                  {
                    title: "Travel insurance",
                    detail: "Your first trip out of the new home, covered from the day you land back.",
                  },
                  {
                    title: "Cottage insurance",
                    detail: "The summer place you'll finally have time for — priced the same open way.",
                  },
                ].map((s) => (
                  <div key={s.title} className="rounded-md border border-border bg-background p-3.5">
                    <p className="text-sm font-semibold">{s.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-text-muted">{s.detail}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-text-muted">
                Each stays its own policy with its own printed price — or combine them and
                renew everything on one date, on one bill.
              </p>
            </div>

          </section>
          )}

          {bookedDate && (
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
              <Link
                href={planHrefFor(bookedDate)}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-base font-semibold text-white transition-colors hover:bg-primary-hover"
              >
                Open your checklist
                <ArrowRight className="h-5 w-5" />
              </Link>
              <span className="text-xs text-text-muted">
                crew, cover and this quote are already on it — including the
                "confirm the crew" task, three days out.
              </span>
            </div>
          )}
          {/* Scroll headroom: without extra page height below, the browser
              clamps the scroll and the insurance panel can't reach the top of
              the viewport when the calculating animation plays. */}
          <div aria-hidden className="h-[50vh]" />
        </section>
        )}

        {/* Pricing transparency footnote */}
        <section className="mt-10 rounded-md border border-border bg-card p-6">
          <h2 className="font-display text-lg font-semibold">How these numbers are built</h2>
          <p className="mt-2 text-sm leading-relaxed text-text-muted">
            Every quote above comes from one open formula:{" "}
            <span className="tnum">
              crew × hours × rate × day-factor + kilometres × van rate + extras
            </span>
            . The same inputs produce the same number for every operator, so nothing
            here can be jacked up between your search and your booking. Weekend
            factors and winter-handling fees are quoted as line items, never
            buried. Market demand is the same for every operator: month-end days
            and the June–July season carry a printed ×1.20 / ×1.15 on labour —
            Skyscanner-style price movement without surge pricing — and a fully
            booked crew simply says so. Every operator listed here is vetted and
            their damage-claim records are tracked — the data you're comparing on
            is the part that can't be faked.
          </p>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto w-full max-w-6xl px-6 py-6 text-xs text-text-muted">
          Hackathon mockup. Operators, prices, statistics and weather are illustrative
          mock data.
        </div>
      </footer>
    </div>
  );
}

function MoverCard({
  mover,
  quote,
  rank,
  requestedServices,
  date,
  slots,
  soldOutAlt,
  chosen,
  onChoose,
}: {
  mover: Mover;
  quote: Quote;
  rank: string | null;
  requestedServices: MoverService[];
  date: string;
  slots: number;
  soldOutAlt: { label: string; price: number; onSelect: () => void } | null;
  chosen: boolean;
  onChoose: () => void;
}) {
  const soldOut = slots === 0;
  const scarce = !soldOut && slots < mover.dailyCapacity;
  const missing = missingServices(mover, requestedServices);

  return (
    <article className={"rounded-lg border border-border bg-card" + (soldOut ? " opacity-60" : "")}>
      <div className="grid gap-6 p-6 md:grid-cols-[1fr_240px]">
        {/* Left: profile */}
        <div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3 className="font-display text-lg font-semibold">{mover.name}</h3>
            {rank && (
              <span className="rounded-sm bg-accent px-2 py-0.5 text-xs font-semibold text-white">
                {rank}
              </span>
            )}
            {mover.priceLock ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                <Lock className="h-3.5 w-3.5" /> Fixed price
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                <Timer className="h-3.5 w-3.5" /> Confirmed in 24 h
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-text-muted">{mover.tagline}</p>

          <dl className="tnum mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-foreground text-foreground" />
              <dt className="sr-only">Rating</dt>
              <dd className="font-semibold">{mover.rating.toFixed(1)}</dd>
              <dd className="text-text-muted">({mover.reviews})</dd>
            </div>
            <div>
              <dt className="inline text-text-muted">Damage claims </dt>
              <dd className={`inline font-semibold ${damageTone(mover.damageRate)}`}>
                {mover.damageRate}%
              </dd>
            </div>
            <div>
              <dt className="inline text-text-muted">On time </dt>
              <dd className="inline font-semibold">{mover.onTimeRate}%</dd>
            </div>
            <div>
              <dt className="inline text-text-muted">Cover included </dt>
              <dd className="inline font-semibold">{euro(mover.insuranceCap)}</dd>
            </div>
          </dl>

          <div className="mt-4 grid gap-x-8 gap-y-1 text-sm sm:grid-cols-2">
            <ul className="space-y-1">
              {mover.pros.map((p) => (
                <li key={p} className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
            <ul className="space-y-1">
              {mover.cons.map((c) => (
                <li key={c} className="flex gap-2 text-text-muted">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>

          {missing.length > 0 && (
            <p className="mt-3 text-xs text-text-muted">
              Doesn’t offer: {missing.map((s) => SERVICE_LABELS[s]).join(", ")} — quoted without it.
            </p>
          )}
        </div>

        {/* Right: price */}
        <div className="flex flex-col border-t border-border pt-4 md:border-l md:border-t-0 md:pl-6 md:pt-0">
          <p className="kicker">Fixed total · incl. VAT</p>
          <p className="tnum mt-1 font-display text-3xl font-semibold">{euro(quote.total)}</p>
          <details className="mt-3 text-sm">
            <summary className="cursor-pointer select-none text-text-muted hover:text-foreground">
              Price breakdown
            </summary>
            <table className="tnum mt-2 w-full text-xs">
              <tbody>
                {quote.lines.map((line) => (
                  <tr key={line.label} className="border-b border-border/60 last:border-0">
                    <td className="py-1.5 pr-2 align-top">
                      {line.label}
                      {line.note && <div className="text-text-muted">{line.note}</div>}
                    </td>
                    <td className="py-1.5 text-right align-top font-semibold">{euro(line.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
          <p className="mt-2 text-xs leading-relaxed text-text-muted">
            {mover.priceLock
              ? "Price-locked — the number you book is the invoice."
              : "Estimate — under Finnish consumer guidance a final invoice may not exceed the estimate by more than 15%."}
          </p>
          <div className="mt-auto pt-4">
            {scarce && (
              <p className="mb-2 text-xs font-semibold text-amber-700">
                Only {slots} of {mover.dailyCapacity} slots left on{" "}
                {fmtDay.format(new Date(`${date}T12:00:00Z`))}
              </p>
            )}
            <button
              onClick={onChoose}
              disabled={soldOut || (chosen && !mover.instantBooking)}
              className={
                "w-full rounded-md px-4 py-2.5 text-sm font-semibold transition-colors " +
                (soldOut
                  ? "cursor-not-allowed bg-muted text-text-muted"
                  : chosen
                    ? "bg-emerald-700 text-white"
                    : "bg-primary text-white hover:bg-primary-hover")
              }
            >
              {soldOut
                ? `Fully booked on ${fmtDay.format(new Date(`${date}T12:00:00Z`))}`
                : chosen
                  ? mover.instantBooking
                    ? "Held for 48 h at this price"
                    : `Quote requested — ${mover.name} confirms within 24 h`
                  : mover.instantBooking
                    ? `Book for ${euro(quote.total)}`
                    : "Request final quote"}
            </button>
            {soldOut && soldOutAlt && (
              <button
                onClick={soldOutAlt.onSelect}
                className="mt-2 w-full text-left text-xs font-medium text-accent hover:underline"
              >
                Try {soldOutAlt.label} — from {euro(soldOutAlt.price)}
              </button>
            )}
            {chosen && (
              <p className="mt-2 text-xs leading-relaxed text-text-muted">
                {mover.instantBooking
                  ? "Demo: no payment taken. Cancel free until 72 h before the move."
                  : "Demo: no payment taken. Nothing is booked until you accept the final quote."}{" "}
                Your If home insurance covers your belongings at both addresses during the
                move — transit included as standard.
              </p>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
