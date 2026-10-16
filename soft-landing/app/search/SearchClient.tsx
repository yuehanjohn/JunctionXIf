"use client";

import Link from "next/link";
import * as React from "react";
import {
  ArrowLeft,
  Check,
  Lock,
  Minus,
  Star,
  Timer,
  Umbrella,
  X,
} from "lucide-react";
import { MOVERS, SERVICE_LABELS, type Mover, type MoverService } from "@/lib/movers";
import { CONTENTS_VALUE, bestDay, euro, missingServices, quote, type HomeSize, type Quote } from "@/lib/pricing";
import type { WeatherDay } from "@/lib/types";

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

function scoreTone(label: WeatherDay["label"]) {
  return label === "good" ? "bg-emerald-600" : label === "ok" ? "bg-amber-500" : "bg-red-600";
}

function damageTone(rate: number) {
  return rate <= 0.5 ? "text-emerald-700" : rate <= 1.2 ? "text-amber-700" : "text-red-700";
}

export function SearchClient({ query, weather }: { query: SearchQuery; weather: WeatherDay[] }) {
  const [selectedDate, setSelectedDate] = React.useState(query.date);
  const [sort, setSort] = React.useState<SortKey>("price");
  const [chosenId, setChosenId] = React.useState<string | null>(null);

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

  const cheapestToday = React.useMemo(
    () => Math.min(...MOVERS.map((m) => quotes.get(m.id)?.total ?? Infinity)),
    [quotes]
  );
  const cheapestBest = React.useMemo(() => {
    if (!best || best.date === selectedDate) return null;
    const q = Math.min(
      ...MOVERS.map((m) =>
        quote(m, {
          from: query.from,
          to: query.to,
          homeSize: query.size,
          date: best.date,
          services: query.services,
          dayScore: best.score,
        }).total
      )
    );
    return Number.isFinite(q) ? q : null;
  }, [best, query, selectedDate]);

  const savings = cheapestBest !== null ? cheapestToday - cheapestBest : null;

  const ranked = React.useMemo(() => {
    const rows = MOVERS.map((mover) => ({ mover, quote: quotes.get(mover.id)! }));
    rows.sort((a, b) => {
      if (sort === "price") return a.quote.total - b.quote.total;
      if (sort === "rating") return b.mover.rating - a.mover.rating;
      return a.mover.damageRate - b.mover.damageRate;
    });
    return rows;
  }, [quotes, sort]);

  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <header className="border-b border-border bg-card">
        <div className="mx-auto w-full max-w-6xl px-6 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            New search
          </Link>
          <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
              {query.from.name} → {query.to.name}
            </h1>
            <span className="text-sm text-text-muted">
              {fmtDay.format(new Date(`${selectedDate}T12:00:00Z`))} · {query.size}
              {query.services.length > 0 && ` · ${query.services.map((s) => SERVICE_LABELS[s]).join(", ")}`}
            </span>
            <span className="ml-auto rounded-sm border border-border bg-background px-2 py-0.5 text-xs text-text-muted">
              An If Insurance concept
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        {/* Weather day picker */}
        <section aria-label="Moving conditions by day">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="kicker">Moving conditions · next 16 days at destination</h2>
            {best && (
              <p className="text-xs text-text-muted">
                Best day:{" "}
                <button
                  onClick={() => setSelectedDate(best.date)}
                  className="font-semibold text-accent hover:underline"
                >
                  {fmtDay.format(new Date(`${best.date}T12:00:00Z`))}
                </button>
              </p>
            )}
          </div>
          {weather.length > 0 ? (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
              {weather.map((day) => {
                const active = day.date === selectedDate;
                return (
                  <button
                    key={day.date}
                    onClick={() => setSelectedDate(day.date)}
                    className={
                      "w-20 shrink-0 rounded-md border p-2 text-left transition-colors " +
                      (active
                        ? "border-primary bg-primary text-white"
                        : "border-border bg-card hover:border-text-muted")
                    }
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">{fmtShort.format(new Date(`${day.date}T12:00:00Z`))}</span>
                      {best?.date === day.date && (
                        <Star className={"h-3 w-3 " + (active ? "fill-white text-white" : "fill-accent text-accent")} />
                      )}
                    </div>
                    <div className={"tnum text-xs " + (active ? "text-white/70" : "text-text-muted")}>
                      {fmtDate.format(new Date(`${day.date}T12:00:00Z`))}
                    </div>
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${scoreTone(day.label)}`} />
                      <span className="tnum text-xs font-semibold">{day.score}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="mt-3 text-sm text-text-muted">
              Forecast unavailable — prices below exclude weather adjustments.
            </p>
          )}
          {savings !== null && savings > 0 && best && (
            <p className="mt-2 flex items-center gap-2 text-sm">
              <Umbrella className="h-4 w-4 text-accent" />
              Moving on{" "}
              <strong>
                {fmtDay.format(new Date(`${best.date}T12:00:00Z`))}
              </strong>{" "}
              instead saves{" "}
              <strong className="tnum text-accent">{euro(savings)}</strong> on the cheapest
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
                  higher chance of something breaking. If moves your booking to a
                  safer day at no cost if the forecast worsens.
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
          {ranked.map(({ mover, quote: q }, i) => (
            <MoverCard
              key={mover.id}
              mover={mover}
              quote={q}
              rank={i === 0 && sort === "price" ? "Cheapest" : null}
              requestedServices={query.services}
              homeSize={query.size}
              chosen={chosenId === mover.id}
              onChoose={() => setChosenId(mover.id)}
            />
          ))}
        </div>

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
            buried. If vets every operator, tracks their damage claims, and tops
            up any cover gap — operators compete for your booking, If earns a
            customer for everything a new home needs.
          </p>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto w-full max-w-6xl px-6 py-6 text-xs text-text-muted">
          Hackathon mockup. Operators, prices and statistics are illustrative; weather
          data is live from Open-Meteo.
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
  homeSize,
  chosen,
  onChoose,
}: {
  mover: Mover;
  quote: Quote;
  rank: string | null;
  requestedServices: MoverService[];
  homeSize: HomeSize;
  chosen: boolean;
  onChoose: () => void;
}) {
  const missing = missingServices(mover, requestedServices);
  const contents = CONTENTS_VALUE[homeSize];
  const coverGap = contents > mover.insuranceCap;

  return (
    <article className="rounded-lg border border-border bg-card">
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
          <div className="mt-auto pt-4">
            <button
              onClick={onChoose}
              className={
                "w-full rounded-md px-4 py-2.5 text-sm font-semibold transition-colors " +
                (chosen
                  ? "bg-emerald-700 text-white"
                  : "bg-primary text-white hover:bg-primary-hover")
              }
            >
              {chosen
                ? "Held for 48 h at this price"
                : mover.instantBooking
                  ? `Book for ${euro(quote.total)}`
                  : "Request final quote"}
            </button>
            {chosen && (
              <p className="mt-2 text-xs leading-relaxed text-text-muted">
                Demo: no payment taken. Cancel free until 72 h before the move.
                {coverGap
                  ? ` If top-up added for 60 days at no charge — your full ~${euro(contents)} of contents is covered from the first box.`
                  : ` Damage cover ${euro(mover.insuranceCap)} is enough for a home this size.`}
              </p>
            )}
            {coverGap && !chosen && (
              <p className="mt-2 rounded-md border border-orange-200 bg-orange-50 p-2 text-xs leading-relaxed text-orange-900">
                <strong>Cover gap:</strong> this operator covers {euro(mover.insuranceCap)}{" "}
                but a home this size holds ~{euro(contents)}. If tops up the
                difference from €4.90/mo.
              </p>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
