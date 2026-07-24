# Deploying SUPERNOVA

The whole game is static + client-side, so it deploys anywhere that serves a
Next.js app — for **free**, at any scale. No database, no server, no secrets
required to go live.

## Option A — Vercel (recommended, ~2 minutes)

1. Push this repo to GitHub (already done if you're reading this there).
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo.
3. Framework preset: **Next.js** (auto-detected). No build changes needed.
4. (Optional) Add environment variables — see below. None are required.
5. **Deploy.** You get a `*.vercel.app` URL instantly. Add a custom domain in
   Project → Settings → Domains.

## Option B — Netlify

1. New site from Git → pick the repo.
2. Build command `npm run build`, publish handled by the Next.js runtime plugin
   (Netlify adds it automatically).
3. Deploy.

## Option C — Any Node host / self-host

```bash
npm install
npm run build
npm start            # serves on $PORT (default 3000)
```

Put it behind a CDN/reverse proxy and you're done. A `Dockerfile` is included:

```bash
docker build -t supernova .
docker run -p 3000:3000 supernova
```

## Environment variables (all optional)

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | Absolute site URL for OG tags, sitemap, robots, checkout redirects. Set to your real domain in production. |
| `NEXT_PUBLIC_SUPPORTER_URL` | Checkout link for the Supporter Pack (Stripe/Gumroad/Lemon Squeezy). |
| `NEXT_PUBLIC_ADS_ENABLED` | `"1"` to show ad slots once a network is wired. |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | Your AdSense publisher id. |

Copy `.env.example` to `.env.local` for local development.

## Post-deploy checklist

- [ ] Set `NEXT_PUBLIC_APP_URL` to your domain (fixes OG/sitemap absolute URLs).
- [ ] Submit `https://yourdomain/sitemap.xml` in Google Search Console.
- [ ] Wire monetization — see [MONETIZATION.md](MONETIZATION.md).
- [ ] Share the link. It's a game; the best marketing is people playing it.
