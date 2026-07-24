import Link from "next/link";
import { GENERATORS } from "@/lib/game/config";

function CoreVisual() {
  return (
    <div className="relative grid aspect-square w-[min(70vw,340px)] place-items-center">
      <span className="absolute inset-[-12%] rounded-full bg-brand/30 blur-3xl" />
      <span
        className="absolute inset-0 rounded-full opacity-70"
        style={{
          background:
            "conic-gradient(from 0deg, transparent, #7c3aed55, transparent, #c4b5fd55, transparent)",
          animation: "spin 16s linear infinite",
        }}
      />
      <span
        className="relative grid h-[78%] w-[78%] place-items-center rounded-full"
        style={{
          background: "radial-gradient(circle at 35% 30%, #c4b5fd, #7c3aed 55%, #2e1065)",
          boxShadow: "inset 0 0 60px rgba(0,0,0,0.45), 0 0 80px #7c3aed66",
        }}
      >
        <span className="text-7xl">✦</span>
      </span>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

function Feature({ glyph, title, body }: { glyph: string; title: string; body: string }) {
  return (
    <div className="card p-5">
      <div className="grid h-11 w-11 place-items-center rounded-lg bg-surface-2 text-2xl">
        {glyph}
      </div>
      <h3 className="mt-4 text-base font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">{body}</p>
    </div>
  );
}

export default function Home() {
  return (
    <div className="relative overflow-hidden bg-bg">
      <div className="pointer-events-none absolute inset-0 bg-brand-glow" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[70vh] bg-grid opacity-40" />

      {/* Nav */}
      <header className="relative z-10">
        <nav className="container flex items-center justify-between py-5">
          <div className="flex items-center gap-2">
            <span className="text-xl">✦</span>
            <span className="font-display text-lg font-bold tracking-tight">SUPERNOVA</span>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <a href="#how" className="hidden rounded-lg px-3 py-2 text-muted hover:text-ink sm:block">
              How it works
            </a>
            <a href="#loop" className="hidden rounded-lg px-3 py-2 text-muted hover:text-ink sm:block">
              The loop
            </a>
            <Link
              href="/play"
              className="rounded-lg bg-brand px-4 py-2 font-medium text-brand-ink transition-colors hover:bg-brand/90"
            >
              Play free
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative z-10">
        <div className="container grid items-center gap-10 py-12 lg:grid-cols-2 lg:py-20">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
              Free · No signup · Plays in your browser
            </span>
            <h1 className="mt-5 text-balance font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
              Tap a spark.
              <br />
              Build a <span className="text-gradient">universe</span>.
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-muted">
              SUPERNOVA is a hypnotic idle game. Ignite generators from embers to entire galaxies,
              catch Solar Flares for huge surges, and collapse it all in a Supernova to be reborn —
              stronger every time. Just… one more upgrade.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/play"
                className="inline-flex h-12 items-center gap-2 rounded-lg bg-brand px-7 text-base font-semibold text-brand-ink shadow-glow transition-transform hover:-translate-y-0.5"
              >
                Start playing →
              </Link>
              <span className="text-sm text-faint">Your progress saves automatically.</span>
            </div>
          </div>
          <div className="flex justify-center lg:justify-end">
            <CoreVisual />
          </div>
        </div>
      </section>

      {/* Ticker of generators */}
      <section className="relative z-10 border-y border-border/60 bg-surface/40 py-4">
        <div className="no-scrollbar flex gap-8 overflow-hidden">
          <div className="flex shrink-0 animate-marquee gap-8">
            {[...GENERATORS, ...GENERATORS].map((g, i) => (
              <span key={i} className="flex items-center gap-2 whitespace-nowrap text-sm text-muted">
                <span className="text-lg">{g.glyph}</span>
                {g.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="relative z-10">
        <div className="container py-16 lg:py-24">
          <h2 className="text-center font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Simple to start. Impossible to stop.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted">
            No tutorials, no accounts, no waiting. You&apos;ll understand it in five seconds and still
            be playing in five hours.
          </p>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Feature
              glyph="👆"
              title="Tap the core"
              body="Every tap bursts with particles, sound and rising combos. The first spark is on you — the rest builds itself."
            />
            <Feature
              glyph="🪐"
              title="Ignite the cosmos"
              body="Spend energy on generators — sparks, stars, nebulae, black holes, whole galaxies — each producing forever while you watch the numbers climb."
            />
            <Feature
              glyph="☄️"
              title="Catch Solar Flares"
              body="Golden flares drift across the screen at random. Tap one for a surge, a frenzy, a tap-storm — or a jackpot."
            />
            <Feature
              glyph="💥"
              title="Go Supernova"
              body="Collapse everything into Stardust, spend it on a permanent skill tree, and restart richer. The loop that never lets go."
            />
            <Feature
              glyph="🌙"
              title="Earns while you sleep"
              body="Your universe keeps producing offline. Come back to a pile of energy — and the pull to spend it all at once."
            />
            <Feature
              glyph="🏆"
              title="Chase every milestone"
              body="Dozens of achievements, daily streaks, and cosmetic skins. There is always a next thing to unlock."
            />
          </div>
        </div>
      </section>

      {/* The loop */}
      <section id="loop" className="relative z-10 border-t border-border/60">
        <div className="container py-16 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-brand">
              the loop
            </span>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Tap → Ignite → Surge → Collapse → Repeat
            </h2>
            <p className="mt-4 text-muted">
              Every session ends with you a little more powerful than the last — and one clear reason
              to come back. That&apos;s the whole game. That&apos;s why you won&apos;t put it down.
            </p>
            <Link
              href="/play"
              className="mt-8 inline-flex h-12 items-center gap-2 rounded-lg bg-brand px-7 text-base font-semibold text-brand-ink shadow-glow transition-transform hover:-translate-y-0.5"
            >
              Play SUPERNOVA free →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/60">
        <div className="container flex flex-col items-center justify-between gap-3 py-8 text-sm text-faint sm:flex-row">
          <div className="flex items-center gap-2">
            <span>✦</span>
            <span className="font-semibold text-muted">SUPERNOVA</span>
          </div>
          <p>Built to be played. © {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
