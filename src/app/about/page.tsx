import type { Metadata } from "next";
import Link from "next/link";
import { buildOgImageUrl, OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH } from "@/seo/og";
import { publicEnv } from "@/env";

const UPDATED_AT = "2026-06-02";
const ogImage = buildOgImageUrl({
  title: "플랜티프렌즈 소개",
  subtitle: "한국 기후·생활 환경 기반 반려식물 데이터 가이드",
  label: "About"
});

export const metadata: Metadata = {
  title: "사이트 소개 — 플랜티프렌즈 운영 목적·데이터 출처",
  description:
    "플랜티프렌즈는 국립수목원·국립생물자원관·농사로 공공 데이터를 바탕으로 한국 기후·생활 환경에 맞는 반려식물 가이드를 제공합니다.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "사이트 소개 | 플랜티프렌즈",
    description: "한국 기후 적합도와 생활 환경 기반 반려식물 데이터 가이드를 운영하는 플랜티프렌즈 소개 페이지입니다.",
    type: "website",
    locale: "ko_KR",
    images: [{ url: ogImage, width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT, alt: "플랜티프렌즈 소개" }]
  }
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${publicEnv.siteUrl}/#organization`,
      name: "플랜티프렌즈",
      url: publicEnv.siteUrl,
      logo: { "@type": "ImageObject", url: `${publicEnv.siteUrl}/icon.svg` },
      description: "한국 기후 적합도와 생활 환경에 맞는 반려식물 정보를 공공 데이터 기반으로 제공하는 가드닝 가이드 사이트",
      foundingDate: "2026",
      areaServed: "KR",
      inLanguage: "ko-KR",
      sameAs: [`${publicEnv.siteUrl}/about`],
      knowsAbout: ["반려식물", "가드닝", "실내 식물 관리", "한국 기후 적합도", "반려동물 안전 식물"]
    },
    {
      "@type": "AboutPage",
      name: "플랜티프렌즈 소개",
      url: `${publicEnv.siteUrl}/about`,
      description: "플랜티프렌즈의 운영 목적, 데이터 출처, 편집 기준 안내 페이지",
      inLanguage: "ko-KR",
      publisher: { "@id": `${publicEnv.siteUrl}/#organization` }
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "홈", item: `${publicEnv.siteUrl}/` },
        { "@type": "ListItem", position: 2, name: "소개", item: `${publicEnv.siteUrl}/about` }
      ]
    }
  ]
};

const DATA_SOURCES = [
  { name: "국립수목원 (KNA)", desc: "식물 학명·분류·생태 정보", url: "https://www.kna.go.kr" },
  { name: "국립생물자원관 (NIBR)", desc: "국가 생물종 목록·식별 데이터", url: "https://www.nibr.go.kr" },
  { name: "농사로 (RDA)", desc: "재배 관리·병충해 정보", url: "https://www.nongsaro.go.kr" },
  { name: "기상청 (KMA)", desc: "지역별 월 평균 기온·습도 기후 데이터", url: "https://www.weather.go.kr" }
];

export default function AboutPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="policy-shell">
        <header className="policy-header">
          <p className="eyebrow">About</p>
          <h1>사이트 소개</h1>
          <p className="lead">
            플랜티프렌즈는 국공립 기관 공공 데이터를 바탕으로 한국 기후와
            생활 환경에 맞는 반려식물 선택을 돕는 가드닝 가이드입니다.
          </p>
          <PolicyNav />
        </header>

        <article className="policy-article">
          <section className="policy-section" aria-labelledby="mission-title">
            <h2 id="mission-title">운영 목적</h2>
            <p>
              식물 이름만 나열하는 도감이 아니라, 지역 기후 적합도·관리 난이도·
              반려동물·아이 안전성·꽃말을 한 페이지에서 비교할 수 있도록 정리합니다.
              서울·경기·부산 등 지역별 기후 데이터를 적용해 한국 아파트 생활에 맞는
              현실적인 관리 정보를 제공하는 것이 목표입니다.
            </p>
          </section>

          <section className="policy-section" aria-labelledby="source-title">
            <h2 id="source-title">데이터 출처</h2>
            <p>아래 공공 기관 데이터를 기반으로 편집·가공합니다.</p>
            <ul>
              {DATA_SOURCES.map((src) => (
                <li key={src.name}>
                  <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-link">
                    {src.name}
                  </a>
                  {" — "}{src.desc}
                </li>
              ))}
            </ul>
            <p>
              각 식물 페이지의 수치(온도·습도·광량·물주기)는 공개 자료의 평균값이며,
              품종·재배 환경에 따라 달라질 수 있는 <em>참고값</em>입니다.
            </p>
          </section>

          <section className="policy-section" aria-labelledby="editorial-title">
            <h2 id="editorial-title">편집 기준</h2>
            <p>
              플랜티프렌즈 편집팀은 공공 데이터 수집·검수·가공을 담당합니다.
              의료적 효능, 섭취 권장, 치료 효과처럼 <strong>전문가 판단이 필요한 내용은
              다루지 않습니다</strong>. 반려동물 안전 점수는 ASPCA 독성 목록과
              국내 수의 참고 자료를 바탕으로 분류하며, 실제 섭취 반응을 보증하지
              않습니다.
            </p>
          </section>

          <section className="policy-section" aria-labelledby="coverage-title">
            <h2 id="coverage-title">콘텐츠 현황</h2>
            <ul>
              <li>반려식물 데이터: <strong>474종</strong> (기후 적합도·난이도·안전성·꽃말 포함)</li>
              <li>가드닝 블로그 글: <strong>600개 이상</strong> (키우기가이드·병충해·계절관리 등)</li>
              <li>기후 데이터 적용 지역: 전국 <strong>250개 이상</strong> 시군구</li>
            </ul>
          </section>
        </article>

        <footer className="policy-footer">
          <p>마지막 업데이트: {UPDATED_AT}</p>
        </footer>
      </main>
    </>
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
