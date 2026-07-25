import type { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: APP_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${APP_URL}/play`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${APP_URL}/guide`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${APP_URL}/faq`, changeFrequency: "monthly", priority: 0.6 },
  ];
}
