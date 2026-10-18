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
 * Rough insured value of household contents per home size — the basis of the
 * home-insurance quote. Illustrative averages.
 */
export const CONTENTS_VALUE: Record<HomeSize, number> = {
  Studio: 20000,
  "1–2 rooms": 35000,
  "3+ rooms": 55000,
  House: 85000,
};

/**
 * Illustrative If home insurance (kotivakuutus) for the new home, priced by
 * the same open rule as everything else on the site: a small base plus a
 * fixed amount for each started €10 000 of contents value, rounded to 10
 * cents — the same gap always costs the same.
 */
export const HOME_INSURANCE = { base: 4.9, per10k: 1.2 } as const;

/** Physical home type — water exposure and building fabric drive the premium. */
export type HomeType = "apartment" | "row" | "detached";

export const HOME_TYPES: { value: HomeType; label: string; factor: number }[] = [
  { value: "apartment", label: "Apartment", factor: 1 },
  { value: "row", label: "Row house", factor: 1.15 },
  { value: "detached", label: "Detached", factor: 1.35 },
];

/** Construction era — old plumbing is the single biggest claim driver. */
export type BuildEra = "post2010" | "1990s" | "1960s" | "pre1960";

export const BUILD_ERAS: { value: BuildEra; label: string; factor: number }[] = [
  { value: "post2010", label: "2010 or newer", factor: 0.9 },
  { value: "1990s", label: "1990–2009", factor: 1 },
  { value: "1960s", label: "1960–1989", factor: 1.15 },
  { value: "pre1960", label: "Before 1960", factor: 1.3 },
];

/** Deductible (omavastuu) — higher self-risk, lower premium. */
export type Deductible = 150 | 300 | 450;

export const DEDUCTIBLES: { value: Deductible; label: string; factor: number }[] = [
  { value: 150, label: "€150", factor: 1 },
  { value: 300, label: "€300", factor: 0.9 },
  { value: 450, label: "€450", factor: 0.82 },
];

export type HomeProfile = {
  homeType: HomeType;
  era: BuildEra;
  deductible: Deductible;
};

export const DEFAULT_PROFILE: HomeProfile = {
  homeType: "apartment",
  era: "1990s",
  deductible: 150,
};

export function homeInsurancePricing(
  homeSize: HomeSize,
  profile: HomeProfile = DEFAULT_PROFILE
): {
  /** Insured contents value for this home size, €. */
  insured: number;
  /** Started €10 000 blocks of contents value. */
  blocks: number;
  /** Monthly premium, €. */
  monthly: number;
  /** The open rule, itemised — printed on the card, one row per factor. */
  lines: { label: string; note: string }[];
} {
  const insured = CONTENTS_VALUE[homeSize];
  const blocks = Math.ceil(insured / 10_000);
  const cover = Math.round((HOME_INSURANCE.base + blocks * HOME_INSURANCE.per10k) * 10) / 10;
  const type = HOME_TYPES.find((t) => t.value === profile.homeType) ?? HOME_TYPES[0];
  const era = BUILD_ERAS.find((e) => e.value === profile.era) ?? BUILD_ERAS[0];
  const ded = DEDUCTIBLES.find((d) => d.value === profile.deductible) ?? DEDUCTIBLES[0];
  const monthly = Math.round(cover * type.factor * era.factor * ded.factor * 10) / 10;

  const lines: { label: string; note: string }[] = [
    {
      label: "Cover",
      note: `${euroCents(HOME_INSURANCE.base)} + ${blocks} × ${euroCents(
        HOME_INSURANCE.per10k
      )} per €10 000 ≈ ${euro(insured)} of contents`,
    },
  ];
  if (type.factor !== 1) {
    lines.push({ label: "Home type", note: `${type.label.toLowerCase()} ×${type.factor}` });
  }
  if (era.factor !== 1) {
    lines.push({ label: "Build year", note: `${era.label} ×${era.factor}` });
  }
  if (ded.factor !== 1) {
    lines.push({ label: "Deductible", note: `${ded.label} omavastuu ×${ded.factor}` });
  }
  return { insured, blocks, monthly, lines };
}

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
  /** Market-demand multiplier for the date, surfaced on the card. */
  demandFactor: number;
};

/**
 * Market demand for a moving date — the reason the price grid moves like a
 * flight calendar. Finnish moving habits: rental contracts turn over at the
 * month boundary (last days + the 1st), and June–July is the peak season.
 */
export type Demand = { factor: number; reason: string | null };

export function demandFor(date: string): Demand {
  const d = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return { factor: 1, reason: null };
  const day = d.getUTCDate();
  const month = d.getUTCMonth(); // 0-based
  let factor = 1;
  const reasons: string[] = [];
  if (day >= 27 || day <= 2) {
    factor *= 1.2;
    reasons.push("end-of-month rush");
  }
  if (month === 5 || month === 6) {
    factor *= 1.15;
    reasons.push("peak moving season");
  }
  return { factor, reason: reasons.join(" + ") || null };
}

// FNV-1a — stable across server and client, so sold-out slots never cause a
// hydration mismatch and the same mover+date always shows the same slots.
function hashStr(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Slots a mover still has open on a date. Deterministic pseudo-availability:
 * demand eats capacity, so month-end days sell out first and busy cheap crews
 * fill before premium ones. 0 = fully booked.
 */
export function slotsLeft(mover: Mover, date: string): number {
  const demand = demandFor(date);
  const draw = hashStr(`${mover.id}:${date}`) % 100; // 0..99
  const taken = Math.round((draw / 100) * mover.dailyCapacity * demand.factor);
  return Math.max(0, mover.dailyCapacity - taken);
}

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

  const demand = demandFor(input.date);
  const labour = Math.round(hours * mover.crew * mover.hourlyRate * dayFactor);
  const demandSurcharge = Math.round(labour * (demand.factor - 1));
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

  if (demandSurcharge > 0) {
    lines.push({
      label: "High-demand day",
      amount: demandSurcharge,
      note: `${demand.reason} · ×${demand.factor.toFixed(2)} on labour — printed, never a hidden surge`,
    });
  }

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
  return { moverId: mover.id, total, lines, dayFactor, demandFactor: demand.factor };
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

/** Like euro(), but keeps cents — for monthly premiums. */
export function euroCents(n: number): string {
  return `€${n.toFixed(2)}`;
}
