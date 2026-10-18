"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { ArrowRight, CalendarCheck, Check, Search } from "lucide-react";
import { Button } from "@/components/ui";
import { AddressInput, type AddressChoice } from "./onboarding/AddressInput";
import { HOME_SIZES, type HomeSize } from "@/lib/pricing";

const stats = [
  { value: "1.2M", label: "homes move inside Finland every year — Statistics Finland" },
  { value: "+15%", label: "the most a final invoice may exceed an estimate, per Finnish consumer guidance" },
  { value: "€0", label: "charged for comparing" },
];

const steps = [
  {
    icon: Search,
    title: "Tell us the move",
    detail:
      "Two addresses, a rough date, your home size. That's everything the pricing engine needs — no account, no phone number.",
  },
  {
    icon: CalendarCheck,
    title: "See every crew and every day",
    detail:
      "Fixed prices side by side, each euro as a line item — and each day weather-scored, so the cheapest date is obvious at a glance.",
  },
  {
    icon: Check,
    title: "Book your crew in one click",
    detail:
      "Lock the fixed price — it can't jump after — and get a moving checklist paced around your date.",
  },
];

function toLocalDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function Home() {
  const router = useRouter();

  const [from, setFrom] = React.useState<AddressChoice | null>(null);
  const [to, setTo] = React.useState<AddressChoice | null>(null);
  const [moveDate, setMoveDate] = React.useState("");
  const [minDate, setMinDate] = React.useState("");
  const [homeSize, setHomeSize] = React.useState<HomeSize | "">("");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Clock-derived defaults must be set after mount: a lazy initializer would
    // render a different date on the server (SSR) than on the client.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMinDate(toLocalDate(new Date()));
    const nextSaturday = new Date();
    const diff = (6 - new Date().getDay() + 7) % 7;
    nextSaturday.setDate(new Date().getDate() + (diff === 0 ? 7 : diff));
    setMoveDate(toLocalDate(nextSaturday));
  }, []);

  function search() {
    if (!from || !to) return setError("Pick both addresses so we can price the van leg.");
    if (!moveDate || !homeSize) return setError("Pick a date and your home size.");
    setError(null);
    const params = new URLSearchParams({
      fromName: from.name,
      fromLat: String(from.latitude),
      fromLon: String(from.longitude),
      toName: to.name,
      toLat: String(to.latitude),
      toLon: String(to.longitude),
      date: moveDate,
      size: homeSize,
    });
    router.push(`/search?${params.toString()}`);
  }

  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      {/* Masthead */}
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <span className="font-display text-lg font-semibold tracking-tight">
            MoveScanner
          </span>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/plan/demo" className="text-text-muted transition-colors hover:text-foreground">
              Your move checklist
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero + the one CTA that matters */}
        <section className="border-b border-border bg-card">
          <div className="mx-auto w-full max-w-6xl px-6 pb-14 pt-14">
            <div className="grid gap-10 lg:grid-cols-[1fr_1.15fr] lg:items-start">
              {/* Pitch */}
              <div className="lg:pt-2">
                <p className="kicker">The Skyscanner of moving firms · Finland</p>
                <h1 className="mt-4 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                  Compare moving firms.
                  <br />
                  Discover the <span className="text-accent">cheapest</span> alternative.
                </h1>
                <p className="mt-5 max-w-xl text-base leading-relaxed text-text-muted">
                  Every vetted crew side by side, priced by the same open formula —
                  then the date that costs least. Same crew, smarter day, smaller
                  invoice.
                </p>
                <ul className="mt-6 space-y-2.5 text-sm leading-relaxed">
                  {[
                    "Fixed price locked before you book — it can't jump after",
                    "Every euro itemised: labour, kilometres, day factors",
                    "Days weather-scored, so the cheapest date is obvious",
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
                {/* Secondary path for people not ready to fill the form */}
                <p className="mt-6 text-sm text-text-muted">
                  Not moving yet?{" "}
                  <Link
                    href="/plan/demo"
                    className="font-medium text-accent underline decoration-accent/40 underline-offset-4 hover:decoration-accent"
                  >
                    See what a planned move looks like
                  </Link>
                </p>
              </div>

              {/* The CTA: search panel */}
              <div className="rounded-xl border border-accent/40 bg-background p-6 shadow-md sm:p-7">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="kicker">Start here — results in seconds</p>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                    Free · no account
                  </span>
                </div>

                <div className="mt-5 grid gap-4">
                  <AddressInput
                    id="from"
                    label="Moving from"
                    placeholder="City or address — e.g. Helsinki"
                    value={from}
                    onChange={setFrom}
                  />
                  <AddressInput
                    id="to"
                    label="Moving to"
                    placeholder="City or address — e.g. Tampere"
                    value={to}
                    onChange={setTo}
                  />
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="kicker">Move date</span>
                    <input
                      type="date"
                      min={minDate}
                      value={moveDate}
                      onChange={(e) => setMoveDate(e.target.value)}
                      className="tnum mt-2 w-full rounded-md border border-border bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <span className="tnum mt-1.5 block text-xs text-text-muted">
                      We'll check nearby days too — the cheapest one wins.
                    </span>
                  </label>
                  <label className="block">
                    <span className="kicker">Home size</span>
                    <select
                      value={homeSize}
                      onChange={(e) => setHomeSize(e.target.value as HomeSize)}
                      className="mt-2 w-full rounded-md border border-border bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="" disabled>
                        Select size
                      </option>
                      {HOME_SIZES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {error && (
                  <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    {error}
                  </p>
                )}

                <Button
                  onClick={search}
                  className="mt-5 h-14 w-full px-8 text-base font-semibold shadow-md transition-transform hover:-translate-y-px"
                >
                  Compare prices now
                  <ArrowRight className="h-5 w-5" />
                </Button>
                <p className="mt-3 text-center text-xs leading-relaxed text-text-muted">
                  Fixed prices from 6 vetted crews · every euro itemised · nothing
                  charged for comparing
                </p>
              </div>
            </div>

            {/* Stats strip */}
            <dl className="mt-12 grid grid-cols-1 gap-x-10 gap-y-6 border-t border-border pt-8 sm:grid-cols-3">
              {stats.map((s) => (
                <div key={s.value}>
                  <dd className="tnum font-display text-3xl font-semibold text-accent">
                    {s.value}
                  </dd>
                  <dt className="mt-1 text-sm leading-relaxed text-text-muted">{s.label}</dt>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto w-full max-w-6xl px-6 py-16">
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            Three steps. No phone calls, no quote-request forms.
          </h2>
          <div className="mt-8 grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-3">
            {steps.map((s, i) => (
              <div key={s.title} className="bg-card p-6">
                <div className="flex items-center gap-3">
                  <s.icon className="h-5 w-5 text-accent" />
                  <span className="kicker">Step 0{i + 1}</span>
                </div>
                <h3 className="mt-4 text-base font-semibold leading-snug">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-muted">{s.detail}</p>
              </div>
            ))}
          </div>
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
