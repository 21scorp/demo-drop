/**
 * The pure game engine. No React, no DOM, no time-of-day — everything is a
 * function of state + config (+ explicit dt / timestamps). This is what the unit
 * tests pin down, and what the runtime hook drives.
 */

import {
  BASE_OFFLINE_CAP_MS,
  BASE_OFFLINE_EFFICIENCY,
  BASE_TAP,
  DARK_MATTER_GLOBAL,
  DARK_MATTER_STARDUST,
  SINGULARITY_MIN_SUPERNOVAS,
  TAP_PCT_PER_UPGRADE,
} from "./config";
import type {
  Derived,
  GameConfig,
  GameState,
  GeneratorDef,
  Multipliers,
  UnlockCtx,
  UpgradeDef,
} from "./types";

/* ── lookups ─────────────────────────────────────────────────────────────── */

export function skillLevel(state: GameState, id: string): number {
  return state.skills[id] ?? 0;
}

export function owned(state: GameState, id: string): number {
  return state.generators[id] ?? 0;
}

export function buildUnlockCtx(state: GameState): UnlockCtx {
  return {
    energy: state.energy,
    lifetimeEnergy: state.lifetimeEnergy,
    totalEnergyThisRun: state.totalEnergyThisRun,
    stardust: state.stardust,
    supernovaCount: state.supernovaCount,
    darkMatter: state.darkMatter,
    singularityCount: state.singularityCount,
    generators: state.generators,
    upgrades: new Set(state.upgrades),
    achievements: new Set(state.achievements),
    skills: state.skills,
    taps: state.taps,
  };
}

/* ── generator costs ─────────────────────────────────────────────────────── */

/** Cost of the next single unit given how many are already owned. */
export function costOfNext(def: GeneratorDef, ownedCount: number): number {
  return def.baseCost * Math.pow(def.costGrowth, ownedCount);
}

/** Total cost to buy `qty` units in a row (geometric series). */
export function bulkCost(def: GeneratorDef, ownedCount: number, qty: number): number {
  if (qty <= 0) return 0;
  const g = def.costGrowth;
  const first = def.baseCost * Math.pow(g, ownedCount);
  if (g === 1) return first * qty;
  return (first * (Math.pow(g, qty) - 1)) / (g - 1);
}

/** Largest quantity affordable with `budget`, starting from `ownedCount`. */
export function maxAffordable(def: GeneratorDef, ownedCount: number, budget: number): number {
  if (budget <= 0) return 0;
  const g = def.costGrowth;
  const first = def.baseCost * Math.pow(g, ownedCount);
  if (budget < first) return 0;
  if (g === 1) return Math.floor(budget / first);
  // budget >= first * (g^q - 1)/(g-1)  →  q <= log_g(budget*(g-1)/first + 1)
  const q = Math.floor(Math.log((budget * (g - 1)) / first + 1) / Math.log(g));
  // Numerical safety: trim if the closed form overshoots by a hair.
  return q > 0 && bulkCost(def, ownedCount, q) > budget ? q - 1 : Math.max(0, q);
}

/* ── multipliers ─────────────────────────────────────────────────────────── */

export function computeMultipliers(state: GameState, config: GameConfig): Multipliers {
  const purchased = new Set(state.upgrades);
  const unlockedAch = new Set(state.achievements);

  // Global multiplier
  let global = 1;
  for (const up of config.upgrades) {
    if (up.kind === "global" && purchased.has(up.id)) global *= up.mult;
  }
  for (const ach of config.achievements) {
    if (unlockedAch.has(ach.id)) global *= ach.reward;
  }
  global *= 1 + 0.08 * skillLevel(state, "core");
  global *= 1 + 0.2 * skillLevel(state, "overdrive");
  global *= 1 + 0.03 * state.stardustEarned; // prestige power (this cycle)
  global *= 1 + DARK_MATTER_GLOBAL * state.darkMatter; // singularity power (permanent)
  if (state.supporter) global *= 1.1;

  // Per-generator multipliers
  const perGen: Record<string, number> = {};
  for (const gen of config.generators) perGen[gen.id] = 1;
  for (const up of config.upgrades) {
    if (up.kind === "generator" && up.target && purchased.has(up.id)) {
      perGen[up.target] = (perGen[up.target] ?? 1) * up.mult;
    }
  }

  // Tap multiplier
  let tap = 1;
  for (const up of config.upgrades) {
    if (up.kind === "tap" && purchased.has(up.id)) tap *= up.mult;
  }
  tap *= Math.pow(1.6, skillLevel(state, "bighands"));

  return { global, perGen, tap };
}

/** Fraction of energy/sec added to every tap (from "coupling" upgrades). */
export function tapPercent(state: GameState, config: GameConfig): number {
  const purchased = new Set(state.upgrades);
  let pct = 0;
  for (const up of config.upgrades) {
    if (up.kind === "special" && up.id.startsWith("t_couple") && purchased.has(up.id)) {
      pct += TAP_PCT_PER_UPGRADE * up.mult;
    }
  }
  return pct;
}

