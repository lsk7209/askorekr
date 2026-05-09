import type { Metadata } from "next";
import Link from "next/link";

const UPDATED_AT = "2026-05-10";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description:
    "플랜티프렌즈의 개인정보 수집 항목, 이용 목적, 보관 기준을 안내합니다.",
  alternates: {
    canonical: "/privacy"
  },
  openGraph: {
    title: "개인정보처리방침 | 플랜티프렌즈",
    description: "사이트 이용 중 처리될 수 있는 개인정보 기준을 안내합니다.",
    type: "website",
    locale: "ko_KR"
  }
};

export default function PrivacyPage() {
  return (
    <main className="policy-shell">
      <header className="policy-header">
        <p className="eyebrow">Privacy</p>
        <h1>개인정보처리방침</h1>
        <p className="lead">
          플랜티프렌즈는 서비스 제공에 필요한 최소 범위에서 개인정보를
          처리합니다.
        </p>
        <PolicyNav />
      </header>

      <article className="policy-article">
        <section className="policy-section" aria-labelledby="collect-title">
          <h2 id="collect-title">수집 항목</h2>
          <p>
            현재 회원가입 기능은 제공하지 않습니다. 문의 이메일을 보내는 경우
            회신을 위해 이메일 주소와 문의 내용이 처리될 수 있습니다.
          </p>
        </section>

        <section className="policy-section" aria-labelledby="analytics-title">
          <h2 id="analytics-title">분석·광고 도구</h2>
          <p>
            사이트 품질 개선과 광고 운영을 위해 Google Analytics, Google
            AdSense 같은 외부 도구가 쿠키 또는 유사 기술을 사용할 수 있습니다.
          </p>
        </section>

        <section className="policy-section" aria-labelledby="retention-title">
          <h2 id="retention-title">보관 및 삭제</h2>
          <p>
            문의 기록은 처리 목적이 끝난 뒤 합리적인 기간 안에 삭제합니다.
            법령상 보관이 필요한 경우 해당 기간 동안 보관할 수 있습니다.
          </p>
        </section>

        <section className="policy-section" aria-labelledby="rights-title">
          <h2 id="rights-title">이용자 권리</h2>
          <p>
            이용자는 본인 개인정보의 열람, 정정, 삭제를 요청할 수 있습니다.
            요청은 문의 페이지의 이메일로 접수합니다.
          </p>
        </section>
      </article>

      <footer className="policy-footer">
        <p>시행일 및 마지막 업데이트: {UPDATED_AT}</p>
      </footer>
    </main>
  );
}

function PolicyNav() {
  return (
    <nav className="policy-nav" aria-label="보조 페이지">
      <Link href="/about">소개</Link>
      <Link href="/contact">문의</Link>
      <Link href="/privacy">개인정보처리방침</Link>
      <Link href="/terms">이용약관</Link>
      <Link href="/disclaimer">면책 고지</Link>
    </nav>
  );
}
