/**
 * The runtime store. Owns the live GameState, the requestAnimationFrame loop,
 * combos, Solar Flares, temporary buffs, autosave, offline catch-up, the daily
 * streak, and every player action. Framework-agnostic (no React); a thin provider
 * drives start()/stop() and subscribes for renders.
 */

import { getAudio, type AudioEngine } from "./audio";
import {
  BASE_TAP,
  CONFIG,
  EVENTS,
  EVENT_FIRST_MAX,
  EVENT_FIRST_MIN,
  EVENT_MIN_LIFETIME,
  EVENT_STEADY_MAX,
  EVENT_STEADY_MIN,
} from "./config";
import {
  buildUnlockCtx,
  buyGenerator as engBuyGenerator,
  buySkill as engBuySkill,
  buyUpgrade as engBuyUpgrade,
  computeDerived,
  computeMultipliers,
  computeOffline,
  newlyUnlockedAchievements,
  prestigeGain,
  canSingularity as engCanSingularity,
  singularity as engSingularity,
  singularityGain as engSingularityGain,
  supernova as engSupernova,
  tapPower as engTapPower,
} from "./engine";
import {
  clearStorage,
  exportSave as engExport,
  importSave as engImport,
  loadFromStorage,
  newGame,
  saveToStorage,
} from "./save";
import type {
  ActiveBuff,
  ActiveEvent,
  Derived,
  Flare,
  FlareKind,
  GameState,
  Multipliers,
  Settings,
  Toast,
} from "./types";

const COMMIT_INTERVAL_MS = 60; // ~16fps React commits (numbers stay smooth)
const AUTOSAVE_INTERVAL_MS = 10_000;
const OFFLINE_MIN_MS = 30_000; // below this, credit silently (no modal)
const COMBO_STEP = 0.1;
const DAY_MS = 86_400_000;

const FLARE_WEIGHTS: { kind: FlareKind; w: number }[] = [
  { kind: "surge", w: 50 },
  { kind: "frenzy", w: 25 },
  { kind: "tapstorm", w: 18 },
  { kind: "jackpot", w: 7 },
];

export interface OfflineReport {
  gained: number;
  ms: number;
  eps: number;
}

export interface TapResult {
  power: number;
  combo: number;
  comboMult: number;
}

export class GameStore {
  state: GameState;
  derived: Derived;
  mult: Multipliers;

  // runtime-only
  flares: Flare[] = [];
  buffs: ActiveBuff[] = [];
  toasts: Toast[] = [];
  activeEvent: ActiveEvent | null = null;
  combo = 0;
  comboMult = 1;
  pendingOffline: OfflineReport | null = null;

  private audio: AudioEngine;
  private now: number;
  private rafId: number | null = null;
  private lastFrame = 0;
  private lastCommit = 0;
  private lastSave = 0;
  private comboExpires = 0;
  private nextFlareAt = 0;
  private nextEventAt = 0;
  private knownGenerators = new Set<string>();
  private idSeq = 1;
  private listeners = new Set<() => void>();
  private tick = 0;
  private running = false;

  constructor() {
    this.now = Date.now();
    const loaded = loadFromStorage(this.now);
    this.state = loaded ?? newGame(this.now);
    this.audio = getAudio();
    this.audio.setSfxVolume(this.state.settings.sfxVolume);
    this.audio.setMusicVolume(this.state.settings.musicVolume);
    this.mult = computeMultipliers(this.state, CONFIG);
    this.derived = computeDerived(this.state, CONFIG);
    this.scheduleNextFlare(this.now);
    this.scheduleNextEvent(this.now, true);
    // Remember which generators are already unlocked so we only celebrate NEW ones.
    {
      const ctx = buildUnlockCtx(this.state);
      for (const g of CONFIG.generators) if (g.unlock(ctx)) this.knownGenerators.add(g.id);
    }
    if (loaded) this.applyOffline(this.now);
    this.evaluateDaily(this.now);
  }

  /* ── subscription (for React useSyncExternalStore) ────────────────────── */

  subscribe = (cb: () => void): (() => void) => {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  };
  getTick = (): number => this.tick;

  private notify() {
    this.tick++;
    for (const cb of this.listeners) cb();
  }

  private newId() {
    return this.idSeq++;
  }

  /* ── derived / live values ─────────────────────────────────────────────── */

  private recompute() {
    this.mult = computeMultipliers(this.state, CONFIG);
    this.derived = computeDerived(this.state, CONFIG);
  }

  private prodBuffMult(): number {
    let m = 1;
    for (const b of this.buffs) if (b.kind === "frenzy") m *= b.mult;
    return m;
  }
  private tapBuffMult(): number {
    let m = 1;
    for (const b of this.buffs) if (b.kind === "tapstorm") m *= b.mult;
    return m;
  }

