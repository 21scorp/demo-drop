"use client";

import { useGameTick, useStore } from "./GameProvider";

export function DailyButton() {
  useGameTick();
  const store = useStore();
  if (!store.dailyAvailable()) return null;
  const streak = store.state.dailyStreak;

  return (
    <button
      onClick={() => store.claimDaily()}
      className="group flex items-center gap-2 rounded-full border border-warning/40 bg-warning/10 px-3 py-1.5 text-sm font-semibold text-warning transition-all hover:bg-warning/20"
    >
      <span className="text-base transition-transform group-hover:scale-125">🎁</span>
      <span>Daily bonus</span>
      {streak > 0 && (
        <span className="rounded-full bg-warning/20 px-1.5 text-[11px] tabular-nums">
          🔥 {streak}
        </span>
      )}
    </button>
  );
}
