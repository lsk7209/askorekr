import type { Metadata } from "next";
import Link from "next/link";

const UPDATED_AT = "2026-05-10";

export const metadata: Metadata = {
  title: "사이트 소개",
  description:
    "플랜티프렌즈의 운영 목적, 데이터 출처, 편집 기준을 안내합니다.",
  alternates: {
    canonical: "/about"
  },
  openGraph: {
    title: "사이트 소개 | 플랜티프렌즈",
    description:
      "한국 생활 환경에 맞는 반려식물 정보를 데이터 기반으로 정리합니다.",
    type: "website",
    locale: "ko_KR"
  }
};

export default function AboutPage() {
  return (
    <main className="policy-shell">
      <header className="policy-header">
        <p className="eyebrow">About</p>
        <h1>사이트 소개</h1>
        <p className="lead">
          플랜티프렌즈는 한국 기후와 생활 환경에 맞는 반려식물 선택을 돕는
          데이터 기반 가드닝 정보 사이트입니다.
        </p>
        <PolicyNav />
      </header>

      <article className="policy-article">
        <section className="policy-section" aria-labelledby="mission-title">
          <h2 id="mission-title">운영 목적</h2>
          <p>
            식물 이름만 나열하는 도감이 아니라, 지역 기후 적합도와 관리 난이도,
            반려동물·아이 안전성, 꽃말 정보를 함께 확인할 수 있도록 정리합니다.
          </p>
        </section>

        <section className="policy-section" aria-labelledby="source-title">
          <h2 id="source-title">데이터 출처</h2>
          <p>
            식물 기본 정보는 공공 데이터와 공개 자료를 바탕으로 정리하며,
            국립수목원, 국립생물자원관, 농사로, 기상 자료 등 신뢰 가능한 출처를
            우선합니다.
          </p>
        </section>

        <section className="policy-section" aria-labelledby="editorial-title">
          <h2 id="editorial-title">편집 기준</h2>
          <p>
            본문은 플랜티프렌즈 편집 기준에 따라 검토합니다. 의료적 효능,
            섭취 권장, 치료 효과처럼 전문가 판단이 필요한 내용은 다루지
            않습니다.
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
