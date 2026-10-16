# Soft Landing

A moving-day copilot, built for the JunctionXIf challenge by If Insurance.

Moving is one of the most stressful life events — 88% of Finns report negative stress around it, and 1 in 5 arrives with something broken or missing. Soft Landing plans the move around the weather, not around insurance. Coverage only shows up when it is quietly reassuring: "your things travel covered."

## What it does

- **Pick a safe day** — a live 7-day forecast (Open-Meteo, no signup) scored for moving risk: ice near 0 °C, wind gusts, rain and snow. Best day of the week highlighted; calm warning if your chosen day looks risky.
- **Everything on one list** — a checklist paced around your date: DVV muuttoilmoitus, Posti mail forwarding, electricity contract, moving-elevator booking (taloyhtiö), fragile-item packing, fridge defrost.
- **Address change in one click** — files DVV + Posti notifications from one button (mock).
- **Coverage in the background** — one quiet card: belongings are covered in transit, plus the one habit that prevents most moving damage.

## Run it

```bash
cd soft-landing
npm install   # already installed in this workspace
npm run build
npx next start -p 4517
```

Open http://localhost:4517 — **"See a demo plan"** jumps straight into a seeded plan (`/plan/demo`).

## Stack

- Next.js 16 (App Router, TS, Tailwind v4, Cache Components)
- In-memory mock store (`lib/store.ts`) — mockup only, no database needed
- Live data: [Open-Meteo forecast + geocoding APIs](https://open-meteo.com)
- Design: warm-paper surfaces, Lora display + DM Sans, Lucide icons (inspired by sincehq)

## Layout

- `app/page.tsx` — landing (stats + how it works)
- `app/onboarding/` — 2-step wizard: geocoded addresses → date + home size
- `app/plan/[id]/` — dashboard: weather strip, best-day callout, checklist timeline, one-click address change, coverage aside
- `app/api/` — `geocode`, `weather`, `plan` (+ `plan/[id]/address-change`)
- `lib/` — types, file-backed plan store (shared across page and route module instances), weather risk scoring
