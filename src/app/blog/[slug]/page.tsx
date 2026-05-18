import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getBlogPostBySlug,
  getBlogSitemapItems,
  getRelatedBlogPosts
} from "@/features/blog/queries";
import { publicEnv } from "@/env";
import { buildOgImageUrl, OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH } from "@/seo/og";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const posts = await getBlogSitemapItems().catch(() => []);
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) return { title: "글을 찾을 수 없습니다" };

  const ogImage = buildOgImageUrl({
    title: post.title,
    subtitle: post.metaDescription ?? "한국형 반려식물·가드닝 가이드",
    label: post.category
  });

  return {
    title: post.title,
    description: post.metaDescription ?? undefined,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: `${post.title} | 플랜티프렌즈`,
      description: post.metaDescription ?? undefined,
      type: "article",
      locale: "ko_KR",
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      tags: post.tags,
      images: [
        {
          url: ogImage,
          width: OG_IMAGE_WIDTH,
          height: OG_IMAGE_HEIGHT,
          alt: `${post.title} 대표 이미지`
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} | 플랜티프렌즈`,
      description: post.metaDescription ?? undefined,
      images: [ogImage]
    }
  };
}

type TocItem = { id: string; text: string };
type FaqItem = { q: string; a: string };
type ParseResult = {
  html: string;
  toc: TocItem[];
  faqs: FaqItem[];
  charCount: number;
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80) || "section";
}

function isQuestionHeading(text: string): boolean {
  return /[?？]\s*$/.test(text.trim());
}

function parseMarkdown(md: string): ParseResult {
  function inline(text: string): string {
    return text
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/`(.+?)`/g, "<code>$1</code>");
  }

  const blocks = md.split(/\n{2,}/);
  const html: string[] = [];
  const toc: TocItem[] = [];
  const faqs: FaqItem[] = [];
  const idCounts = new Map<string, number>();

  function uniqId(base: string): string {
    const count = (idCounts.get(base) ?? 0) + 1;
    idCounts.set(base, count);
    return count === 1 ? base : `${base}-${count}`;
  }

  const charCount = md.replace(/\s+/g, "").length;

  for (const block of blocks) {
    const lines = block.split("\n").filter((l) => l.trim());
    if (!lines.length) continue;
    const first = lines[0];

    if (first.startsWith("### ")) {
      const text = first.slice(4);
      const id = uniqId(slugify(text));
      html.push(`<h3 id="${id}">${inline(text)}</h3>`);
      if (lines.length > 1) {
        const answer = lines.slice(1).join(" ");
        html.push(`<p>${inline(answer)}</p>`);
        if (isQuestionHeading(text)) faqs.push({ q: text, a: answer });
      }
    } else if (first.startsWith("## ")) {
      const text = first.slice(3);
      const id = uniqId(slugify(text));
      toc.push({ id, text });
      html.push(`<h2 id="${id}">${inline(text)}</h2>`);
      if (lines.length > 1) html.push(`<p>${inline(lines.slice(1).join(" "))}</p>`);
    } else if (first.startsWith("# ")) {
      const text = first.slice(2);
      const id = uniqId(slugify(text));
      html.push(`<h1 id="${id}">${inline(text)}</h1>`);
      if (lines.length > 1) html.push(`<p>${inline(lines.slice(1).join(" "))}</p>`);
    } else if (first === "---") {
      html.push("<hr>");
    } else if (lines.every((l) => l.startsWith("> "))) {
      const content = lines.map((l) => l.slice(2)).join(" ");
      const isCaution = /⚠️|주의|경고|danger/i.test(content);
      const cls = isCaution ? "blog-callout caution" : "blog-callout tip";
      html.push(`<div class="${cls}">${inline(content)}</div>`);
    } else if (lines.every((l) => /^[-*] /.test(l))) {
      const items = lines.map((l) => `<li>${inline(l.slice(2))}</li>`).join("");
      html.push(`<ul>${items}</ul>`);
    } else if (lines.every((l) => /^\d+\. /.test(l))) {
      const items = lines
        .map((l) => `<li>${inline(l.replace(/^\d+\. /, ""))}</li>`)
        .join("");
      html.push(`<ol>${items}</ol>`);
    } else if (lines.every((l) => l.startsWith("|"))) {
      const dataLines = lines.filter((l) => !/^\|[-| :]+\|$/.test(l.trim()));
      const rows = dataLines.map((l, i) => {
        const cells = l.slice(1, -1).split("|").map((c) => c.trim());
        const tag = i === 0 ? "th" : "td";
        return `<tr>${cells.map((c) => `<${tag}>${inline(c)}</${tag}>`).join("")}</tr>`;
      });
      html.push(`<table>${rows.join("")}</table>`);
    } else {
      html.push(`<p>${inline(lines.join(" "))}</p>`);
    }
  }

  return { html: html.join("\n"), toc, faqs, charCount };
}

function estimateReadingMinutes(charCount: number): number {
  return Math.max(1, Math.round(charCount / 500));
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) notFound();

  const parsed = parseMarkdown(post.bodyMarkdown);
  const readingMin = estimateReadingMinutes(parsed.charCount);
  const relatedPosts = await getRelatedBlogPosts(post.category, post.slug, 4).catch(
    () => []
  );

  const ogImageAbs = new URL(
    buildOgImageUrl({
      title: post.title,
      subtitle: post.metaDescription ?? "한국형 반려식물·가드닝 가이드",
      label: post.category
    }),
    publicEnv.siteUrl
  ).toString();

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.metaDescription,
    image: [ogImageAbs],
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: {
      "@type": "Organization",
      name: "플랜티프렌즈 편집팀",
      url: publicEnv.siteUrl
    },
    publisher: {
      "@type": "Organization",
      name: "플랜티프렌즈",
      url: publicEnv.siteUrl,
      logo: {
        "@type": "ImageObject",
        url: `${publicEnv.siteUrl}/icon.svg`
      }
    },
    keywords: post.tags.join(", "),
    articleSection: post.category,
    inLanguage: "ko-KR",
    wordCount: parsed.charCount,
    url: `${publicEnv.siteUrl}/blog/${post.slug}`,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${publicEnv.siteUrl}/blog/${post.slug}`
    }
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "홈",
        item: `${publicEnv.siteUrl}/`
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "블로그",
        item: `${publicEnv.siteUrl}/blog`
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: `${publicEnv.siteUrl}/blog/${post.slug}`
      }
    ]
  };

  const faqJsonLd =
    parsed.faqs.length >= 2
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: parsed.faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: {
              "@type": "Answer",
              text: f.a
            }
          }))
        }
      : null;

  const speakableJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${publicEnv.siteUrl}/blog/${post.slug}#speakable`,
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: [".lead", ".blog-content h2", ".blog-content h3"]
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(speakableJsonLd) }}
      />
      <header className="home-header">
        <nav className="home-nav" aria-label="주요 메뉴">
          <Link href="/">플랜티프렌즈</Link>
          <Link href="/tools/diagnose">진단</Link>
          <Link href="/blog">블로그</Link>
          <Link href="/about">소개</Link>
          <Link href="/contact">문의</Link>
        </nav>
      </header>

      <main className="plant-shell">
        <nav className="breadcrumb" aria-label="경로">
          <Link href="/">홈</Link>
          <span aria-hidden="true">/</span>
          <Link href="/blog">블로그</Link>
          <span aria-hidden="true">/</span>
          <span>{post.category}</span>
          <span aria-hidden="true">/</span>
          <span>{post.title}</span>
        </nav>

        <article className="plant-article">
          <header className="plant-header">
            <p className="eyebrow">{post.category}</p>
            <h1>{post.title}</h1>
            {post.metaDescription && (
              <p className="lead">{post.metaDescription}</p>
            )}
            <div className="blog-post-meta">
              {post.tags.map((tag) => (
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
              <span className="blog-reading-time" aria-label="예상 읽는 시간">
                약 {readingMin}분 읽기
              </span>
            </div>
          </header>

          {parsed.toc.length >= 3 && (
            <nav className="blog-toc" aria-label="목차">
              <p className="blog-toc-title">목차</p>
              <ol>
                {parsed.toc
                  .map((item) => (
                    <li key={item.id}>
                      <a href={`#${item.id}`}>{item.text}</a>
                    </li>
                  ))}
              </ol>
            </nav>
          )}

          <div
            className="plant-section blog-content"
            dangerouslySetInnerHTML={{ __html: parsed.html }}
          />

          <footer className="plant-section plant-next-actions">
            <p>
              <strong>정보 출처:</strong> 공개 자료 및 플랜티프렌즈 편집 기준에
              따라 작성되었습니다. 반려동물·건강 관련 문제는 전문가 상담을
              권장합니다.
            </p>
            <Link href="/tools/diagnose" className="primary-link">
              나에게 맞는 식물 찾기 →
            </Link>
          </footer>

          {relatedPosts.length > 0 && (
            <section className="blog-related" aria-labelledby="related-title">
              <h2 id="related-title" className="blog-related-title">
                같은 카테고리 추천 글
              </h2>
              <div className="blog-related-list">
                {relatedPosts.map((rp) => (
                  <Link
                    key={rp.slug}
                    href={`/blog/${rp.slug}`}
                    className="blog-related-card"
                  >
                    <span className="blog-related-category">{rp.category}</span>
                    <span className="blog-related-card-title">{rp.title}</span>
                    {rp.metaDescription && (
                      <span className="blog-related-card-desc">
                        {rp.metaDescription}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>
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
