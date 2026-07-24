/**
 * Economy balance simulator (not shipped). Runs a greedy "reasonable player"
 * against the real engine and reports time-to-milestones so we can tune pacing.
 *
 *   npx tsx scripts/sim.ts            # idle-ish (1 tap/s)
 *   npx tsx scripts/sim.ts 4          # active (4 taps/s)
 */
import { CONFIG, GENERATORS } from "../src/lib/game/config";
import {
  buildUnlockCtx,
  buyGenerator,
  buyUpgrade,
  computeMultipliers,
  costOfNext,
  energyPerSec,
  newlyUnlockedAchievements,
  perGeneratorOutput,
  prestigeGain,
  tapPower,
} from "../src/lib/game/engine";
import { fmt, fmtDuration } from "../src/lib/game/format";
import { newGame } from "../src/lib/game/save";

const tapsPerSec = Number(process.argv[2] ?? 1);
const MAX_SECONDS = 12 * 3600;

const s = newGame(0);
const milestones: Record<string, number> = {};
const mark = (k: string, t: number) => {
  if (milestones[k] === undefined) milestones[k] = t;
};

function spend() {
  // Buy affordable, not-owned, unlocked upgrades with reasonable payback first.
  const purchased = new Set(s.upgrades);
  const ctx = buildUnlockCtx(s);
  for (const u of CONFIG.upgrades) {
    if (purchased.has(u.id) || !u.unlock(ctx)) continue;
    const eps = energyPerSec(perGeneratorOutput(s, CONFIG, computeMultipliers(s, CONFIG)));
    if (s.energy >= u.cost && u.cost <= Math.max(50, eps * 600)) buyUpgrade(s, u);
  }
  // Buy generators greedily by best eps-gain per cost.
  for (let iter = 0; iter < 200; iter++) {
    const mult = computeMultipliers(s, CONFIG);
    let best: { id: string; ratio: number } | null = null;
    const ctx2 = buildUnlockCtx(s);
    for (const g of GENERATORS) {
      if (!g.unlock(ctx2)) continue;
      const owned = s.generators[g.id] ?? 0;
      const cost = costOfNext(g, owned);
      if (cost > s.energy) continue;
      const dEps = g.baseOutput * (mult.perGen[g.id] ?? 1) * mult.global;
      const ratio = dEps / cost;
      if (!best || ratio > best.ratio) best = { id: g.id, ratio };
    }
    if (!best) break;
    const def = GENERATORS.find((g) => g.id === best!.id)!;
    if (!buyGenerator(s, def, 1).ok) break;
  }
}

for (let t = 1; t <= MAX_SECONDS; t++) {
  const mult = computeMultipliers(s, CONFIG);
  const eps = energyPerSec(perGeneratorOutput(s, CONFIG, mult));
  // production
  s.energy += eps;
  s.totalEnergyThisRun += eps;
  s.lifetimeEnergy += eps;
  // taps
  const tp = tapPower(s, CONFIG, eps, mult, 1);
  for (let i = 0; i < tapsPerSec; i++) {
    s.energy += tp;
    s.totalEnergyThisRun += tp;
    s.lifetimeEnergy += tp;
    s.taps += 1;
  }
  if (eps > s.stats.bestEnergyPerSec) s.stats.bestEnergyPerSec = eps;
  // achievements (they boost global)
  for (const id of newlyUnlockedAchievements(s, CONFIG)) s.achievements.push(id);
  // spend
  spend();

  // milestones
  for (const g of GENERATORS) {
    if ((s.generators[g.id] ?? 0) >= 1) mark(`own:${g.name}`, t);
  }
  if (prestigeGain(s) >= 1) mark("supernova:1st", t);
  if (prestigeGain(s) >= 10) mark("supernova:10sd", t);
  if (prestigeGain(s) >= 100) mark("supernova:100sd", t);
  if (s.lifetimeEnergy >= 1e9) mark("energy:1B", t);
  if (s.lifetimeEnergy >= 1e12) mark("energy:1T", t);

  if (milestones["supernova:100sd"] !== undefined && t > (milestones["supernova:100sd"] ?? 0) + 5) break;
}

const finalEps = energyPerSec(perGeneratorOutput(s, CONFIG, computeMultipliers(s, CONFIG)));
console.log(`\n=== SUPERNOVA balance sim · ${tapsPerSec} tap/s ===`);
console.log(`final: eps=${fmt(finalEps)} lifetime=${fmt(s.lifetimeEnergy)} taps=${s.taps}`);
console.log(`upgrades owned=${s.upgrades.length} achievements=${s.achievements.length}`);
console.log(`\nmilestone            time`);
for (const [k, v] of Object.entries(milestones).sort((a, b) => a[1] - b[1])) {
  console.log(`${k.padEnd(20)} ${fmtDuration(v * 1000)}`);
}
