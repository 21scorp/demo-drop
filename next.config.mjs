/**
 * Two build targets:
 *  - default  → `output: "standalone"` (Vercel/Node/Docker; security headers applied)
 *  - static   → `BUILD_STATIC=1` produces a fully static `out/` you can upload to
 *               itch.io, GameDistribution, Poki, Netlify drop, S3/CDN, GitHub Pages…
 * The game is 100% client-side, so the static export is fully playable.
 */
const STATIC = process.env.BUILD_STATIC === "1";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: STATIC ? "export" : "standalone",
  images: {
    unoptimized: STATIC,
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  // `headers()` is not supported by static export; apply only for server builds.
  ...(STATIC
    ? {}
    : {
        async headers() {
          return [
            {
              source: "/(.*)",
              headers: [
                { key: "X-Content-Type-Options", value: "nosniff" },
                { key: "X-Frame-Options", value: "SAMEORIGIN" },
                { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
                { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
              ],
            },
          ];
        },
      }),
};

export default nextConfig;
