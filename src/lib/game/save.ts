/**
 * Persistence: default state, localStorage save/load, versioned migration, and
 * validated export/import. Save integrity is guarded with Zod so a corrupt or
 * hostile blob can never crash the game — it falls back to a fresh universe.
 */

import { z } from "zod";
import type { GameState, Settings, Stats } from "./types";

export const SAVE_VERSION = 1;
export const STORAGE_KEY = "supernova:save";

/* ── defaults ────────────────────────────────────────────────────────────── */

export function defaultSettings(): Settings {
  return {
    sfxVolume: 0.6,
    musicVolume: 0.35,
    reducedMotion: false,
    showFloatingNumbers: true,
    notation: "standard",
  };
}

export function defaultStats(): Stats {
  return {
    totalTaps: 0,
    flaresCollected: 0,
    bestEnergyPerSec: 0,
    handEnergyFromTaps: 0,
    fastestSupernovaMs: null,
  };
}

export function newGame(now: number): GameState {
  return {
    version: SAVE_VERSION,
    energy: 0,
    totalEnergyThisRun: 0,
    lifetimeEnergy: 0,
    stardust: 0,
    stardustEarned: 0,
    generators: {},
    upgrades: [],
    skills: {},
    achievements: [],
    taps: 0,
    supernovaCount: 0,
    createdAt: now,
    runStartedAt: now,
    lastSeen: now,
    playtimeMs: 0,
    lastDailyClaimDay: null,
    dailyStreak: 0,
    supporter: false,
    skin: "violet",
    settings: defaultSettings(),
    stats: defaultStats(),
  };
}

/* ── schema (permissive, with defaults so partial/old saves still load) ───── */

const finite = z.number().finite();
const nonneg = finite.pipe(z.number().min(0)).catch(0);

const settingsSchema = z
  .object({
    sfxVolume: finite.min(0).max(1).catch(0.6),
    musicVolume: finite.min(0).max(1).catch(0.35),
    reducedMotion: z.boolean().catch(false),
    showFloatingNumbers: z.boolean().catch(true),
    notation: z.enum(["standard", "scientific", "engineering"]).catch("standard"),
  })
  .catch(defaultSettings());

const statsSchema = z
  .object({
    totalTaps: nonneg,
    flaresCollected: nonneg,
    bestEnergyPerSec: nonneg,
    handEnergyFromTaps: nonneg,
    fastestSupernovaMs: finite.min(0).nullable().catch(null),
  })
  .catch(defaultStats());

const stateSchema = z.object({
  version: z.number().int().catch(SAVE_VERSION),
  energy: nonneg,
  totalEnergyThisRun: nonneg,
  lifetimeEnergy: nonneg,
  stardust: nonneg,
  stardustEarned: nonneg,
  generators: z.record(z.string(), nonneg).catch({}),
  upgrades: z.array(z.string()).catch([]),
  skills: z.record(z.string(), z.number().int().min(0)).catch({}),
  achievements: z.array(z.string()).catch([]),
  taps: nonneg,
  supernovaCount: nonneg,
  createdAt: finite.catch(0),
  runStartedAt: finite.catch(0),
  lastSeen: finite.catch(0),
  playtimeMs: nonneg,
  lastDailyClaimDay: z.number().int().nullable().catch(null),
  dailyStreak: nonneg,
  supporter: z.boolean().catch(false),
  skin: z.string().catch("violet"),
  settings: settingsSchema,
  stats: statsSchema,
});

/* ── migration ───────────────────────────────────────────────────────────── */

function migrate(raw: unknown): unknown {
  if (typeof raw !== "object" || raw === null) return raw;
  const r = raw as Record<string, unknown>;
  // Future migrations key off r.version. v1 is the baseline.
  return r;
}

/** Parse an unknown blob into a valid GameState, or null if unusable. */
export function parseState(raw: unknown, now: number): GameState | null {
  const migrated = migrate(raw);
  const result = stateSchema.safeParse(migrated);
  if (!result.success) return null;
  const s = result.data as GameState;
  // Fill timestamps that were zeroed by a bad/partial save.
  if (!s.createdAt) s.createdAt = now;
  if (!s.runStartedAt) s.runStartedAt = now;
  if (!s.lastSeen) s.lastSeen = now;
  s.version = SAVE_VERSION;
  return s;
}

/* ── (de)serialize ───────────────────────────────────────────────────────── */

export function serialize(state: GameState): string {
  return JSON.stringify(state);
}

export function deserialize(json: string, now: number): GameState | null {
  try {
    return parseState(JSON.parse(json), now);
  } catch {
    return null;
  }
}

/* ── base64 helpers (browser + node) ─────────────────────────────────────── */

function toBase64(str: string): string {
  if (typeof btoa === "function") return btoa(unescape(encodeURIComponent(str)));
  return Buffer.from(str, "utf-8").toString("base64");
}
function fromBase64(b64: string): string {
  if (typeof atob === "function") return decodeURIComponent(escape(atob(b64)));
  return Buffer.from(b64, "base64").toString("utf-8");
}

const EXPORT_PREFIX = "SNOVA1:";

/** A portable, shareable save string the player can copy out. */
export function exportSave(state: GameState): string {
  return EXPORT_PREFIX + toBase64(serialize(state));
}

export function importSave(text: string, now: number): GameState | null {
  const trimmed = text.trim();
  const body = trimmed.startsWith(EXPORT_PREFIX)
    ? trimmed.slice(EXPORT_PREFIX.length)
    : trimmed;
  try {
    // Accept both raw JSON and our base64 export format.
    if (body.startsWith("{")) return deserialize(body, now);
    return deserialize(fromBase64(body), now);
  } catch {
    return null;
  }
}

/* ── localStorage ────────────────────────────────────────────────────────── */

export function loadFromStorage(now: number): GameState | null {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  return deserialize(raw, now);
}

export function saveToStorage(state: GameState): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, serialize(state));
  } catch {
    // Quota or privacy mode — fail silently; the game keeps running in memory.
  }
}

export function clearStorage(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
