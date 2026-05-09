import type { MetadataRoute } from "next";
import { publicEnv } from "@/env";
import { getCategorySitemapItems } from "@/features/categories/queries";
import { getPlantSitemapItems } from "@/features/plants/queries";

const STATIC_ROUTES = [
  "",
  "/tools/diagnose",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/disclaimer"
] as const;
const MAX_FUTURE_DRIFT_MS = 24 * 60 * 60 * 1000;

function absoluteUrl(path: string) {
  return new URL(path, publicEnv.siteUrl).toString();
}

function safeLastModified(value: Date, fallback: Date) {
  const time = value.getTime();

  if (!Number.isFinite(time)) {
    return fallback;
  }

  if (time > fallback.getTime() + MAX_FUTURE_DRIFT_MS) {
    return fallback;
  }

  return value;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, plants] = await Promise.all([
    getCategorySitemapItems(),
    getPlantSitemapItems()
  ]);
  const now = new Date();
  const staticPages = STATIC_ROUTES.map((path) => ({
    url: absoluteUrl(path),
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: path === "" ? 1 : 0.8
  }));
  const categoryPages = categories.map((category) => ({
    url: absoluteUrl(`/category/${category.slug}`),
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.7
  }));
  const plantPages = plants.map((plant) => ({
    url: absoluteUrl(`/plant/${plant.slug}`),
    lastModified: safeLastModified(plant.updatedAt, now),
    changeFrequency: "weekly" as const,
    priority: 0.6
  }));

  return [...staticPages, ...categoryPages, ...plantPages];
}
