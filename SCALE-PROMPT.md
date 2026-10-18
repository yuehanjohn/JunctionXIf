# Prompt: scale Soft Landing from hackathon mockup to a genuinely sophisticated product

Copy everything below the line into a long-running agent session in `JunctionXIf/`.

---

## Mission

`soft-landing/` is a Next.js 16 app: a neutral, Skyscanner-style comparison for Finnish moving
companies, operated by If Insurance as a lead magnet. The comparison is the product; If Home
Insurance is the **hidden promotion** — a quiet underwriter woven into the experience, never a
banner. Your job: grow this from a polished hackathon mockup into a deeper, scalable tool —
real data backbone, real mechanisms behind every claim, distribution surfaces, and measurement —
while keeping the honesty that makes it credible.

Work autonomously for as long as it takes. Ship in phases. Every phase must end with the app
built, probed end-to-end, and committed. No phase may leave stubs, mock fallbacks, or TODOs.

## Non-negotiable invariants (violating any of these is a failed phase)

1. **Insurance-only funnel.** No mover cover-gap / top-up product, ever. The operator's
   `insuranceCap` is neutral comparison data (like baggage allowance), never gap-sold.
2. **Open-formula pricing.** Every euro a user sees traces to a line item via `quote()` or
   `homeInsurancePricing()`. No hidden costs, no surge. Demand factors print as lines.
3. **Determinism.** `slotsLeft()` uses the FNV hash — never `Date.now()` or randomness in
   render paths. SSR and hydration must always agree.
4. **The comparison stays neutral.** If never ranks movers up, never injects itself into the
   price comparison. If's edge is data the user can't get elsewhere (weather risk, damage
   rates, prevention) — surfaced honestly, labeled as If's data.
5. **Hidden promotion style.** If surfaces as the quiet row + collapsed "Quote" panel and the
   per-card "Cover check" details. NO scroll hijack, NO banners, NO orange gradient sales
   blocks, NO interstitials. If a surface feels like an ad, redesign it until it doesn't.
6. **Weather honesty.** Beyond ~10 days the forecast is unreliable — fade confidence, never
   strengthen claims.
7. **Illustrative data stays labeled.** Until real feeds exist, operator names/prices/damage
   rates are illustrative and the footer says so. Never mix fake and real data in one surface
   without labeling which is which.

## Current state (start here)

- `soft-landing/` — App Router, TS, Tailwind v4, warm-paper theme, `components/ui.tsx` primitives.
- `lib/pricing.ts` — `quote()`, `demandFor()`, `slotsLeft()`, `homeInsurancePricing()`, `CONTENTS_VALUE`.
- `lib/movers.ts` — 13 illustrative operators with `damageRate`, `dailyCapacity`, service areas.
- `lib/weather.ts` + `lib/scoring.ts` — Open-Meteo daily+hourly, best ≥3 h loading window 08:00–20:00.
- `lib/store.ts` — file-backed plan store (`os.tmpdir()/soft-landing-plans.json`), seeded plan,
  idempotent `attachBooking`.
- `app/search/SearchClient.tsx` — day strip with per-day cheapest prices, mover cards, booking POST,
  hidden If promotion row + premium panel, green-day "€20 off your first year" chip (display-only today).
- `app/plan/[id]/` — checklist dashboard; `app/api/plan/*` — booking + address-change APIs.
- `Booking` = `{moverId, moverName, price, insuranceMonthly, heldAt}` exactly.
- Demo deep link: `/search?fromName=Helsinki&fromLat=60.17&fromLon=24.94&toName=Tampere&toLat=61.4978&toLon=23.7610&date=<future>&size=1–2 rooms`.

## The roadmap — phases in priority order

### Phase 1 — Engine hardening + test spine (do this first, everything builds on it)
- Extract a vitest suite for `lib/pricing.ts`, `lib/scoring.ts`, `lib/store.ts`: golden-quote tests
  (fixed inputs → exact line items), demand-factor boundaries (day 26/27, Jun/Jul), `slotsLeft`
  determinism across calls, insurance factor matrix, store idempotency.
- Give every pure function a documented contract. Refactor only if a test forces it.
- Done when: `npm test` covers every euro-producing and ranking function; build green.

