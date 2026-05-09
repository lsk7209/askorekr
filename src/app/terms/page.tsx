import type { Metadata } from "next";
import Link from "next/link";

const UPDATED_AT = "2026-05-10";

export const metadata: Metadata = {
  title: "이용약관",
  description:
    "플랜티프렌즈 이용 조건, 콘텐츠 사용 기준, 책임 범위를 안내합니다.",
  alternates: {
    canonical: "/terms"
  },
  openGraph: {
    title: "이용약관 | 플랜티프렌즈",
    description: "서비스 이용 조건과 콘텐츠 사용 기준을 확인하세요.",
    type: "website",
    locale: "ko_KR"
  }
};

export default function TermsPage() {
  return (
    <main className="policy-shell">
      <header className="policy-header">
        <p className="eyebrow">Terms</p>
        <h1>이용약관</h1>
        <p className="lead">
          본 약관은 플랜티프렌즈 웹사이트 이용과 콘텐츠 열람에 적용됩니다.
        </p>
        <PolicyNav />
      </header>

      <article className="policy-article">
        <section className="policy-section" aria-labelledby="service-title">
          <h2 id="service-title">서비스의 성격</h2>
          <p>
            플랜티프렌즈는 반려식물 선택과 관리에 참고할 수 있는 일반 정보를
            제공합니다. 제공 정보는 전문 자문을 대체하지 않습니다.
          </p>
        </section>

        <section className="policy-section" aria-labelledby="content-title">
          <h2 id="content-title">콘텐츠 이용</h2>
          <p>
            사이트의 텍스트, 구조, 편집물은 무단 복제, 대량 수집, 상업적 재배포를
            금지합니다. 공공 데이터 출처의 원 권리는 각 제공 기관 정책을
            따릅니다.
          </p>
        </section>

        <section className="policy-section" aria-labelledby="limit-title">
          <h2 id="limit-title">책임 제한</h2>
          <p>
            식물 생육 결과는 지역, 계절, 실내 환경, 관리 습관에 따라 달라질 수
            있습니다. 이용자는 정보를 참고 자료로 활용해야 합니다.
          </p>
        </section>

        <section className="policy-section" aria-labelledby="change-title">
          <h2 id="change-title">약관 변경</h2>
          <p>
            운영상 필요한 경우 약관을 수정할 수 있으며, 변경 내용은 본 페이지에
            게시합니다.
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
