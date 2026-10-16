import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { fetchWeatherBundle } from "@/lib/weather";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const lat = Number(params.get("lat"));
  const lon = Number(params.get("lon"));
  const days = Math.min(Math.max(Number(params.get("days")) || 16, 1), 16);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ ok: false, error: "lat and lon must be numbers" }, { status: 400 });
  }

  try {
    const bundle = await fetchWeatherBundle(lat, lon, days);
    return NextResponse.json({
      ok: true,
      days: bundle.days,
      hourly: { hours: bundle.hours, windows: bundle.windows },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to reach weather service";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
