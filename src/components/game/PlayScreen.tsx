"use client";

import Link from "next/link";
import { Core } from "./Core";
import { DailyButton } from "./DailyButton";
import { FlareLayer } from "./FlareLayer";
import { GameShell } from "./GameShell";
import { Hud } from "./Hud";
import { OfflineModal } from "./OfflineModal";
import { ToastLayer } from "./ToastLayer";

export function PlayScreen() {
  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-bg">
      <div className="pointer-events-none absolute inset-0 bg-brand-glow opacity-70" />
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.35]" />

      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border/70 bg-bg/70 backdrop-blur-md">
        <div className="container flex items-center justify-between py-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl">✦</span>
            <span className="font-display text-lg font-bold tracking-tight">SUPERNOVA</span>
          </Link>
          <div className="flex items-center gap-2">
            <DailyButton />
            <Link
              href="/"
              className="rounded-lg px-3 py-1.5 text-sm text-muted transition-colors hover:text-ink"
            >
              Home
            </Link>
          </div>
        </div>
        <div className="container pb-3">
          <Hud />
        </div>
      </header>

      {/* Main */}
      <main className="container relative z-10 grid flex-1 gap-6 py-6 lg:grid-cols-[1.05fr_minmax(360px,440px)]">
        <section className="relative flex min-h-[46vh] items-center justify-center lg:min-h-0">
          <Core />
        </section>
        <aside className="min-h-0 lg:h-[calc(100dvh-8.5rem)] lg:sticky lg:top-[8.5rem]">
          <GameShell />
        </aside>
      </main>

      <FlareLayer />
      <ToastLayer />
      <OfflineModal />
    </div>
  );
}
