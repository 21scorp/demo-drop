# Changelog

All notable work on SUPERNOVA. This project was built in one focused session from
an abandoned prototype into a complete, shippable idle game.

## 1.0.0 — Launch build

### Game
- **Core loop**: tappable star with particles, floating numbers, rising-combo audio,
  and a breathing/rotating visual that reacts to production.
- **12 generator tiers** (Spark → Universe), geometric costs, linear output.
- **Upgrades**: auto-generated per-generator "×N" tiers + global "cosmic" multipliers
  + tap upgrades + energy-coupling specials.
- **Combos**: rapid tapping builds a decaying multiplier.
- **Solar Flares**: 4 variable-reward types (Surge, Frenzy, Tap-Storm, Jackpot).
- **Cosmic Events**: 4 rare announced modifiers (Star Alignment, Meteor Shower,
  Cosmic Wind, Time Warp) with an event banner + countdown.
- **Prestige — Supernova**: Stardust currency, a 9-node skill tree, permanent bonus.
- **Prestige² — Singularity**: Dark Matter meta-currency after 12 Supernovas; deep
  reset for a permanent +30%/point global boost.
- **Achievements**: 37, including endgame and secret ones, each a permanent boost.
- **Offline earnings** with a welcome-back modal (+opt-in "double it" ad seam).
- **Daily streak** bonus. **Cosmetic skins** (free + supporter).
- **New-tier unlock celebrations**; first-time onboarding hints.

### Feel & platform
- Procedural **WebAudio** engine (tap/combo/flare/achievement/prestige + ambient pad).
- Canvas **starfield** (twinkle + parallax), buff-reactive core glow.
- **PWA**: offline service worker, installable, manifest.
- **Share card**: canvas poster via Web Share / download (viral loop).
- Full **keyboard play**, **reduced-motion** support, semantic labels.
- **Settings**: volumes, motion, notation, skins, save export/import, hard reset.

### Growth & money
- SEO landing page, sitemap, robots, OpenGraph/Twitter card image.
- Monetization seams: rewarded ads, interstitials, one-time Supporter Pack (payment-link).
- Optional privacy-friendly analytics (Plausible, env-gated).

### Engineering
- **Next.js + TypeScript + Tailwind**, fully static, zero backend.
- Pure engine + runtime store split; **64 unit/integration tests** (Vitest + jsdom).
- Economy **balance simulator** (`scripts/sim.ts`).
- Zod-validated, versioned, resilient save.
- Dockerfile, GitHub Actions CI, comprehensive docs.
- `window.SUPERNOVA` power-user console handle.
