# DemoDrop — Project Plan & Roadmap

**Product:** DemoDrop — get your music heard by DJs, labels & playlist curators, with guaranteed feedback.
**Model:** Artists buy credits → spend them submitting tracks to curators → curators give guaranteed feedback → platform takes commission, curators earn a share.

Legend: `[ ]` todo · `[~]` in progress · `[x]` done

## Phase 0 — Foundation
- [x] Master prompt + roadmap
- [x] Decide stack (Next.js + TS + Tailwind + Prisma + Stripe)
- [ ] Scaffold Next.js app, tooling, config
- [ ] Design system (tokens, Tailwind theme, base UI components)

## Phase 1 — Data & domain
- [ ] Prisma schema: User, ArtistProfile, CuratorProfile, Submission, Review, CreditLedger, Transaction, Payout
- [ ] Seed script: realistic curators (DJs, labels, playlists), genres, demo artists
- [ ] Domain services: credits, submissions, reviews, guarantee/refund logic (integer-cent money math)

## Phase 2 — Auth & accounts
- [ ] Password hashing (scrypt), session cookies, JWT
- [ ] Sign up (artist/curator), login, logout, protected routes, role guards
- [ ] Zod validation on all auth inputs

## Phase 3 — Artist experience
- [ ] Curator directory (filter by genre, type, price, rating)
- [ ] Curator detail page
- [ ] Submit-a-track flow (link + pitch, credit cost, confirm)
- [ ] Artist dashboard: submissions, statuses, feedback, credit balance & ledger

## Phase 4 — Curator experience
- [ ] Curator onboarding & editable profile
- [ ] Inbox / review queue with SLA countdown
- [ ] Review flow: rating, written feedback, decision (repost/playlist/pass), earnings
- [ ] Curator dashboard: stats, response rate, earnings & payouts

## Phase 5 — Monetization
- [ ] Credit packs & pricing page
- [ ] Stripe Checkout (credit packs + Pro subscription), webhooks → ledger
- [ ] Commission / curator-share accounting; payout records
- [ ] Guarantee engine: auto-refund on missed SLA (cron/route)

## Phase 6 — Marketing site & SEO
- [ ] Landing page: hero, social proof, how-it-works, curator preview, pricing, FAQ, CTA
- [ ] For-curators landing, pricing page, legal (terms/privacy)
- [ ] SEO: metadata, OpenGraph, sitemap, robots, structured data, blog scaffold

## Phase 7 — Quality & delivery
- [ ] Vitest tests for credits, guarantee/refund, auth, commission math
- [ ] Error handling, empty states, loading states, toasts
- [ ] Accessibility pass, responsive pass
- [ ] Dockerfile + docker-compose, CI workflow
- [ ] README, DEPLOY guide, MONETIZATION playbook, ARCHITECTURE doc

## Phase 8+ — Depth (never run out of work)
- [ ] Admin panel: moderation, curator approvals, platform stats
- [ ] Email notifications (submission received, feedback ready, SLA warnings)
- [ ] Analytics dashboards (conversion, response times, top genres)
- [ ] Referral / affiliate program (artists & curators)
- [ ] Playlists & "wins" showcase (breakthroughs → social proof)
- [ ] Ratings & reputation, curator verification badges
- [ ] i18n (EN/NL), PWA/offline, performance budget
- [ ] Fraud/abuse guards, rate limiting, audit log
- [ ] Blog content for SEO (music-promo guides)
- [ ] Polish passes: micro-interactions, motion, copy editing

## Revenue math (illustrative)
- Credit pack: €10 = 100 credits. Average submission = 20 credits (€2 value).
- Curator share ~ 50% of the credit value on a completed review; platform keeps ~50%.
- Pro subscription: €9/mo (analytics, priority, 10% credit bonus).
- 1,000 active artists × 4 submissions/mo × €2 × 50% commission ≈ €4,000/mo gross,
  before Pro subs and curator-side growth. Scales with curator supply.
