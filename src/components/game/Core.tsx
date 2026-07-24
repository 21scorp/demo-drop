"use client";

import { useCallback, useMemo, useRef } from "react";
import { CONFIG } from "@/lib/game/config";
import { fmt } from "@/lib/game/format";
import { useGameTick, useStore } from "./GameProvider";

const DEFAULT_COLORS: [string, string, string] = ["#c4b5fd", "#7c3aed", "#2e1065"];

export function Core() {
  useGameTick();
  const store = useStore();
  const fxRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<HTMLButtonElement>(null);

  const skin = useMemo(
    () => CONFIG.skins.find((s) => s.id === store.state.skin) ?? null,
    [store.state.skin],
  );
  const colors = skin?.colors ?? DEFAULT_COLORS;
  const reduced = store.state.settings.reducedMotion;
  const showFloaters = store.state.settings.showFloatingNumbers;

  const spawnFloater = useCallback(
    (x: number, y: number, text: string, strong: boolean) => {
      const layer = fxRef.current;
      if (!layer || !showFloaters) return;
      const el = document.createElement("div");
      el.textContent = text;
      el.style.cssText = `position:absolute;left:${x}px;top:${y}px;transform:translate(-50%,-50%);pointer-events:none;font-weight:700;white-space:nowrap;z-index:20;font-family:var(--font-mono),monospace;font-size:${
        strong ? 22 : 15
      }px;color:${strong ? "#fde68a" : "#e9e7ff"};text-shadow:0 2px 10px rgba(0,0,0,.6);`;
      layer.appendChild(el);
      const dx = (Math.random() - 0.5) * 40;
      el.animate(
        [
          { transform: "translate(-50%,-50%) translate(0,0)", opacity: 1 },
          { transform: `translate(-50%,-50%) translate(${dx}px,-70px)`, opacity: 0 },
        ],
        { duration: 950, easing: "cubic-bezier(0.22,1,0.36,1)" },
      ).onfinish = () => el.remove();
    },
    [showFloaters],
  );

  const spawnParticles = useCallback(
    (x: number, y: number, count: number) => {
      const layer = fxRef.current;
      if (!layer || reduced) return;
      for (let i = 0; i < count; i++) {
        const el = document.createElement("div");
        const size = 4 + Math.random() * 5;
        el.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${size}px;height:${size}px;border-radius:999px;pointer-events:none;z-index:15;background:${
          Math.random() > 0.5 ? colors[0] : colors[1]
        };box-shadow:0 0 8px ${colors[0]};`;
        layer.appendChild(el);
        const angle = Math.random() * Math.PI * 2;
        const dist = 30 + Math.random() * 70;
        el.animate(
          [
            { transform: "translate(-50%,-50%) translate(0,0) scale(1)", opacity: 1 },
            {
              transform: `translate(-50%,-50%) translate(${Math.cos(angle) * dist}px,${
                Math.sin(angle) * dist
              }px) scale(0)`,
              opacity: 0,
            },
          ],
          { duration: 600 + Math.random() * 300, easing: "cubic-bezier(0.22,1,0.36,1)" },
        ).onfinish = () => el.remove();
      }
    },
    [colors, reduced],
  );

  const handleTap = useCallback(
    (clientX: number, clientY: number) => {
      const layer = fxRef.current;
      const res = store.tap();
      if (layer) {
        const rect = layer.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        const strong = res.combo >= 10;
        spawnFloater(x, y, `+${fmt(res.power)}`, strong);
        spawnParticles(x, y, strong ? 12 : 7);
      }
      // Quick tactile bounce on the core.
      if (coreRef.current && !reduced) {
        coreRef.current.animate(
          [{ transform: "scale(0.94)" }, { transform: "scale(1)" }],
          { duration: 180, easing: "cubic-bezier(0.22,1,0.36,1)" },
        );
      }
    },
    [store, spawnFloater, spawnParticles, reduced],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      handleTap(e.clientX, e.clientY);
    },
    [handleTap],
  );

  const eps = store.liveEps();
  const tapPower = store.liveTapPower();
  const combo = store.combo;
  const comboPct = Math.min(1, combo / (20 + (store.state.skills.momentum ?? 0) * 5));

  // Pulse speed scales gently with production (more alive when richer).
  const pulseDur = eps > 0 ? Math.max(1.6, 4 - Math.log10(eps + 1) * 0.25) : 3.4;

  return (
    <div className="relative flex w-full flex-col items-center justify-center gap-6 py-4">
      {/* fx overlay spans the whole play area for floaters/particles */}
      <div ref={fxRef} className="pointer-events-none absolute inset-0 overflow-visible" />

      {/* Combo ring */}
      {combo > 1 && (
        <div className="absolute top-2 z-10 flex flex-col items-center gap-1">
          <span
            className="font-mono text-sm font-bold tabular-nums"
            style={{ color: combo >= 10 ? "#fde68a" : "#c4b5fd" }}
          >
            COMBO ×{store.comboMult.toFixed(1)}
          </span>
          <div className="h-1 w-28 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full transition-[width] duration-150"
              style={{
                width: `${comboPct * 100}%`,
                background: `linear-gradient(90deg, ${colors[0]}, #fde68a)`,
              }}
            />
          </div>
        </div>
      )}

      {/* The Core */}
      <button
        ref={coreRef}
        onPointerDown={onPointerDown}
        aria-label="Tap the core to generate energy"
        className="group relative grid aspect-square w-[min(58vw,300px)] place-items-center rounded-full outline-none"
        style={{ touchAction: "manipulation" }}
      >
        {/* outer glow */}
        <span
          className="absolute inset-[-18%] rounded-full opacity-60 blur-2xl"
          style={{
            background: `radial-gradient(circle, ${colors[0]}, transparent 70%)`,
            animation: reduced ? undefined : `pulseGlow ${pulseDur}s ease-in-out infinite`,
          }}
        />
        {/* rotating halo */}
        {!reduced && (
          <span
            className="absolute inset-[-6%] rounded-full opacity-70"
            style={{
              background: `conic-gradient(from 0deg, transparent, ${colors[0]}44, transparent, ${colors[1]}55, transparent)`,
              animation: "spin 14s linear infinite",
            }}
          />
        )}
        {/* body */}
        <span
          className="relative grid h-full w-full place-items-center rounded-full transition-transform duration-150 group-active:scale-95"
          style={{
            background: `radial-gradient(circle at 35% 30%, ${colors[0]}, ${colors[1]} 55%, ${colors[2]})`,
            boxShadow: `inset 0 0 60px rgba(0,0,0,0.45), 0 0 60px ${colors[1]}66`,
          }}
        >
          <span className="select-none text-6xl drop-shadow-lg sm:text-7xl">✦</span>
        </span>
      </button>

      {/* under-core readout */}
      <div className="z-10 flex flex-col items-center gap-0.5">
        <span className="font-mono text-xs uppercase tracking-widest text-faint">per tap</span>
        <span className="font-mono text-lg font-semibold text-ink tabular-nums">
          +{fmt(tapPower)}
        </span>
      </div>

      <style>{`
        @keyframes pulseGlow { 0%,100% { transform: scale(1); opacity:.5 } 50% { transform: scale(1.08); opacity:.75 } }
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  );
}
