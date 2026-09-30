import { NextResponse, type NextRequest } from "next/server";

function readEnv(name: string) {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : undefined;
}

export function middleware(request: NextRequest) {
  const { pathname, host } = request.nextUrl;

  // www → non-www 리다이렉트 (canonical 유지, GSC 불일치 방지)
  if (host.startsWith("www.")) {
    const nonWwwUrl = request.nextUrl.clone();
    nonWwwUrl.host = host.slice(4);
    return NextResponse.redirect(nonWwwUrl, { status: 301 });
  }

  // IndexNow 키 파일 서빙
  const key = readEnv("INDEXNOW_KEY");
  if (key && pathname === `/${key}.txt`) {
    return new NextResponse(key, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600"
      }
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * 다음 정적 리소스 요청은 미들웨어 실행 대상에서 제외:
     * - _next/static (빌드 정적 파일)
     * - _next/image (이미지 최적화 파일)
     * - favicon.ico, icon.svg (아이콘 에셋)
     */
    "/((?!_next/static|_next/image|favicon.ico|icon.svg).*)",
  ]
};

