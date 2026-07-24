"use client";

import { fmtCountdown } from "@/lib/game/format";
import { useGameTick, useStore } from "./GameProvider";

export function EventBanner() {
  useGameTick();
  const store = useStore();
  const ev = store.activeEvent;
  if (!ev) return null;

  const now = Date.now();
  const total = ev.def.durationMs;
  const left = Math.max(0, ev.expiresAt - now);
  const pct = Math.max(0, Math.min(1, left / total));

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[8.75rem] z-[65] flex justify-center px-4">
      <div className="pointer-events-auto relative w-full max-w-md animate-scale-in overflow-hidden rounded-xl border border-brand/50 bg-surface/90 px-4 py-3 shadow-lift backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{ev.def.glyph}</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-brand">
              {ev.def.name}
              <span className="ml-2 font-mono text-xs font-normal text-muted">
                {fmtCountdown(left)}
              </span>
            </p>
            <p className="truncate text-xs text-muted">{ev.def.description}</p>
          </div>
        </div>
        <span
          className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-brand to-accent transition-[width] duration-500"
          style={{ width: `${pct * 100}%` }}
        />
      </div>
    </div>
  );
}
