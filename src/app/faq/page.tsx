import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ — SUPERNOVA idle game",
  description:
    "Frequently asked questions about SUPERNOVA: is it free, does it need an account, does it save, does it work offline and on mobile, and how the game works.",
  alternates: { canonical: "/faq" },
};

const FAQ: { q: string; a: string }[] = [
  {
    q: "Is SUPERNOVA free to play?",
    a: "Yes. SUPERNOVA is completely free. There's an optional Supporter Pack that removes ads and adds cosmetic skins, but the entire game is playable for free forever.",
  },
  {
    q: "Do I need to create an account?",
    a: "No account, no email, no sign-up. Just open the game and start tapping. Your progress is saved locally in your browser automatically.",
  },
  {
    q: "Does my progress save?",
    a: "Yes — automatically, to your browser. You can also copy a save code in Settings to back it up or move it to another device.",
  },
  {
    q: "Does it work offline?",
    a: "Yes. SUPERNOVA is installable as a web app and plays offline once loaded. Your universe even keeps producing energy while the game is closed — you collect it when you return.",
  },
  {
    q: "Can I play on my phone?",
    a: "Absolutely. It's designed mobile-first and works great on phones, tablets and desktops. You can install it to your home screen for a full-screen, app-like experience.",
  },
  {
    q: "What is the goal of the game?",
    a: "Grow from a single spark into an entire universe. Buy generators, catch Solar Flares, ride Cosmic Events, and go Supernova to reset for permanent power. The numbers — and the goals — never stop climbing.",
  },
  {
    q: "What is a Supernova?",
    a: "A prestige reset. You trade your current progress for Stardust, a permanent currency that powers a skill tree and makes every future run faster. Later you unlock the Singularity — an even deeper reset for Dark Matter.",
  },
  {
    q: "Is it pay-to-win?",
    a: "No. Everything that affects gameplay can be earned for free. The Supporter Pack is a small, optional thank-you that's mostly cosmetic (skins) plus removing ads.",
  },
];

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="relative min-h-[100dvh] bg-bg">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
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

      <main className="container relative z-10 max-w-2xl py-12">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-brand">Questions</p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">
          Frequently asked questions
        </h1>

        <div className="mt-10 flex flex-col gap-3">
          {FAQ.map((f) => (
            <details
              key={f.q}
              className="group rounded-xl border border-border bg-surface p-4 open:border-brand/40"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink">
                {f.q}
                <span className="text-muted transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </div>

        <div className="mt-12 flex items-center gap-4">
          <Link
            href="/play"
            className="inline-flex h-12 items-center rounded-lg bg-brand px-7 font-semibold text-brand-ink shadow-glow transition-transform hover:-translate-y-0.5"
          >
            Play SUPERNOVA →
          </Link>
          <Link href="/guide" className="text-sm text-muted hover:text-ink">
            Read the strategy guide →
          </Link>
        </div>
      </main>

      <footer className="relative z-10 border-t border-border/60">
        <div className="container flex items-center justify-between py-6 text-sm text-faint">
          <Link href="/" className="hover:text-ink">← Home</Link>
          <Link href="/play" className="hover:text-ink">Play →</Link>
        </div>
      </footer>
    </div>
  );
}
