"use client";

import { useState } from "react";
import {
  canSingularity,
  energyForNextStardust,
  prestigeGain,
  singularityGain,
  stardustForNextDarkMatter,
} from "@/lib/game/engine";
import { DARK_MATTER_GLOBAL, SINGULARITY_MIN_SUPERNOVAS } from "@/lib/game/config";
import { fmt } from "@/lib/game/format";
import { showInterstitial } from "@/lib/monetize";
import { Button } from "@/components/ui/Button";
import { useGameTick, useStore } from "./GameProvider";

export function SupernovaPanel() {
  useGameTick();
  const store = useStore();
  const s = store.state;
  const notation = s.settings.notation;
  const [confirming, setConfirming] = useState(false);
  const [confirmingSing, setConfirmingSing] = useState(false);

  const gain = prestigeGain(s);
  const canNova = gain >= 1;
  const permanentBonus = 0.03 * s.stardustEarned;

  // progress toward the next whole stardust point
  const nextThreshold = energyForNextStardust(s);
  const progress = canNova
    ? Math.min(1, (gain - Math.floor(gain)) || 0.999)
    : Math.min(1, s.totalEnergyThisRun / nextThreshold);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Supernova</h2>
        <span className="font-mono text-xs text-faint">{s.supernovaCount} collapses</span>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-brand/30 bg-gradient-to-b from-brand/10 to-transparent p-5">
        <div className="pointer-events-none absolute -right-8 -top-8 text-8xl opacity-10">💥</div>
        <p className="text-sm text-muted">Collapse the universe to bank</p>
        <p className="mt-1 flex items-baseline gap-2">
          <span className="font-mono text-4xl font-bold tabular-nums text-brand">
            +{fmt(gain, notation)}
          </span>
          <span className="text-lg text-brand">✦ Stardust</span>
        </p>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-2">
          <div
            className={`h-full rounded-full bg-gradient-to-r from-brand to-accent transition-[width] duration-300 ${
              !canNova && progress > 0.8 ? "animate-pulse" : ""
            }`}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <p className="mt-1.5 font-mono text-[11px] text-faint">
          {canNova
            ? "Ready — but every second longer earns a little more."
            : `${fmt(s.totalEnergyThisRun, notation)} / ${fmt(nextThreshold, notation)} energy to first Stardust`}
        </p>

        <div className="mt-4">
          {!confirming ? (
            <Button
              className="w-full"
              size="lg"
              disabled={!canNova}
              onClick={() => setConfirming(true)}
            >
              Go Supernova
            </Button>
          ) : (
            <div className="flex flex-col gap-2 rounded-lg border border-warning/40 bg-warning/5 p-3">
              <p className="text-xs text-muted">
                This <span className="font-semibold text-ink">resets energy, generators and upgrades</span>.
                You keep Stardust, skills, achievements and cosmetics — and become permanently stronger.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setConfirming(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    const gained = store.doSupernova();
                    setConfirming(false);
                    if (gained > 0 && store.state.supernovaCount % 3 === 0 && !store.state.supporter) {
                      void showInterstitial();
                    }
                  }}
                >
                  Collapse now
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-border bg-surface p-3">
          <p className="text-xs text-faint">Stardust banked</p>
          <p className="mt-0.5 font-mono text-lg font-semibold text-brand">
            ✦ {fmt(s.stardust, notation)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-3">
          <p className="text-xs text-faint">Permanent bonus</p>
          <p className="mt-0.5 font-mono text-lg font-semibold text-accent">
            +{Math.round(permanentBonus * 100)}%
          </p>
        </div>
      </div>

      {/* Singularity — the second prestige layer */}
      {s.supernovaCount >= 5 && (
        <SingularitySection
          confirming={confirmingSing}
          setConfirming={setConfirmingSing}
        />
      )}
    </div>
  );
}

function SingularitySection({
  confirming,
  setConfirming,
}: {
  confirming: boolean;
  setConfirming: (v: boolean) => void;
}) {
  const store = useStore();
  const s = store.state;
  const notation = s.settings.notation;
  const unlocked = s.supernovaCount >= SINGULARITY_MIN_SUPERNOVAS;
  const gain = singularityGain(s);
  const ready = canSingularity(s);
  const nextTarget = stardustForNextDarkMatter(s);
  const progress = unlocked ? Math.min(1, s.stardustEarned / nextTarget) : s.supernovaCount / SINGULARITY_MIN_SUPERNOVAS;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-accent/30 bg-gradient-to-b from-accent/10 to-transparent p-5">
      <div className="pointer-events-none absolute -right-6 -top-6 text-8xl opacity-10">◆</div>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wide text-accent">Singularity</h3>
        <span className="font-mono text-xs text-faint">{s.singularityCount} collapses</span>
      </div>

      {!unlocked ? (
        <>
          <p className="mt-2 text-sm text-muted">
            A deeper prestige. Collapse <span className="text-ink">everything</span> — Stardust and
            skills included — into <span className="text-accent">◆ Dark Matter</span>, a permanent
            currency that supercharges every future run.
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent to-brand"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <p className="mt-1.5 font-mono text-[11px] text-faint">
            Unlocks at {SINGULARITY_MIN_SUPERNOVAS} Supernovas ({SINGULARITY_MIN_SUPERNOVAS - s.supernovaCount} to go)
          </p>
        </>
      ) : (
        <>
          <p className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold tabular-nums text-accent">
              +{fmt(gain, notation)}
            </span>
            <span className="text-accent">◆ Dark Matter</span>
          </p>
          <p className="mt-1 font-mono text-[11px] text-faint">
            Each ◆ gives +{Math.round(DARK_MATTER_GLOBAL * 100)}% production forever · you hold{" "}
            {fmt(s.darkMatter, notation)} ◆
          </p>
          <div className="mt-4">
            {!confirming ? (
              <Button
                variant="secondary"
                className="w-full border-accent/40 text-accent hover:bg-accent/10"
                disabled={!ready}
                onClick={() => setConfirming(true)}
              >
                Collapse into a Singularity
              </Button>
            ) : (
              <div className="flex flex-col gap-2 rounded-lg border border-danger/40 bg-danger/5 p-3">
                <p className="text-xs text-muted">
                  This is a <span className="font-semibold text-danger">deep reset</span>: you lose all
                  Stardust and skills on top of the usual Supernova reset. In return you gain{" "}
                  <span className="text-accent">{fmt(gain)} ◆ Dark Matter</span>, permanently. Only do
                  this when a fresh, far-stronger run is worth it.
                </p>
                <div className="flex gap-2">
                  <Button variant="secondary" className="flex-1" onClick={() => setConfirming(false)}>
                    Not yet
                  </Button>
                  <Button
                    variant="danger"
                    className="flex-1"
                    onClick={() => {
                      store.doSingularity();
                      setConfirming(false);
                    }}
                  >
                    Collapse
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
