import type { ChecklistItem, MovePlan } from "./types";

const plans = new Map<string, MovePlan>();

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

plans.set("demo", seedPlan());

export function getPlan(id: string): MovePlan | undefined {
  return plans.get(id);
}

export function createPlan(plan: MovePlan): MovePlan {
  plans.set(plan.id, plan);
  return plan;
}

export function updatePlan(plan: MovePlan): MovePlan {
  plans.set(plan.id, plan);
  return plan;
}

export type PatchOutcome = { ok: true; plan: MovePlan } | { ok: false; error: string };

export function patchChecklistItem(id: string, itemId: string, done: boolean): PatchOutcome {
  const plan = plans.get(id);
  if (!plan) return { ok: false, error: "Plan not found" };
  const item = plan.checklist.find((entry) => entry.id === itemId);
  if (!item) return { ok: false, error: `Checklist item '${itemId}' not found` };
  item.done = done;
  return { ok: true, plan };
}
