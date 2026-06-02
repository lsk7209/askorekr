import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "페이지를 찾을 수 없습니다",
  description: "요청한 페이지가 존재하지 않습니다. 홈이나 식물 진단 도구로 이동해 보세요.",
  robots: { index: false, follow: true }
};

export default function NotFound() {
  return (
    <main className="policy-shell">
      <header className="policy-header">
        <p className="eyebrow">404</p>
        <h1>페이지를 찾을 수 없습니다</h1>
        <p className="lead">
          요청한 주소가 삭제되었거나 주소가 변경되었을 수 있습니다.
          아래 링크로 이동해 보세요.
        </p>
      </header>

      <article className="policy-article">
        <section className="policy-section">
          <div className="entry-links">
            <Link href="/">홈으로 돌아가기</Link>
            <Link href="/tools/diagnose">반려식물 진단</Link>
            <Link href="/blog">가드닝 블로그</Link>
          </div>
        </section>
      </article>
    </main>
  );
}
