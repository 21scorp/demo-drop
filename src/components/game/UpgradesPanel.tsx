"use client";

import { CONFIG } from "@/lib/game/config";
import { fmt } from "@/lib/game/format";
import type { UpgradeDef } from "@/lib/game/types";
import { cn } from "@/lib/utils";
import { useGameTick, useStore } from "./GameProvider";

const KIND_LABEL: Record<string, string> = {
  global: "Cosmic",
  generator: "Generator",
  tap: "Tap",
  special: "Tap",
};
const KIND_TONE: Record<string, string> = {
  global: "text-brand",
  generator: "text-accent",
  tap: "text-warning",
  special: "text-warning",
};

function UpgradeCard({ def }: { def: UpgradeDef }) {
  const store = useStore();
  const notation = store.state.settings.notation;
  const affordable = store.state.energy >= def.cost;
  return (
    <button
      onClick={() => store.buyUpgrade(def.id)}
      disabled={!affordable}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all",
        affordable
          ? "border-border bg-surface hover:border-brand/60 hover:bg-surface-2/60"
          : "border-border/60 bg-surface/40 opacity-70",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-semibold text-ink">{def.name}</span>
          <span
            className={cn(
              "shrink-0 rounded-full bg-surface-2 px-1.5 py-0.5 text-[10px] font-bold uppercase",
              KIND_TONE[def.kind],
            )}
          >
            {KIND_LABEL[def.kind]}
          </span>
        </div>
        <p className="truncate text-xs text-muted">{def.blurb}</p>
      </div>
      <span
        className={cn(
          "shrink-0 font-mono text-sm font-semibold tabular-nums",
          affordable ? "text-ink" : "text-faint",
        )}
      >
        {fmt(def.cost, notation)}
      </span>
    </button>
  );
}

export function UpgradesPanel() {
  useGameTick();
  const store = useStore();
  const ctx = store.unlockCtx();

  const purchased = new Set(store.state.upgrades);
  const available = CONFIG.upgrades
    .filter((u) => !purchased.has(u.id) && u.unlock(ctx))
    .sort((a, b) => a.cost - b.cost);
  const ownedCount = purchased.size;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Upgrades</h2>
        <span className="font-mono text-xs text-faint">{ownedCount} owned</span>
      </div>
      {available.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/70 p-6 text-center">
          <p className="text-sm text-muted">No upgrades available yet.</p>
          <p className="mt-1 text-xs text-faint">
            Buy more generators and keep tapping — new upgrades unlock as you grow.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {available.slice(0, 30).map((def) => (
            <UpgradeCard key={def.id} def={def} />
          ))}
        </div>
      )}
    </div>
  );
}
