import Script from "next/script";

/**
 * Optional, privacy-friendly analytics (Plausible — no cookies, GDPR-friendly).
 * Renders nothing unless NEXT_PUBLIC_PLAUSIBLE_DOMAIN is set, so the game stays
 * dependency-free by default. Swap for your analytics of choice if you prefer.
 */
export function Analytics() {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const src = process.env.NEXT_PUBLIC_PLAUSIBLE_SRC || "https://plausible.io/js/script.js";
  if (!domain) return null;
  return <Script defer data-domain={domain} src={src} strategy="afterInteractive" />;
}
