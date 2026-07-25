/**
 * Monetization seams. Everything here is a thin, well-marked boundary the owner
 * fills in with real keys/links — no server required. See docs/MONETIZATION.md.
 *
 * Revenue model:
 *   1) Rewarded ads      — optional "double it" / boost buttons (opt-in, never forced).
 *   2) Interstitial ads  — a light, skippable frame on Supernova (very occasional).
 *   3) Supporter Pack    — one-time purchase: removes ads, exclusive skins, +10% forever.
 *
 * Because the whole game is client-side, ad + IAP revenue is ~100% margin.
 */

/** Stripe Payment Link / Gumroad / Lemon Squeezy URL for the Supporter Pack. */
export const SUPPORTER_URL = process.env.NEXT_PUBLIC_SUPPORTER_URL || "";

/** Set "1" once an ad network is wired (keeps slots hidden until then). */
export const ADS_ENABLED = process.env.NEXT_PUBLIC_ADS_ENABLED === "1";

/** e.g. AdSense client id "ca-pub-XXXXXXXXXXXX". */
export const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "";

/**
 * Show a rewarded video and resolve true if the reward should be granted.
 * STUB: resolves true immediately. Wire your network's rewarded-ad SDK here
 * (AdSense H5 rewarded, AdinPlay, Google Ad Manager, etc.).
 */
export async function showRewardedAd(): Promise<boolean> {
  if (!ADS_ENABLED) return true; // dev / not configured → grant the reward
  // Example integration point:
  //   return new Promise((resolve) => window.adBreak?.({
  //     type: "reward",
  //     beforeReward: (show) => show(),
  //     adViewed: () => resolve(true),
  //     adDismissed: () => resolve(false),
  //   }));
  return true;
}

/**
 * Show an interstitial (e.g. on Supernova). STUB: no-op.
 * Keep these rare — trust and retention beat a few extra impressions.
 */
export async function showInterstitial(): Promise<void> {
  if (!ADS_ENABLED) return;
  // window.adBreak?.({ type: "next" });
}

/** Whether banner/ad slots should render for this player right now. */
export function adsVisibleFor(isSupporter: boolean): boolean {
  return ADS_ENABLED && !isSupporter;
}

/** True if a real payment link is configured (otherwise dev-grant is used). */
export function hasSupporterCheckout(): boolean {
  return SUPPORTER_URL.length > 0;
}
