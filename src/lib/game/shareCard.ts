import { fmt } from "./format";

export interface ShareStats {
  lifetimeEnergy: number;
  supernovaCount: number;
  bestEnergyPerSec: number;
  achievements: number;
  achievementsTotal: number;
  skinColors: [string, string, string];
  url: string;
}

/** Render a shareable poster of the player's universe onto a canvas. */
export function renderShareCard(s: ShareStats): HTMLCanvasElement {
  const W = 1200;
  const H = 630;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Background
  ctx.fillStyle = "#0b0b13";
  ctx.fillRect(0, 0, W, H);
  const bg = ctx.createRadialGradient(W * 0.5, H * 0.1, 50, W * 0.5, H * 0.1, W * 0.9);
  bg.addColorStop(0, "rgba(124,58,237,0.35)");
  bg.addColorStop(1, "rgba(11,11,19,0)");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Stars
  for (let i = 0; i < 140; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    const r = Math.random() * 1.6;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(220,220,255,${0.2 + Math.random() * 0.6})`;
    ctx.fill();
  }

  // Core orb
  const cx = 250;
  const cy = 300;
  const cr = 120;
  const orb = ctx.createRadialGradient(cx - 40, cy - 40, 10, cx, cy, cr);
  orb.addColorStop(0, s.skinColors[0]);
  orb.addColorStop(0.55, s.skinColors[1]);
  orb.addColorStop(1, s.skinColors[2]);
  ctx.beginPath();
  ctx.arc(cx, cy, cr, 0, Math.PI * 2);
  ctx.fillStyle = orb;
  ctx.shadowColor = s.skinColors[1];
  ctx.shadowBlur = 60;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.font = "700 90px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("✦", cx, cy + 6);

  // Title
  ctx.textAlign = "left";
  ctx.fillStyle = "#f4f3ff";
  ctx.font = "800 64px system-ui, sans-serif";
  ctx.fillText("SUPERNOVA", 470, 120);
  ctx.fillStyle = "#a9a4c9";
  ctx.font = "500 26px system-ui, sans-serif";
  ctx.fillText("I built a universe. Can you build a bigger one?", 470, 168);

  // Stats
  const rows: [string, string][] = [
    ["Lifetime energy", fmt(s.lifetimeEnergy)],
    ["Supernovas", fmt(s.supernovaCount)],
    ["Peak energy/sec", fmt(s.bestEnergyPerSec)],
    ["Achievements", `${s.achievements}/${s.achievementsTotal}`],
  ];
  let y = 240;
  for (const [label, value] of rows) {
    ctx.fillStyle = "#8f8ab0";
    ctx.font = "500 24px system-ui, sans-serif";
    ctx.fillText(label.toUpperCase(), 470, y);
    ctx.fillStyle = "#ffffff";
    ctx.font = "800 44px ui-monospace, monospace";
    ctx.fillText(value, 470, y + 44);
    y += 96;
  }

  // Footer
  ctx.fillStyle = "#7c3aed";
  ctx.font = "700 28px system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(s.url.replace(/^https?:\/\//, ""), W - 40, H - 36);

  return canvas;
}

/** Share the card via the Web Share API, falling back to a PNG download. */
export async function shareCard(s: ShareStats): Promise<"shared" | "downloaded"> {
  const canvas = renderShareCard(s);
  const blob: Blob = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b!), "image/png"),
  );
  const file = new File([blob], "my-supernova.png", { type: "image/png" });

  const nav = navigator as Navigator & { canShare?: (d: unknown) => boolean };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({
        files: [file],
        title: "SUPERNOVA",
        text: "I built a universe in SUPERNOVA. Can you build a bigger one?",
        url: s.url,
      });
      return "shared";
    } catch {
      /* user cancelled — fall through to download */
    }
  }

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "my-supernova.png";
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 4000);
  return "downloaded";
}
