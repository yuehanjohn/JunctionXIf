import { SERVICE_LABELS, type Mover, type MoverService } from "./movers";
import type { WeatherDay } from "./types";

export type HomeSize = "Studio" | "1–2 rooms" | "3+ rooms" | "House";

export const HOME_SIZES: HomeSize[] = ["Studio", "1–2 rooms", "3+ rooms", "House"];

/** Estimated move volume in m³ — the number every quote is derived from. */
const VOLUME_M3: Record<HomeSize, number> = {
  Studio: 15,
  "1–2 rooms": 25,
  "3+ rooms": 40,
  House: 70,
};

/** Flat € add-ons for optional services (per move, not per hour). */
const SERVICE_FEE: Record<Exclude<MoverService, "assembly">, number> = {
  packing: 180,
  storage: 120,
  piano: 240,
  cleaning: 210,
};

/**
 * Rough insured value of household contents per home size — used to flag
 * when an operator's damage cover leaves a gap. Illustrative averages.
 */
export const CONTENTS_VALUE: Record<HomeSize, number> = {
  Studio: 20000,
  "1–2 rooms": 35000,
  "3+ rooms": 55000,
  House: 85000,
};

export type PriceLine = {
  label: string;
  amount: number;
  note?: string;
};

export type Quote = {
  moverId: string;
  total: number;
  lines: PriceLine[];
  /** Effective multiplier from weekday/weekend, surfaced so nothing is hidden. */
  dayFactor: number;
};

export function haversineKm(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number }
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Deterministic quote builder. Every euro is traceable to a line item —
 * this is the product promise, so the engine stays dead simple.
 */
export function quote(
  mover: Mover,
  input: {
    from: { lat: number; lon: number };
    to: { lat: number; lon: number };
    homeSize: HomeSize;
    date: string; // YYYY-MM-DD
    services: MoverService[];
    dayScore?: number; // 0–100 moving-conditions score
  }
): Quote {
  const volume = VOLUME_M3[input.homeSize];
  const km = Math.max(5, Math.round(haversineKm(input.from, input.to)));

  // Loading + transport + unloading labour, rounded up to the half hour.
  const baseHours = 3 + volume / 12 + km / 90;
  const hours = Math.max(mover.minHours, Math.ceil(baseHours * 2) / 2);

  const weekday = new Date(`${input.date}T12:00:00Z`).getUTCDay();
  const isWeekend = weekday === 0 || weekday === 5 || weekday === 6;
  const dayFactor = isWeekend ? mover.weekendFactor : 1;

  const labour = Math.round(hours * mover.crew * mover.hourlyRate * dayFactor);
  const mileage = Math.round(km * mover.mileagePerKm);

  const lines: PriceLine[] = [
    {
      label: "Labour",
      amount: labour,
      note: `${mover.crew} movers × ${hours} h × €${mover.hourlyRate}/h${
        dayFactor !== 1 ? ` × ${dayFactor.toFixed(2)} weekend factor` : ""
      }`,
    },
    {
      label: `Van & fuel (${km} km)`,
      amount: mileage,
      note: `€${mover.mileagePerKm}/km`,
    },
  ];

  for (const service of ["packing", "storage", "piano", "cleaning"] as const) {
    if (!input.services.includes(service)) continue;
    if (!mover.services.includes(service)) continue;
    lines.push({ label: SERVICE_LABELS[service], amount: SERVICE_FEE[service] });
  }

  if (input.services.includes("assembly") && mover.services.includes("assembly")) {
    const assembly = Math.round(1.5 * mover.hourlyRate * mover.crew);
    lines.push({
      label: SERVICE_LABELS.assembly,
      amount: assembly,
      note: "1.5 h at labour rate",
    });
  }

  if ((input.dayScore ?? 100) < 45 && mover.weatherRiskFee > 0) {
    lines.push({
      label: "Winter handling",
      amount: mover.weatherRiskFee,
      note: "Floor protection & salt for icy loading zones",
    });
  }

  const total = lines.reduce((sum, line) => sum + line.amount, 0);
  return { moverId: mover.id, total, lines, dayFactor };
}

/** Unavailable services the customer asked for but this mover doesn't offer. */
export function missingServices(mover: Mover, services: MoverService[]): MoverService[] {
  return services.filter((s) => !mover.services.includes(s));
}

/** Best weather day inside the forecast window, skipping the past. */
export function bestDay(days: WeatherDay[], fromDate: string): WeatherDay | undefined {
  return days
    .filter((d) => d.date >= fromDate)
    .slice()
    .sort((a, b) => b.score - a.score)[0];
}

export function euro(n: number): string {
  return `€${n.toLocaleString("fi-FI")}`;
}
