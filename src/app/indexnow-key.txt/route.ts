import { getIndexNowConfig } from "@/env";

export const runtime = "nodejs";

export function GET() {
  const { key } = getIndexNowConfig();

  if (!key) {
    return new Response("IndexNow key is not configured.", { status: 503 });
  }

  return new Response(key, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
