import type { Metadata } from "next";
import Link from "next/link";

const CONTACT_EMAIL = "hello@plantyfriends.com";
const UPDATED_AT = "2026-05-10";

export const metadata: Metadata = {
  title: "문의",
  description:
    "플랜티프렌즈 문의, 오류 제보, 데이터 수정 요청 접수 방법을 안내합니다.",
  alternates: {
    canonical: "/contact"
  },
  openGraph: {
    title: "문의 | 플랜티프렌즈",
    description: "식물 정보 오류, 제휴, 운영 문의를 접수합니다.",
    type: "website",
    locale: "ko_KR"
  }
};

export default function ContactPage() {
  return (
    <main className="policy-shell">
      <header className="policy-header">
        <p className="eyebrow">Contact</p>
        <h1>문의</h1>
        <p className="lead">
          식물 정보 오류, 출처 보강, 운영 문의가 있으면 아래 이메일로 보내주세요.
        </p>
        <PolicyNav />
      </header>

      <article className="policy-article">
        <section className="policy-section" aria-labelledby="email-title">
          <h2 id="email-title">연락처</h2>
          <p>
            이메일:{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-link">
              {CONTACT_EMAIL}
            </a>
          </p>
        </section>

        <section className="policy-section" aria-labelledby="report-title">
          <h2 id="report-title">제보할 때 포함하면 좋은 내용</h2>
          <ul>
            <li>문제가 있는 페이지 주소</li>
            <li>수정이 필요한 식물명 또는 문장</li>
            <li>확인 가능한 공식 출처나 참고 자료</li>
          </ul>
        </section>

        <section className="policy-section" aria-labelledby="response-title">
          <h2 id="response-title">처리 기준</h2>
          <p>
            단순 의견은 개별 답변이 어려울 수 있습니다. 명백한 오류나 안전성
            관련 제보는 우선 검토합니다.
          </p>
        </section>
      </article>

      <footer className="policy-footer">
        <p>마지막 업데이트: {UPDATED_AT}</p>
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
