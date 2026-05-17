import { type NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getScheduledPostsToPublish, publishBlogPost } from "@/features/blog/queries";

function verifyToken(request: NextRequest) {
  const token = process.env.INTERNAL_API_TOKEN;
  if (!token) return false;

  const authHeader = request.headers.get("Authorization");
  const cronSecret = request.headers.get("x-vercel-cron-signature");

  if (authHeader === `Bearer ${token}`) return true;
  if (cronSecret) return true;

  return false;
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

    return NextResponse.json({
      published: results.length,
      slugs: results
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
