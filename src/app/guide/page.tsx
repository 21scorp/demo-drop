import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Strategy Guide — how to grow fastest",
  description:
    "A complete SUPERNOVA strategy guide: when to go Supernova, how to use Solar Flares and Cosmic Events, skill-tree priorities, and Singularity timing. Grow your idle universe faster.",
  alternates: { canonical: "/guide" },
};

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="mt-12 scroll-mt-24 font-display text-2xl font-bold tracking-tight">
      {children}
    </h2>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 leading-relaxed text-muted">{children}</p>;
}

export default function GuidePage() {
  return (
    <div className="relative min-h-[100dvh] bg-bg">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[40vh] bg-brand-glow opacity-60" />
      <header className="relative z-10 border-b border-border/60">
        <nav className="container flex items-center justify-between py-5">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl">✦</span>
            <span className="font-display text-lg font-bold tracking-tight">SUPERNOVA</span>
          </Link>
          <Link
            href="/play"
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-ink transition-colors hover:bg-brand/90"
          >
            Play free
          </Link>
        </nav>
      </header>

      <article className="container relative z-10 max-w-2xl py-12">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-brand">Strategy guide</p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">
          How to grow your universe fastest
        </h1>
        <P>
          SUPERNOVA is a free idle game about turning one spark into an entire cosmos. It&apos;s easy
          to pick up, but a little strategy makes your numbers climb dramatically faster. Here&apos;s
          everything that matters, from your first tap to the deep endgame.
        </P>

        <H2 id="early">The first 10 minutes</H2>
        <P>
          Tap the core to make your first energy, then buy the cheapest generator you can afford —
          <em> always keep buying</em>. Early on, a good rule is to buy the generator whose next unit
          gives you the most energy-per-second per unit of cost. Don&apos;t hoard energy: idle
          currency sitting still is wasted growth.
        </P>
        <P>
          Tap while you play. Rapid tapping builds a <strong>combo multiplier</strong>, and early tap
          upgrades plus the &quot;coupling&quot; upgrades (which add a percentage of your
          energy/second to every tap) keep tapping relevant well into the late game.
        </P>

        <H2 id="flares">Solar Flares &amp; Cosmic Events</H2>
        <P>
          Golden <strong>Solar Flares</strong> drift across the screen at random. Always tap them.
          A Surge is instant energy; a Frenzy triples production for 15 seconds; a Tap-Storm makes
          tapping ten times stronger; a Jackpot is a huge payout. Stack a Frenzy with active tapping
          for a burst of progress.
        </P>
        <P>
          <strong>Cosmic Events</strong> are rarer and bigger — Star Alignment (×3 production), Meteor
          Shower (far more flares), Cosmic Wind (×6 tap), and Time Warp (a lump of instant
          production). When an event banner appears, that&apos;s the moment to buy aggressively and
          tap hard.
        </P>

        <H2 id="supernova">When to go Supernova</H2>
        <P>
          Going <strong>Supernova</strong> resets your energy, generators and upgrades, but grants{" "}
          <strong>Stardust</strong> — a permanent currency that boosts every future run and fuels the
          skill tree. The gain scales with how much energy you made this run, so don&apos;t prestige
          the instant it&apos;s available. A good habit: prestige when a fresh run would let you
          re-earn your last run&apos;s progress in a fraction of the time — typically when your
          Stardust gain would roughly double.
        </P>

        <H2 id="skills">Skill-tree priorities</H2>
        <P>
          Buy <strong>Stellar Core</strong> first (production per level), then branch based on your
          style: <strong>Cosmic Inheritance</strong> and <strong>Big Bang Theory</strong> if you love
          prestiging often, <strong>Hands of a God</strong> and <strong>Momentum</strong> if you tap
          a lot, and <strong>Timeless</strong> if you play in short bursts and want strong offline
          earnings. <strong>Golden Eye</strong> is excellent value — it makes flares more frequent and
          more rewarding.
        </P>

        <H2 id="offline">Play in bursts</H2>
        <P>
          Your universe keeps producing while you&apos;re away, and a daily bonus grows with your
          login streak. Check in a few times a day, spend your offline energy in one satisfying
          shopping spree, catch a flare or two, and go. That rhythm is the fastest way to climb.
        </P>

        <H2 id="singularity">The endgame: Singularity</H2>
        <P>
          After twelve Supernovas you unlock the second prestige layer. Collapsing into a{" "}
          <strong>Singularity</strong> is a deep reset — you lose Stardust and skills on top of the
          usual reset — but you gain <strong>Dark Matter</strong>, which permanently boosts all
          production by +30% per point. Do it when your Dark Matter gain is high enough that a fresh
          start with the new bonus rockets you back past where you were. From there, the loop deepens:
          bigger runs, more Dark Matter, forever.
        </P>

        <div className="mt-14 rounded-2xl border border-brand/30 bg-brand/5 p-6 text-center">
          <h2 className="font-display text-2xl font-bold">Ready to build a universe?</h2>
          <p className="mt-2 text-muted">Free, instant, no signup. Your progress saves automatically.</p>
          <Link
            href="/play"
            className="mt-5 inline-flex h-12 items-center rounded-lg bg-brand px-7 font-semibold text-brand-ink shadow-glow transition-transform hover:-translate-y-0.5"
          >
            Play SUPERNOVA →
          </Link>
        </div>
      </article>

      <footer className="relative z-10 border-t border-border/60">
        <div className="container flex items-center justify-between py-6 text-sm text-faint">
          <Link href="/" className="hover:text-ink">
            ← Home
          </Link>
          <Link href="/play" className="hover:text-ink">
            Play →
          </Link>
        </div>
      </footer>
    </div>
  );
}
