"use client";

import { useState } from "react";
import { CONFIG } from "@/lib/game/config";
import type { Notation } from "@/lib/game/format";
import { SUPPORTER_URL, hasSupporterCheckout } from "@/lib/monetize";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useGameTick, useStore } from "./GameProvider";

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">{label}</p>
        {hint && <p className="text-xs text-faint">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className={cn(
        "relative h-6 w-11 rounded-full transition-colors",
        on ? "bg-brand" : "bg-surface-2",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
          on ? "translate-x-[22px]" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

function Slider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input
      type="range"
      min={0}
      max={1}
      step={0.05}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-1.5 w-32 cursor-pointer appearance-none rounded-full bg-surface-2 accent-brand"
    />
  );
}

export function SettingsPanel() {
  useGameTick();
  const store = useStore();
  const s = store.state;
  const [importText, setImportText] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const flash = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(null), 2500);
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Settings</h2>

      {/* Skins */}
      <section>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-faint">Core skin</p>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
          {CONFIG.skins.map((skin) => {
            const locked =
              (skin.supporter && !s.supporter) ||
              (skin.unlockSupernovas ? s.supernovaCount < skin.unlockSupernovas : false) ||
              (skin.unlockSingularities ? s.singularityCount < skin.unlockSingularities : false);
            const active = s.skin === skin.id;
            return (
              <button
                key={skin.id}
                onClick={() => (locked ? flash("Locked — see how to unlock in the label.") : store.setSkin(skin.id))}
                className={cn(
                  "group relative aspect-square rounded-full ring-2 transition-all",
                  active ? "ring-brand" : "ring-transparent hover:ring-border",
                  locked && "opacity-40",
                )}
                title={
                  locked
                    ? skin.supporter
                      ? "Supporter Pack"
                      : skin.unlockSingularities
                        ? `Unlocks at ${skin.unlockSingularities} singularities`
                        : `Unlocks at ${skin.unlockSupernovas} supernovas`
                    : skin.name
                }
                style={{
                  background: `radial-gradient(circle at 35% 30%, ${skin.colors[0]}, ${skin.colors[1]} 55%, ${skin.colors[2]})`,
                }}
              >
                {locked && (
                  <span className="absolute inset-0 grid place-items-center text-xs">🔒</span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Audio + display */}
      <section className="divide-y divide-border/60 rounded-xl border border-border bg-surface px-3">
        <Row label="Sound effects">
          <Slider value={s.settings.sfxVolume} onChange={(v) => store.updateSettings({ sfxVolume: v })} />
        </Row>
        <Row label="Ambient music">
          <Slider value={s.settings.musicVolume} onChange={(v) => store.updateSettings({ musicVolume: v })} />
        </Row>
        <Row label="Floating numbers" hint="Show +energy on every tap">
          <Toggle
            on={s.settings.showFloatingNumbers}
            onClick={() => store.updateSettings({ showFloatingNumbers: !s.settings.showFloatingNumbers })}
          />
        </Row>
        <Row label="Reduced motion" hint="Fewer particles & animations">
          <Toggle
            on={s.settings.reducedMotion}
            onClick={() => store.updateSettings({ reducedMotion: !s.settings.reducedMotion })}
          />
        </Row>
        <Row label="Number notation">
          <select
            value={s.settings.notation}
            onChange={(e) => store.updateSettings({ notation: e.target.value as Notation })}
            className="rounded-md border border-border bg-surface-2 px-2 py-1 text-sm text-ink outline-none"
          >
            <option value="standard">Standard (K, M, B)</option>
            <option value="scientific">Scientific (1e6)</option>
            <option value="engineering">Engineering</option>
          </select>
        </Row>
      </section>

      {/* Supporter */}
      <section className="rounded-xl border border-brand/30 bg-brand/5 p-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">💛</span>
          <p className="text-sm font-semibold text-ink">Supporter Pack</p>
        </div>
        <p className="mt-1 text-xs text-muted">
          Remove ads, unlock exclusive skins, and gain a permanent +10% to all production.
        </p>
        {s.supporter ? (
          <p className="mt-2 font-mono text-xs text-accent">✓ Active — thank you for the support!</p>
        ) : (
          <Button
            size="sm"
            className="mt-3"
            onClick={() => {
              if (hasSupporterCheckout()) {
                const back = `${window.location.origin}/play?supporter=success`;
                window.location.href = `${SUPPORTER_URL}${SUPPORTER_URL.includes("?") ? "&" : "?"}redirect=${encodeURIComponent(back)}`;
              } else {
                store.grantSupporter();
              }
            }}
          >
            Unlock Supporter Pack
          </Button>
        )}
      </section>

      {/* Save management */}
      <section className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-faint">Your save</p>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              const code = store.exportSave();
              navigator.clipboard?.writeText(code).then(
                () => flash("Save copied to clipboard."),
                () => flash("Copy failed — long-press to select."),
              );
            }}
          >
            Copy save code
          </Button>
        </div>
        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder="Paste a save code here to import…"
          rows={2}
          className="w-full resize-none rounded-lg border border-border bg-surface-2 p-2 font-mono text-xs text-ink outline-none focus:border-brand/60"
        />
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={!importText.trim()}
            onClick={() => {
              const ok = store.importSave(importText.trim());
              flash(ok ? "Save imported!" : "That doesn't look like a valid save.");
              if (ok) setImportText("");
            }}
          >
            Import
          </Button>
          {msg && <span className="text-xs text-muted">{msg}</span>}
        </div>
      </section>

      {/* Danger zone */}
      <section className="rounded-xl border border-danger/30 bg-danger/5 p-3">
        {!confirmReset ? (
          <Button variant="danger" size="sm" onClick={() => setConfirmReset(true)}>
            Reset everything
          </Button>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted">
              This erases your entire universe — permanently. Consider copying your save first.
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setConfirmReset(false)}>
                Keep playing
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  store.hardReset();
                  setConfirmReset(false);
                  flash("A fresh universe awaits.");
                }}
              >
                Erase it all
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
