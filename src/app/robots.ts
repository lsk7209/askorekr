import type { MetadataRoute } from "next";
import { publicEnv } from "@/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: [
          "Googlebot",
          "Bingbot",
          "Yeti",
          "Daumoa",
          "GPTBot",
          "ClaudeBot",
          "anthropic-ai",
          "PerplexityBot",
          "OAI-SearchBot",
          "Google-Extended"
        ],
        allow: "/",
        disallow: ["/api/", "/admin/"]
      },
      {
        userAgent: "Bytespider",
        disallow: "/"
      },
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/"]
      }
    ],
    sitemap: new URL("/sitemap.xml", publicEnv.siteUrl).toString()
  };
}
