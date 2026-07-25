/**
 * Build a SINGLE self-contained HTML file that plays the full game — no server,
 * no external requests. Open it by double-clicking, or upload it anywhere
 * (itch.io, a CDN, an email attachment). CSS + JS are inlined.
 *
 *   node scripts/build-embed.mjs      (or: npm run build:embed)
 *   → dist-embed/SUPERNOVA.html
 */
import { build } from "esbuild";
import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(root, "dist-embed");
mkdirSync(outDir, { recursive: true });

// 1) Compile Tailwind CSS (scans src/ for used classes).
console.log("• compiling CSS…");
execSync(
  `npx tailwindcss -i ./src/app/globals.css -o ./dist-embed/game.css --minify`,
  { cwd: root, stdio: "inherit" },
);
const css = readFileSync(resolve(outDir, "game.css"), "utf8");

// 2) Bundle the app into one minified IIFE (React included, all inlined).
console.log("• bundling JS…");
const empty = '""';
const result = await build({
  absWorkingDir: root,
  entryPoints: ["standalone/main.tsx"],
  bundle: true,
  minify: true,
  format: "iife",
  jsx: "automatic",
  target: ["es2020"],
  legalComments: "none",
  write: false,
  alias: {
    "next/link": resolve(root, "standalone/next-link-shim.tsx"),
    "next/script": resolve(root, "standalone/next-script-shim.tsx"),
  },
  define: {
    "process.env.NODE_ENV": '"production"',
    "process.env.NEXT_PUBLIC_APP_URL": empty,
    "process.env.NEXT_PUBLIC_SUPPORTER_URL": empty,
    "process.env.NEXT_PUBLIC_ADS_ENABLED": empty,
    "process.env.NEXT_PUBLIC_ADSENSE_CLIENT": empty,
    "process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN": empty,
    "process.env.NEXT_PUBLIC_PLAUSIBLE_SRC": empty,
  },
});
const js = result.outputFiles[0].text;

// 3) Assemble the single HTML file.
const html = `<!doctype html>
<html lang="en" class="dark">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<meta name="theme-color" content="#0b0b13" />
<title>SUPERNOVA — Tap a spark. Build a universe.</title>
<style>${css}</style>
</head>
<body>
<div id="root"></div>
<script>${js}</script>
</body>
</html>`;

const outFile = resolve(outDir, "SUPERNOVA.html");
writeFileSync(outFile, html);
const kb = (Buffer.byteLength(html) / 1024).toFixed(0);
console.log(`✓ wrote ${outFile} (${kb} KB, fully self-contained)`);