/* ── production ──────────────────────────────────────────────────────────── */

/** Energy/sec produced by each generator line (all owned units), post-multipliers. */
export function perGeneratorOutput(
  state: GameState,
  config: GameConfig,
  mult: Multipliers,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const gen of config.generators) {
    const n = owned(state, gen.id);
    out[gen.id] = n * gen.baseOutput * (mult.perGen[gen.id] ?? 1) * mult.global;
  }
  return out;
}

export function energyPerSec(perGenOut: Record<string, number>): number {
  let sum = 0;
  for (const k in perGenOut) sum += perGenOut[k]!;
  return sum;
}

/** Energy from a single tap, including the % of eps and an optional combo. */
export function tapPower(
  state: GameState,
  config: GameConfig,
  eps: number,
  mult: Multipliers,
  comboMult = 1,
): number {
  const base = BASE_TAP * mult.tap;
  const fromEps = tapPercent(state, config) * eps;
  return (base + fromEps) * comboMult;
}

/* ── prestige (Supernova) ────────────────────────────────────────────────── */

/** Stardust you would gain by going Supernova right now. */
export function prestigeGain(state: GameState): number {
  const x = state.totalEnergyThisRun;
  if (x <= 0) return 0;
  const raw = 3 * Math.pow(x / 1e6, 0.35);
  const inheritance = 1 + 0.06 * skillLevel(state, "inherit");
  const bang = 1 + 0.25 * skillLevel(state, "bang");
  const dm = 1 + DARK_MATTER_STARDUST * state.darkMatter;
  return Math.floor(raw * inheritance * bang * dm);
}

/* ── singularity (second prestige) ───────────────────────────────────────── */

/** Dark Matter you would gain by collapsing into a Singularity right now. */
export function singularityGain(state: GameState): number {
  if (state.stardustEarned <= 0) return 0;
  return Math.floor(Math.pow(state.stardustEarned / 200, 0.5));
}

/** Whether a Singularity is available (deep enough + would yield ≥1 Dark Matter). */
export function canSingularity(state: GameState): boolean {
  return (
    state.supernovaCount >= SINGULARITY_MIN_SUPERNOVAS && singularityGain(state) >= 1
  );
}

/** Stardust-earned needed for the next whole Dark Matter point. */
export function stardustForNextDarkMatter(state: GameState): number {
  const next = singularityGain(state) + 1;
  return 200 * next * next;
}

/**
 * Collapse into a Singularity: bank Dark Matter and perform a DEEP reset —
 * clears stardust, skills, generators, upgrades, and the current run — while
 * keeping Dark Matter, supernova count (for cosmetics/achievements),
 * achievements, cosmetics, settings, and lifetime stats. Mutates state.
 */
export function singularity(state: GameState, now: number): number {
  const gain = singularityGain(state);
  if (!canSingularity(state)) return 0;

  state.darkMatter += gain;
  state.singularityCount += 1;

  // Deep reset.
  state.stardust = 0;
  state.stardustEarned = 0;
  state.skills = {};
  state.energy = 0;
  state.totalEnergyThisRun = 0;
  state.generators = {};
  state.upgrades = [];
  state.runStartedAt = now;

  return gain;
}

/** Energy needed this run before a Supernova yields at least 1 Stardust. */
export function energyForNextStardust(state: GameState): number {
  const inheritance = 1 + 0.06 * skillLevel(state, "inherit");
  const bang = 1 + 0.25 * skillLevel(state, "bang");
  // solve 3 * (x/1e6)^0.35 * inheritance * bang = 1
  const target = 1 / (3 * inheritance * bang);
  return 1e6 * Math.pow(target, 1 / 0.35);
}

export function canSupernova(state: GameState): boolean {
  return prestigeGain(state) >= 1;
}

/* ── offline ─────────────────────────────────────────────────────────────── */

export function offlineEfficiency(state: GameState): number {
  return Math.min(1, BASE_OFFLINE_EFFICIENCY + 0.12 * skillLevel(state, "offline"));
}

export function offlineCapMs(state: GameState): number {
  return BASE_OFFLINE_CAP_MS + skillLevel(state, "offline") * 12 * 60 * 60 * 1000;
}

export interface OfflineResult {
  gained: number;
  creditedMs: number;
  cappedMs: number;
  eps: number;
}

export function computeOffline(
  state: GameState,
  config: GameConfig,
  elapsedMs: number,
): OfflineResult {
  const mult = computeMultipliers(state, config);
  const eps = energyPerSec(perGeneratorOutput(state, config, mult));
  const cap = offlineCapMs(state);
  const creditedMs = Math.max(0, Math.min(elapsedMs, cap));
  const gained = eps * (creditedMs / 1000) * offlineEfficiency(state);
  return { gained, creditedMs, cappedMs: Math.max(0, elapsedMs - cap), eps };
}

/* ── derived snapshot for UI ─────────────────────────────────────────────── */

