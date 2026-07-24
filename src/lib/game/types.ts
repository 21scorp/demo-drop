import type { Notation } from "./format";

/* ────────────────────────────────────────────────────────────────────────
 *  Content definitions (static config, authored in config.ts)
 * ──────────────────────────────────────────────────────────────────────── */

/** A view of state passed to unlock predicates (kept minimal + serializable-ish). */
export interface UnlockCtx {
  energy: number;
  lifetimeEnergy: number;
  totalEnergyThisRun: number;
  stardust: number;
  supernovaCount: number;
  darkMatter: number;
  singularityCount: number;
  generators: Record<string, number>;
  upgrades: Set<string>;
  achievements: Set<string>;
  skills: Record<string, number>;
  taps: number;
}

/** A tier of producer. Cost grows geometrically; output is linear in count. */
export interface GeneratorDef {
  id: string;
  name: string;
  /** Short flavor line shown in the UI. */
  blurb: string;
  /** Emoji/glyph used as the generator icon. */
  glyph: string;
  tier: number;
  /** Cost of the first unit, in Energy. */
  baseCost: number;
  /** Geometric cost growth per owned unit (e.g. 1.15). */
  costGrowth: number;
  /** Energy per second produced by ONE unit, before multipliers. */
  baseOutput: number;
  /** Becomes visible/buyable when this predicate is true. */
  unlock: (ctx: UnlockCtx) => boolean;
}

export type UpgradeKind = "global" | "generator" | "tap" | "special";

/** A one-time purchase that permanently boosts something. */
export interface UpgradeDef {
  id: string;
  name: string;
  blurb: string;
  kind: UpgradeKind;
  /** Energy cost. */
  cost: number;
  /** Multiplier applied (for global/generator/tap kinds). */
  mult: number;
  /** For kind==="generator": which generator id it boosts. */
  target?: string;
  unlock: (ctx: UnlockCtx) => boolean;
}

/** Permanent perk bought with Stardust in the skill tree. Can be leveled. */
export interface SkillDef {
  id: string;
  name: string;
  blurb: string;
  glyph: string;
  maxLevel: number;
  /** Stardust cost for the given level (1-indexed). */
  cost: (level: number) => number;
  /** Skill nodes this depends on (must have level >= 1). */
  requires?: string[];
  /** Grid position for the tree layout. */
  row: number;
  col: number;
}

export type AchievementCheck = (ctx: UnlockCtx & { bestEnergyPerSec: number; flaresCollected: number }) => boolean;

/** A milestone. Unlocking grants a small permanent global multiplier + a toast. */
export interface AchievementDef {
  id: string;
  name: string;
  blurb: string;
  glyph: string;
  /** Permanent global production multiplier granted on unlock (e.g. 1.02). */
  reward: number;
  secret?: boolean;
  check: AchievementCheck;
}

export interface SkinDef {
  id: string;
  name: string;
  /** CSS color stops for the core gradient. */
  colors: [string, string, string];
  /** Requires the Supporter Pack to equip. */
  supporter?: boolean;
  /** Unlocked after N supernovas (0 = always). */
  unlockSupernovas?: number;
}

export interface GameConfig {
  generators: GeneratorDef[];
  upgrades: UpgradeDef[];
  skills: SkillDef[];
  achievements: AchievementDef[];
  skins: SkinDef[];
}

/* ────────────────────────────────────────────────────────────────────────
 *  Persistent game state (serialized to localStorage)
 * ──────────────────────────────────────────────────────────────────────── */

export interface Settings {
  sfxVolume: number; // 0..1
  musicVolume: number; // 0..1
  reducedMotion: boolean;
  showFloatingNumbers: boolean;
  notation: Notation;
}

export interface Stats {
  totalTaps: number;
  flaresCollected: number;
  bestEnergyPerSec: number;
  handEnergyFromTaps: number;
  fastestSupernovaMs: number | null;
}

export interface GameState {
  version: number;

  // Resources
  energy: number;
  totalEnergyThisRun: number; // resets each supernova — drives prestige gain
  lifetimeEnergy: number; // never resets
  stardust: number; // current spendable prestige currency
  stardustEarned: number; // stardust earned this singularity-cycle — powers the prestige bonus

  // Second prestige layer (Singularity)
  darkMatter: number; // permanent meta-currency; each point boosts everything
  singularityCount: number;

  // Production
  generators: Record<string, number>; // id -> owned count
  upgrades: string[]; // purchased upgrade ids
  skills: Record<string, number>; // skill id -> level
  achievements: string[]; // unlocked achievement ids

  // Active layer
  taps: number;

  // Meta / prestige
  supernovaCount: number;

  // Timing (ms epoch)
  createdAt: number;
  runStartedAt: number;
  lastSeen: number;
  playtimeMs: number;

  // Daily streak
  lastDailyClaimDay: number | null; // day index (epochDay)
  dailyStreak: number;

  // Cosmetics / commerce
  supporter: boolean;
  skin: string;

  settings: Settings;
  stats: Stats;
}

/* ────────────────────────────────────────────────────────────────────────
 *  Derived / runtime (never persisted)
 * ──────────────────────────────────────────────────────────────────────── */

export interface Multipliers {
  global: number;
  perGen: Record<string, number>;
  tap: number;
}

export interface Derived {
  mult: Multipliers;
  perGenOutput: Record<string, number>; // energy/sec per generator line (all owned units)
  energyPerSec: number;
  tapPower: number;
  prestigeGain: number; // stardust if you supernova right now
}

export type FlareKind = "surge" | "frenzy" | "tapstorm" | "jackpot";

export interface Flare {
  id: number;
  kind: FlareKind;
  /** viewport position in %, 0..100 */
  x: number;
  y: number;
  bornAt: number;
  ttl: number;
}

export interface ActiveBuff {
  id: number;
  kind: FlareKind;
  label: string;
  mult: number;
  expiresAt: number;
}

/** A rare, announced, high-impact modifier (bigger and rarer than a flare buff). */
export interface GameEvent {
  id: string;
  name: string;
  description: string;
  glyph: string;
  durationMs: number;
  /** Multipliers applied while active. */
  prodMult?: number;
  tapMult?: number;
  /** Flares spawn this many times more often while active. */
  flareFreqMult?: number;
  /** One-off grant of N seconds of current production on trigger. */
  instantProdSeconds?: number;
  /** Selection weight. */
  weight: number;
}

export interface ActiveEvent {
  def: GameEvent;
  startedAt: number;
  expiresAt: number;
}

export type ToastKind = "unlock" | "achievement" | "flare" | "info" | "prestige";

export interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  body?: string;
  glyph?: string;
}
