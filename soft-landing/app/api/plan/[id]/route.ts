import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getPlan, patchChecklistItem } from "@/lib/store";

type PatchBody = {
  itemId?: string;
  done?: boolean;
};

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const plan = getPlan(id);
  if (!plan) {
    return NextResponse.json({ ok: false, error: "Plan not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, plan });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

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
