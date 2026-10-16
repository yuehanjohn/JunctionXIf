export type WeatherDay = {
  date: string;
  tMax: number;
  tMin: number;
  precip: number;
  snow: number;
  gust: number;
  score: number;
  label: "good" | "ok" | "risky";
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
};