### Phase 2 — Make the safe-day discount real
- The green-day chip is display-only. Turn it into a mechanism: server-issued deterministic promo
  code (`lib/promo.ts` — hash of plan-id + day + weather label, so it's reproducible and auditable),
  stored on the booking, applied as a line item ("Green-day discount −€20/yr" style) in the
  insurance premium panel and the lead payload.
- Risk-model honesty: derive the discount from the day's score (e.g. score ≥ 85 → €20, 70–84 → €10),
  print the rule in the UI footnote. The discount is risk selection, not a bribe — the copy must say
  why it exists (fewer claims on good days).
- Done when: booking a green day yields a stored, code-carrying booking; the code verifies against
  its inputs; a probe demonstrates the full loop.

### Phase 3 — Claims-true mover scoreboard
- Per-city, quarterly leaderboard page (`/scores/[city]`) built from the operator damage data:
  damage rate, on-time rate, trend arrow. Neutral design — it must read as public-interest data,
  not an ad. The comparison page links to it as plain data ("Fewest damage claims" sort already exists).
- Make the data model real enough to swap: define `OperatorRecord` (id, city, period, rates) in
  `lib/operator-data.ts` with the mock as one provider and a clearly-marked JSON import path as
  another. Ranking logic tested.
- Done when: a probe walks search → scoreboard → back; a comment documents exactly what changes
  when If's real claims feed arrives.

### Phase 4 — Contextual prevention engine
- `lib/prevention.ts`: given (build era, home type, weather, season, route), emit 2–3 concrete,
  dated tasks into the plan checklist ("Book a pipe inspection before winter — 1960s building",
  "Icy moving day: order door protection", "High water table in Tampere…"). Each task links to a
  short explainer. No generic safety filler.
- Prevention tasks appear on the plan dashboard and (one line, quiet) in the promotion panel.
- Done when: different seeds (old building/city/winter vs new/summer) produce visibly different,
  correct checklists; unit tests cover the rule table.

### Phase 5 — Distribution: the embeddable widget + SEO surfaces
- A lightweight embeddable comparison widget (`/embed` route, iframe-first): origin/destination/
  date inputs → top 3 results + "Full comparison" link out. No If branding except the quiet
  underwriter line. Ship `public/embed.js` snippet + docs in the README.
- Programmatic landing pages for top city pairs (`/[from]-to-[to]` static generation from a
  route list) with the open formula explained — SEO entry points that answer "what does a move
  from X to Y cost" with the honest formula, not a lead form.
- Done when: the widget renders inside a plain static HTML page via iframe; a landing page for
  Helsinki→Tampere builds statically and shows real per-day prices.

### Phase 6 — Measurement: the growth dashboard
- Event store (JSONL in the same tmp store dir): search, day-select, sort-change, quote-open,
  hold, email-lead — with plan context (city pair, home size, day score).
- `/dashboard` (concept-only page, clearly marked internal): funnel conversion per stage, per
  city pair and per day-score bucket — the "which acquisition surface converts" story. Prove the
  aggregation with a seeded probe.
- Define the exact payload of the "pre-filled If quote application" (the search already encodes
  size, distance, era, day risk) as a typed export from a booking — the integration point for
  If's real quote API, ready but not faked.

### Phase 7 — Depth pass (the sophistication bar)
Skyscanner-level interaction polish, in this order of value:
- Shareable comparison artifact: `/search?...` state is fully URL-encoded (verify) + a "Copy
  comparison link" that produces a compact permalink.
- Forecast-confidence fade on the day strip (opacity + "less reliable" tag past ~10 days).
- Keyboard navigation + focus states across day strip and cards; `prefers-reduced-motion` respected.
- Empty/loading/error states for weather-unavailable days (already partially handled — finish it).
- A price-explanation hover on every euro (line-item tooltip → full breakdown), replacing any
  remaining "trust me" numbers.

## Working agreements

- Verify like this, every phase: `npm run build` → restart `npx next start -p 4517` → probe with
  puppeteer-core + headless Edge (`NODE_PATH=$(npm root -g) node probe.cjs`, delete probes after;
  see the runbook skill for recipes and stale-build traps) → `git commit` with a phase-prefixed message.
- Keep the project + runbook skills updated when architecture or verification changes.
- One commit per phase, message format `phase-N: <what>`. Never batch phases into one commit.
- If a phase turns out to be wrong-headed, stop, write down why in the commit message, and
  propose the better design before building it.

## Definition of done (overall)

A stranger can: search any Finnish city pair, get honest deterministic prices with weather-aware
day choice, hold a crew, receive a real safe-day discount code, get a prevention-aware checklist,
see the neutral claims scoreboard, and hand If a pre-filled quote application — and the embed
widget + landing pages put the whole thing at the top of the funnel for real-estate traffic.
Every step measured, every euro a line item, If present but never loud.
