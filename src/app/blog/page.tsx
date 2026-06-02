import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedBlogPosts, getPublishedBlogPostCount } from "@/features/blog/queries";
import { publicEnv } from "@/env";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "가드닝 블로그",
  description:
    "반려식물 키우기, 계절 관리, 병충해 대처, 식물 선택 가이드 등 한국 생활 환경에 맞는 실용적인 가드닝 정보를 전합니다.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "가드닝 블로그 | 플랜티프렌즈",
    description: "한국 반려식물·가드닝 실용 정보 블로그",
    type: "website",
    locale: "ko_KR"
  }
};

const CATEGORIES = [
  "전체",
  "키우기가이드",
  "식물선택",
  "계절관리",
  "병충해",
  "도구",
  "꽃말문화"
] as const;

const PAGE_SIZE = 18;

const blogJsonLd = {
  "@context": "https://schema.org",
  "@type": "Blog",
  name: "플랜티프렌즈 가드닝 블로그",
  url: `${publicEnv.siteUrl}/blog`,
  description: "한국 생활 환경에 맞는 반려식물·가드닝 실용 정보 블로그",
  inLanguage: "ko-KR",
  publisher: {
    "@type": "Organization",
    name: "플랜티프렌즈",
    url: publicEnv.siteUrl,
    logo: { "@type": "ImageObject", url: `${publicEnv.siteUrl}/icon.svg` }
  }
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "홈", item: `${publicEnv.siteUrl}/` },
    { "@type": "ListItem", position: 2, name: "블로그", item: `${publicEnv.siteUrl}/blog` }
  ]
};

type Props = { searchParams: Promise<{ page?: string; cat?: string }> };

export default async function BlogPage({ searchParams }: Props) {
  const { page = "1", cat = "전체" } = await searchParams;
  const pageNum = Math.max(1, parseInt(page) || 1);
  const offset = (pageNum - 1) * PAGE_SIZE;
  const activeCategory = CATEGORIES.includes(cat as typeof CATEGORIES[number]) ? cat : "전체";
  const categoryFilter = activeCategory === "전체" ? undefined : activeCategory;

  const [posts, total] = await Promise.all([
    getPublishedBlogPosts(PAGE_SIZE, offset, categoryFilter).catch(() => []),
    getPublishedBlogPostCount(categoryFilter).catch(() => 0)
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePageNum = Math.min(pageNum, totalPages);

  const itemListJsonLd = posts.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "최신 가드닝 블로그 글",
        itemListOrder: "https://schema.org/ItemListOrderDescending",
        numberOfItems: posts.length,
        itemListElement: posts.map((p, i) => ({
          "@type": "ListItem",
          position: offset + i + 1,
          url: `${publicEnv.siteUrl}/blog/${p.slug}`,
          name: p.title
        }))
      }
    : null;

  function catLink(c: string, p = 1) {
    const params = new URLSearchParams();
    if (c !== "전체") params.set("cat", c);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `/blog${qs ? `?${qs}` : ""}`;
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {itemListJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      )}

      <main className="site-shell">
        <section className="blog-hero" aria-labelledby="blog-title">
          <p className="eyebrow">Gardening Blog</p>
          <h1 id="blog-title">가드닝 블로그</h1>
          <p className="lead">
            반려식물 키우기, 계절 관리, 병충해 대처까지 한국 생활 환경에 맞는
            실용 가드닝 정보를 정리합니다.
          </p>
        </section>

        <nav className="blog-category-nav" aria-label="카테고리 필터">
          {CATEGORIES.map((c) => (
            <Link
              key={c}
              href={catLink(c)}
              className={`blog-category-chip${activeCategory === c ? " active" : ""}`}
              aria-current={activeCategory === c ? "true" : undefined}
            >
              {c}
            </Link>
          ))}
          {total > 0 && (
            <span className="blog-post-count">총 {total}개</span>
          )}
        </nav>

        {posts.length === 0 ? (
          <section className="empty-result compact" aria-labelledby="empty-blog">
            <h2 id="empty-blog">아직 글이 없어요</h2>
            <p>곧 다양한 가드닝 콘텐츠가 업데이트될 예정입니다.</p>
          </section>
        ) : (
          <>
            <section aria-labelledby="blog-list-title">
              <h2 id="blog-list-title" className="sr-only">블로그 글 목록</h2>
              <div className="blog-list">
                {posts.map((post) => (
                  <article key={post.slug} className="blog-card">
                    <header>
                      <span className="blog-card-category">{post.category}</span>
                      <h2 className="blog-card-title">
                        <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                      </h2>
                      {post.metaDescription && (
                        <p className="blog-card-desc">{post.metaDescription}</p>
                      )}
                    </header>
                    <footer className="blog-card-meta">
                      {post.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="blog-tag">#{tag}</span>
                      ))}
                      {post.publishedAt && (
                        <time dateTime={post.publishedAt.toISOString()} className="blog-card-date">
                          {post.publishedAt.toLocaleDateString("ko-KR", {
                            month: "short",
                            day: "numeric"
                          })}
                        </time>
                      )}
                    </footer>
                  </article>
                ))}
              </div>
            </section>

            {totalPages > 1 && (
              <nav className="blog-pagination" aria-label="페이지 이동">
                {safePageNum > 1 ? (
                  <Link href={catLink(activeCategory, safePageNum - 1)} className="page-btn" aria-label="이전 페이지">
                    ←
                  </Link>
                ) : (
                  <span className="page-btn disabled" aria-disabled="true">←</span>
                )}

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => Math.abs(p - safePageNum) <= 2)
                  .map((p) => (
                    p === safePageNum
                      ? <span key={p} className="page-btn current" aria-current="page">{p}</span>
                      : <Link key={p} href={catLink(activeCategory, p)} className="page-btn">{p}</Link>
                  ))}

                {safePageNum < totalPages ? (
                  <Link href={catLink(activeCategory, safePageNum + 1)} className="page-btn" aria-label="다음 페이지">
                    →
                  </Link>
                ) : (
                  <span className="page-btn disabled" aria-disabled="true">→</span>
                )}
              </nav>
            )}
          </>
        )}
      </main>
    </>
  );
}
