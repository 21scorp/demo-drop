import type {
  AchievementDef,
  GameConfig,
  GameEvent,
  GeneratorDef,
  SkillDef,
  SkinDef,
  UnlockCtx,
  UpgradeDef,
} from "./types";

/** Base energy granted by a single tap before multipliers. */
export const BASE_TAP = 1;

/** Fraction of energy/sec added to each tap once "Kinetic Coupling" is owned. */
export const TAP_PCT_PER_UPGRADE = 0.01;

/** Base share of production earned while offline (before skill bonuses). */
export const BASE_OFFLINE_EFFICIENCY = 0.5;

/** Max offline time credited (24h) before skills extend it. */
export const BASE_OFFLINE_CAP_MS = 24 * 60 * 60 * 1000;

/* ────────────────────────────────────────────────────────────────────────
 *  Generators — from a lone spark to the whole universe.
 * ──────────────────────────────────────────────────────────────────────── */

interface GenSeed {
  id: string;
  name: string;
  blurb: string;
  glyph: string;
  baseCost: number;
  costGrowth: number;
  baseOutput: number;
}

const GEN_SEEDS: GenSeed[] = [
  { id: "spark", name: "Spark", glyph: "✦", baseCost: 15, costGrowth: 1.12, baseOutput: 0.1, blurb: "A flicker of potential in the dark." },
  { id: "ember", name: "Ember", glyph: "🔥", baseCost: 120, costGrowth: 1.125, baseOutput: 1, blurb: "The first warmth of creation." },
  { id: "protostar", name: "Protostar", glyph: "🌑", baseCost: 1_400, costGrowth: 1.13, baseOutput: 9, blurb: "Gas collapsing toward ignition." },
  { id: "star", name: "Star", glyph: "⭐", baseCost: 16_000, costGrowth: 1.13, baseOutput: 55, blurb: "A furnace of fusion, steady and bright." },
  { id: "redgiant", name: "Red Giant", glyph: "🔴", baseCost: 190_000, costGrowth: 1.14, baseOutput: 340, blurb: "Swollen, luminous, nearing the end." },
  { id: "nebula", name: "Nebula", glyph: "🌌", baseCost: 2_300_000, costGrowth: 1.14, baseOutput: 2_100, blurb: "A nursery of a thousand suns." },
  { id: "pulsar", name: "Pulsar", glyph: "📡", baseCost: 31_000_000, costGrowth: 1.15, baseOutput: 13_000, blurb: "A lighthouse spinning a thousand times a second." },
  { id: "blackhole", name: "Black Hole", glyph: "🕳️", baseCost: 540_000_000, costGrowth: 1.15, baseOutput: 78_000, blurb: "It gives back more than it takes. Somehow." },
  { id: "quasar", name: "Quasar", glyph: "💠", baseCost: 8_900_000_000, costGrowth: 1.16, baseOutput: 480_000, blurb: "The brightest engines in the sky." },
  { id: "galaxy", name: "Galaxy", glyph: "🌠", baseCost: 1.4e11, costGrowth: 1.16, baseOutput: 3.0e6, blurb: "A hundred billion stars at your command." },
  { id: "cluster", name: "Galactic Cluster", glyph: "🪐", baseCost: 2.3e12, costGrowth: 1.17, baseOutput: 2.0e7, blurb: "Galaxies bound in a gravitational choir." },
  { id: "universe", name: "Universe", glyph: "🌐", baseCost: 4.0e13, costGrowth: 1.17, baseOutput: 1.4e8, blurb: "Everything there is. You made it." },
];

export const GENERATORS: GeneratorDef[] = GEN_SEEDS.map((s, i) => ({
  ...s,
  tier: i,
  // Reveal a generator once you've ever earned ~40% of its base cost.
  unlock: (ctx: UnlockCtx) => i === 0 || ctx.lifetimeEnergy >= s.baseCost * 0.4,
}));

/* ────────────────────────────────────────────────────────────────────────
 *  Upgrades — per-generator "×N" unlocks (auto-generated) + global + tap.
 * ──────────────────────────────────────────────────────────────────────── */

const ROMAN = ["", "I", "II", "III", "IV", "V", "VI"];

function genUpgradesFor(def: GeneratorDef): UpgradeDef[] {
  const specs = [
    { owned: 10, mult: 2 },
    { owned: 25, mult: 2 },
    { owned: 50, mult: 3 },
    { owned: 100, mult: 2 },
    { owned: 200, mult: 3 },
  ];
  return specs.map((sp, idx) => ({
    id: `${def.id}_u${sp.owned}`,
    name: `${def.name} ${ROMAN[idx + 1]}`,
    blurb: `${def.name}s are ${sp.mult}× as productive. (Own ${sp.owned})`,
    kind: "generator" as const,
    target: def.id,
    cost: def.baseCost * Math.pow(def.costGrowth, sp.owned) * 6,
    mult: sp.mult,
    unlock: (ctx: UnlockCtx) => (ctx.generators[def.id] ?? 0) >= sp.owned,
  }));
}

