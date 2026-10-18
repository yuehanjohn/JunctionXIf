import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { attachBooking, ensureSeededPlan, seededPlanId } from "@/lib/store";
import type { PlanSeed } from "@/lib/store";
import type { Booking } from "@/lib/types";

type BookingBody = {
  seed?: Partial<PlanSeed>;
  booking?: Partial<Booking>;
};

const SEED_FIELDS = [
  "fromName",
  "fromLat",
  "fromLon",
  "toName",
  "toLat",
  "toLon",
  "moveDate",
  "homeSize",
] as const;

// The plan id is derived from the search context, so the client never picks it.
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(request: NextRequest) {
  let body: BookingBody;
  try {
    body = (await request.json()) as BookingBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Request body must be valid JSON" }, { status: 400 });
  }
  const { seed, booking } = body;
  if (!seed || !booking) {
    return NextResponse.json({ ok: false, error: "Missing 'seed' or 'booking'" }, { status: 400 });
  }
  const missing = SEED_FIELDS.filter((key) => seed[key] === undefined || seed[key] === "");
  if (missing.length > 0) {
    return NextResponse.json({ ok: false, error: `Missing fields: ${missing.join(", ")}` }, { status: 400 });
  }
  const moveDate = String(seed.moveDate);
  if (!DATE_PATTERN.test(moveDate)) {
    return NextResponse.json({ ok: false, error: "moveDate must be YYYY-MM-DD" }, { status: 400 });
  }

  const cleanSeed: PlanSeed = {
    fromName: String(seed.fromName),
    fromLat: Number(seed.fromLat),
    fromLon: Number(seed.fromLon),
    toName: String(seed.toName),
    toLat: Number(seed.toLat),
    toLon: Number(seed.toLon),
    moveDate,
    homeSize: String(seed.homeSize),
  };
  if (![cleanSeed.fromLat, cleanSeed.fromLon, cleanSeed.toLat, cleanSeed.toLon].every(Number.isFinite)) {
    return NextResponse.json({ ok: false, error: "Coordinates must be numbers" }, { status: 400 });
  }

  const cleanBooking: Booking = {
    moverId: String(booking.moverId ?? ""),
    moverName: String(booking.moverName ?? ""),
    price: Number(booking.price),
    insuranceMonthly: Number(booking.insuranceMonthly),
    heldAt: String(booking.heldAt ?? new Date().toISOString()),
  };
  if (
    !cleanBooking.moverId ||
    !cleanBooking.moverName ||
    !Number.isFinite(cleanBooking.price) ||
    cleanBooking.price <= 0 ||
    !Number.isFinite(cleanBooking.insuranceMonthly) ||
    cleanBooking.insuranceMonthly <= 0
  ) {
    return NextResponse.json({ ok: false, error: "Invalid booking payload" }, { status: 400 });
  }

  const plan = ensureSeededPlan(cleanSeed);
  const outcome = attachBooking(seededPlanId(cleanSeed), cleanBooking);
  if (!outcome.ok) {
    return NextResponse.json({ ok: false, error: outcome.error }, { status: 404 });
  }
  return NextResponse.json({ ok: true, plan: outcome.plan });
}
