import { type NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getScheduledPostsToPublish, publishBlogPost } from "@/features/blog/queries";
import { publicEnv } from "@/env";

function verifyToken(request: NextRequest) {
  const token = process.env.INTERNAL_API_TOKEN;
  if (!token) return false;

  const authHeader = request.headers.get("Authorization");
  const cronSecret = request.headers.get("x-vercel-cron-signature");

  if (authHeader === `Bearer ${token}`) return true;
  if (cronSecret) return true;

  return false;
}

async function pingIndexNow(slugs: string[]) {
  const key = process.env.INDEXNOW_KEY;
  const token = process.env.INTERNAL_API_TOKEN;
  if (!key || !token || slugs.length === 0) return;

  const urls = slugs.map((slug) => `${publicEnv.siteUrl}/blog/${slug}`);

  try {
    await fetch(`${publicEnv.siteUrl}/api/internal/indexnow`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ urls }),
      cache: "no-store"
    });
  } catch {
    // IndexNow failure should not block publish response
  }
}

async function pingSitemapToGoogle() {
  try {
    const sitemapUrl = `${publicEnv.siteUrl}/sitemap.xml`;
    await fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`, {
      method: "GET",
      cache: "no-store"
    });
  } catch {
    // Google ping failure should not block publish response
  }
}

export async function POST(request: NextRequest) {
  if (!verifyToken(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const posts = await getScheduledPostsToPublish();

    if (posts.length === 0) {
      return NextResponse.json({ published: 0, message: "No posts scheduled" });
    }

    const results: string[] = [];

    for (const post of posts) {
      await publishBlogPost(post.id);
      revalidatePath(`/blog/${post.slug}`);
      revalidatePath("/blog");
      revalidatePath("/sitemap.xml");
      results.push(post.slug);
    }

    // 비동기로 IndexNow + Google sitemap ping (발행 응답 차단 안 함)
    void Promise.allSettled([
      pingIndexNow(results),
      pingSitemapToGoogle()
    ]);

    return NextResponse.json({
      published: results.length,
      slugs: results
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