  private eventProdMult(): number {
    return this.activeEvent?.def.prodMult ?? 1;
  }
  private eventTapMult(): number {
    return this.activeEvent?.def.tapMult ?? 1;
  }
  private eventFlareFreqMult(): number {
    return this.activeEvent?.def.flareFreqMult ?? 1;
  }

  /** Live energy/sec including temporary buffs and events. */
  liveEps(): number {
    return this.derived.energyPerSec * this.prodBuffMult() * this.eventProdMult();
  }

  /** Live tap power including combo, buffs and events. */
  liveTapPower(): number {
    return (
      engTapPower(this.state, CONFIG, this.derived.energyPerSec, this.mult, this.comboMult) *
      this.tapBuffMult() *
      this.eventTapMult()
    );
  }

  /* ── lifecycle ─────────────────────────────────────────────────────────── */

  start() {
    if (this.running) return;
    this.running = true;
    this.lastFrame = performance.now();
    this.lastCommit = this.lastFrame;
    this.lastSave = this.lastFrame;
    const loop = (t: number) => {
      if (!this.running) return;
      this.frame(t);
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
    if (this.state.settings.musicVolume > 0) this.audio.startMusic();
  }

  stop() {
    this.running = false;
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    this.audio.stopMusic();
    this.save();
  }

  private frame(perfNow: number) {
    const dtMs = Math.min(1000, perfNow - this.lastFrame);
    this.lastFrame = perfNow;
    const dt = dtMs / 1000;
    this.now = Date.now();

    // Production
    const eps = this.liveEps();
    if (eps > 0 && dt > 0) {
      const gained = eps * dt;
      this.state.energy += gained;
      this.state.totalEnergyThisRun += gained;
      this.state.lifetimeEnergy += gained;
    }
    this.state.playtimeMs += dtMs;
    if (eps > this.state.stats.bestEnergyPerSec) this.state.stats.bestEnergyPerSec = eps;

    // Combo decay
    if (this.combo > 0 && this.now >= this.comboExpires) {
      this.combo = 0;
      this.comboMult = 1;
    }

    // Buffs expiry
    if (this.buffs.length) {
      const before = this.buffs.length;
      this.buffs = this.buffs.filter((b) => b.expiresAt > this.now);
      if (this.buffs.length !== before) this.recompute();
    }

    // Flares
    if (this.now >= this.nextFlareAt) this.spawnFlare(this.now);
    if (this.flares.length) {
      this.flares = this.flares.filter((f) => f.bornAt + f.ttl > this.now);
    }

    // Cosmic events
    if (this.activeEvent && this.now >= this.activeEvent.expiresAt) {
      this.activeEvent = null;
      this.scheduleNextEvent(this.now, false);
    } else if (
      !this.activeEvent &&
      this.now >= this.nextEventAt &&
      this.state.lifetimeEnergy >= EVENT_MIN_LIFETIME
    ) {
      this.triggerEvent(this.now);
    }

    // To* expiry
    // (toasts self-expire in UI; we cap the array)
    if (this.toasts.length > 6) this.toasts = this.toasts.slice(-6);

    // Achievements + new-tier unlocks (throttled to commits)
    if (perfNow - this.lastCommit >= COMMIT_INTERVAL_MS) {
      this.scanAchievements();
      this.checkGeneratorUnlocks();
      this.recompute();
      this.lastCommit = perfNow;
      this.notify();
    }

    // Autosave
    if (perfNow - this.lastSave >= AUTOSAVE_INTERVAL_MS) {
      this.save();
      this.lastSave = perfNow;
    }
  }

  /* ── saving ────────────────────────────────────────────────────────────── */

  save() {
    this.state.lastSeen = Date.now();
    saveToStorage(this.state);
  }

  /* ── offline ───────────────────────────────────────────────────────────── */

  private applyOffline(now: number) {
    const elapsed = now - this.state.lastSeen;
    if (elapsed < OFFLINE_MIN_MS) return;
    const res = computeOffline(this.state, CONFIG, elapsed);
    if (res.gained > 0) {
      this.state.energy += res.gained;
      this.state.totalEnergyThisRun += res.gained;
      this.state.lifetimeEnergy += res.gained;
      this.pendingOffline = { gained: res.gained, ms: res.creditedMs, eps: res.eps };
    }
  }

  dismissOffline() {
    this.pendingOffline = null;
    this.notify();
  }

  /** Claim the pending offline earnings; `double` grants a second helping (ad seam). */
  claimOffline(double: boolean) {
    if (this.pendingOffline && double) {
      this.grantEnergy(this.pendingOffline.gained);
      this.audio.flare("surge");
    }
    this.pendingOffline = null;
    this.recompute();
    this.notify();
  }

  /* ── daily streak ──────────────────────────────────────────────────────── */

  private epochDay(now: number): number {
    return Math.floor((now - new Date().getTimezoneOffset() * 60_000) / DAY_MS);
  }

  dailyAvailable(): boolean {
    return this.state.lastDailyClaimDay !== this.epochDay(this.now);
  }

  private evaluateDaily(now: number) {
    const today = this.epochDay(now);
    if (this.state.lastDailyClaimDay === null) return;
    const gap = today - this.state.lastDailyClaimDay;
    if (gap > 1) this.state.dailyStreak = 0; // streak broken
  }

  claimDaily(): { energy: number; stardust: number; streak: number } | null {
    if (!this.dailyAvailable()) return null;
    const today = this.epochDay(this.now);
    const consecutive = this.state.lastDailyClaimDay === today - 1;
    this.state.dailyStreak = consecutive ? this.state.dailyStreak + 1 : 1;
    this.state.lastDailyClaimDay = today;

    const streak = this.state.dailyStreak;
    const baseEnergy = Math.max(this.derived.energyPerSec * 3600, 100 * Math.pow(10, this.state.supernovaCount));
    const energy = baseEnergy * (1 + 0.15 * (streak - 1));
    const stardust = Math.floor(streak / 3);

    this.state.energy += energy;
    this.state.totalEnergyThisRun += energy;
    this.state.lifetimeEnergy += energy;
    if (stardust > 0) {
      this.state.stardust += stardust;
      this.state.stardustEarned += stardust;
    }
    this.audio.achievement();
    this.pushToast({ kind: "info", title: `Daily bonus · day ${streak}`, glyph: "🎁" });
    this.recompute();
    this.save();
    this.notify();
    return { energy, stardust, streak };
  }

  /* ── flares ────────────────────────────────────────────────────────────── */

  private goldenEyeLevel(): number {
    return this.state.skills.goldeneye ?? 0;
  }

  private scheduleNextFlare(now: number) {
    const ge = this.goldenEyeLevel();
    const base = 26_000 + Math.random() * 30_000; // 26–56s
    const interval = Math.max(10_000, base * (1 - 0.1 * ge)) / this.eventFlareFreqMult();
    this.nextFlareAt = now + interval;
  }

  private rollFlareKind(): FlareKind {
    const total = FLARE_WEIGHTS.reduce((a, b) => a + b.w, 0);
    let r = Math.random() * total;
    for (const { kind, w } of FLARE_WEIGHTS) {
      if (r < w) return kind;
      r -= w;
    }
    return "surge";
  }

  /* ── cosmic events ─────────────────────────────────────────────────────── */

  private scheduleNextEvent(now: number, first: boolean) {
    const min = first ? EVENT_FIRST_MIN : EVENT_STEADY_MIN;
    const max = first ? EVENT_FIRST_MAX : EVENT_STEADY_MAX;
    this.nextEventAt = now + min + Math.random() * (max - min);
  }

  private triggerEvent(now: number) {
    const total = EVENTS.reduce((a, e) => a + e.weight, 0);
    let r = Math.random() * total;
    let def = EVENTS[0]!;
    for (const e of EVENTS) {
      if (r < e.weight) {
        def = e;
        break;
      }
      r -= e.weight;
    }
    this.activeEvent = { def, startedAt: now, expiresAt: now + def.durationMs };
    if (def.instantProdSeconds) {
      this.grantEnergy(this.liveEps() * def.instantProdSeconds);
    }
    this.audio.flare("jackpot");
    this.pushToast({
      kind: "prestige",
      title: def.name,
      body: def.description,
      glyph: def.glyph,
    });
    this.scheduleNextEvent(now, false);
    this.recompute();
    this.notify();
  }

  private spawnFlare(now: number) {
    const kind = this.rollFlareKind();
    this.flares.push({
      id: this.newId(),
      kind,
      x: 8 + Math.random() * 84,
      y: 14 + Math.random() * 62,
      bornAt: now,
      ttl: 11_000,
    });
    this.audio.flareSpawn();
    this.scheduleNextFlare(now);
    this.notify();
  }

  /** Player collected a flare. Returns a short label for the floating text. */
  collectFlare(id: number): { kind: FlareKind; label: string; value: number } | null {
    const idx = this.flares.findIndex((f) => f.id === id);
    if (idx === -1) return null;
    const flare = this.flares[idx]!;
    this.flares.splice(idx, 1);
    this.state.stats.flaresCollected += 1;

    const geMult = 1 + 0.25 * this.goldenEyeLevel();
    const eps = this.liveEps();
    let label = "";
    let value = 0;

    switch (flare.kind) {
      case "surge": {
        value = Math.max(eps * 90, this.liveTapPower() * 25, 50) * geMult;
        this.grantEnergy(value);
        label = "SURGE";
        break;
      }
      case "jackpot": {
        value = Math.max(eps * 600, this.liveTapPower() * 200, 500) * geMult;
        this.grantEnergy(value);
        label = "JACKPOT!";
        break;
      }
      case "frenzy": {
        this.addBuff("frenzy", "×7 Production", 7 * geMult, 15_000);
        label = "FRENZY ×7";
        break;
      }
      case "tapstorm": {
        this.addBuff("tapstorm", "×10 Tap", 10 * geMult, 15_000);
        label = "TAP STORM ×10";
        break;
      }
    }
    this.audio.flare(flare.kind);
    this.pushToast({ kind: "flare", title: label, glyph: "🌠" });
    this.recompute();
    this.notify();
    return { kind: flare.kind, label, value };
  }

  private grantEnergy(amount: number) {
    this.state.energy += amount;
    this.state.totalEnergyThisRun += amount;
    this.state.lifetimeEnergy += amount;
  }

  private addBuff(kind: FlareKind, label: string, mult: number, durationMs: number) {
    // Refresh if same kind already active.
    const existing = this.buffs.find((b) => b.kind === kind);
    if (existing) {
      existing.expiresAt = this.now + durationMs;
      existing.mult = mult;
    } else {
      this.buffs.push({ id: this.newId(), kind, label, mult, expiresAt: this.now + durationMs });
    }
  }

  /* ── achievements ──────────────────────────────────────────────────────── */

  private checkGeneratorUnlocks() {
    const ctx = buildUnlockCtx(this.state);
    for (const g of CONFIG.generators) {
      if (!this.knownGenerators.has(g.id) && g.unlock(ctx)) {
        this.knownGenerators.add(g.id);
        this.pushToast({
          kind: "unlock",
          title: `New: ${g.name}`,
          body: g.blurb,
          glyph: g.glyph,
        });
        this.audio.achievement();
      }
    }
  }

  private scanAchievements() {
    const fresh = newlyUnlockedAchievements(this.state, CONFIG);
    if (!fresh.length) return;
    for (const id of fresh) {
      this.state.achievements.push(id);
      const def = CONFIG.achievements.find((a) => a.id === id);
      if (def) {
        this.pushToast({
          kind: "achievement",
          title: def.name,
          body: def.blurb,
          glyph: def.glyph,
        });
      }
    }
    this.audio.achievement();
  }

  /* ── toasts ────────────────────────────────────────────────────────────── */

  private pushToast(t: Omit<Toast, "id">) {
    this.toasts.push({ ...t, id: this.newId() });
  }
  dismissToast(id: number) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.notify();
  }

