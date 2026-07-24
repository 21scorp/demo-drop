import type { Metadata, Viewport } from "next";
import { PwaRegister } from "@/components/PwaRegister";
import "./globals.css";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "SUPERNOVA — Tap a spark. Build a universe.",
    template: "%s · SUPERNOVA",
  },
  description:
    "SUPERNOVA is a hypnotic idle game. Tap a single spark, ignite generators from embers to whole galaxies, catch Solar Flares, and collapse everything in a Supernova to be reborn more powerful. One more upgrade…",
  applicationName: "SUPERNOVA",
  keywords: [
    "idle game",
    "incremental game",
    "clicker game",
    "cookie clicker",
    "prestige",
    "browser game",
    "free game",
  ],
  authors: [{ name: "SUPERNOVA" }],
  openGraph: {
    type: "website",
    title: "SUPERNOVA — Tap a spark. Build a universe.",
    description:
      "A hypnotic idle game. Tap, ignite the cosmos, catch Solar Flares, go Supernova. Free, instant, no signup.",
    url: APP_URL,
    siteName: "SUPERNOVA",
  },
  twitter: {
    card: "summary_large_image",
    title: "SUPERNOVA — Tap a spark. Build a universe.",
    description:
      "A hypnotic idle game. Tap, ignite the cosmos, catch Solar Flares, go Supernova. Free, instant, no signup.",
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0b13",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
