"use client";

import { fmt, fmtRate } from "@/lib/game/format";
import { cn } from "@/lib/utils";
import { useGameTick, useStore } from "./GameProvider";

function BuffPill({
  label,
  msLeft,
  total,
  tone,
}: {
  label: string;
  msLeft: number;
  total: number;
  tone: string;
}) {
  const pct = Math.max(0, Math.min(1, msLeft / total));
  return (
    <div className="relative flex items-center gap-2 overflow-hidden rounded-full border border-border bg-surface-2 px-3 py-1">
      <span className="relative z-10 font-mono text-[11px] font-bold" style={{ color: tone }}>
        {label}
      </span>
      <span className="relative z-10 font-mono text-[11px] tabular-nums text-muted">
        {Math.ceil(msLeft / 1000)}s
      </span>
      <span
        className="absolute inset-y-0 left-0 z-0 opacity-25"
        style={{ width: `${pct * 100}%`, background: tone }}
      />
    </div>
  );
}

export function Hud() {
  useGameTick();
  const store = useStore();
  const s = store.state;
  const notation = s.settings.notation;
  const eps = store.liveEps();
  const now = Date.now();

  const boosted = store.buffs.some((b) => b.kind === "frenzy");

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-baseline gap-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-2xl leading-none">⚡</span>
            <span
              className={cn(
                "font-mono text-3xl font-bold tabular-nums sm:text-4xl",
                boosted ? "text-warning" : "text-ink",
              )}
            >
              {fmt(s.energy, notation)}
            </span>
          </div>
          <span className="ml-9 font-mono text-sm tabular-nums text-muted">
            {fmtRate(eps, notation)}
            {boosted && <span className="ml-1 text-warning">· boosted</span>}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {store.buffs.map((b) => (
          <BuffPill
            key={b.id}
            label={b.kind === "frenzy" ? "×7 PROD" : "×10 TAP"}
            msLeft={b.expiresAt - now}
            total={15_000}
            tone={b.kind === "frenzy" ? "#f59e0b" : "#a3e635"}
          />
        ))}
        {s.darkMatter > 0 && (
          <div className="flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5">
            <span className="text-base leading-none text-accent">◆</span>
            <span className="font-mono text-sm font-semibold tabular-nums text-accent">
              {fmt(s.darkMatter, notation)}
            </span>
          </div>
        )}
        <div className="flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-3 py-1.5">
          <span className="text-base leading-none">✦</span>
          <span className="font-mono text-sm font-semibold tabular-nums text-brand">
            {fmt(s.stardust, notation)}
          </span>
        </div>
      </div>
    </div>
  );
}
