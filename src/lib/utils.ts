import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes with conditional logic, de-duplicating conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Clamp a number into [min, max]. */
export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/** Linear interpolation. */
export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Deterministic-ish pseudo range helper (uses Math.random by default). */
export function randRange(min: number, max: number, rng: () => number = Math.random) {
  return min + rng() * (max - min);
}

/** Pick a random element. */
export function pick<T>(arr: readonly T[], rng: () => number = Math.random): T {
  return arr[Math.floor(rng() * arr.length)]!;
}
