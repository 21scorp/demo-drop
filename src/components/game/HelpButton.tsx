"use client";

import { useState } from "react";

const SECTIONS: { glyph: string; title: string; body: string }[] = [
  { glyph: "👆", title: "Tap the core", body: "Each tap makes energy. Tap fast to build a combo multiplier." },
  { glyph: "🪐", title: "Buy generators", body: "Spend energy on generators — they produce energy forever, even while you're away." },
  { glyph: "⬆️", title: "Upgrades", body: "Multiply your output. New ones unlock as you own more generators and grow." },
  { glyph: "☄️", title: "Solar Flares", body: "Golden orbs drift across the screen. Tap them for surges, frenzies, tap-storms and jackpots." },
  { glyph: "🌟", title: "Cosmic Events", body: "Rare, powerful, timed boosts announced with a banner. Ride them for big gains." },
  { glyph: "💥", title: "Supernova", body: "When you're strong enough, collapse for Stardust. Spend it on the permanent skill tree, then grow back faster." },
  { glyph: "◆", title: "Singularity", body: "The deep endgame. After many Supernovas, collapse everything into Dark Matter — a permanent supercharge." },
  { glyph: "🌙", title: "Offline & daily", body: "You earn while away, and a daily bonus grows with your streak. Come back often." },
];

export function HelpButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="How to play"
        className="grid h-8 w-8 place-items-center rounded-full border border-border text-sm text-muted transition-colors hover:border-brand/60 hover:text-ink"
      >
        ?
      </button>
      {open && (
        <div
          className="fixed inset-0 z-[85] grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[85dvh] w-full max-w-md animate-scale-in overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-lift"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">How to play</h3>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {SECTIONS.map((s) => (
                <div key={s.title} className="flex gap-3">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-2 text-xl">
                    {s.glyph}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">{s.title}</p>
                    <p className="text-sm text-muted">{s.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-5 text-center text-xs text-faint">
              Your progress saves automatically. There is always one more upgrade. ✦
            </p>
          </div>
        </div>
      )}
    </>
  );
}
