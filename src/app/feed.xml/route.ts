import { publicEnv } from "@/env";
import { getCategories } from "@/features/categories/queries";

const FEED_TITLE = "플랜티프렌즈";
const FEED_DESCRIPTION =
  "한국 기후와 생활 환경에 맞는 반려식물 선택을 돕는 데이터 기반 가드닝 가이드입니다.";

function absoluteUrl(path: string) {
  return new URL(path, publicEnv.siteUrl).toString();
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function GET() {
  const categories = await getCategories();
  const now = new Date().toUTCString();
  const items = [
    {
      title: "반려식물 진단",
      description: "지역과 실내외 환경을 기준으로 반려식물 후보를 찾아보세요.",
      url: absoluteUrl("/tools/diagnose"),
      pubDate: now
    },
    ...categories.map((category) => ({
      title: category.title,
      description:
        category.description ?? `${category.title} 반려식물 목록입니다.`,
      url: absoluteUrl(`/category/${category.slug}`),
      pubDate: now
    }))
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(FEED_TITLE)}</title>
    <link>${absoluteUrl("/")}</link>
    <description>${escapeXml(FEED_DESCRIPTION)}</description>
    <language>ko-KR</language>
    <lastBuildDate>${now}</lastBuildDate>
${items
  .map(
    (item) => `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${item.url}</link>
      <guid>${item.url}</guid>
      <description>${escapeXml(item.description)}</description>
      <pubDate>${item.pubDate}</pubDate>
    </item>`
  )
  .join("\n")}
  </channel>
</rss>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
