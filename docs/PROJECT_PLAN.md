# SUPERNOVA — Project Plan & Roadmap

**Product:** SUPERNOVA — an idle/incremental game. Tap a spark, build a universe, go
Supernova, do it again — bigger. Fully client-side, free to host, monetizes via ads +
a Supporter Pack.

Legend: `[ ]` todo · `[~]` in progress · `[x]` done

## Phase 0 — Foundation
- [x] Master prompt + roadmap (repointed to SUPERNOVA)
- [x] Stack: Next.js + TS + Tailwind (lean, no backend), design tokens
- [ ] Root layout, fonts, metadata; utils (cn, format)

## Phase 1 — Engine (pure, testable)
- [ ] `types.ts` — game state, generators, upgrades, achievements
- [ ] `format.ts` — big-number formatting (K/M/B/T/… → scientific), time, rates
- [ ] `config.ts` — content: generator tiers, upgrades, achievements, balance curves
- [ ] `engine.ts` — cost/bulk-cost, production/sec, tick, buy, prestige math, offline
- [ ] `save.ts` — Zod schema, versioning/migration, serialize, export/import
- [ ] Unit tests for engine + format + save

## Phase 2 — Runtime & feel
- [ ] `audio.ts` — WebAudio synth (tap tones, combo pitch, flare, milestone fanfare)
- [ ] `useGame` hook — RAF loop, refs↔snapshot, autosave, offline catch-up, actions
- [ ] Particle + floating-number system (performant, DOM/canvas)

## Phase 3 — Core play (the fun slice)
- [ ] The Core: big tappable star with juice (particles, shake, glow, sound)
- [ ] Energy HUD (amount, per-second, per-tap), combo meter
- [ ] Generator list: buy x1/x10/xMax, cost, output, owned, unlock gating
- [ ] Solar Flare spawns + collect surge (variable reward)
- [ ] Toasts (unlocks, achievements, events)

## Phase 4 — Progression & meta
- [ ] Upgrades panel (per-generator + global multipliers, unlock conditions)
- [ ] Supernova (prestige): preview stardust, confirm, reset, permanent boost
- [ ] Stardust skill tree (spend stardust on permanent perks)
- [ ] Achievements panel + rewards
- [ ] Daily bonus + streak
- [ ] Offline earnings "welcome back" modal

## Phase 5 — Shell & polish
- [ ] Landing page (hero, live demo teaser, features, CTA, SEO/OG)
- [ ] Game shell: tabs (Cosmos / Upgrades / Skills / Stats / Settings)
- [ ] Stats page (lifetime numbers, run stats)
- [ ] Settings (sound/music volume, reduced motion, notation, export/import, hard reset)
- [ ] Responsive + mobile tap ergonomics + a11y + reduced-motion
- [ ] PWA (manifest, service worker, installable, offline)

## Phase 6 — Monetize & ship
- [ ] Ad seams (rewarded "flare boost" + interstitial on prestige) — stubbed, documented
- [ ] Supporter Pack (remove ads, cosmetic star skins, +permanent boost) — payment-link seam
- [ ] Cosmetic star/theme skins (some free, some Supporter)
- [ ] Share card (canvas image of your universe + stats)
- [ ] README, DEPLOY (Vercel), MONETIZATION playbook, GAME-DESIGN doc

## Phase 7+ — Depth (never run out)
- [ ] More generator tiers + upgrade branches; rebalance curves
- [ ] Second prestige layer (e.g., "Multiverse") for very-late game
- [ ] Timed events / challenges (limited modifiers for bonus rewards)
- [ ] More achievements; secret achievements
- [ ] Golden-flare variants (frenzy, cash-out, click-power)
- [ ] Generative ambient audio that reacts to production
- [ ] Optional cloud save / global leaderboard (later; needs tiny backend)
- [ ] Analytics hook (privacy-friendly) for the owner
- [ ] Copy polish, onboarding, tutorial beats, tooltips
- [ ] Performance passes; big-number safety (beyond 1e308 via mantissa/exp)

## Monetization model (for the owner)
- **Traffic**: SEO landing + shareable results → organic. Free to play, instant, no signup.
- **Ads**: rewarded video (optional boosts) + light interstitial on prestige (AdSense/other).
- **Supporter Pack**: one-time purchase (Stripe payment link / Gumroad) — removes ads,
  unlocks cosmetic skins, small permanent boost.
- **Zero server cost** → ~100% margin on ad + IAP revenue. Scales with players.
