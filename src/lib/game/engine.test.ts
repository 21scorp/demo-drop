import { describe, expect, it } from "vitest";
import { CONFIG, GENERATORS } from "./config";
import {
  bulkCost,
  buyGenerator,
  buySkill,
  buyUpgrade,
  canSupernova,
  computeDerived,
  computeMultipliers,
  computeOffline,
  costOfNext,
  energyPerSec,
  maxAffordable,
  perGeneratorOutput,
  prestigeGain,
  supernova,
  tapPower,
} from "./engine";
import { newGame } from "./save";

const spark = GENERATORS.find((g) => g.id === "spark")!;

function fresh() {
  return newGame(1_000_000);
}

describe("generator costs", () => {
  it("costOfNext grows geometrically", () => {
    expect(costOfNext(spark, 0)).toBeCloseTo(15);
    expect(costOfNext(spark, 1)).toBeCloseTo(15 * 1.12);
    expect(costOfNext(spark, 10)).toBeCloseTo(15 * Math.pow(1.12, 10));
  });

  it("bulkCost equals the sum of individual costs", () => {
    let manual = 0;
    for (let i = 0; i < 5; i++) manual += costOfNext(spark, i);
    expect(bulkCost(spark, 0, 5)).toBeCloseTo(manual);
  });

  it("maxAffordable never overspends", () => {
    for (const budget of [0, 14, 15, 100, 1000, 12345, 1e9]) {
      const q = maxAffordable(spark, 0, budget);
      expect(bulkCost(spark, 0, q)).toBeLessThanOrEqual(budget + 1e-6);
      if (q < 1e6) {
        // buying one more should exceed the budget
        expect(bulkCost(spark, 0, q + 1)).toBeGreaterThan(budget);
      }
    }
  });
});

describe("buying", () => {
  it("buys generators and deducts energy", () => {
    const s = fresh();
    s.energy = 1000;
    const r = buyGenerator(s, spark, 10);
    expect(r.ok).toBe(true);
    expect(r.bought).toBe(10);
    expect(s.generators.spark).toBe(10);
    expect(s.energy).toBeCloseTo(1000 - r.spent);
  });

  it("buying x max spends down to what is affordable", () => {
    const s = fresh();
    s.energy = 500;
    const r = buyGenerator(s, spark, Infinity);
    expect(r.bought).toBeGreaterThan(0);
    expect(s.energy).toBeGreaterThanOrEqual(0);
    expect(bulkCost(spark, 0, r.bought + 1)).toBeGreaterThan(500);
  });

  it("cannot buy with no energy", () => {
    const s = fresh();
    s.energy = 0;
    const r = buyGenerator(s, spark, 1);
    expect(r.ok).toBe(false);
    expect(s.generators.spark ?? 0).toBe(0);
  });

  it("upgrades are one-time and gated by cost", () => {
    const s = fresh();
    const up = CONFIG.upgrades.find((u) => u.id === "g_cosmic1")!;
    s.energy = up.cost - 1;
    expect(buyUpgrade(s, up)).toBe(false);
    s.energy = up.cost;
    expect(buyUpgrade(s, up)).toBe(true);
    expect(buyUpgrade(s, up)).toBe(false); // already owned
  });
});

describe("multipliers & production", () => {
  it("global upgrade multiplies all production", () => {
    const s = fresh();
    s.generators.spark = 10;
    const before = energyPerSec(perGeneratorOutput(s, CONFIG, computeMultipliers(s, CONFIG)));
    s.upgrades.push("g_cosmic1"); // ×2 global
    const after = energyPerSec(perGeneratorOutput(s, CONFIG, computeMultipliers(s, CONFIG)));
    expect(after).toBeCloseTo(before * 2);
  });

  it("generator upgrade only boosts its target", () => {
    const s = fresh();
    s.generators.spark = 10;
    s.generators.ember = 10;
    const m0 = computeMultipliers(s, CONFIG);
    s.upgrades.push("spark_u10"); // ×2 sparks
    const m1 = computeMultipliers(s, CONFIG);
    expect(m1.perGen.spark!).toBeCloseTo(m0.perGen.spark! * 2);
    expect(m1.perGen.ember!).toBeCloseTo(m0.perGen.ember!);
  });

  it("tap power includes a share of eps after coupling", () => {
    const s = fresh();
    s.generators.star = 50;
    const m = computeMultipliers(s, CONFIG);
    const eps = energyPerSec(perGeneratorOutput(s, CONFIG, m));
    const before = tapPower(s, CONFIG, eps, m, 1);
    s.upgrades.push("t_couple1"); // +1% of eps per tap
    const after = tapPower(s, CONFIG, eps, computeMultipliers(s, CONFIG), 1);
    expect(after).toBeGreaterThan(before);
    expect(after - before).toBeCloseTo(0.01 * eps);
  });

  it("core skill raises global multiplier", () => {
    const s = fresh();
    s.skills.core = 5;
    const m = computeMultipliers(s, CONFIG);
    expect(m.global).toBeCloseTo(1 + 0.08 * 5);
  });
});

