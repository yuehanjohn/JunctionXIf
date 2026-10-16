"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { ArrowRight, Lock, ReceiptText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui";
import { AddressInput, type AddressChoice } from "./onboarding/AddressInput";
import { HOME_SIZES, type HomeSize } from "@/lib/pricing";
import { SERVICE_LABELS, type MoverService } from "@/lib/movers";

const SERVICE_KEYS = Object.keys(SERVICE_LABELS) as MoverService[];

const stats = [
  { value: "1.2M", label: "homes move inside Finland every year — Statistics Finland" },
  { value: "+15%", label: "the most a final invoice may exceed an estimate, per Finnish consumer guidance" },
  { value: "€0", label: "charged for comparing — operators pay us, never you" },
];

const principles = [
  {
    icon: Lock,
    title: "The price you book is the price you pay",
    detail:
      "Every listed operator commits to a fixed total before your card is touched. No overtime surprises, no 'the stairs were harder than expected'.",
  },
  {
    icon: ReceiptText,
    title: "Every euro has a line item",
    detail:
      "Labour, kilometres, packing, weekend factors — shown side by side, priced by the same open formula. If you can't see it, we don't list it.",
  },
  {
    icon: ShieldCheck,
    title: "Covered when things break anyway",
    detail:
      "Each operator's damage rate and cover limit is public. Your home insurance covers your belongings at both addresses during the move — a priced If top-up closes whatever the mover's transport-liability cap leaves open.",
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
  const [services, setServices] = React.useState<MoverService[]>([]);
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

  function toggleService(s: MoverService) {
    setServices((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

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
      services: services.join(","),
    });
    router.push(`/search?${params.toString()}`);
  }

  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      {/* Masthead */}
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <span className="font-display text-lg font-semibold tracking-tight">
            Soft Landing
          </span>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/plan/demo" className="text-text-muted transition-colors hover:text-foreground">
              Your move checklist
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero + search */}
        <section className="border-b border-border bg-card">
          <div className="mx-auto w-full max-w-6xl px-6 pb-10 pt-16">
            <p className="kicker">The moving marketplace · Finland</p>
            <h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Compare house movers.
              <br />
              Lock the price. Move on the right day.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-text-muted">
              One search across every operator we vet: side-by-side fixed prices, open
              line items, damage rates — and a forecast so you never carry a sofa on
              the iciest day of the year.
            </p>

            {/* Search panel */}
            <div className="mt-10 rounded-lg border border-border bg-background p-6 shadow-sm">
              <div className="grid gap-5 md:grid-cols-2">
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
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="kicker">Move date</span>
                  <input
                    type="date"
                    min={minDate}
                    value={moveDate}
                    onChange={(e) => setMoveDate(e.target.value)}
                    className="mt-2 w-full rounded-md border border-border bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <span className="tnum mt-1.5 block text-xs text-text-muted">
                    {moveDate
                      ? `Chosen: ${moveDate.split("-").reverse().join(".")}`
                      : "Format: dd.mm.yyyy"}
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

              <div className="mt-5">
                <span className="kicker">Extras</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {SERVICE_KEYS.map((s) => {
                    const active = services.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleService(s)}
                        className={
                          "rounded-md border px-3 py-1.5 text-sm transition-colors " +
                          (active
                            ? "border-primary bg-primary text-white"
                            : "border-border bg-card text-foreground hover:border-text-muted")
                        }
                      >
                        {SERVICE_LABELS[s]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-4">
                <Button onClick={search} className="px-6">
                  Compare movers
                  <ArrowRight className="h-4 w-4" />
                </Button>
                {error && <p className="text-sm text-red-700">{error}</p>}
              </div>
            </div>

            {/* Stats */}
            <dl className="mt-12 grid grid-cols-1 gap-x-10 gap-y-6 border-t border-border pt-8 sm:grid-cols-3">
              {stats.map((s) => (
                <div key={s.value}>
                  <dt className="kicker">{s.label}</dt>
                  <dd className="tnum mt-1 font-display text-3xl font-semibold text-accent">
                    {s.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Principles */}
        <section className="mx-auto w-full max-w-6xl px-6 py-16">
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            Why the price can’t jump on you here
          </h2>
          <div className="mt-8 grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-3">
            {principles.map((p, i) => (
              <div key={p.title} className="bg-card p-6">
                <div className="flex items-center gap-3">
                  <p.icon className="h-5 w-5 text-accent" />
                  <span className="kicker">0{i + 1}</span>
                </div>
                <h3 className="mt-4 text-base font-semibold leading-snug">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-muted">{p.detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Post-booking tie-in */}
        <section className="border-t border-border bg-card">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold tracking-tight">
                Booked? The rest of the move lives in one checklist.
              </h2>
              <p className="mt-1 text-sm text-text-muted">
                Address changes, utilities, insurance transfers — paced around your date.
              </p>
            </div>
            <Link
              href="/plan/demo"
              className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-accent hover:underline"
            >
              Open the checklist
              <ArrowRight className="h-4 w-4" />
            </Link>
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
