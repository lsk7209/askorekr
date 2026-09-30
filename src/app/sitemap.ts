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

/**
 * 사이트맵 하위 쿼리 실패 시 조용히 빈 배열로 대체하면, DB 일시 오류가
 * '이 URL들이 전부 삭제됨'이라는 정상 200 사이트맵으로 검색엔진에 전달될 수 있다.
 * 완전한 해결(마지막 성공 결과 캐싱)은 별도 캐시 인프라가 필요해 이번 범위 밖이지만,
 * 최소한 실패를 조용히 숨기지 않고 로그로 남겨 운영자가 실제 원인을 인지할 수 있게 한다.
 */
async function safeSitemapQuery<T>(
  queryName: string,
  query: () => Promise<T[]>
): Promise<T[]> {
  try {
    return await query();
  } catch (error) {
    console.error(`[sitemap] ${queryName} query failed, falling back to empty list:`, error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [categories, plants, blogPosts] = await Promise.all([
    safeSitemapQuery("categories", getCategorySitemapItems),
    safeSitemapQuery("plants", getPlantSitemapItems),
    safeSitemapQuery("blogPosts", getBlogSitemapItems)
  ]);

  // 정적 라우트와 카테고리 목록은 실제 콘텐츠 변경 이력을 추적하지 않으므로,
  // 확실하지 않은 lastModified(요청 시각을 매번 넣는 가짜 최신성)를 채우지 않고
  // 필드 자체를 생략한다. Google 사이트맵 가이드는 정확한 변경일만 사용할 것을
  // 권고하며, 불명확하면 생략하는 편이 매 요청마다 달라지는 현재 시각보다 정직하다.
  const staticPages = STATIC_ROUTES.map(({ path, priority, changeFreq }) => ({
    url: absoluteUrl(path),
    changeFrequency: changeFreq,
    priority
  }));

  const categoryPages = categories.map((category) => ({
    url: absoluteUrl(`/category/${category.slug}`),
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
