import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedBlogPosts } from "@/features/blog/queries";
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

export default async function BlogPage() {
  const posts = await getPublishedBlogPosts(30).catch(() => []);

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "최신 가드닝 블로그 글",
    itemListOrder: "https://schema.org/ItemListOrderDescending",
    numberOfItems: posts.length,
    itemListElement: posts.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${publicEnv.siteUrl}/blog/${p.slug}`,
      name: p.title
    }))
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {posts.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      )}
      <header className="home-header">
        <nav className="home-nav" aria-label="주요 메뉴">
          <Link href="/">플랜티프렌즈</Link>
          <Link href="/tools/diagnose">진단</Link>
          <Link href="/blog" aria-current="page">블로그</Link>
          <Link href="/about">소개</Link>
          <Link href="/contact">문의</Link>
        </nav>
      </header>

      <main className="site-shell">
        <section className="hero" aria-labelledby="blog-title">
          <p className="eyebrow">Gardening Blog</p>
          <h1 id="blog-title">가드닝 블로그</h1>
          <p className="lead">
            반려식물 키우기, 계절 관리, 병충해 대처까지 한국 생활 환경에 맞는
            실용 가드닝 정보를 정리합니다.
          </p>
        </section>

        <nav className="blog-category-nav" aria-label="카테고리">
          {CATEGORIES.map((cat) => (
            <span key={cat} className="blog-category-chip">
              {cat}
            </span>
          ))}
        </nav>

        {posts.length === 0 ? (
          <section className="empty-result compact" aria-labelledby="empty-blog">
            <h2 id="empty-blog">아직 글이 없어요</h2>
            <p>곧 다양한 가드닝 콘텐츠가 업데이트될 예정입니다.</p>
          </section>
        ) : (
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
                    {post.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="blog-tag">#{tag}</span>
                    ))}
                    {post.publishedAt && (
                      <time dateTime={post.publishedAt.toISOString()}>
                        {post.publishedAt.toLocaleDateString("ko-KR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric"
                        })}
                      </time>
                    )}
                  </footer>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="home-footer">
        <nav aria-label="사이트 정보">
          <Link href="/about">소개</Link>
          <Link href="/privacy">개인정보처리방침</Link>
          <Link href="/terms">이용약관</Link>
          <Link href="/disclaimer">면책 고지</Link>
          <Link href="/contact">문의</Link>
        </nav>
      </footer>
    </>
  );
}
