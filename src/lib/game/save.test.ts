import { describe, expect, it } from "vitest";
import {
  SAVE_VERSION,
  deserialize,
  exportSave,
  importSave,
  newGame,
  parseState,
  serialize,
} from "./save";

describe("newGame", () => {
  it("creates a valid fresh state", () => {
    const s = newGame(123);
    expect(s.version).toBe(SAVE_VERSION);
    expect(s.energy).toBe(0);
    expect(s.skin).toBe("violet");
    expect(s.settings.sfxVolume).toBeGreaterThan(0);
    expect(s.createdAt).toBe(123);
  });
});

describe("serialize round-trip", () => {
  it("preserves state", () => {
    const s = newGame(1000);
    s.energy = 123456.789;
    s.generators = { spark: 42, star: 3 };
    s.upgrades = ["g_cosmic1"];
    s.skills = { core: 2 };
    s.stardust = 17;
    s.darkMatter = 6;
    s.singularityCount = 2;
    const back = deserialize(serialize(s), 2000)!;
    expect(back).not.toBeNull();
    expect(back.energy).toBeCloseTo(123456.789);
    expect(back.generators.spark).toBe(42);
    expect(back.upgrades).toEqual(["g_cosmic1"]);
    expect(back.skills.core).toBe(2);
    expect(back.stardust).toBe(17);
    expect(back.darkMatter).toBe(6);
    expect(back.singularityCount).toBe(2);
  });
});

describe("parseState resilience", () => {
  it("rejects non-objects", () => {
    expect(parseState(null, 1)).toBeNull();
    expect(parseState(42, 1)).toBeNull();
    expect(parseState("nope", 1)).toBeNull();
  });

  it("fills missing fields with defaults from a partial save", () => {
    const s = parseState({ energy: 500, generators: { spark: 3 } }, 999);
    expect(s).not.toBeNull();
    expect(s!.energy).toBe(500);
    expect(s!.generators.spark).toBe(3);
    expect(s!.upgrades).toEqual([]);
    expect(s!.settings.notation).toBe("standard");
    expect(s!.createdAt).toBe(999); // backfilled
  });

  it("sanitizes hostile values", () => {
    const s = parseState(
      { energy: -1, taps: "lots", settings: { sfxVolume: 99 } },
      1,
    );
    expect(s).not.toBeNull();
    expect(s!.energy).toBe(0); // negative coerced
    expect(s!.taps).toBe(0); // non-number coerced
    expect(s!.settings.sfxVolume).toBeLessThanOrEqual(1);
  });
});

describe("export / import", () => {
  it("round-trips through the portable format", () => {
    const s = newGame(1000);
    s.energy = 9999;
    s.supernovaCount = 4;
    const code = exportSave(s);
    expect(code.startsWith("SNOVA1:")).toBe(true);
    const back = importSave(code, 2000)!;
    expect(back).not.toBeNull();
    expect(back.energy).toBe(9999);
    expect(back.supernovaCount).toBe(4);
  });

  it("also accepts raw JSON", () => {
    const s = newGame(1000);
    s.energy = 55;
    const back = importSave(serialize(s), 2000)!;
    expect(back.energy).toBe(55);
  });

  it("returns null on garbage", () => {
    expect(importSave("this is not a save", 1)).toBeNull();
  });
});
