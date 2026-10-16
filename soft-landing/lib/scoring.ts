import type { WeatherDay } from "./types";

type WeatherInput = Pick<WeatherDay, "tMax" | "tMin" | "precip" | "snow" | "gust">;

// Freeze risk is the dominant Finnish moving hazard: near-zero temps with
// precipitation create ice on sidewalks, stairs and loading zones.
export function scoreWeatherDay(day: WeatherInput): number {
  let score = 100;
  if (day.tMin <= 1 && (day.snow > 0 || day.precip > 0)) score -= 35;
  if (day.gust >= 50) score -= 25;
  if (day.precip >= 5) score -= 20;
  if (day.snow >= 3) score -= 15;
  if (day.gust >= 35 || day.precip >= 1) score -= 10;
  return Math.max(0, Math.min(100, score));
}

export function labelForScore(score: number): WeatherDay["label"] {
  if (score >= 70) return "good";
  if (score >= 45) return "ok";
  return "risky";
}
