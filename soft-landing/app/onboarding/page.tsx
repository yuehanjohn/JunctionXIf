"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ChevronDown, Home, Loader2, Truck } from "lucide-react";
import { Button, Card, Input, Progress } from "@/components/ui";
import { AddressInput, type AddressChoice } from "./AddressInput";

const HOME_SIZES = ["Studio", "1–2 rooms", "3+ rooms", "House"];

function toLocalDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function OnboardingPage() {
  const router = useRouter();

  const [step, setStep] = React.useState<1 | 2>(1);
  const [from, setFrom] = React.useState<AddressChoice | null>(null);
  const [to, setTo] = React.useState<AddressChoice | null>(null);
  const [moveDate, setMoveDate] = React.useState("");
  const [minDate, setMinDate] = React.useState("");
  const [homeSize, setHomeSize] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  // Default to next Saturday (never today); constrain the picker to today onward.
  React.useEffect(() => {
    const now = new Date();
    setMinDate(toLocalDate(now));
    const nextSaturday = new Date(now);
    const diff = (6 - now.getDay() + 7) % 7;
    nextSaturday.setDate(now.getDate() + (diff === 0 ? 7 : diff));
    setMoveDate(toLocalDate(nextSaturday));
  }, []);

  const step1Valid = Boolean(from && to);
  const step2Valid = Boolean(moveDate && homeSize);
  const canSubmit = step1Valid && step2Valid && !submitting;

  async function submit() {
    if (!from || !to || !moveDate || !homeSize) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromName: from.label,
          fromLat: from.latitude,
          fromLon: from.longitude,
          toName: to.label,
          toLat: to.latitude,
          toLon: to.longitude,
          moveDate,
          homeSize,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; plan?: { id: string }; error?: string };
      if (!res.ok || !data.ok || !data.plan) {
        throw new Error(data.error ?? "Could not create your plan");
      }
      router.push(`/plan/${data.plan.id}`);
    } catch (e) {
      setSubmitError(
        e instanceof Error ? e.message : "Something went wrong. Please try again."
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-6 py-12">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back home
        </Link>

        <h1 className="font-display text-3xl tracking-tight text-foreground">
          Let&apos;s plan your move
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          Two quick steps — then we&apos;ll find you a safe day and a calm plan.
        </p>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-xs font-medium text-text-muted">
            <span>Step {step} of 2</span>
            <span>{step === 1 ? "Where are you moving?" : "When and what?"}</span>
          </div>
          <Progress value={step === 1 ? 50 : 100} />
        </div>

        <Card className="mt-6 p-6">
          {step === 1 ? (
            <div className="space-y-5">
              <AddressInput
                id="from-address"
                label="Moving from"
                placeholder="Start typing a city or area…"
                value={from}
                onChange={setFrom}
              />
              <AddressInput
                id="to-address"
                label="Moving to"
                placeholder="Start typing a city or area…"
                value={to}
                onChange={setTo}
              />

              <div className="flex justify-end pt-1">
                <Button
                  type="button"
                  disabled={!step1Valid}
                  onClick={() => setStep(2)}
                  className="min-w-36"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-lg bg-muted px-4 py-3 text-sm">
                <div className="flex items-start gap-2">
                  <Truck className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" aria-hidden />
                  <span className="text-foreground">
                    {from?.label} <span className="text-text-muted">→</span> {to?.label}
                  </span>
                </div>
              </div>

              <div>
                <label htmlFor="move-date" className="mb-1.5 block text-sm font-medium text-foreground">
                  Move date
                </label>
                <Input
                  id="move-date"
                  type="date"
                  value={moveDate}
                  min={minDate || undefined}
                  onChange={(e) => setMoveDate(e.target.value)}
                />
                <p className="mt-1.5 text-xs text-text-muted">
                  Pre-set to next Saturday — we&apos;ll check the weather before you commit.
                </p>
              </div>

              <div>
                <label htmlFor="home-size" className="mb-1.5 block text-sm font-medium text-foreground">
                  Home size
                </label>
                <div className="relative">
                  <Home
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
                    aria-hidden
                  />
                  <select
                    id="home-size"
                    value={homeSize}
                    onChange={(e) => setHomeSize(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-border bg-card py-2.5 pl-9 pr-9 text-sm outline-none transition-shadow placeholder:text-text-muted focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="" disabled>
                      Choose your home size
                    </option>
                    {HOME_SIZES.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
                    aria-hidden
                  />
                </div>
              </div>

              {submitError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                  {submitError}
                </p>
              )}

              <div className="flex items-center justify-between pt-1">
                <Button type="button" variant="ghost" onClick={() => setStep(1)} disabled={submitting}>
                  <ArrowLeft className="h-4 w-4" aria-hidden />
                  Back
                </Button>
                <Button type="button" disabled={!canSubmit} onClick={submit} className="min-w-40">
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      Building plan…
                    </>
                  ) : (
                    <>
                      Create my plan
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </Card>

        <p className="mt-4 text-center text-xs text-text-muted">
          Takes about a minute. No account needed.
        </p>
      </main>
    </div>
  );
}
