import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createPlan, getPlan, makeChecklist, patchChecklistItem } from "@/lib/store";
import type { MovePlan } from "@/lib/types";

type PlanBody = {
  fromName?: string;
  fromLat?: number;
  fromLon?: number;
  toName?: string;
  toLat?: number;
  toLon?: number;
  moveDate?: string;
  homeSize?: string;
};

type PatchBody = {
  itemId?: string;
  done?: boolean;
};

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ ok: false, error: "Missing 'id' query parameter" }, { status: 400 });
  }
  const plan = getPlan(id);
  if (!plan) {
    return NextResponse.json({ ok: false, error: "Plan not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, plan });
}

export async function PATCH(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ ok: false, error: "Missing 'id' query parameter" }, { status: 400 });
  }

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Request body must be valid JSON" }, { status: 400 });
  }

  if (!body.itemId || typeof body.done !== "boolean") {
    return NextResponse.json({ ok: false, error: "Body must include itemId (string) and done (boolean)" }, { status: 400 });
  }

  const outcome = patchChecklistItem(id, body.itemId, body.done);
  if (!outcome.ok) {
    return NextResponse.json({ ok: false, error: outcome.error }, { status: 404 });
  }
  return NextResponse.json({ ok: true, plan: outcome.plan });
}

export async function POST(request: NextRequest) {
  let body: PlanBody;
  try {
    body = (await request.json()) as PlanBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Request body must be valid JSON" }, { status: 400 });
  }

  const required = ["fromName", "fromLat", "fromLon", "toName", "toLat", "toLon", "moveDate", "homeSize"] as const;
  const missing = required.filter((key) => body[key] === undefined || body[key] === "");
  if (missing.length > 0) {
    return NextResponse.json({ ok: false, error: `Missing fields: ${missing.join(", ")}` }, { status: 400 });
  }

  const plan: MovePlan = {
    id: crypto.randomUUID(),
    fromName: String(body.fromName),
    fromLat: Number(body.fromLat),
    fromLon: Number(body.fromLon),
    toName: String(body.toName),
    toLat: Number(body.toLat),
    toLon: Number(body.toLon),
    moveDate: String(body.moveDate),
    homeSize: String(body.homeSize),
    checklist: makeChecklist(),
    createdAt: new Date().toISOString(),
  };

  return NextResponse.json({ ok: true, plan: createPlan(plan) });
}
