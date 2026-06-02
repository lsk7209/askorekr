import { publicEnv } from "@/env";
import { getPublishedBlogPosts } from "@/features/blog/queries";

const FEED_TITLE = "플랜티프렌즈 가드닝 블로그";
const FEED_DESCRIPTION =
  "한국 기후와 생활 환경에 맞는 반려식물·가드닝 실용 정보를 전합니다.";

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
  const posts = await getPublishedBlogPosts(50, 0).catch(() => []);
  const now = new Date().toUTCString();

  const items = posts.map((post) => ({
    title: post.title,
    description: post.metaDescription ?? `${post.category} — 플랜티프렌즈`,
    url: absoluteUrl(`/blog/${post.slug}`),
    pubDate: post.publishedAt?.toUTCString() ?? now,
    category: post.category
  }));

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(FEED_TITLE)}</title>
    <link>${absoluteUrl("/blog")}</link>
    <atom:link href="${absoluteUrl("/feed.xml")}" rel="self" type="application/rss+xml"/>
    <description>${escapeXml(FEED_DESCRIPTION)}</description>
    <language>ko-KR</language>
    <lastBuildDate>${now}</lastBuildDate>
${items
  .map(
    (item) => `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${item.url}</link>
      <guid isPermaLink="true">${item.url}</guid>
      <description>${escapeXml(item.description)}</description>
      <category>${escapeXml(item.category)}</category>
      <pubDate>${item.pubDate}</pubDate>
    </item>`
  )
  .join("\n")}
  </channel>
</rss>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400"
    }
  });
}