const GENERATOR_UPGRADES: UpgradeDef[] = GENERATORS.flatMap(genUpgradesFor);

const GLOBAL_UPGRADES: UpgradeDef[] = [
  { id: "g_cosmic1", name: "Cosmic Resonance", blurb: "All production ×2.", kind: "global", cost: 5_000, mult: 2, unlock: (c) => c.lifetimeEnergy >= 2_500 },
  { id: "g_cosmic2", name: "Harmonic Fields", blurb: "All production ×2.", kind: "global", cost: 500_000, mult: 2, unlock: (c) => c.lifetimeEnergy >= 250_000 },
  { id: "g_cosmic3", name: "Dark Energy Tap", blurb: "All production ×3.", kind: "global", cost: 80_000_000, mult: 3, unlock: (c) => c.lifetimeEnergy >= 40_000_000 },
  { id: "g_cosmic4", name: "Vacuum Genesis", blurb: "All production ×3.", kind: "global", cost: 1.2e10, mult: 3, unlock: (c) => c.lifetimeEnergy >= 6e9 },
  { id: "g_cosmic5", name: "Entropy Reversal", blurb: "All production ×4.", kind: "global", cost: 2.5e12, mult: 4, unlock: (c) => c.lifetimeEnergy >= 1.2e12 },
  { id: "g_cosmic6", name: "The First Law", blurb: "All production ×5.", kind: "global", cost: 5e14, mult: 5, unlock: (c) => c.lifetimeEnergy >= 2.5e14 },
];

const TAP_UPGRADES: UpgradeDef[] = [
  { id: "t_hand1", name: "Steady Hand", blurb: "Tapping is ×2 as strong.", kind: "tap", cost: 500, mult: 2, unlock: (c) => c.taps >= 25 },
  { id: "t_hand2", name: "Quick Fingers", blurb: "Tapping is ×2 as strong.", kind: "tap", cost: 25_000, mult: 2, unlock: (c) => c.taps >= 150 },
  { id: "t_hand3", name: "Static Charge", blurb: "Tapping is ×3 as strong.", kind: "tap", cost: 4_000_000, mult: 3, unlock: (c) => c.taps >= 500 },
  { id: "t_hand4", name: "Lightning Reflex", blurb: "Tapping is ×3 as strong.", kind: "tap", cost: 900_000_000, mult: 3, unlock: (c) => c.taps >= 1500 },
  // "special" upgrades add a % of energy/sec to every tap (see engine.tapPower).
  { id: "t_couple1", name: "Kinetic Coupling", blurb: "Each tap also gains 1% of your energy/sec.", kind: "special", cost: 250_000, mult: 1, unlock: (c) => c.taps >= 300 },
  { id: "t_couple2", name: "Resonant Coupling", blurb: "Each tap gains a further 2% of your energy/sec.", kind: "special", cost: 120_000_000, mult: 2, unlock: (c) => (c.upgrades.has("t_couple1")) },
  { id: "t_couple3", name: "Singularity Coupling", blurb: "Each tap gains a further 5% of your energy/sec.", kind: "special", cost: 4e11, mult: 5, unlock: (c) => (c.upgrades.has("t_couple2")) },
];

export const UPGRADES: UpgradeDef[] = [
  ...GENERATOR_UPGRADES,
  ...GLOBAL_UPGRADES,
  ...TAP_UPGRADES,
];

/* ────────────────────────────────────────────────────────────────────────
 *  Skill tree — permanent perks bought with Stardust after a Supernova.
 * ──────────────────────────────────────────────────────────────────────── */

