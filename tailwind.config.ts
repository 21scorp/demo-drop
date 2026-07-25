import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{ts,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.25rem",
      screens: { "2xl": "1200px" },
    },
    extend: {
      colors: {
        // Semantic tokens map to CSS variables (see globals.css)
        bg: "hsl(var(--bg) / <alpha-value>)",
        surface: "hsl(var(--surface) / <alpha-value>)",
        "surface-2": "hsl(var(--surface-2) / <alpha-value>)",
        border: "hsl(var(--border) / <alpha-value>)",
        ink: "hsl(var(--ink) / <alpha-value>)",
        muted: "hsl(var(--muted) / <alpha-value>)",
        faint: "hsl(var(--faint) / <alpha-value>)",
        brand: {
          DEFAULT: "hsl(var(--brand) / <alpha-value>)",
          soft: "hsl(var(--brand-soft) / <alpha-value>)",
          ink: "hsl(var(--brand-ink) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          soft: "hsl(var(--accent-soft) / <alpha-value>)",
        },
        success: "hsl(var(--success) / <alpha-value>)",
        warning: "hsl(var(--warning) / <alpha-value>)",
        danger: "hsl(var(--danger) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
        xl: "calc(var(--radius) + 6px)",
        "2xl": "calc(var(--radius) + 12px)",
      },
      boxShadow: {
        glow: "0 0 0 1px hsl(var(--brand) / 0.2), 0 8px 40px -12px hsl(var(--brand) / 0.5)",
        card: "0 1px 0 0 hsl(var(--border) / 0.6), 0 12px 32px -20px hsl(0 0% 0% / 0.8)",
        lift: "0 24px 60px -24px hsl(0 0% 0% / 0.7)",
      },
      backgroundImage: {
        "grid-faint":
          "linear-gradient(hsl(var(--border) / 0.35) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border) / 0.35) 1px, transparent 1px)",
        "brand-glow":
          "radial-gradient(60% 60% at 50% 0%, hsl(var(--brand) / 0.22) 0%, transparent 70%)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.97)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "equalize-1": { "0%,100%": { height: "30%" }, "50%": { height: "100%" } },
        "equalize-2": { "0%,100%": { height: "100%" }, "50%": { height: "40%" } },
        "equalize-3": { "0%,100%": { height: "60%" }, "50%": { height: "90%" } },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.22,1,0.36,1) both",
        "scale-in": "scale-in 0.35s cubic-bezier(0.22,1,0.36,1) both",
        marquee: "marquee 40s linear infinite",
        "eq-1": "equalize-1 0.9s ease-in-out infinite",
        "eq-2": "equalize-2 1.1s ease-in-out infinite",
        "eq-3": "equalize-3 0.7s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
