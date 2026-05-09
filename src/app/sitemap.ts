import type { MetadataRoute } from "next";
import { publicEnv } from "@/env";
import { getCategorySitemapItems } from "@/features/categories/queries";
import { getPlantSitemapItems } from "@/features/plants/queries";

const STATIC_ROUTES = ["", "/tools/diagnose"] as const;

function absoluteUrl(path: string) {
  return new URL(path, publicEnv.siteUrl).toString();
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
    lastModified: plant.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.6
  }));

  return [...staticPages, ...categoryPages, ...plantPages];
}