export function computeDerived(state: GameState, config: GameConfig): Derived {
  const mult = computeMultipliers(state, config);
  const perGenOutput = perGeneratorOutput(state, config, mult);
  const eps = energyPerSec(perGenOutput);
  return {
    mult,
    perGenOutput,
    energyPerSec: eps,
    tapPower: tapPower(state, config, eps, mult, 1),
    prestigeGain: prestigeGain(state),
  };
}

/* ── mutations (operate on a live state object; return true on success) ───── */

/** Add produced energy for `seconds` of elapsed time. Mutates state. */
export function applyProduction(state: GameState, seconds: number, eps: number): void {
  if (seconds <= 0 || eps <= 0) return;
  const gained = eps * seconds;
  state.energy += gained;
  state.totalEnergyThisRun += gained;
  state.lifetimeEnergy += gained;
}

/** Credit a manual tap. Mutates state, returns energy gained. */
export function applyTap(state: GameState, power: number): number {
  state.energy += power;
  state.totalEnergyThisRun += power;
  state.lifetimeEnergy += power;
  state.taps += 1;
  state.stats.totalTaps += 1;
  state.stats.handEnergyFromTaps += power;
  return power;
}

export interface BuyResult {
  ok: boolean;
  bought: number;
  spent: number;
}

/** Buy up to `qty` (Infinity = max affordable) of a generator. Mutates state. */
export function buyGenerator(
  state: GameState,
  def: GeneratorDef,
  qty: number,
): BuyResult {
  const have = owned(state, def.id);
  const want = qty === Infinity ? maxAffordable(def, have, state.energy) : qty;
  if (want <= 0) return { ok: false, bought: 0, spent: 0 };
  const cost = bulkCost(def, have, want);
  if (cost > state.energy) {
    // Requested a fixed qty we can't afford — buy as many as we can instead.
    const canBuy = maxAffordable(def, have, state.energy);
    if (canBuy <= 0) return { ok: false, bought: 0, spent: 0 };
    const c2 = bulkCost(def, have, canBuy);
    state.energy -= c2;
    state.generators[def.id] = have + canBuy;
    return { ok: true, bought: canBuy, spent: c2 };
  }
  state.energy -= cost;
  state.generators[def.id] = have + want;
  return { ok: true, bought: want, spent: cost };
}

/** Purchase a one-time upgrade. Mutates state. */
export function buyUpgrade(state: GameState, def: UpgradeDef): boolean {
  if (state.upgrades.includes(def.id)) return false;
  if (state.energy < def.cost) return false;
  state.energy -= def.cost;
  state.upgrades.push(def.id);
  return true;
}

/** Level up a skill with Stardust. Mutates state. */
export function buySkill(
  state: GameState,
  config: GameConfig,
  id: string,
): boolean {
  const def = config.skills.find((s) => s.id === id);
  if (!def) return false;
  const level = skillLevel(state, id);
  if (level >= def.maxLevel) return false;
  // dependencies
  if (def.requires) {
    for (const r of def.requires) if (skillLevel(state, r) < 1) return false;
  }
  const cost = def.cost(level + 1);
  if (state.stardust < cost) return false;
  state.stardust -= cost;
  state.skills[id] = level + 1;
  return true;
}

/** Free generators granted at the start of each run by the Head Start skill. */
export function headStartGenerators(state: GameState): Record<string, number> {
  const lvl = skillLevel(state, "headstart");
  if (lvl <= 0) return {};
  return { spark: 10 * lvl, ember: 4 * lvl };
}

/**
 * Perform a Supernova: bank Stardust, reset the run (keeping skills, achievements,
 * stardust, supernovaCount, cosmetics, settings, lifetime stats). Mutates state.
 */
export function supernova(state: GameState, config: GameConfig, now: number): number {
  const gain = prestigeGain(state);
  if (gain < 1) return 0;

  const runMs = Math.max(0, now - state.runStartedAt);
  if (state.stats.fastestSupernovaMs === null || runMs < state.stats.fastestSupernovaMs) {
    state.stats.fastestSupernovaMs = runMs;
  }

  state.stardust += gain;
  state.stardustEarned += gain;
  state.supernovaCount += 1;

  // Reset the active run.
  state.energy = 0;
  state.totalEnergyThisRun = 0;
  state.generators = {};
  state.upgrades = [];
  state.runStartedAt = now;

  // Apply head-start generators.
  const head = headStartGenerators(state);
  for (const k in head) state.generators[k] = head[k]!;

  return gain;
}

/* ── unlock / achievement scanning ───────────────────────────────────────── */

/** Return achievement ids newly satisfied but not yet unlocked. */
export function newlyUnlockedAchievements(state: GameState, config: GameConfig): string[] {
  const ctx = {
    ...buildUnlockCtx(state),
    bestEnergyPerSec: state.stats.bestEnergyPerSec,
    flaresCollected: state.stats.flaresCollected,
  };
  const have = new Set(state.achievements);
  const out: string[] = [];
  for (const ach of config.achievements) {
    if (!have.has(ach.id) && ach.check(ctx)) out.push(ach.id);
  }
  return out;
}
