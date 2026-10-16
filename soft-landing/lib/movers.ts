// Illustrative marketplace data for the hackathon mockup. No real operator
// is represented; profiles and rates are invented but shaped to be plausible
// for the Finnish market (prices incl. VAT).

export type MoverService = "packing" | "storage" | "piano" | "assembly" | "cleaning";

export const SERVICE_LABELS: Record<MoverService, string> = {
  packing: "Packing",
  storage: "Storage",
  piano: "Piano & special items",
  assembly: "Furniture assembly",
  cleaning: "Move-out cleaning",
};

export type Mover = {
  id: string;
  name: string;
  tagline: string;
  city: string;
  rating: number;
  reviews: number;
  /** % of moves that end in a damage claim — our trust metric. */
  damageRate: number;
  onTimeRate: number;
  crew: number;
  vans: number;
  services: MoverService[];
  pros: string[];
  cons: string[];
  /** € per mover-hour, labour only. */
  hourlyRate: number;
  minHours: number;
  /** € per km for the van leg. */
  mileagePerKm: number;
  /** Labour multiplier for Fri–Sun. */
  weekendFactor: number;
  /** € flat handling fee when the moving-day score is risky (ice/snow). */
  weatherRiskFee: number;
  /** True when the price is locked at booking, not "estimated". */
  priceLock: boolean;
  /** Included damage cover in €. If tops this up. */
  insuranceCap: number;
  instantBooking: boolean;
};

export const MOVERS: Mover[] = [
  {
    id: "kotikarry",
    name: "Kotikärry",
    tagline: "Helsinki locals since 2011. Small crew, honest math.",
    city: "Helsinki",
    rating: 4.6,
    reviews: 412,
    damageRate: 0.6,
    onTimeRate: 94,
    crew: 3,
    vans: 1,
    services: ["assembly"],
    pros: ["No weekend surcharge", "Hourly billing stops at the door", "Instant booking"],
    cons: ["No storage", "No packing service", "One van — large houses need two rounds"],
    hourlyRate: 38,
    minHours: 3,
    mileagePerKm: 1.1,
    weekendFactor: 1.0,
    weatherRiskFee: 40,
    priceLock: true,
    insuranceCap: 20000,
    instantBooking: true,
  },
  {
    id: "nordmove",
    name: "NordMove",
    tagline: "National network, white-glove standard, forensic inventory.",
    city: "Espoo",
    rating: 4.8,
    reviews: 1893,
    damageRate: 0.2,
    onTimeRate: 98,
    crew: 4,
    vans: 2,
    services: ["packing", "storage", "piano", "assembly", "cleaning"],
    pros: ["Lowest damage rate we track", "Photo inventory of every box", "Storage included 14 days"],
    cons: ["Highest labour rate", "Weekend +25%"],
    hourlyRate: 54,
    minHours: 4,
    mileagePerKm: 1.4,
    weekendFactor: 1.25,
    weatherRiskFee: 0,
    priceLock: true,
    insuranceCap: 50000,
    instantBooking: true,
  },
  {
    id: "muuttobussi",
    name: "Muuttobussi",
    tagline: "Two movers, one big van, zero frills.",
    city: "Vantaa",
    rating: 4.2,
    reviews: 267,
    damageRate: 1.1,
    onTimeRate: 89,
    crew: 2,
    vans: 1,
    services: [],
    pros: ["Cheapest crew on the platform", "Great for small flats"],
    cons: ["No packing or assembly", "Small crew — 3+ rooms run into overtime", "Damage cover capped low"],
    hourlyRate: 32,
    minHours: 2,
    mileagePerKm: 1.0,
    weekendFactor: 1.15,
    weatherRiskFee: 60,
    priceLock: true,
    insuranceCap: 8000,
    instantBooking: true,
  },
  {
    id: "fenix",
    name: "Fenix Moving",
    tagline: "Full-service concierge. You hand over keys, that's it.",
    city: "Helsinki",
    rating: 4.7,
    reviews: 654,
    damageRate: 0.3,
    onTimeRate: 97,
    crew: 4,
    vans: 2,
    services: ["packing", "storage", "piano", "assembly", "cleaning"],
    pros: ["Packs, cleans, disassembles, reassembles", "Piano and art handling certified", "Highest damage cover"],
    cons: ["Price confirmed within 24h — not instant", "Noticeable premium over self-pack"],
    hourlyRate: 62,
    minHours: 4,
    mileagePerKm: 1.3,
    weekendFactor: 1.1,
    weatherRiskFee: 0,
    priceLock: false,
    insuranceCap: 75000,
    instantBooking: false,
  },
  {
    id: "lohko",
    name: "Lohko Logistics",
    tagline: "Long-distance and storage specialist. Built for cross-country moves.",
    city: "Tampere",
    rating: 4.5,
    reviews: 378,
    damageRate: 0.5,
    onTimeRate: 92,
    crew: 3,
    vans: 1,
    services: ["storage", "packing"],
    pros: ["Flat van rate — long distances stay cheap", "Months of storage available"],
    cons: ["Weekend +30%", "Weekday slots fill first"],
    hourlyRate: 42,
    minHours: 4,
    mileagePerKm: 0.8,
    weekendFactor: 1.3,
    weatherRiskFee: 50,
    priceLock: true,
    insuranceCap: 30000,
    instantBooking: true,
  },
  {
    id: "sisu",
    name: "Sisu Crew",
    tagline: "Student-run movers. Cheap, cheerful, bring your own tape.",
    city: "Helsinki",
    rating: 4.1,
    reviews: 158,
    damageRate: 1.8,
    onTimeRate: 85,
    crew: 2,
    vans: 1,
    services: ["assembly"],
    pros: ["Lowest hourly rate", "Flexible on short notice"],
    cons: ["Highest damage rate we track", "No packing service", "Cover capped at €2,000"],
    hourlyRate: 27,
    minHours: 2,
    mileagePerKm: 0.9,
    weekendFactor: 1.1,
    weatherRiskFee: 70,
    priceLock: true,
    insuranceCap: 2000,
    instantBooking: true,
  },
];

export function getMover(id: string): Mover | undefined {
  return MOVERS.find((m) => m.id === id);
}