export const SKILLS: SkillDef[] = [
  { id: "core", name: "Stellar Core", glyph: "☀️", blurb: "+8% to all production per level.", maxLevel: 10, cost: (l) => Math.ceil(1 * Math.pow(1.7, l - 1)), row: 0, col: 1 },
  { id: "inherit", name: "Cosmic Inheritance", glyph: "♾️", blurb: "+6% Stardust from every Supernova per level.", maxLevel: 8, cost: (l) => Math.ceil(2 * Math.pow(1.9, l - 1)), row: 1, col: 0, requires: ["core"] },
  { id: "bighands", name: "Hands of a God", glyph: "👐", blurb: "Tap power ×1.6 per level.", maxLevel: 6, cost: (l) => Math.ceil(2 * Math.pow(2.0, l - 1)), row: 1, col: 2, requires: ["core"] },
  { id: "goldeneye", name: "Golden Eye", glyph: "👁️", blurb: "Solar Flares appear more often & pay more.", maxLevel: 5, cost: (l) => Math.ceil(3 * Math.pow(2.1, l - 1)), row: 2, col: 1, requires: ["core"] },
  { id: "offline", name: "Timeless", glyph: "⏳", blurb: "+12% offline efficiency & +12h cap per level.", maxLevel: 5, cost: (l) => Math.ceil(3 * Math.pow(2.0, l - 1)), row: 2, col: 0, requires: ["inherit"] },
  { id: "momentum", name: "Momentum", glyph: "🌀", blurb: "Combo builds faster and lasts longer.", maxLevel: 5, cost: (l) => Math.ceil(3 * Math.pow(2.0, l - 1)), row: 2, col: 2, requires: ["bighands"] },
  { id: "headstart", name: "Head Start", glyph: "🚀", blurb: "Begin each run with a burst of free Sparks & Embers.", maxLevel: 5, cost: (l) => Math.ceil(5 * Math.pow(2.2, l - 1)), row: 3, col: 0, requires: ["offline"] },
  { id: "overdrive", name: "Overdrive", glyph: "⚡", blurb: "+20% to all production per level.", maxLevel: 8, cost: (l) => Math.ceil(6 * Math.pow(2.0, l - 1)), row: 3, col: 1, requires: ["goldeneye"] },
  { id: "bang", name: "Big Bang Theory", glyph: "💥", blurb: "Every Supernova yields +25% more Stardust per level.", maxLevel: 4, cost: (l) => Math.ceil(10 * Math.pow(2.4, l - 1)), row: 3, col: 2, requires: ["momentum"] },
];

/* ────────────────────────────────────────────────────────────────────────
 *  Achievements — frequent little wins. Each grants a small permanent boost.
 * ──────────────────────────────────────────────────────────────────────── */

function energyMilestone(id: string, name: string, glyph: string, amount: number, reward: number): AchievementDef {
  return {
    id,
    name,
    glyph,
    reward,
    blurb: `Reach a lifetime of serious energy.`,
    check: (c) => c.lifetimeEnergy >= amount,
  };
}

function tapMilestone(id: string, name: string, glyph: string, taps: number, reward: number): AchievementDef {
  return { id, name, glyph, reward, blurb: `Tap the core ${taps.toLocaleString()} times.`, check: (c) => c.taps >= taps };
}

function ownMilestone(genId: string, genName: string, glyph: string, count: number, reward: number): AchievementDef {
  return {
    id: `own_${genId}_${count}`,
    name: `${genName} ×${count}`,
    glyph,
    reward,
    blurb: `Own ${count} ${genName}${count > 1 ? "s" : ""}.`,
    check: (c) => (c.generators[genId] ?? 0) >= count,
  };
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // First steps
  { id: "first_tap", name: "Let There Be Light", glyph: "✨", reward: 1.02, blurb: "Tap the core for the first time.", check: (c) => c.taps >= 1 },
  { id: "first_gen", name: "Ignition", glyph: "🔆", reward: 1.02, blurb: "Buy your first generator.", check: (c) => Object.values(c.generators).some((n) => n > 0) },
  // Taps
  tapMilestone("tap_100", "Warmed Up", "👆", 100, 1.02),
  tapMilestone("tap_1000", "Percussionist", "🥁", 1000, 1.03),
  tapMilestone("tap_10000", "Machine Hands", "🤖", 10000, 1.05),
  // Energy milestones
  energyMilestone("e_1k", "Kilowatt", "🔋", 1e3, 1.02),
  energyMilestone("e_1m", "Megastar", "🌟", 1e6, 1.03),
  energyMilestone("e_1b", "Billionaire of the Void", "💰", 1e9, 1.04),
  energyMilestone("e_1t", "Trillion Tesla", "⚡", 1e12, 1.05),
  energyMilestone("e_1qa", "Beyond Counting", "🔭", 1e15, 1.06),
  energyMilestone("e_1e18", "Astronomical", "🌌", 1e18, 1.07),
  // Owning
  ownMilestone("spark", "Spark", "✦", 25, 1.02),
  ownMilestone("spark", "Spark", "✦", 100, 1.04),
  ownMilestone("star", "Star", "⭐", 25, 1.03),
  ownMilestone("nebula", "Nebula", "🌌", 25, 1.04),
  ownMilestone("blackhole", "Black Hole", "🕳️", 10, 1.05),
  ownMilestone("galaxy", "Galaxy", "🌠", 10, 1.06),
  // Flares
  { id: "flare_1", name: "Caught a Star", glyph: "🌠", reward: 1.03, blurb: "Collect your first Solar Flare.", check: (c) => c.flaresCollected >= 1 },
  { id: "flare_50", name: "Flare Hunter", glyph: "🎯", reward: 1.05, blurb: "Collect 50 Solar Flares.", check: (c) => c.flaresCollected >= 50 },
  // Prestige
  { id: "nova_1", name: "Ashes to Ashes", glyph: "💥", reward: 1.05, blurb: "Go Supernova for the first time.", check: (c) => c.supernovaCount >= 1 },
  { id: "nova_10", name: "Phoenix", glyph: "🔥", reward: 1.08, blurb: "Go Supernova 10 times.", check: (c) => c.supernovaCount >= 10 },
  { id: "nova_25", name: "Eternal Return", glyph: "♻️", reward: 1.12, blurb: "Go Supernova 25 times.", check: (c) => c.supernovaCount >= 25 },
  // Rate
  { id: "eps_1m", name: "Power Plant", glyph: "🏭", reward: 1.04, blurb: "Reach 1M energy/sec.", check: (c) => c.bestEnergyPerSec >= 1e6 },
  { id: "eps_1b", name: "Cosmic Grid", glyph: "🛰️", reward: 1.06, blurb: "Reach 1B energy/sec.", check: (c) => c.bestEnergyPerSec >= 1e9 },
  // Secret
  { id: "secret_patience", name: "The Long Now", glyph: "🕰️", reward: 1.1, secret: true, blurb: "Some rewards come only to those who wait.", check: (c) => c.stardust >= 100 },
];

