import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogPostBySlug, getBlogSitemapItems } from "@/features/blog/queries";
import { publicEnv } from "@/env";

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
      tags: post.tags
    }
  };
}

function markdownToHtml(md: string): string {
  function inline(text: string): string {
    return text
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/`(.+?)`/g, "<code>$1</code>");
  }

  const blocks = md.split(/\n{2,}/);
  const result: string[] = [];

  for (const block of blocks) {
    const lines = block.split("\n").filter((l) => l.trim());
    if (!lines.length) continue;
    const first = lines[0];

    if (first.startsWith("### ")) {
      result.push(`<h3>${inline(first.slice(4))}</h3>`);
    } else if (first.startsWith("## ")) {
      result.push(`<h2>${inline(first.slice(3))}</h2>`);
    } else if (first.startsWith("# ")) {
      result.push(`<h1>${inline(first.slice(2))}</h1>`);
    } else if (first === "---") {
      result.push("<hr>");
    } else if (lines.every((l) => l.startsWith("> "))) {
      const content = lines.map((l) => l.slice(2)).join(" ");
      const isCaution = /⚠️|주의|경고|danger/i.test(content);
      const cls = isCaution ? "blog-callout caution" : "blog-callout tip";
      result.push(`<div class="${cls}">${inline(content)}</div>`);
    } else if (lines.every((l) => /^[-*] /.test(l))) {
      const items = lines.map((l) => `<li>${inline(l.slice(2))}</li>`).join("");
      result.push(`<ul>${items}</ul>`);
    } else if (lines.every((l) => /^\d+\. /.test(l))) {
      const items = lines
        .map((l) => `<li>${inline(l.replace(/^\d+\. /, ""))}</li>`)
        .join("");
      result.push(`<ol>${items}</ol>`);
    } else if (lines.every((l) => l.startsWith("|"))) {
      const dataLines = lines.filter((l) => !/^\|[-| :]+\|$/.test(l.trim()));
      const rows = dataLines.map((l, i) => {
        const cells = l.slice(1, -1).split("|").map((c) => c.trim());
        const tag = i === 0 ? "th" : "td";
        return `<tr>${cells.map((c) => `<${tag}>${inline(c)}</${tag}>`).join("")}</tr>`;
      });
      result.push(`<table>${rows.join("")}</table>`);
    } else {
      result.push(`<p>${inline(lines.join(" "))}</p>`);
    }
  }

  return result.join("\n");
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.metaDescription,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: {
      "@type": "Organization",
      name: "플랜티프렌즈 편집팀"
    },
    publisher: {
      "@type": "Organization",
      name: "플랜티프렌즈",
      url: publicEnv.siteUrl
    },
    keywords: post.tags.join(", "),
    articleSection: post.category,
    inLanguage: "ko-KR",
    url: `${publicEnv.siteUrl}/blog/${post.slug}`
  };

  const htmlContent = markdownToHtml(post.bodyMarkdown);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
            </div>
          </header>

          <div
            className="plant-section blog-content"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
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
