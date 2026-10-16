export type WeatherLabel = "good" | "ok" | "risky";

export type WeatherDay = {
  date: string;
  tMax: number;
  tMin: number;
  precip: number;
  snow: number;
  gust: number;
  score: number;
  label: WeatherLabel;
  /** Best ≥3 h loading window for this day; null when none qualifies, undefined when hourly data was unavailable. */
  bestWindow?: MovingWindow | null;
};

/** One scored forecast hour (local time, Europe/Helsinki). */
export type WeatherHour = {
  /** Local ISO timestamp, e.g. "2026-10-24T09:00". */
  time: string;
  /** Local hour of day, 0–23. */
  hour: number;
  /** Temperature °C. */
  t: number;
  /** Precipitation mm that hour. */
  precip: number;
  /** Snowfall cm that hour. */
  snow: number;
  /** Wind gust km/h. */
  gust: number;
  score: number;
  label: WeatherLabel;
};

/** Best contiguous ≥3 h loading span inside 08:00–20:00 local for one day. */
export type MovingWindow = {
  date: string;
  /** Local start hour, 08–19. */
  startHour: number;
  /** Local end hour, exclusive (≤ 20). */
  endHour: number;
  /** Cumulative precipitation mm across the window. */
  precip: number;
  /** Cumulative snowfall cm across the window. */
  snow: number;
  /** Worst gust km/h inside the window. */
  maxGust: number;
  /** Lowest hourly score inside the window — the worst hour defines it. */
  score: number;
  label: WeatherLabel;
};

export type ChecklistItem = {
  id: string;
  title: string;
  detail: string;
  dueOffsetDays: number;
  category: "official" | "home" | "utilities" | "coverage";
  done: boolean;
};

export type MovePlan = {
  id: string;
  fromName: string;
  fromLat: number;
  fromLon: number;
  toName: string;
  toLat: number;
  toLon: number;
  moveDate: string;
  homeSize: string;
  checklist: ChecklistItem[];
  createdAt: string;
  /** Move date the one-click DVV + Posti filing was actually made for. */
  addressChangeFiledFor?: string;
};
