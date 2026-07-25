"use client";

import { useCallback, useRef } from "react";
import type { FlareKind } from "@/lib/game/types";
import { useGameTick, useStore } from "./GameProvider";

const GLYPH: Record<FlareKind, string> = {
  surge: "☄️",
  frenzy: "🔥",
  tapstorm: "⚡",
  jackpot: "🌟",
};
const TONE: Record<FlareKind, string> = {
  surge: "#fbbf24",
  frenzy: "#fb923c",
  tapstorm: "#a3e635",
  jackpot: "#fde68a",
};

export function FlareLayer() {
  useGameTick();
  const store = useStore();
  const layerRef = useRef<HTMLDivElement>(null);
  const reduced = store.state.settings.reducedMotion;

  const burst = useCallback(
    (x: number, y: number, tone: string, label: string) => {
      const layer = layerRef.current;
      if (!layer) return;
      // floating label
      const lab = document.createElement("div");
      lab.textContent = label;
      lab.style.cssText = `position:fixed;left:${x}px;top:${y}px;transform:translate(-50%,-50%);pointer-events:none;z-index:60;font-family:var(--font-mono),monospace;font-weight:800;font-size:22px;color:${tone};text-shadow:0 2px 12px rgba(0,0,0,.7);`;
      document.body.appendChild(lab);
      lab.animate(
        [
          { transform: "translate(-50%,-50%) scale(0.6)", opacity: 0 },
          { transform: "translate(-50%,-90px) scale(1.1)", opacity: 1, offset: 0.3 },
          { transform: "translate(-50%,-140px) scale(1)", opacity: 0 },
        ],
        { duration: 1200, easing: "cubic-bezier(0.22,1,0.36,1)" },
      ).onfinish = () => lab.remove();

      if (reduced) return;
      for (let i = 0; i < 20; i++) {
        const p = document.createElement("div");
        const size = 5 + Math.random() * 7;
        p.style.cssText = `position:fixed;left:${x}px;top:${y}px;width:${size}px;height:${size}px;border-radius:999px;pointer-events:none;z-index:59;background:${tone};box-shadow:0 0 10px ${tone};`;
        document.body.appendChild(p);
        const a = Math.random() * Math.PI * 2;
        const d = 60 + Math.random() * 120;
        p.animate(
          [
            { transform: "translate(-50%,-50%) translate(0,0) scale(1)", opacity: 1 },
            {
              transform: `translate(-50%,-50%) translate(${Math.cos(a) * d}px,${Math.sin(a) * d}px) scale(0)`,
              opacity: 0,
            },
          ],
          { duration: 700 + Math.random() * 400, easing: "cubic-bezier(0.22,1,0.36,1)" },
        ).onfinish = () => p.remove();
      }
    },
    [reduced],
  );

  const onCollect = useCallback(
    (e: React.PointerEvent, id: number) => {
      e.preventDefault();
      e.stopPropagation();
      const x = e.clientX;
      const y = e.clientY;
      const res = store.collectFlare(id);
      if (res) burst(x, y, TONE[res.kind], res.label);
    },
    [store, burst],
  );

  const firstEver = store.state.stats.flaresCollected === 0;

  return (
    <div ref={layerRef} className="pointer-events-none fixed inset-0 z-50">
      {store.flares.map((f) => {
        const age = Date.now() - f.bornAt;
        const life = age / f.ttl;
        const dying = life > 0.8;
        return (
          <button
            key={f.id}
            onPointerDown={(e) => onCollect(e, f.id)}
            aria-label={`Collect ${f.kind} flare`}
            className="pointer-events-auto absolute grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full"
            style={{
              left: `${f.x}%`,
              top: `${f.y}%`,
              animation: reduced
                ? undefined
                : `flareFloat 3s ease-in-out infinite, flareIn .4s cubic-bezier(0.22,1,0.36,1)`,
              opacity: dying ? 0.5 + Math.abs(Math.sin(age / 120)) * 0.5 : 1,
            }}
          >
            <span
              className="absolute inset-0 rounded-full blur-md"
              style={{ background: TONE[f.kind], opacity: 0.55 }}
            />
            <span className="relative text-3xl drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
              {GLYPH[f.kind]}
            </span>
            {firstEver && (
              <span className="absolute left-1/2 top-full mt-1 -translate-x-1/2 animate-pulse whitespace-nowrap rounded-full bg-warning/90 px-2 py-0.5 text-[11px] font-bold text-black">
                Tap the flare!
              </span>
            )}
          </button>
        );
      })}
      <style>{`
        @keyframes flareFloat { 0%,100% { margin-top:0 } 50% { margin-top:-12px } }
        @keyframes flareIn { from { transform: translate(-50%,-50%) scale(0) } to { transform: translate(-50%,-50%) scale(1) } }
      `}</style>
    </div>
  );
}
