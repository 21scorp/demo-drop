"use client";

import { fmt, fmtDuration } from "@/lib/game/format";
import { showRewardedAd } from "@/lib/monetize";
import { Button } from "@/components/ui/Button";
import { useGameTick, useStore } from "./GameProvider";

export function OfflineModal() {
  useGameTick();
  const store = useStore();
  const report = store.pendingOffline;
  if (!report) return null;
  const n = store.state.settings.notation;

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm animate-scale-in rounded-2xl border border-brand/30 bg-surface p-6 text-center shadow-lift">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand/15 text-4xl">
          🌌
        </div>
        <h3 className="mt-4 text-lg font-bold text-ink">Welcome back</h3>
        <p className="mt-1 text-sm text-muted">
          While you were away for{" "}
          <span className="font-semibold text-ink">{fmtDuration(report.ms)}</span>, your cosmos kept
          working.
        </p>
        <p className="mt-4 font-mono text-3xl font-bold tabular-nums text-brand">
          +{fmt(report.gained, n)}
        </p>
        <p className="font-mono text-xs text-faint">energy earned offline</p>

        <div className="mt-6 flex flex-col gap-2">
          <Button
            onClick={async () => {
              const rewarded = await showRewardedAd();
              store.claimOffline(rewarded);
            }}
          >
            ▶ Double it (watch a short ad)
          </Button>
          <Button variant="ghost" size="sm" onClick={() => store.claimOffline(false)}>
            Just collect
          </Button>
        </div>
      </div>
    </div>
  );
}
