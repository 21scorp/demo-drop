"use client";

import { CONFIG } from "@/lib/game/config";
import { cn } from "@/lib/utils";
import { useGameTick, useStore } from "./GameProvider";

export function AchievementsPanel() {
  useGameTick();
  const store = useStore();
  const unlocked = new Set(store.state.achievements);
  const total = CONFIG.achievements.length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Achievements</h2>
        <span className="font-mono text-xs text-faint">
          {unlocked.size}/{total}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-gradient-to-r from-warning to-accent transition-[width]"
          style={{ width: `${(unlocked.size / total) * 100}%` }}
        />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {CONFIG.achievements.map((a) => {
          const has = unlocked.has(a.id);
          const hidden = a.secret && !has;
          return (
            <div
              key={a.id}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition-all",
                has ? "border-warning/40 bg-warning/5" : "border-border/60 bg-surface/40",
              )}
              title={hidden ? "Secret achievement" : a.blurb}
            >
              <span className={cn("text-2xl", !has && "opacity-40 grayscale")}>
                {hidden ? "❓" : a.glyph}
              </span>
              <span
                className={cn(
                  "text-[11px] font-semibold leading-tight",
                  has ? "text-ink" : "text-faint",
                )}
              >
                {hidden ? "Secret" : a.name}
              </span>
              {has && (
                <span className="font-mono text-[10px] text-warning">
                  +{Math.round((a.reward - 1) * 100)}%
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
