"use client";

import { CONFIG } from "@/lib/game/config";
import { fmt } from "@/lib/game/format";
import type { SkillDef } from "@/lib/game/types";
import { cn } from "@/lib/utils";
import { useGameTick, useStore } from "./GameProvider";

function LevelDots({ level, max }: { level: number; max: number }) {
  return (
    <div className="flex flex-wrap gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            i < level ? "bg-brand" : "bg-surface-2 ring-1 ring-border",
          )}
        />
      ))}
    </div>
  );
}

function SkillNode({ def }: { def: SkillDef }) {
  const store = useStore();
  const level = store.state.skills[def.id] ?? 0;
  const maxed = level >= def.maxLevel;
  const reqMet = (def.requires ?? []).every((r) => (store.state.skills[r] ?? 0) >= 1);
  const nextCost = def.cost(level + 1);
  const affordable = !maxed && reqMet && store.state.stardust >= nextCost;

  return (
    <div
      style={{ gridColumn: def.col + 1, gridRow: def.row + 1 }}
      className={cn(
        "flex flex-col gap-2 rounded-xl border p-3 transition-all",
        maxed
          ? "border-accent/50 bg-accent/5"
          : reqMet
            ? "border-border bg-surface"
            : "border-border/50 bg-surface/40 opacity-60",
      )}
    >
      <div className="flex items-start gap-2">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-2 text-xl">
          {def.glyph}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{def.name}</p>
          <p className="font-mono text-[10px] text-faint">
            Lv {level}/{def.maxLevel}
          </p>
        </div>
      </div>
      <p className="text-[11px] leading-snug text-muted">{def.blurb}</p>
      <LevelDots level={level} max={def.maxLevel} />
      {maxed ? (
        <span className="rounded-md bg-accent/15 py-1 text-center text-[11px] font-bold uppercase text-accent">
          Maxed
        </span>
      ) : !reqMet ? (
        <span className="rounded-md bg-surface-2 py-1 text-center text-[10px] text-faint">
          Needs {def.requires?.map((r) => CONFIG.skills.find((s) => s.id === r)?.name).join(", ")}
        </span>
      ) : (
        <button
          onClick={() => store.buySkill(def.id)}
          disabled={!affordable}
          className={cn(
            "flex items-center justify-center gap-1 rounded-md py-1 font-mono text-xs font-semibold transition-colors",
            affordable
              ? "bg-brand text-brand-ink hover:bg-brand/90"
              : "bg-surface-2 text-faint",
          )}
        >
          ✦ {fmt(nextCost)}
        </button>
      )}
    </div>
  );
}

export function SkillsPanel() {
  useGameTick();
  const store = useStore();
  const maxRow = Math.max(...CONFIG.skills.map((s) => s.row));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Skill Tree</h2>
        <span className="flex items-center gap-1 font-mono text-xs text-brand">
          ✦ {fmt(store.state.stardust)}
        </span>
      </div>
      <p className="text-xs text-muted">
        Spend Stardust on permanent perks. Every Supernova makes you richer here.
      </p>
      <div className="overflow-x-auto pb-1">
        <div
          className="grid min-w-[420px] gap-2"
          style={{
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gridTemplateRows: `repeat(${maxRow + 1}, auto)`,
          }}
        >
          {CONFIG.skills.map((def) => (
            <SkillNode key={def.id} def={def} />
          ))}
        </div>
      </div>
    </div>
  );
}
