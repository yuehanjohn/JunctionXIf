import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getPlan, updatePlan } from "@/lib/store";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const plan = getPlan(id);
  if (!plan) {
    return NextResponse.json({ ok: false, error: "Plan not found" }, { status: 404 });
  }

  const notifications: { service: string; status: string }[] = [
    {
      service: "DVV muuttoilmoitus",
      status: "sent",
    },
    {
      service: "Posti mail forwarding",
      status: "sent",
    },
  ];

  const item = plan.checklist.find((entry) => entry.id === "dvv-notification");
  if (item) item.done = true;
  const postiItem = plan.checklist.find((entry) => entry.id === "posti-forwarding");
  if (postiItem) postiItem.done = true;

  return NextResponse.json({ ok: true, plan: updatePlan(plan), notifications });
}
