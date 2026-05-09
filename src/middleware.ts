import { NextResponse, type NextRequest } from "next/server";

function readEnv(name: string) {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : undefined;
}

export function middleware(request: NextRequest) {
  const key = readEnv("INDEXNOW_KEY");

  if (!key || request.nextUrl.pathname !== `/${key}.txt`) {
    return NextResponse.next();
  }

  return new NextResponse(key, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600"
    }
  });
}

export const config = {
  matcher: ["/:path*"]
};