/* ────────────────────────────────────────────────────────────────────────
 *  Skins — cosmetic core gradients.
 * ──────────────────────────────────────────────────────────────────────── */

export const SKINS: SkinDef[] = [
  { id: "violet", name: "Violet Dawn", colors: ["#c4b5fd", "#7c3aed", "#2e1065"], unlockSupernovas: 0 },
  { id: "solar", name: "Solar Flare", colors: ["#fde68a", "#f59e0b", "#b45309"], unlockSupernovas: 1 },
  { id: "ice", name: "Ice Giant", colors: ["#a5f3fc", "#06b6d4", "#0e7490"], unlockSupernovas: 3 },
  { id: "rose", name: "Rose Nebula", colors: ["#fecdd3", "#f43f5e", "#881337"], unlockSupernovas: 8 },
  { id: "emerald", name: "Emerald Void", colors: ["#bbf7d0", "#10b981", "#064e3b"], unlockSupernovas: 15 },
  { id: "aurora", name: "Aurora (Supporter)", colors: ["#67e8f9", "#a855f7", "#22c55e"], supporter: true },
  { id: "gold", name: "24K Singularity (Supporter)", colors: ["#fff7cc", "#facc15", "#a16207"], supporter: true },
];

/* ────────────────────────────────────────────────────────────────────────
 *  Cosmic Events — rare, announced, high-impact modifiers.
 * ──────────────────────────────────────────────────────────────────────── */

export const EVENTS: GameEvent[] = [
  {
    id: "alignment",
    name: "Star Alignment",
    description: "The heavens line up — all production ×3.",
    glyph: "🌟",
    durationMs: 120_000,
    prodMult: 3,
    weight: 30,
  },
  {
    id: "meteors",
    name: "Meteor Shower",
    description: "Solar Flares rain down far more often.",
    glyph: "☄️",
    durationMs: 180_000,
    flareFreqMult: 4,
    weight: 28,
  },
  {
    id: "cosmicwind",
    name: "Cosmic Wind",
    description: "A charged gust — tap power ×6.",
    glyph: "💨",
    durationMs: 90_000,
    tapMult: 6,
    weight: 24,
  },
  {
    id: "timewarp",
    name: "Time Warp",
    description: "Ten minutes of production, in an instant.",
    glyph: "🕳️",
    durationMs: 6_000,
    instantProdSeconds: 600,
    weight: 18,
  },
];

/** Trigger no earlier than this lifetime energy (so new players aren't confused). */
export const EVENT_MIN_LIFETIME = 2_000;
/** First event window (ms) and steady-state window after that. */
export const EVENT_FIRST_MIN = 4 * 60_000;
export const EVENT_FIRST_MAX = 7 * 60_000;
export const EVENT_STEADY_MIN = 14 * 60_000;
export const EVENT_STEADY_MAX = 26 * 60_000;

export const CONFIG: GameConfig = {
  generators: GENERATORS,
  upgrades: UPGRADES,
  skills: SKILLS,
  achievements: ACHIEVEMENTS,
  skins: SKINS,
};
