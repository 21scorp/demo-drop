// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { EVENTS } from "./config";
import { createGameStore, type GameStore } from "./store";
import { STORAGE_KEY } from "./save";

let store: GameStore;

beforeEach(() => {
  localStorage.clear();
  store = createGameStore();
});
afterEach(() => {
  localStorage.clear();
});

describe("tapping", () => {
  it("adds energy, counts taps, builds combo", () => {
    const r1 = store.tap();
    expect(store.state.taps).toBe(1);
    expect(store.state.energy).toBeGreaterThan(0);
    expect(r1.combo).toBe(1);
    const r2 = store.tap();
    expect(r2.combo).toBe(2);
    expect(r2.comboMult).toBeGreaterThan(r1.comboMult);
  });
});

describe("buying", () => {
  it("buys a generator and updates production", () => {
    store.state.energy = 1000;
    const ok = store.buyGenerator("spark", 10);
    expect(ok).toBe(true);
    expect(store.state.generators.spark).toBe(10);
    expect(store.derived.energyPerSec).toBeGreaterThan(0);
  });

  it("rejects unaffordable purchases", () => {
    store.state.energy = 0;
    expect(store.buyGenerator("spark", 1)).toBe(false);
  });

  it("buys an upgrade once", () => {
    store.state.energy = 1e9;
    expect(store.buyUpgrade("g_cosmic1")).toBe(true);
    expect(store.buyUpgrade("g_cosmic1")).toBe(false);
    expect(store.state.upgrades).toContain("g_cosmic1");
  });

  it("levels a skill with stardust and enforces deps", () => {
    store.state.stardust = 100;
    expect(store.buySkill("inherit")).toBe(false); // needs core
    expect(store.buySkill("core")).toBe(true);
    expect(store.state.skills.core).toBe(1);
  });
});

describe("flares", () => {
  it("collecting a surge flare grants energy", () => {
    store.flares.push({ id: 999, kind: "surge", x: 50, y: 50, bornAt: Date.now(), ttl: 10000 });
    const before = store.state.energy;
    const res = store.collectFlare(999);
    expect(res?.kind).toBe("surge");
    expect(store.state.energy).toBeGreaterThan(before);
    expect(store.state.stats.flaresCollected).toBe(1);
    expect(store.flares.find((f) => f.id === 999)).toBeUndefined();
  });

  it("collecting a frenzy flare adds a production buff", () => {
    // production must exist first (collectFlare recomputes derived)
    store.state.energy = 1e12;
    store.buyGenerator("star", 10);
    store.flares.push({ id: 111, kind: "frenzy", x: 10, y: 10, bornAt: Date.now(), ttl: 10000 });
    store.collectFlare(111);
    expect(store.buffs.some((b) => b.kind === "frenzy")).toBe(true);
    // buff multiplies live eps above the (buff-free) derived eps
    const base = store.derived.energyPerSec;
    expect(base).toBeGreaterThan(0);
    expect(store.liveEps()).toBeGreaterThan(base);
  });
});

describe("cosmic events", () => {
  it("an active production event multiplies live eps", () => {
    store.state.energy = 1e12;
    store.buyGenerator("star", 10);
    const base = store.derived.energyPerSec;
    const alignment = EVENTS.find((e) => e.id === "alignment")!;
    store.activeEvent = {
      def: alignment,
      startedAt: Date.now(),
      expiresAt: Date.now() + alignment.durationMs,
    };
    expect(store.liveEps()).toBeCloseTo(base * (alignment.prodMult ?? 1));
  });

  it("a tap event multiplies live tap power", () => {
    const before = store.liveTapPower();
    const wind = EVENTS.find((e) => e.id === "cosmicwind")!;
    store.activeEvent = {
      def: wind,
      startedAt: Date.now(),
      expiresAt: Date.now() + wind.durationMs,
    };
    expect(store.liveTapPower()).toBeCloseTo(before * (wind.tapMult ?? 1));
  });
});

describe("prestige", () => {
  it("supernova banks stardust and resets the run", () => {
    store.state.totalEnergyThisRun = 1e9;
    store.state.generators.spark = 50;
    const gain = store.doSupernova();
    expect(gain).toBeGreaterThan(0);
    expect(store.state.stardust).toBe(gain);
    expect(store.state.supernovaCount).toBe(1);
    expect(store.state.generators.spark ?? 0).toBe(0);
  });

  it("refuses supernova below threshold", () => {
    store.state.totalEnergyThisRun = 10;
    expect(store.canSupernova()).toBe(false);
    expect(store.doSupernova()).toBe(0);
  });
});

describe("daily streak", () => {
  it("claims once per day and grants a reward", () => {
    expect(store.dailyAvailable()).toBe(true);
    const res = store.claimDaily();
    expect(res).not.toBeNull();
    expect(res!.streak).toBe(1);
    expect(store.dailyAvailable()).toBe(false);
    expect(store.claimDaily()).toBeNull(); // already claimed today
  });
});

describe("offline", () => {
  it("credits offline earnings and queues a welcome-back report", () => {
    store.state.generators.star = 100;
    store.save();
    store.state.lastSeen = Date.now() - 3_600_000; // 1h ago
    store.resumeFromBackground();
    expect(store.pendingOffline).not.toBeNull();
    expect(store.pendingOffline!.gained).toBeGreaterThan(0);
  });
});

describe("persistence via store", () => {
  it("autosaves to localStorage and reloads", () => {
    store.state.energy = 4242;
    store.state.generators.ember = 5;
    store.save();
    const reloaded = createGameStore();
    expect(reloaded.state.energy).toBeGreaterThanOrEqual(4242);
    expect(reloaded.state.generators.ember).toBe(5);
    expect(localStorage.getItem(STORAGE_KEY)).toBeTruthy();
  });

  it("export/import round-trips through the store", () => {
    store.state.energy = 7777;
    store.state.supernovaCount = 3;
    const code = store.exportSave();
    const fresh = createGameStore();
    expect(fresh.importSave(code)).toBe(true);
    expect(fresh.state.energy).toBe(7777);
    expect(fresh.state.supernovaCount).toBe(3);
  });

  it("hard reset wipes progress", () => {
    store.state.energy = 999;
    store.state.supernovaCount = 9;
    store.hardReset();
    expect(store.state.energy).toBe(0);
    expect(store.state.supernovaCount).toBe(0);
  });
});

describe("settings & cosmetics", () => {
  it("updates settings and persists", () => {
    store.updateSettings({ reducedMotion: true, sfxVolume: 0.2 });
    expect(store.state.settings.reducedMotion).toBe(true);
    expect(store.state.settings.sfxVolume).toBe(0.2);
  });

  it("gates supporter-only skins until unlocked", () => {
    expect(store.setSkin("aurora")).toBe(false); // supporter-locked
    store.grantSupporter();
    expect(store.setSkin("aurora")).toBe(true);
    expect(store.state.skin).toBe("aurora");
  });

  it("gates singularity skins by singularity count", () => {
    expect(store.setSkin("voidcore")).toBe(false); // needs 1 singularity
    store.state.singularityCount = 1;
    expect(store.setSkin("voidcore")).toBe(true);
    expect(store.state.skin).toBe("voidcore");
    expect(store.setSkin("darkmatter")).toBe(false); // needs 6
  });
});
