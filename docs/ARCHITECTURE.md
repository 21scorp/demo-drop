# SUPERNOVA — Architecture

A deliberately layered design: **pure math at the bottom, React at the top**, with a
single runtime store bridging them. The bottom layers have no framework or browser
dependencies, so they're trivially testable and could be reused on a server or in a
worker later.

```
┌─────────────────────────────────────────────────────────────┐
│  React (App Router)                                          │
│   app/page.tsx (landing) · app/play/page.tsx                 │
│   components/game/*  ← presentational, read live store       │
├─────────────────────────────────────────────────────────────┤
│  GameProvider (context + useSyncExternalStore)               │
│   owns lifecycle: start/stop loop, visibility, supporter URL │
├─────────────────────────────────────────────────────────────┤
│  store.ts  ← the runtime                                     │
│   RAF loop · combos · flares · buffs · toasts · autosave ·   │
│   offline · daily · actions · plays audio                    │
├───────────────┬───────────────────────────┬─────────────────┤
│  engine.ts    │  save.ts                   │  audio.ts       │
│  (pure math)  │  (persistence + Zod)       │  (WebAudio)     │
├───────────────┴───────────────────────────┴─────────────────┤
│  config.ts (content)  ·  types.ts  ·  format.ts              │
└─────────────────────────────────────────────────────────────┘
```

## Layers

### `lib/game/format.ts` — number & time formatting
Big-number formatting (K/M/B/T → two-letter suffixes → scientific), plus durations
and countdowns. Pure, unit-tested, handles up to the edge of the double range and
`Infinity`.

### `lib/game/types.ts` — the domain model
Content definitions (generators, upgrades, skills, achievements, skins) and the
persistent `GameState`, separated from runtime-only shapes (flares, buffs, toasts).

### `lib/game/config.ts` — the content
All game content and balance in one place: 12 generators, auto-generated +
hand-authored upgrades, a 9-node skill tree, 25+ achievements, cosmetic skins, and
the balance constants. Editing this file changes the game without touching logic.

### `lib/game/engine.ts` — pure game logic
Every calculation as a function of `(state, config)`: costs (single/bulk/max-
affordable), multipliers, production, tap power, prestige gain, offline earnings,
and the mutation helpers (`buyGenerator`, `buyUpgrade`, `buySkill`, `supernova`).
No React, no DOM, no wall-clock — time is always passed in. **This is what the
tests pin down.**

### `lib/game/save.ts` — persistence
Default state, `localStorage` load/save, versioned migration, and validated
export/import. A **Zod** schema with per-field `.catch(...)` defaults means a
corrupt, partial, or hostile save can never crash the game — it degrades to sane
values or a fresh universe.

### `lib/game/audio.ts` — sound
A small procedural WebAudio engine (oscillators + envelopes, no asset files).
Created lazily on the first user gesture; volumes driven by settings.

### `lib/game/store.ts` — the runtime
Owns the live `GameState` and the `requestAnimationFrame` loop. Each frame it
accrues production, decays combos, expires buffs, spawns/expires flares, and (on a
~16fps throttle) recomputes derived values, scans achievements, and **notifies**
subscribers. Autosaves every 10s and on tab-hide. Applies offline catch-up on load
and on tab-return. All player actions live here and play their own sounds.

## The React bridge — why `useSyncExternalStore`

React can't render at 60fps without jank, and idle games mutate state constantly.
So state lives in the mutable store; the loop bumps a monotonic **tick** at ~16fps
and calls listeners. Components subscribe via `useGameTick()`
(`useSyncExternalStore`) and read live values straight off the store object
(`store.state`, `store.derived`, `store.liveEps()`). This gives smooth numbers with
controlled, batched re-renders.

Hot paths that must feel instant — tap particles, floating numbers, flare bursts —
bypass React entirely and animate DOM nodes imperatively via the Web Animations API.

## Rendering & deploy

Both routes are statically prerendered. The landing page is a Server Component (SEO,
zero JS beyond hydration); the game is a Client Component tree under `GameProvider`.
No API routes, no database — the entire thing is static assets + client JS, which is
why it hosts for free and scales without limit.

## Testing

`vitest` covers the pure layers — `format`, `engine`, and `save` — including bulk-
cost math, max-affordable never overspending, multiplier composition, prestige
reset semantics, offline caps, and save resilience against hostile input. The
`scripts/sim.ts` economy simulator is a design tool, not a test: it plays the real
engine to report time-to-milestones for balancing.
