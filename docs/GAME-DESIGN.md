# SUPERNOVA — Game Design

The design goal: a game a stranger understands in five seconds and is still
playing five hours later. Every system below exists to serve one of two feelings —
**"that felt good"** (moment-to-moment) or **"I want to come back"** (retention).

## The core loop

```
        ┌──────────────────────────────────────────────┐
        │                                              │
   TAP ─┴─→ IGNITE (buy generators) ─→ SURGE (flares) ─┴─→ COLLAPSE (Supernova)
        │                                              │
        └──────────────────  repeat, stronger  ───────┘
```

## Systems & the feeling each delivers

### Tapping — *immediate agency*
Base energy per tap, boosted by tap upgrades, a combo multiplier, and (late game)
a percentage of your energy/sec via "coupling" upgrades. Every tap fires
particles, a floating number, and a tone that **rises with your combo**. The hand
learns the reward loop within seconds.

### Generators — *numbers go up*
12 tiers from Spark to Universe. Cost grows geometrically (×~1.12–1.17 per unit);
output is linear in count. Higher tiers cost far more but are more efficient over
time, which creates the classic "save up for the shiny new thing" tension. A
locked next-tier teaser is always visible — you can see what you're climbing toward.

### Upgrades — *a steady drip of unlocks*
Per-generator "×N" upgrades unlock at ownership thresholds (10/25/50/100/200), plus
global "cosmic" multipliers and tap upgrades. Dozens of them, each a small hit of
progress. Availability is gated so the shop is never empty and never overwhelming.

### Solar Flares — *variable reward (the hook)*
Golden orbs drift across the screen at **unpredictable** intervals. Tapping one
grants a random payoff: an instant **Surge**, a 15s **Frenzy** (×7 production), a
15s **Tap-Storm** (×10 tap), or a rare **Jackpot**. Unpredictable rewards are the
single most powerful retention mechanic in games; here they're generous and never
punishing.

### Supernova (prestige) — *the meta that never ends*
When your run is big enough, collapse it for **Stardust** (∝ run energy^0.35).
Energy, generators, and upgrades reset; Stardust, skills, achievements, cosmetics,
and a **permanent +3%-per-lifetime-Stardust** production bonus persist. Resetting
makes you *stronger*, so it feels like progress, not loss. First Supernova lands at
~23 min (active) / ~32 min (idle) — early enough to teach the loop, late enough to
earn it.

### Skill tree — *spend the meta currency*
Nine nodes with dependencies: more production, more Stardust, stronger taps, better
flares, longer offline, faster combos, a head start each run, and cheaper novas.
Gives Stardust a home and every prestige a decision.

### Achievements — *frequent little wins*
25+ milestones (taps, energy, ownership, flares, prestige, rate, plus a secret).
Each grants a small **permanent global multiplier**, so they compound — chasing
them is chasing power.

### Offline & daily — *reasons to return*
Your cosmos produces while you're away (50% efficiency base, extendable, 24h+ cap).
A "welcome back" modal shows the payout with an opt-in "double it". A daily bonus
escalates with a streak. Both are gentle return hooks, not FOMO traps.

## Game feel (juice)

- Particle bursts + floating numbers on every tap and flare (imperative DOM, off the
  React render path → 60fps).
- Combo meter that climbs with rapid tapping and decays.
- Core that breathes faster as production grows; rotating halo; glow that pulses.
- Procedural WebAudio: tap tones that rise with combo, flare chords, achievement and
  prestige fanfares, an optional ambient pad.
- Screen-reader labels, full keyboard play (Space/Enter taps the core), and a
  **Reduced Motion** setting that strips particles/animations.

## Balancing philosophy

- **Snappy open**: first generator in seconds, second within a couple of minutes.
- **Reward presence**: active tapping meaningfully accelerates early game…
- **…but never require it**: idle progress is always healthy.
- Tuned against a real economy simulator (`scripts/sim.ts`) rather than by guesswork.

## Deliberate ethical lines

No real-money randomized rewards (loot boxes), no countdowns that punish absence,
no manipulative "your progress will be lost" pressure. It's a toy that respects the
player — which is also why they come back.
