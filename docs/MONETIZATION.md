# Monetizing SUPERNOVA

The game is free-to-play and 100% client-side. That combination is the whole
business case: **no server cost**, so nearly every cent of ad + purchase revenue
is margin, and it scales to any number of players for free.

There are three revenue streams, all wired as clean seams in
[`src/lib/monetize.ts`](../src/lib/monetize.ts). You drop in keys/links; no code
changes to the game itself.

---

## 1. Supporter Pack (one-time purchase) — easiest, highest trust

A single, honest offer players actually like: **remove ads, unlock exclusive
cosmetic skins, and gain a permanent +10% to all production.**

### Wire it (~10 min, no server)

1. Create a **Stripe Payment Link** (Dashboard → Payment Links) — or a Gumroad /
   Lemon Squeezy product. Set a price (e.g. €3.99).
2. In the product's *after-payment* / confirmation redirect, send buyers to:
   ```
   https://YOURDOMAIN/play?supporter=success
   ```
3. Set the env var:
   ```
   NEXT_PUBLIC_SUPPORTER_URL="https://buy.stripe.com/xxxxxxxx"
   ```

That's it. The **Settings → Supporter Pack** button now opens checkout, and when
the buyer returns to `/play?supporter=success` the game grants the pack and
persists it. With no URL configured, the button grants it locally (handy for dev).

> Note: because entitlement is stored client-side, a determined user could unlock
> it manually. That's fine for a cosmetic/quality-of-life pack — it mirrors how
> most web idle games operate and keeps you serverless. If you later want
> server-verified entitlements, add a tiny `/api/verify` route backed by Stripe.

## 2. Rewarded ads (opt-in) — best revenue-per-player without annoyance

Players *choose* to watch a short ad for a bonus:
- **"Double it"** on the offline earnings modal.
- (Extend anywhere) — call `showRewardedAd()` before granting any boost.

### Wire it

Implement the body of `showRewardedAd()` in `src/lib/monetize.ts` with your
network's rewarded SDK (Google AdSense for Games / H5, Google Ad Manager,
AdinPlay, CrazyGames SDK if you publish there, etc.). Return `true` when the ad
was watched to completion, `false` if dismissed. Then:

```
NEXT_PUBLIC_ADS_ENABLED="1"
NEXT_PUBLIC_ADSENSE_CLIENT="ca-pub-…"
```

## 3. Interstitials (rare) — light touch on prestige

`showInterstitial()` fires occasionally on Supernova (every 3rd, and never for
supporters). Keep these rare — trust and retention beat a few extra impressions.
Wire it the same way as rewarded ads.

---

## Distribution (where the money actually comes from)

Revenue = players × monetization. The engine is built; the growth work is:

- **SEO** — the landing page targets "idle game / incremental game / clicker".
  Set `NEXT_PUBLIC_APP_URL`, submit the sitemap, and write a couple of blog posts
  (a `blog/` scaffold is a good next step).
- **Web game portals** — publish to CrazyGames, Poki, GameDistribution, itch.io,
  Newgrounds. Many share ad revenue and send large traffic. The client-side build
  is exactly what they want.
- **Shareability** — add a "share your universe" card (roadmap) so wins spread.
- **Reddit / communities** — r/incremental_games loves a polished new entry.

## Rough revenue math

Illustrative, conservative web-game numbers:

- 10,000 monthly players, ~2 min/session, light ads → on the order of **$30–150/mo**
  in ad revenue depending on geos and fill.
- Supporter Pack at ~1–3% conversion × €3.99 on 10k players → **€400–1,200 one-time**
  per 10k, recurring as new players arrive.
- **Cost to run: ~€0** (free hosting tier).

The lever is traffic. The product is done; point players at it.
