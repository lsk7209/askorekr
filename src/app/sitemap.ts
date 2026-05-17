import type { MetadataRoute } from "next";
import { publicEnv } from "@/env";
import { getCategorySitemapItems } from "@/features/categories/queries";
import { getPlantSitemapItems } from "@/features/plants/queries";
import { getBlogSitemapItems } from "@/features/blog/queries";

const STATIC_ROUTES: { path: string; priority: number; changeFreq: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "", priority: 1.0, changeFreq: "daily" },
  { path: "/tools/diagnose", priority: 0.9, changeFreq: "weekly" },
  { path: "/blog", priority: 0.8, changeFreq: "daily" },
  { path: "/about", priority: 0.6, changeFreq: "monthly" },
  { path: "/contact", priority: 0.5, changeFreq: "monthly" },
  { path: "/privacy", priority: 0.3, changeFreq: "yearly" },
  { path: "/terms", priority: 0.3, changeFreq: "yearly" },
  { path: "/disclaimer", priority: 0.3, changeFreq: "yearly" }
];

const MAX_FUTURE_DRIFT_MS = 24 * 60 * 60 * 1000;

function absoluteUrl(path: string) {
  return new URL(path, publicEnv.siteUrl).toString();
}

function safeLastModified(value: Date, fallback: Date) {
  const time = value.getTime();
  if (!Number.isFinite(time)) return fallback;
  if (time > fallback.getTime() + MAX_FUTURE_DRIFT_MS) return fallback;
  return value;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [categories, plants, blogPosts] = await Promise.all([
    getCategorySitemapItems().catch(() => [] as { slug: string }[]),
    getPlantSitemapItems().catch(() => [] as { slug: string; updatedAt: Date }[]),
    getBlogSitemapItems().catch(() => [] as { slug: string; publishedAt: Date }[])
  ]);

  const staticPages = STATIC_ROUTES.map(({ path, priority, changeFreq }) => ({
    url: absoluteUrl(path),
    lastModified: now,
    changeFrequency: changeFreq,
    priority
  }));

  const categoryPages = categories.map((category) => ({
    url: absoluteUrl(`/category/${category.slug}`),
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7
  }));

  const plantPages = plants.map((plant) => ({
    url: absoluteUrl(`/plant/${plant.slug}`),
    lastModified: safeLastModified(plant.updatedAt, now),
    changeFrequency: "monthly" as const,
    priority: 0.6
  }));

  const blogPages = blogPosts.map((post) => ({
    url: absoluteUrl(`/blog/${post.slug}`),
    lastModified: safeLastModified(post.publishedAt, now),
    changeFrequency: "monthly" as const,
    priority: 0.65
  }));

  return [...staticPages, ...categoryPages, ...plantPages, ...blogPages];
}
