"use client";

import { fmt } from "@/lib/game/format";
import { useGameTick, useStore } from "./GameProvider";

const DURATION = 1800;

export function PrestigeFlash() {
  useGameTick();
  const store = useStore();
  const p = store.lastPrestige;
  if (!p) return null;
  const age = Date.now() - p.at;
  if (age > DURATION) return null;
  if (store.state.settings.reducedMotion) return null;

  const isSing = p.kind === "singularity";
  const color = isSing ? "134 239 90" : "167 139 250"; // accent vs brand (rgb)

  return (
    <div className="pointer-events-none fixed inset-0 z-[90] grid place-items-center overflow-hidden">
      {/* expanding shockwave */}
      <span
        className="absolute rounded-full"
        style={{
          width: "20vmax",
          height: "20vmax",
          border: `2px solid rgba(${color}, 0.7)`,
          animation: `shock ${DURATION}ms cubic-bezier(0.22,1,0.36,1) forwards`,
        }}
      />
      {/* radial flash */}
      <span
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 50% 50%, rgba(${color},0.35), transparent 60%)`,
          animation: `flashFade ${DURATION}ms ease-out forwards`,
        }}
      />
      {/* label */}
      <div
        className="relative text-center"
        style={{ animation: `popLabel ${DURATION}ms cubic-bezier(0.22,1,0.36,1) forwards` }}
      >
        <p
          className="font-display text-5xl font-black tracking-tight sm:text-7xl"
          style={{ color: `rgb(${color})`, textShadow: `0 0 40px rgba(${color},0.8)` }}
        >
          {isSing ? "SINGULARITY" : "SUPERNOVA"}
        </p>
        <p className="mt-2 font-mono text-lg font-bold text-ink">
          +{fmt(p.gain)} {isSing ? "◆ Dark Matter" : "✦ Stardust"}
        </p>
      </div>

      <style>{`
        @keyframes shock { 0% { transform: scale(0.1); opacity: 0.9 } 100% { transform: scale(9); opacity: 0 } }
        @keyframes flashFade { 0% { opacity: 1 } 100% { opacity: 0 } }
        @keyframes popLabel {
          0% { transform: scale(0.6); opacity: 0 }
          18% { transform: scale(1.06); opacity: 1 }
          70% { transform: scale(1); opacity: 1 }
          100% { transform: scale(1.02); opacity: 0 }
        }
      `}</style>
    </div>
  );
}
