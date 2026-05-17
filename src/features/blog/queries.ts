import { and, desc, eq, lte } from "drizzle-orm";
import { db } from "@/db/client";
import { blogPosts } from "@/db/schema";

export type BlogPost = {
  id: number;
  slug: string;
  title: string;
  metaDescription: string | null;
  category: string;
  tags: string[];
  bodyMarkdown: string;
  qualityScore: number | null;
  publishedAt: Date | null;
  updatedAt: Date;
};

export type BlogListItem = Omit<BlogPost, "bodyMarkdown" | "qualityScore">;

export type BlogSitemapItem = {
  slug: string;
  publishedAt: Date;
};

export async function getPublishedBlogPosts(limit = 20, offset = 0): Promise<BlogListItem[]> {
  const rows = await db
    .select({
      id: blogPosts.id,
      slug: blogPosts.slug,
      title: blogPosts.title,
      metaDescription: blogPosts.metaDescription,
      category: blogPosts.category,
      tags: blogPosts.tags,
      publishedAt: blogPosts.publishedAt,
      updatedAt: blogPosts.updatedAt
    })
    .from(blogPosts)
    .where(eq(blogPosts.isPublished, true))
    .orderBy(desc(blogPosts.publishedAt))
    .limit(limit)
    .offset(offset);

  return rows.map((r) => ({
    ...r,
    tags: r.tags ?? [],
    publishedAt: r.publishedAt ?? null
  }));
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const rows = await db
    .select()
    .from(blogPosts)
    .where(and(eq(blogPosts.slug, slug), eq(blogPosts.isPublished, true)))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    metaDescription: row.metaDescription,
    category: row.category,
    tags: row.tags ?? [],
    bodyMarkdown: row.bodyMarkdown,
    qualityScore: row.qualityScore,
    publishedAt: row.publishedAt,
    updatedAt: row.updatedAt
  };
}

export async function getBlogSitemapItems(): Promise<BlogSitemapItem[]> {
  const rows = await db
    .select({ slug: blogPosts.slug, publishedAt: blogPosts.publishedAt })
    .from(blogPosts)
    .where(eq(blogPosts.isPublished, true));

  return rows
    .filter((r) => r.publishedAt != null)
    .map((r) => ({ slug: r.slug, publishedAt: r.publishedAt! }));
}

export async function getScheduledPostsToPublish(): Promise<{ id: number; slug: string }[]> {
  const now = new Date();
  return db
    .select({ id: blogPosts.id, slug: blogPosts.slug })
    .from(blogPosts)
    .where(
      and(
        eq(blogPosts.isPublished, false),
        lte(blogPosts.scheduledAt, now)
      )
    );
}

export async function publishBlogPost(id: number): Promise<void> {
  const now = new Date();
  await db
    .update(blogPosts)
    .set({ isPublished: true, publishedAt: now, updatedAt: now })
    .where(eq(blogPosts.id, id));
}
