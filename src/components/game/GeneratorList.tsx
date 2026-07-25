"use client";

import { useState } from "react";
import { CONFIG } from "@/lib/game/config";
import { bulkCost, costOfNext, maxAffordable } from "@/lib/game/engine";
import { fmt, fmtInt } from "@/lib/game/format";
import type { GeneratorDef } from "@/lib/game/types";
import { cn } from "@/lib/utils";
import { useGameTick, useStore } from "./GameProvider";

type BuyMode = 1 | 10 | 100 | "max";

function ModeToggle({ mode, setMode }: { mode: BuyMode; setMode: (m: BuyMode) => void }) {
  const modes: BuyMode[] = [1, 10, 100, "max"];
  return (
    <div className="inline-flex rounded-lg border border-border bg-surface-2 p-0.5">
      {modes.map((m) => (
        <button
          key={String(m)}
          onClick={() => setMode(m)}
          className={cn(
            "rounded-md px-2.5 py-1 font-mono text-xs font-semibold transition-colors",
            mode === m ? "bg-brand text-brand-ink" : "text-muted hover:text-ink",
          )}
        >
          {m === "max" ? "MAX" : `×${m}`}
        </button>
      ))}
    </div>
  );
}

function GeneratorRow({
  def,
  mode,
  totalEps,
}: {
  def: GeneratorDef;
  mode: BuyMode;
  totalEps: number;
}) {
  const store = useStore();
  const owned = store.state.generators[def.id] ?? 0;
  const notation = store.state.settings.notation;
  const lineOutput = store.derived.perGenOutput[def.id] ?? 0;

  let qty: number;
  let cost: number;
  if (mode === "max") {
    qty = maxAffordable(def, owned, store.state.energy);
    cost = bulkCost(def, owned, Math.max(1, qty));
  } else {
    qty = mode;
    cost = qty === 1 ? costOfNext(def, owned) : bulkCost(def, owned, qty);
  }

  const affordable = mode === "max" ? qty > 0 : store.state.energy >= cost;
  const share = totalEps > 0 ? lineOutput / totalEps : 0;

  return (
    <button
      onClick={() => store.buyGenerator(def.id, mode === "max" ? Infinity : mode)}
      disabled={!affordable}
      aria-label={`Buy ${mode === "max" ? `${qty} (max)` : qty} ${def.name} for ${fmt(cost, notation)} energy`}
      className={cn(
        "group relative flex w-full items-center gap-3 overflow-hidden rounded-xl border p-3 text-left transition-all",
        affordable
          ? "border-border bg-surface hover:border-brand/60 hover:bg-surface-2/60"
          : "border-border/60 bg-surface/40 opacity-70",
      )}
    >
      {/* production share bar */}
      <span
        className="absolute inset-y-0 left-0 z-0 bg-brand/5"
        style={{ width: `${share * 100}%` }}
      />
      <span className="relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-surface-2 text-2xl">
        {def.glyph}
      </span>
      <div className="relative z-10 min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-semibold text-ink">{def.name}</span>
          {owned > 0 && (
            <span className="font-mono text-xs tabular-nums text-faint">×{fmtInt(owned)}</span>
          )}
        </div>
        <p className="truncate text-xs text-muted">
          {owned > 0 ? (
            <>
              <span className="text-accent">{fmt(lineOutput, notation)}/s</span> · {def.blurb}
            </>
          ) : (
            def.blurb
          )}
        </p>
      </div>
      <div className="relative z-10 flex shrink-0 flex-col items-end">
        <span
          className={cn(
            "font-mono text-sm font-semibold tabular-nums",
            affordable ? "text-ink" : "text-faint",
          )}
        >
          {fmt(cost, notation)}
        </span>
        <span className="font-mono text-[11px] text-faint">
          {mode === "max" ? (qty > 0 ? `buy ${fmtInt(qty)}` : "—") : `+${fmtInt(qty)}`}
        </span>
      </div>
    </button>
  );
}

export function GeneratorList() {
  useGameTick();
  const store = useStore();
  const [mode, setMode] = useState<BuyMode>(1);
  const ctx = store.unlockCtx();
  const totalEps = store.derived.energyPerSec;

  const unlocked = CONFIG.generators.filter((g) => g.unlock(ctx));
  const nextLocked = CONFIG.generators.find((g) => !g.unlock(ctx));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Cosmos</h2>
        <ModeToggle mode={mode} setMode={setMode} />
      </div>
      <div className="flex flex-col gap-2">
        {unlocked.map((def) => (
          <GeneratorRow key={def.id} def={def} mode={mode} totalEps={totalEps} />
        ))}
        {nextLocked && (
          <div className="flex items-center gap-3 rounded-xl border border-dashed border-border/70 p-3 opacity-60">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-surface-2 text-2xl grayscale">
              ❔
            </span>
            <div className="min-w-0 flex-1">
              <span className="font-semibold text-muted">???</span>
              <p className="text-xs text-faint">
                Reach {fmt(nextLocked.baseCost * 0.4, store.state.settings.notation)} lifetime energy to
                reveal.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
