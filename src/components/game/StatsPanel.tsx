"use client";

import { useState } from "react";
import { CONFIG } from "@/lib/game/config";
import { fmt, fmtDuration, fmtInt, fmtRate } from "@/lib/game/format";
import { shareCard } from "@/lib/game/shareCard";
import { Button } from "@/components/ui/Button";
import { useGameTick, useStore } from "./GameProvider";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <p className="text-[11px] uppercase tracking-wide text-faint">{label}</p>
      <p className="mt-0.5 font-mono text-base font-semibold tabular-nums text-ink">{value}</p>
    </div>
  );
}

export function StatsPanel() {
  useGameTick();
  const store = useStore();
  const s = store.state;
  const n = s.settings.notation;
  const [shareMsg, setShareMsg] = useState<string | null>(null);

  const onShare = async () => {
    const skin = CONFIG.skins.find((k) => k.id === s.skin);
    try {
      const result = await shareCard({
        lifetimeEnergy: s.lifetimeEnergy,
        supernovaCount: s.supernovaCount,
        bestEnergyPerSec: s.stats.bestEnergyPerSec,
        achievements: s.achievements.length,
        achievementsTotal: CONFIG.achievements.length,
        skinColors: skin?.colors ?? ["#c4b5fd", "#7c3aed", "#2e1065"],
        url: typeof window !== "undefined" ? window.location.origin : "supernova.game",
      });
      setShareMsg(result === "shared" ? "Shared!" : "Image downloaded — post it anywhere.");
    } catch {
      setShareMsg("Could not create the image.");
    }
    setTimeout(() => setShareMsg(null), 3000);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Statistics</h2>
        <Button size="sm" variant="secondary" onClick={onShare}>
          🖼️ Share
        </Button>
      </div>
      {shareMsg && <p className="text-xs text-accent">{shareMsg}</p>}
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Energy/sec" value={fmtRate(store.liveEps(), n)} />
        <Stat label="Best energy/sec" value={fmtRate(s.stats.bestEnergyPerSec, n)} />
        <Stat label="Lifetime energy" value={fmt(s.lifetimeEnergy, n)} />
        <Stat label="This run" value={fmt(s.totalEnergyThisRun, n)} />
        <Stat label="Total taps" value={fmtInt(s.stats.totalTaps)} />
        <Stat label="Energy from taps" value={fmt(s.stats.handEnergyFromTaps, n)} />
        <Stat label="Flares collected" value={fmtInt(s.stats.flaresCollected)} />
        <Stat label="Supernovas" value={fmtInt(s.supernovaCount)} />
        <Stat label="Stardust earned" value={`✦ ${fmt(s.stardustEarned, n)}`} />
        <Stat label="Daily streak" value={`${s.dailyStreak} days`} />
        <Stat label="Playtime" value={fmtDuration(s.playtimeMs)} />
        <Stat
          label="Fastest nova"
          value={s.stats.fastestSupernovaMs === null ? "—" : fmtDuration(s.stats.fastestSupernovaMs)}
        />
      </div>
    </div>
  );
}
