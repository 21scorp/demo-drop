"use client";

import { useState } from "react";
import { CONFIG } from "@/lib/game/config";
import { cn } from "@/lib/utils";
import { AchievementsPanel } from "./AchievementsPanel";
import { GeneratorList } from "./GeneratorList";
import { useGameTick, useStore } from "./GameProvider";
import { SettingsPanel } from "./SettingsPanel";
import { SkillsPanel } from "./SkillsPanel";
import { StatsPanel } from "./StatsPanel";
import { SupernovaPanel } from "./SupernovaPanel";
import { UpgradesPanel } from "./UpgradesPanel";

type TabId = "cosmos" | "upgrades" | "nova" | "skills" | "awards" | "stats" | "settings";

const TABS: { id: TabId; label: string; glyph: string }[] = [
  { id: "cosmos", label: "Cosmos", glyph: "🪐" },
  { id: "upgrades", label: "Upgrades", glyph: "⬆️" },
  { id: "nova", label: "Nova", glyph: "💥" },
  { id: "skills", label: "Skills", glyph: "🌀" },
  { id: "awards", label: "Awards", glyph: "🏆" },
  { id: "stats", label: "Stats", glyph: "📊" },
  { id: "settings", label: "Settings", glyph: "⚙️" },
];

export function GameShell() {
  useGameTick();
  const store = useStore();
  const [tab, setTab] = useState<TabId>("cosmos");

  const canNova = store.canSupernova();
  const ctx = store.unlockCtx();
  const purchased = new Set(store.state.upgrades);
  const availableUpgradeCount = CONFIG.upgrades.filter(
    (u) => !purchased.has(u.id) && u.unlock(ctx) && store.state.energy >= u.cost,
  ).length;

  return (
    <div className="flex h-full flex-col">
      {/* Tab bar */}
      <div className="no-scrollbar -mx-1 mb-3 flex gap-1 overflow-x-auto px-1">
        {TABS.map((t) => {
          const badge =
            t.id === "nova" && canNova
              ? "•"
              : t.id === "upgrades" && availableUpgradeCount > 0
                ? String(availableUpgradeCount)
                : null;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "relative flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                tab === t.id
                  ? "bg-surface-2 text-ink"
                  : "text-muted hover:bg-surface-2/50 hover:text-ink",
              )}
            >
              <span className="text-base leading-none">{t.glyph}</span>
              <span className="hidden sm:inline">{t.label}</span>
              {badge && (
                <span
                  className={cn(
                    "ml-0.5 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-bold",
                    t.id === "nova" ? "bg-brand text-brand-ink" : "bg-accent text-black",
                  )}
                >
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Panel */}
      <div className="card min-h-0 flex-1 overflow-y-auto p-4">
        {tab === "cosmos" && <GeneratorList />}
        {tab === "upgrades" && <UpgradesPanel />}
        {tab === "nova" && <SupernovaPanel />}
        {tab === "skills" && <SkillsPanel />}
        {tab === "awards" && <AchievementsPanel />}
        {tab === "stats" && <StatsPanel />}
        {tab === "settings" && <SettingsPanel />}
      </div>
    </div>
  );
}