  /* ── player actions ────────────────────────────────────────────────────── */

  tap(): TapResult {
    const power = this.liveTapPower();
    this.state.energy += power;
    this.state.totalEnergyThisRun += power;
    this.state.lifetimeEnergy += power;
    this.state.taps += 1;
    this.state.stats.totalTaps += 1;
    this.state.stats.handEnergyFromTaps += power;

    // Combo
    const window = 2000 + (this.state.skills.momentum ?? 0) * 400;
    const cap = 20 + (this.state.skills.momentum ?? 0) * 5;
    this.combo = Math.min(cap, this.combo + 1);
    this.comboMult = 1 + this.combo * COMBO_STEP;
    this.comboExpires = this.now + window;

    this.audio.tap(this.combo);
    return { power, combo: this.combo, comboMult: this.comboMult };
  }

  buyGenerator(id: string, qty: number): boolean {
    const def = CONFIG.generators.find((g) => g.id === id);
    if (!def) return false;
    const r = engBuyGenerator(this.state, def, qty);
    if (r.ok) {
      this.audio.buy();
      this.recompute();
      this.notify();
    } else {
      this.audio.denied();
    }
    return r.ok;
  }

  buyUpgrade(id: string): boolean {
    const def = CONFIG.upgrades.find((u) => u.id === id);
    if (!def) return false;
    const ok = engBuyUpgrade(this.state, def);
    if (ok) {
      this.audio.buy();
      this.pushToast({ kind: "unlock", title: def.name, body: def.blurb, glyph: "⬆️" });
      this.recompute();
      this.notify();
    } else {
      this.audio.denied();
    }
    return ok;
  }

