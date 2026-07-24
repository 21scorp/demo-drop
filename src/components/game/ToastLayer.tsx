"use client";

import { useEffect, useRef } from "react";
import type { ToastKind } from "@/lib/game/types";
import { cn } from "@/lib/utils";
import { useGameTick, useStore } from "./GameProvider";

const TONE: Record<ToastKind, string> = {
  achievement: "border-warning/40 bg-warning/10",
  unlock: "border-brand/40 bg-brand/10",
  flare: "border-accent/40 bg-accent/10",
  prestige: "border-brand/50 bg-brand/15",
  info: "border-border bg-surface-2",
};

export function ToastLayer() {
  useGameTick();
  const store = useStore();
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    for (const t of store.toasts) {
      if (!timers.current.has(t.id)) {
        const ttl = t.kind === "prestige" || t.kind === "achievement" ? 5000 : 3600;
        const handle = setTimeout(() => {
          store.dismissToast(t.id);
          timers.current.delete(t.id);
        }, ttl);
        timers.current.set(t.id, handle);
      }
    }
  });

  useEffect(() => {
    const map = timers.current;
    return () => map.forEach((h) => clearTimeout(h));
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[70] flex flex-col items-center gap-2 px-4">
      {store.toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-lift backdrop-blur-md animate-fade-up",
            TONE[t.kind],
          )}
        >
          {t.glyph && <span className="text-2xl leading-none">{t.glyph}</span>}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{t.title}</p>
            {t.body && <p className="mt-0.5 text-xs text-muted">{t.body}</p>}
          </div>
          {t.kind === "achievement" && (
            <span className="shrink-0 rounded-full bg-warning/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-warning">
              +boost
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