describe("prestige", () => {
  it("no stardust before threshold", () => {
    const s = fresh();
    s.totalEnergyThisRun = 1000;
    expect(prestigeGain(s)).toBe(0);
    expect(canSupernova(s)).toBe(false);
  });

  it("gain scales with run energy", () => {
    const s = fresh();
    s.totalEnergyThisRun = 1e6;
    const g1 = prestigeGain(s);
    s.totalEnergyThisRun = 1e9;
    const g2 = prestigeGain(s);
    expect(g1).toBeGreaterThanOrEqual(1);
    expect(g2).toBeGreaterThan(g1);
  });

  it("supernova banks stardust and resets the run but keeps meta", () => {
    const s = fresh();
    s.totalEnergyThisRun = 1e9;
    s.lifetimeEnergy = 1e9;
    s.energy = 5e8;
    s.generators.spark = 200;
    s.upgrades.push("g_cosmic1");
    s.skills.core = 3;
    s.achievements.push("first_tap");
    const gain = supernova(s, CONFIG, 2_000_000);
    expect(gain).toBeGreaterThan(0);
    expect(s.stardust).toBe(gain);
    expect(s.stardustEarned).toBe(gain);
    expect(s.supernovaCount).toBe(1);
    expect(s.energy).toBe(0);
    expect(s.totalEnergyThisRun).toBe(0);
    expect(s.generators.spark ?? 0).toBe(0);
    expect(s.upgrades).toHaveLength(0);
    // kept:
    expect(s.skills.core).toBe(3);
    expect(s.achievements).toContain("first_tap");
    expect(s.lifetimeEnergy).toBe(1e9);
  });

  it("stardustEarned permanently boosts global production", () => {
    const s = fresh();
    s.generators.spark = 10;
    const before = computeMultipliers(s, CONFIG).global;
    s.stardustEarned = 10;
    const after = computeMultipliers(s, CONFIG).global;
    expect(after).toBeCloseTo(before * (1 + 0.03 * 10));
  });

  it("head-start skill grants free generators after nova", () => {
    const s = fresh();
    s.skills.headstart = 2;
    s.totalEnergyThisRun = 1e9;
    supernova(s, CONFIG, 2_000_000);
    expect(s.generators.spark).toBe(20);
    expect(s.generators.ember).toBe(8);
  });
});

describe("skills", () => {
  it("respects dependencies and cost", () => {
    const s = fresh();
    s.stardust = 100;
    // inherit requires core
    expect(buySkill(s, CONFIG, "inherit")).toBe(false);
    expect(buySkill(s, CONFIG, "core")).toBe(true);
    expect(s.skills.core).toBe(1);
    expect(buySkill(s, CONFIG, "inherit")).toBe(true);
  });

  it("cannot exceed max level", () => {
    const s = fresh();
    s.stardust = 1e9;
    const core = CONFIG.skills.find((x) => x.id === "core")!;
    for (let i = 0; i < core.maxLevel + 3; i++) buySkill(s, CONFIG, "core");
    expect(s.skills.core).toBe(core.maxLevel);
  });
});

describe("offline", () => {
  it("credits capped, efficiency-scaled production", () => {
    const s = fresh();
    s.generators.star = 100;
    const m = computeMultipliers(s, CONFIG);
    const eps = energyPerSec(perGeneratorOutput(s, CONFIG, m));
    const oneHour = 3_600_000;
    const res = computeOffline(s, CONFIG, oneHour);
    expect(res.eps).toBeCloseTo(eps);
    expect(res.gained).toBeCloseTo(eps * 3600 * 0.5); // base 50% efficiency
    expect(res.creditedMs).toBe(oneHour);
  });

  it("caps very long absences", () => {
    const s = fresh();
    s.generators.star = 100;
    const res = computeOffline(s, CONFIG, 1000 * 3_600_000);
    expect(res.creditedMs).toBe(24 * 3_600_000); // 24h base cap
    expect(res.cappedMs).toBeGreaterThan(0);
  });
});

describe("derived snapshot", () => {
  it("computes a coherent snapshot", () => {
    const s = fresh();
    s.generators.spark = 25;
    const d = computeDerived(s, CONFIG);
    expect(d.energyPerSec).toBeGreaterThan(0);
    expect(d.tapPower).toBeGreaterThan(0);
    expect(Object.keys(d.perGenOutput)).toContain("spark");
  });
});
