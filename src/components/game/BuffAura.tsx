"use client";

import { useGameTick, useStore } from "./GameProvider";

export function BuffAura() {
  useGameTick();
  const store = useStore();
  if (store.state.settings.reducedMotion) return null;

  const frenzy = store.buffs.some((b) => b.kind === "frenzy");
  const tapstorm = store.buffs.some((b) => b.kind === "tapstorm");
  const event = store.activeEvent;

  let color: string | null = null;
  if (frenzy) color = "245 158 11"; // amber
  else if (tapstorm) color = "163 230 53"; // lime
  else if (event) color = "167 139 250"; // brand violet
  if (!color) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-30"
      style={{
        boxShadow: `inset 0 0 120px 8px rgba(${color}, 0.28)`,
        animation: "auraPulse 2.2s ease-in-out infinite",
      }}
    >
      <style>{`@keyframes auraPulse { 0%,100% { opacity: 0.55 } 50% { opacity: 1 } }`}</style>
    </div>
  );
}
