# Soft Landing

A moving-day copilot, built for the JunctionXIf challenge by If Insurance.

Moving is one of the most stressful life events — 88% of Finns report negative stress around it, and 1 in 5 arrives with something broken or missing. Soft Landing plans the move around the weather, not around insurance. Coverage only shows up when it is quietly reassuring: "your things travel covered."

## What it does

- **Compare movers like flights** — a Skyscanner for Finnish moving companies: 13 vetted operators, side-by-side fixed quotes from one open formula (`crew × hours × rate × day-factor + km × van rate + extras`), damage rates and cover caps public on every card.
- **Cheapest price points, not just cheapest crew** — every day in the 16-day strip carries the lowest total any operator with open slots quotes for it; the cheapest day is marked and one click away, with the savings printed. Month-end days and the June–July season carry a printed demand multiplier on labour; crews sell out deterministically (per-mover daily capacity) and sold-out cards say so and point at the cheapest open day.
- **Pick a safe day** — a live 7-day forecast (Open-Meteo, no signup) scored for moving risk: ice near 0 °C, wind gusts, rain and snow. Best day of the week highlighted; calm warning if your chosen day looks risky.
- **If home insurance after the booking** — holding a crew triggers the recommendation for the new home: a personalised monthly premium (home type × build year × deductible, every factor printed) from the same open rule, transit cover included as standard, and an email lead capture.
- **Booking follows you** — holding a crew writes it into the moving plan (`POST /api/plan/booking`): crew + price badge on the plan, cover card in the aside, and a "confirm the crew" checklist task three days out.
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
- `app/search/` — the comparison: price-per-day strip, ranked mover cards, If home-insurance offer
- `app/plan/[id]/` — dashboard: weather strip, best-day callout, checklist timeline, one-click address change, coverage aside
- `app/api/` — `geocode`, `weather`, `plan` (+ `plan/[id]/address-change`)
- `lib/` — types, file-backed plan store (shared across page and route module instances), weather risk scoring
