/**
 * Big-number & time formatting — the aesthetic heartbeat of an idle game.
 * Handles values from 0 up to the edge of the double range (~1.8e308) and beyond
 * (Infinity → "∞"). Three notations, switchable from Settings.
 */

export type Notation = "standard" | "scientific" | "engineering";

// Short-scale suffixes. Index i covers 10^(3*(i+1)).
// K,M,B,T then two-letter Latin-ish names common to the genre.
const SUFFIXES = [
  "", "K", "M", "B", "T",
  "Qa", "Qi", "Sx", "Sp", "Oc", "No",
  "Dc", "UDc", "DDc", "TDc", "QaDc", "QiDc", "SxDc", "SpDc", "OcDc", "NoDc",
  "Vg", "UVg", "DVg", "TVg", "QaVg", "QiVg", "SxVg", "SpVg", "OcVg", "NoVg",
  "Tg", "UTg", "DTg", "TTg", "QaTg", "QiTg", "SxTg", "SpTg", "OcTg", "NoTg",
] as const;

function decimalsFor(mantissa: number): number {
  const m = Math.abs(mantissa);
  if (m < 10) return 2;
  if (m < 100) return 1;
  return 0;
}

function trimZeros(s: string): string {
  return s.includes(".") ? s.replace(/\.?0+$/, "") : s;
}

function sci(n: number, digits = 2): string {
  const exp = Math.floor(Math.log10(n));
  const mant = n / Math.pow(10, exp);
  return `${trimZeros(mant.toFixed(digits))}e${exp}`;
}

/** Format a resource amount for display. */
export function fmt(n: number, notation: Notation = "standard"): string {
  if (!Number.isFinite(n)) return n > 0 ? "∞" : "-∞";
  if (n === 0) return "0";
  if (n < 0) return "-" + fmt(-n, notation);

  // Small values: show with adaptive precision.
  if (n < 1000) {
    if (Number.isInteger(n)) return n.toString();
    if (n < 1) return trimZeros(n.toFixed(3));
    if (n < 10) return trimZeros(n.toFixed(2));
    if (n < 100) return trimZeros(n.toFixed(1));
    return Math.floor(n).toString();
  }

  if (notation === "scientific") return sci(n);

  const exp = Math.floor(Math.log10(n));
  let tier = Math.floor(exp / 3);

  if (notation === "engineering") {
    const mant = n / Math.pow(10, tier * 3);
    return `${trimZeros(mant.toFixed(decimalsFor(mant)))}e${tier * 3}`;
  }

  // Standard suffixes, falling back to scientific past the table.
  if (tier < SUFFIXES.length) {
    let mant = n / Math.pow(10, tier * 3);
    let dec = decimalsFor(mant);
    // Rounding at display precision can bump the mantissa to 1000
    // (e.g. 999,999 → 999.999 → "1000"). Roll it into the next tier.
    if (Number(mant.toFixed(dec)) >= 1000) {
      mant /= 1000;
      tier += 1;
      dec = decimalsFor(mant);
    }
    if (tier < SUFFIXES.length) {
      return `${trimZeros(mant.toFixed(dec))}${SUFFIXES[tier]}`;
    }
  }
  return sci(n);
}

/** Format an integer count (owned generators, achievements, etc.). */
export function fmtInt(n: number): string {
  if (!Number.isFinite(n)) return "∞";
  if (Math.abs(n) < 1000) return Math.floor(n).toString();
  return fmt(Math.floor(n));
}

/** Format a per-second rate, e.g. "12.3K/s". */
export function fmtRate(n: number, notation: Notation = "standard"): string {
  return `${fmt(n, notation)}/s`;
}

/** Format a multiplier, e.g. "×1.5", "×10", "×2.75". */
export function fmtMult(n: number): string {
  if (Number.isInteger(n)) return `×${n}`;
  if (n < 10) return `×${trimZeros(n.toFixed(2))}`;
  return `×${fmt(n)}`;
}

/** Format a 0..1 fraction as a percentage. */
export function fmtPct(frac: number, digits = 0): string {
  return `${(frac * 100).toFixed(digits)}%`;
}

/** Human duration from milliseconds: "2d 4h", "13m 20s", "8s". */
export function fmtDuration(ms: number): string {
  if (ms < 0) ms = 0;
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

/** Compact clock for countdowns: "6d 23:59:12" or "12:03". */
export function fmtCountdown(ms: number): string {
  if (ms < 0) ms = 0;
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (x: number) => x.toString().padStart(2, "0");
  if (d > 0) return `${d}d ${pad(h)}:${pad(m)}:${pad(sec)}`;
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(sec)}`;
  return `${pad(m)}:${pad(sec)}`;
}
