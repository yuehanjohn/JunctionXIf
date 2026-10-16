import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck2,
  CloudSun,
  ListChecks,
  PackageCheck,
  PlayCircle,
} from "lucide-react";

const stats = [
  {
    value: "88%",
    label: "of Finns say moving causes negative stress",
  },
  {
    value: "52%",
    label: "rank moving-day stress 8 or higher, out of 10",
  },
  {
    value: "19%",
    label: "arrive with something broken or missing — sofas most of all",
  },
];

const steps = [
  {
    icon: CloudSun,
    title: "Pick a safe day",
    detail:
      "We check the forecast for your route and flag icy, windy, or wet days before you book the van.",
  },
  {
    icon: ListChecks,
    title: "Everything on one list",
    detail:
      "Address changes, utilities, packing order — a calm checklist that paces itself around your date.",
  },
  {
    icon: PackageCheck,
    title: "You're all set",
    detail:
      "Move with a plan instead of a panic. Boxes labelled, floors protected, nothing left behind.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto flex max-w-3xl flex-col items-center px-6 pt-20 pb-14 text-center sm:pt-28">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-text-muted">
            <CalendarCheck2 className="h-3.5 w-3.5 text-primary" aria-hidden />
            Your moving-day copilot
          </span>

          <h1 className="mt-6 font-display text-4xl leading-tight tracking-tight text-foreground sm:text-6xl">
            A soft landing for
            <br />
            moving day.
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-text-muted sm:text-lg">
            Soft Landing picks a safe day, builds the checklist, and keeps the
            chaos out of your move — so you can look forward to the new home
            instead of dreading the drive.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href="/onboarding"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-600"
            >
              Plan my move
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/plan/demo"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <PlayCircle className="h-4 w-4 text-primary" aria-hidden />
              See a demo plan
            </Link>
          </div>

          <p className="mt-4 text-xs text-text-muted">
            Short on time?{" "}
            <Link
              href="/plan/demo"
              className="font-medium text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary"
            >
              Jump straight into a demo plan →
            </Link>
          </p>
        </section>

        {/* Stats */}
        <section className="mx-auto w-full max-w-4xl px-6 pb-16" aria-label="Why this matters">
          <div className="grid gap-4 sm:grid-cols-3">
            {stats.map((s) => (
              <div
                key={s.value}
                className="rounded-xl border border-border bg-card px-6 py-5 text-center shadow-sm"
              >
                <div className="font-display text-3xl font-semibold text-primary">
                  {s.value}
                </div>
                <div className="mt-2 text-sm leading-snug text-text-muted">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto w-full max-w-4xl px-6 pb-20" aria-label="How it works">
          <h2 className="text-center font-display text-2xl tracking-tight text-foreground">
            How it works
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {steps.map((step, i) => (
              <div
                key={step.title}
                className="rounded-xl border border-border bg-card p-6 shadow-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
                  <step.icon className="h-5 w-5 text-primary" aria-hidden />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-text-muted">{step.detail}</p>
                <div className="mt-4 text-xs font-medium text-text-muted">
                  Step {i + 1} of {steps.length}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-1 px-6 py-6 text-center">
          <p className="text-xs text-text-muted">
            Made with If — home insurance that moves with you.
          </p>
        </div>
      </footer>
    </div>
  );
}
