"use client";

import { useState } from "react";
import {
  CalendarCheck,
  Check,
  CheckCircle2,
  Home,
  Landmark,
  Loader2,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Badge, Button, Card, CardTitle, Progress, cx } from "@/components/ui";
import type { ChecklistItem } from "@/lib/types";

type Notification = { service: string; status: string };

const CATEGORY_ICONS: Record<ChecklistItem["category"], typeof Home> = {
  official: Landmark,
  home: Home,
  utilities: Zap,
  coverage: ShieldCheck,
};

function groupLabel(offsetDays: number): string {
  if (offsetDays === 0) return "Moving day";
  const days = Math.abs(offsetDays);
  if (days % 7 === 0) return days === 7 ? "1 week before" : `${days / 7} weeks before`;
  return days === 1 ? "1 day before" : `${days} days before`;
}

function formatDay(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Europe/Helsinki",
  });
}

type PlanTasksProps = {
  planId: string;
  moveDate: string;
  initialItems: ChecklistItem[];
};

export function PlanTasks({ planId, moveDate, initialItems }: PlanTasksProps) {
  const [items, setItems] = useState(initialItems);
  const [savingIds, setSavingIds] = useState<Set<string>>(() => new Set());
  const [phase, setPhase] = useState<"idle" | "sending" | "done" | "error">(() => {
    const dvv = initialItems.find((i) => i.id === "dvv-notification")?.done;
    const posti = initialItems.find((i) => i.id === "posti-forwarding")?.done;
    return dvv && posti ? "done" : "idle";
  });
  const [notifications, setNotifications] = useState<Notification[] | null>(null);

  const doneCount = items.filter((item) => item.done).length;

  async function toggleItem(itemId: string, nextDone: boolean) {
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, done: nextDone } : item))
    );
    setSavingIds((prev) => new Set(prev).add(itemId));
    try {
      const res = await fetch(`/api/plan?id=${encodeURIComponent(planId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, done: nextDone }),
      });
      if (!res.ok) throw new Error("save failed");
    } catch {
      setItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, done: !nextDone } : item))
      );
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  }

  async function sendAddressChange() {
    setPhase("sending");
    try {
      const res = await fetch(
        `/api/plan/${encodeURIComponent(planId)}/address-change`,
        { method: "POST" }
      );
      const data = (await res.json()) as {
        ok: boolean;
        plan?: { checklist: ChecklistItem[] };
        notifications?: Notification[];
      };
      if (!res.ok || !data.ok || !data.plan || !data.notifications) {
        throw new Error("address change failed");
      }
      setItems(data.plan.checklist);
      setNotifications(data.notifications);
      setPhase("done");
    } catch {
      setPhase("error");
    }
  }

  const offsets = [...new Set(items.map((item) => item.dueOffsetDays))].sort(
    (a, b) => a - b
  );

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="mt-0.5 rounded-lg bg-accent/10 p-2.5">
            <CalendarCheck className="h-5 w-5 text-accent" />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle>Address change in one click</CardTitle>
            <p className="mt-1 text-sm text-text-muted">
              We file your DVV muuttoilmoitus and order Posti mail forwarding for{" "}
              {formatDay(moveDate)}. One click, no forms.
            </p>
          </div>
        </div>

        <div className="mt-4">
          {phase === "done" ? (
            <div className="space-y-3">
              <ul className="space-y-2">
                {(notifications ?? [
                  { service: "DVV muuttoilmoitus", status: "sent" },
                  { service: "Posti mail forwarding", status: "sent" },
                ]).map((n) => (
                  <li
                    key={n.service}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-accent" />
                      {n.service}
                    </span>
                    <Badge tone="good">{n.status}</Badge>
                  </li>
                ))}
              </ul>
              <Button variant="secondary" disabled className="w-full">
                You're all set
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {phase === "error" && (
                <p className="text-sm text-amber-700">
                  That didn't go through — nothing was lost. Try again in a moment.
                </p>
              )}
              <Button
                className="w-full"
                disabled={phase === "sending"}
                onClick={sendAddressChange}
              >
                {phase === "sending" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  "Send both notifications"
                )}
              </Button>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Your checklist</CardTitle>
          <span className="text-sm text-text-muted">
            {doneCount} of {items.length} done
          </span>
        </div>
        <Progress
          value={items.length ? (doneCount / items.length) * 100 : 0}
          className="mt-3"
        />

        <div className="mt-6 space-y-6">
          {offsets.map((offset) => (
            <section key={offset}>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                {groupLabel(offset)}
              </h4>
              <ul className="mt-2 space-y-2">
                {items
                  .filter((item) => item.dueOffsetDays === offset)
                  .map((item) => {
                    const Icon = CATEGORY_ICONS[item.category];
                    const saving = savingIds.has(item.id);
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={item.done}
                          onClick={() => toggleItem(item.id, !item.done)}
                          className={cx(
                            "flex w-full items-start gap-3 rounded-lg border border-border px-3 py-3 text-left transition-colors hover:bg-muted",
                            item.done && "bg-muted/50"
                          )}
                        >
                          <span
                            className={cx(
                              "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
                              item.done
                                ? "border-accent bg-accent text-white"
                                : "border-border bg-card text-transparent"
                            )}
                          >
                            <Check className="h-3.5 w-3.5" strokeWidth={3} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span
                              className={cx(
                                "flex items-center gap-2 text-sm font-medium text-foreground",
                                item.done && "text-text-muted line-through"
                              )}
                            >
                              <Icon className="h-4 w-4 shrink-0 text-text-muted" />
                              {item.title}
                              {saving && (
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-text-muted" />
                              )}
                            </span>
                            <span className="mt-1 block text-xs leading-relaxed text-text-muted">
                              {item.detail}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
              </ul>
            </section>
          ))}
        </div>
      </Card>
    </div>
  );
}
