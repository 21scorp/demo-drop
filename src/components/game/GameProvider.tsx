"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { createGameStore, type GameStore } from "@/lib/game/store";

const GameContext = createContext<GameStore | null>(null);

function BootScreen() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 bg-bg">
      <div className="relative h-24 w-24">
        <div className="absolute inset-0 animate-pulse rounded-full bg-brand/40 blur-2xl" />
        <div className="absolute inset-0 grid place-items-center text-5xl">✦</div>
      </div>
      <p className="font-mono text-sm uppercase tracking-[0.3em] text-muted">
        igniting…
      </p>
    </div>
  );
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<GameStore | null>(null);

  useEffect(() => {
    const s = createGameStore();
    s.start();
    setStore(s);

    // Power-user / debug console handle (the game is client-side anyway).
    (window as unknown as { SUPERNOVA?: unknown }).SUPERNOVA = s;
    try {
      // eslint-disable-next-line no-console
      console.log(
        "%c✦ SUPERNOVA",
        "color:#a78bfa;font-size:22px;font-weight:800",
        "\nCurious? `window.SUPERNOVA` is the live game store. Tinker at your own risk. ✨",
      );
    } catch {
      /* noop */
    }

    // Grant the Supporter Pack when returning from a successful checkout.
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("supporter") === "success") {
        s.grantSupporter();
        params.delete("supporter");
        const qs = params.toString();
        window.history.replaceState({}, "", window.location.pathname + (qs ? `?${qs}` : ""));
      }
    } catch {
      /* ignore */
    }

    const onVisibility = () => {
      if (document.hidden) s.pauseToBackground();
      else s.resumeFromBackground();
    };
    const onHide = () => s.pauseToBackground();

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onHide);
    window.addEventListener("beforeunload", onHide);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onHide);
      window.removeEventListener("beforeunload", onHide);
      s.stop();
    };
  }, []);

  if (!store) return <BootScreen />;
  return <GameContext.Provider value={store}>{children}</GameContext.Provider>;
}

/** Access the live store (throws if used outside the provider). */
export function useStore(): GameStore {
  const s = useContext(GameContext);
  if (!s) throw new Error("useStore must be used within <GameProvider>");
  return s;
}

/**
 * Subscribe a component to store commits. Returns the current tick; read live
 * values off the store object (store.state, store.derived, store.liveEps(), …).
 */
export function useGameTick(): number {
  const store = useStore();
  return useSyncExternalStore(store.subscribe, store.getTick, store.getTick);
}