  buySkill(id: string): boolean {
    const ok = engBuySkill(this.state, CONFIG, id);
    if (ok) {
      this.audio.buy();
      this.recompute();
      this.notify();
    } else {
      this.audio.denied();
    }
    return ok;
  }

  canSupernova(): boolean {
    return prestigeGain(this.state) >= 1;
  }
  prestigeGain(): number {
    return prestigeGain(this.state);
  }

  doSupernova(): number {
    if (!this.canSupernova()) {
      this.audio.denied();
      return 0;
    }
    const gain = engSupernova(this.state, CONFIG, Date.now());
    this.combo = 0;
    this.comboMult = 1;
    this.buffs = [];
    this.flares = [];
    this.audio.prestige();
    this.pushToast({
      kind: "prestige",
      title: `Supernova! +${gain} Stardust`,
      body: "The universe collapses… and begins again, stronger.",
      glyph: "💥",
    });
    this.recompute();
    this.save();
    this.notify();
    return gain;
  }

  canSingularity(): boolean {
    return engCanSingularity(this.state);
  }
  singularityGain(): number {
    return engSingularityGain(this.state);
  }

  doSingularity(): number {
    if (!this.canSingularity()) {
      this.audio.denied();
      return 0;
    }
    const gain = engSingularity(this.state, Date.now());
    this.combo = 0;
    this.comboMult = 1;
    this.buffs = [];
    this.flares = [];
    this.activeEvent = null;
    this.audio.prestige();
    this.pushToast({
      kind: "prestige",
      title: `Singularity! +${gain} ◆ Dark Matter`,
      body: "Everything collapses to a point — and the whole story begins anew, far stronger.",
      glyph: "◆",
    });
    this.recompute();
    this.save();
    this.notify();
    return gain;
  }

