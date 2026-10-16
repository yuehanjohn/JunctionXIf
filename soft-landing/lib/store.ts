import { readFileSync, renameSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { ChecklistItem, MovePlan } from "./types";

// Pages and route handlers compile to separate module instances in Next dev,
// so a plain in-memory Map is not shared between them: a plan seeded during a
// page render was invisible to the API routes (every PATCH/POST 404'd).
// Backing the store with one small JSON file makes every instance — and every
// hot reload — see the same plans.
const STORE_FILE = path.join(tmpdir(), "soft-landing-plans.json");

type StoreFile = { plans: Record<string, MovePlan> };

function readStore(): StoreFile {
  try {
    return JSON.parse(readFileSync(STORE_FILE, "utf8")) as StoreFile;
  } catch {
    return { plans: {} };
  }
}

function writeStore(store: StoreFile): void {
  const tmp = `${STORE_FILE}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(store));
  renameSync(tmp, STORE_FILE);
}

function putPlan(plan: MovePlan): void {
  const store = readStore();
  store.plans[plan.id] = plan;
  writeStore(store);
}

export function makeChecklist(): ChecklistItem[] {
  return [
    {
      id: "dvv-notification",
      title: "File DVV muuttoilmoitus",
      detail:
        "Report your move to the Digital and Population Data Services Agency (DVV) at muuttoilmoitus.fi. Must be filed no later than one week after moving — do it before the move so registers update on move day.",
      dueOffsetDays: -7,
      category: "official",
      done: false,
    },
    {
      id: "posti-forwarding",
      title: "Order Posti mail forwarding",
      detail:
        "Order permanent or 1-year mail forwarding from Posti (posti.fi/en). Takes effect on your chosen date, so order at least 2 weeks ahead of the move.",
      dueOffsetDays: -14,
      category: "official",
      done: false,
    },
    {
      id: "electricity-contract",
      title: "Set up electricity contract for the new home",
      detail:
        "Order an electricity contract for the new address (e.g. Helen, Fortum, Caruna area grid). Give the move-in date; the old contract usually ends on the move-out date or per notice period.",
      dueOffsetDays: -14,
      category: "utilities",
      done: false,
    },
    {
      id: "insurance-update",
      title: "Update home insurance",
      detail:
        "Move your home insurance (kotivakuutus) to the new address or take a new policy. Update square metres and contents; liability often covers moving-day damage.",
      dueOffsetDays: -7,
      category: "coverage",
      done: false,
    },
    {
      id: "elevator-booking",
      title: "Book moving elevator",
      detail:
        "In most Finnish apartment buildings you must reserve the moving elevator with the taloyhtiö (building manager) well in advance and lay floor protection. Book for move day.",
      dueOffsetDays: -14,
      category: "home",
      done: false,
    },
    {
      id: "fragile-towels",
      title: "Pack fragile items with towels and linens",
      detail:
        "Wrap dishes, glassware and electronics in towels, bed linens and clothing — saves on bubble wrap and halves the box count for the linen closet.",
      dueOffsetDays: -2,
      category: "home",
      done: false,
    },
    {
      id: "defrost-fridge",
      title: "Defrost and empty the fridge",
      detail:
        "Switch the fridge and freezer off 24 hours before the move and defrost them so water does not leak during transport; keep a cooler for anything you keep cold.",
      dueOffsetDays: -1,
      category: "home",
      done: false,
    },
  ];
}

function seedPlan(): MovePlan {
  const createdAt = new Date("2026-10-01T12:00:00.000Z").toISOString();
  return {
    id: "demo",
    fromName: "Helsinki",
    fromLat: 60.16986,
    fromLon: 24.9384,
    toName: "Tampere",
    toLat: 61.49775,
    toLon: 23.76095,
    moveDate: "2026-11-15",
    homeSize: "2-room (55 m²)",
    checklist: makeChecklist(),
    createdAt,
  };
}

if (!getPlan("demo")) {
  putPlan(seedPlan());
}

export function getPlan(id: string): MovePlan | undefined {
  return readStore().plans[id];
}

export function createPlan(plan: MovePlan): MovePlan {
  putPlan(plan);
  return plan;
}

/** Everything needed to build a plan from the search the visitor just made. */
export type PlanSeed = Pick<
  MovePlan,
  "fromName" | "fromLat" | "fromLon" | "toName" | "toLat" | "toLon" | "moveDate" | "homeSize"
>;

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "x"
  );
}

export function seededPlanId(seed: PlanSeed): string {
  return `s-${slugify(seed.fromName)}-${slugify(seed.toName)}-${seed.moveDate}-${slugify(seed.homeSize)}`;
}

/** Idempotent: the same search context always resolves to the same plan. */
export function ensureSeededPlan(seed: PlanSeed): MovePlan {
  const id = seededPlanId(seed);
  const existing = getPlan(id);
  if (existing) return existing;
  return createPlan({
    ...seed,
    id,
    checklist: makeChecklist(),
    createdAt: new Date().toISOString(),
  });
}

export function updatePlan(plan: MovePlan): MovePlan {
  putPlan(plan);
  return plan;
}

export type PatchOutcome = { ok: true; plan: MovePlan } | { ok: false; error: string };

export function patchChecklistItem(id: string, itemId: string, done: boolean): PatchOutcome {
  const plan = getPlan(id);
  if (!plan) return { ok: false, error: "Plan not found" };
  const item = plan.checklist.find((entry) => entry.id === itemId);
  if (!item) return { ok: false, error: `Checklist item '${itemId}' not found` };
  item.done = done;
  putPlan(plan);
  return { ok: true, plan };
}
