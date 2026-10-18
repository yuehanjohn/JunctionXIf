"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  Home,
  Landmark,
  Loader2,
  PartyPopper,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Card, CardTitle, Progress, cx } from "@/components/ui";
import type { ChecklistItem, MovePlan } from "@/lib/types";

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

// Dependency-free confetti: fixed overlay, WAAPI-animated pieces, self-cleaning.
// Three bottom cannons (left, right, center) launch pieces upward in arcs;
// gravity brings them back down past the bottom edge.
const CONFETTI_COLORS = ["#c2410c", "#0054F0", "#16a34a", "#eab308", "#db2777"];
function burstConfetti() {
  const root = document.createElement("div");
  root.style.cssText =
    "position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:60";
  document.body.appendChild(root);
  const width = window.innerWidth;
  const height = window.innerHeight;
  const cannons = [
    { x: width * 0.08, angle: 72, count: 85 },
    { x: width * 0.92, angle: 108, count: 85 },
    { x: width * 0.5, angle: 90, count: 90 },
  ];
  let longest = 0;
  for (const cannon of cannons) {
    for (let i = 0; i < cannon.count; i++) {
      const piece = document.createElement("div");
      const size = 6 + Math.random() * 7;
      const ribbon = Math.random() > 0.75;
      piece.style.cssText = `position:absolute;left:${cannon.x}px;top:${height - 8}px;width:${ribbon ? 4 : size}px;height:${ribbon ? 14 + Math.random() * 8 : size * 0.6}px;background:${CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]};opacity:0.95;border-radius:${Math.random() > 0.6 ? "50%" : "2px"};`;
      root.appendChild(piece);

      const angle = ((cannon.angle + (Math.random() - 0.5) * 46) * Math.PI) / 180;
      const speed = height * (0.65 + Math.random() * 0.55);
      const vx = Math.cos(angle) * speed;
      const vy = -Math.sin(angle) * speed;
      const spin = 540 + Math.random() * 900;
      const duration = 2000 + Math.random() * 1400;
      longest = Math.max(longest, duration);
      piece.animate(
        [
          {
            transform: "translate(0, 0) rotate(0deg)",
            opacity: 1,
            easing: "cubic-bezier(.15,.6,.35,1)",
            offset: 0,
          },
          {
            transform: `translate(${vx * 0.45}px, ${vy * 0.55}px) rotate(${spin / 2}deg)`,
            opacity: 1,
            easing: "cubic-bezier(.5,0,.85,.4)",
            offset: 0.42,
          },
          {
            transform: `translate(${vx}px, ${height - (height - 8) + 90}px) rotate(${spin}deg)`,
            opacity: 0,
            offset: 1,
          },
        ],
        { duration, fill: "forwards" }
      ).onfinish = () => piece.remove();
    }
  }
  setTimeout(() => root.remove(), longest + 400);
}

type PlanTasksProps = {
  planId: string;
  initialItems: ChecklistItem[];
};

export function PlanTasks({ planId, initialItems }: PlanTasksProps) {
  const [items, setItems] = useState(initialItems);
  const [savingIds, setSavingIds] = useState<Set<string>>(() => new Set());

  // Revalidate against the store: the checklist can change between the
  // server render and hydration.
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/plan/${encodeURIComponent(planId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { ok: boolean; plan?: MovePlan } | null) => {
        if (cancelled || !data?.ok || !data.plan) return;
        setItems(data.plan.checklist);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [planId]);

  const doneCount = items.filter((item) => item.done).length;
  const allDone = items.length > 0 && doneCount === items.length;

  // Confetti fires only on the transition to fully-done (not when a plan
  // renders already complete), and the banner stays while everything is done.
  const wasAllDone = useRef(allDone);
  useEffect(() => {
    if (allDone && !wasAllDone.current) burstConfetti();
    wasAllDone.current = allDone;
  }, [allDone]);

  async function toggleItem(itemId: string, nextDone: boolean) {
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, done: nextDone } : item))
    );
    setSavingIds((prev) => new Set(prev).add(itemId));
    try {
      const res = await fetch(`/api/plan/${encodeURIComponent(planId)}`, {
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

  const offsets = [...new Set(items.map((item) => item.dueOffsetDays))].sort(
    (a, b) => a - b
  );

  return (
    <div className="space-y-6">
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

        {allDone && (
          <div className="fade-rise mt-4 flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
            <PartyPopper className="h-6 w-6 shrink-0 text-emerald-600" />
            <div>
              <p className="font-display text-lg font-semibold text-emerald-900">
                All Done!
              </p>
              <p className="text-xs leading-relaxed text-emerald-800">
                Every task checked — your move is fully planned. Enjoy the new home.
              </p>
            </div>
          </div>
        )}

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