  /* ── settings & cosmetics ──────────────────────────────────────────────── */

  updateSettings(patch: Partial<Settings>) {
    this.state.settings = { ...this.state.settings, ...patch };
    if (patch.sfxVolume !== undefined) this.audio.setSfxVolume(patch.sfxVolume);
    if (patch.musicVolume !== undefined) this.audio.setMusicVolume(patch.musicVolume);
    this.save();
    this.notify();
  }

  setSkin(id: string): boolean {
    const skin = CONFIG.skins.find((s) => s.id === id);
    if (!skin) return false;
    if (skin.supporter && !this.state.supporter) return false;
    if (skin.unlockSupernovas && this.state.supernovaCount < skin.unlockSupernovas) return false;
    this.state.skin = id;
    this.save();
    this.notify();
    return true;
  }

  /** Simulated Supporter Pack purchase seam (real payment wired in monetization). */
  grantSupporter() {
    this.state.supporter = true;
    this.recompute();
    this.pushToast({ kind: "info", title: "Supporter Pack active — thank you!", glyph: "💛" });
    this.save();
    this.notify();
  }

  exportSave(): string {
    return engExport(this.state);
  }

  importSave(text: string): boolean {
    const s = engImport(text, Date.now());
    if (!s) return false;
    this.state = s;
    this.audio.setSfxVolume(s.settings.sfxVolume);
    this.audio.setMusicVolume(s.settings.musicVolume);
    this.combo = 0;
    this.comboMult = 1;
    this.buffs = [];
    this.flares = [];
    this.activeEvent = null;
    this.scheduleNextEvent(Date.now(), true);
    this.recompute();
    this.save();
    this.notify();
    return true;
  }

  hardReset() {
    clearStorage();
    this.state = newGame(Date.now());
    this.combo = 0;
    this.comboMult = 1;
    this.buffs = [];
    this.flares = [];
    this.activeEvent = null;
    this.scheduleNextEvent(Date.now(), true);
    this.pendingOffline = null;
    this.audio.setSfxVolume(this.state.settings.sfxVolume);
    this.audio.setMusicVolume(this.state.settings.musicVolume);
    this.recompute();
    this.save();
    this.notify();
  }

  /** Tab hidden / navigating away: persist immediately. */
  pauseToBackground() {
    this.save();
  }

  /** Tab visible again: credit time away (offline modal if long enough). */
  resumeFromBackground() {
    this.now = Date.now();
    this.applyOffline(this.now);
    this.lastFrame = performance.now();
    this.recompute();
    this.notify();
  }

  /** Unlock context for gating UI (generators/upgrades visibility). */
  unlockCtx() {
    return buildUnlockCtx(this.state);
  }

  baseTap() {
    return BASE_TAP;
  }
}

export function createGameStore(): GameStore {
  return new GameStore();
}
