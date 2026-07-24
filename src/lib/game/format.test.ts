import { describe, expect, it } from "vitest";
import { fmt, fmtDuration, fmtCountdown, fmtInt, fmtMult, fmtPct, fmtRate } from "./format";

describe("fmt", () => {
  it("handles zero and small integers", () => {
    expect(fmt(0)).toBe("0");
    expect(fmt(7)).toBe("7");
    expect(fmt(999)).toBe("999");
  });

  it("shows adaptive decimals below 1000", () => {
    expect(fmt(3.14159)).toBe("3.14");
    expect(fmt(42.5)).toBe("42.5");
    expect(fmt(0.5)).toBe("0.5");
  });

  it("uses suffixes for large numbers", () => {
    expect(fmt(1000)).toBe("1K");
    expect(fmt(1500)).toBe("1.5K");
    expect(fmt(1_000_000)).toBe("1M");
    expect(fmt(2_500_000_000)).toBe("2.5B");
    expect(fmt(1e12)).toBe("1T");
  });

  it("rolls mantissa correctly near a boundary", () => {
    // 999,999 should not render as 1000K
    expect(fmt(999_999)).not.toContain("1000");
  });

  it("falls back to scientific past the suffix table", () => {
    const s = fmt(1e123);
    expect(s).toMatch(/e\d+/);
  });

  it("handles Infinity", () => {
    expect(fmt(Infinity)).toBe("∞");
  });

  it("respects scientific notation mode", () => {
    expect(fmt(1_234_000, "scientific")).toMatch(/^1\.23e6$/);
  });

  it("negatives", () => {
    expect(fmt(-1500)).toBe("-1.5K");
  });
});

describe("helpers", () => {
  it("fmtInt", () => {
    expect(fmtInt(42)).toBe("42");
    expect(fmtInt(1500)).toBe("1.5K");
  });
  it("fmtRate", () => {
    expect(fmtRate(1000)).toBe("1K/s");
  });
  it("fmtMult", () => {
    expect(fmtMult(2)).toBe("×2");
    expect(fmtMult(1.5)).toBe("×1.5");
  });
  it("fmtPct", () => {
    expect(fmtPct(0.25)).toBe("25%");
    expect(fmtPct(0.333, 1)).toBe("33.3%");
  });
});

describe("time", () => {
  it("fmtDuration", () => {
    expect(fmtDuration(8_000)).toBe("8s");
    expect(fmtDuration(80_000)).toBe("1m 20s");
    expect(fmtDuration(3_600_000)).toBe("1h 0m");
    expect(fmtDuration(90_000_000)).toBe("1d 1h");
  });
  it("fmtCountdown", () => {
    expect(fmtCountdown(63_000)).toBe("01:03");
    expect(fmtCountdown(3_723_000)).toBe("01:02:03");
  });
});
