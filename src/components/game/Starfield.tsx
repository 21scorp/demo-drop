"use client";

import { useEffect, useRef } from "react";

/**
 * A lightweight canvas starfield. Twinkles + drifts slowly for depth. Honors
 * reduced-motion (draws a single static frame). Sits behind everything at z-0.
 */
export function Starfield({
  density = 0.00014,
  reduced,
}: {
  density?: number;
  reduced?: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReduced =
      reduced ??
      (typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches);

    let raf = 0;
    let stars: { x: number; y: number; z: number; r: number; tw: number; hue: number }[] = [];
    let w = 0;
    let h = 0;

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.floor(w * h * density);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        z: 0.3 + Math.random() * 0.7,
        r: Math.random() * 1.4 + 0.2,
        tw: Math.random() * Math.PI * 2,
        hue: Math.random() < 0.15 ? 265 : Math.random() < 0.3 ? 45 : 230,
      }));
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        const twinkle = prefersReduced ? 0.7 : 0.5 + Math.sin(t * 0.001 + s.tw) * 0.5;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * s.z, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${s.hue}, 70%, 85%, ${0.15 + twinkle * 0.65 * s.z})`;
        ctx.fill();
        if (!prefersReduced) {
          s.y += s.z * 0.06; // slow parallax drift
          if (s.y > h + 2) {
            s.y = -2;
            s.x = Math.random() * w;
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    if (prefersReduced) {
      draw(0);
      cancelAnimationFrame(raf);
    } else {
      raf = requestAnimationFrame(draw);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [density, reduced]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
