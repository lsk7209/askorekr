import type { Metadata } from "next";
import Link from "next/link";
import { buildOgImageUrl, OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH } from "@/seo/og";
import { publicEnv } from "@/env";
import { getPublishedBlogPostCount } from "@/features/blog/queries";
import { getCoverageCounts } from "@/features/plants/queries";
import { CONTACT_EMAIL } from "@/lib/site-contact";

export const revalidate = 86400;

const UPDATED_AT = "2026-10-22";
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
      email: CONTACT_EMAIL,
      publishingPrinciples: `${publicEnv.siteUrl}/about#process-title`,
      correctionsPolicy: `${publicEnv.siteUrl}/about#correction-title`,
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

export default async function AboutPage() {
  const [coverage, blogCount] = await Promise.all([
    getCoverageCounts().catch(() => null),
    getPublishedBlogPostCount().catch(() => null)
  ]);
  const fmt = (n: number) => n.toLocaleString("ko-KR");

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

          <section className="policy-section" aria-labelledby="operator-title">
            <h2 id="operator-title">운영자 정보</h2>
            <ul>
              <li>운영 주체: 플랜티프렌즈 (개인 운영, 2026년 개설)</li>
              <li>운영 형태: 광고 수익으로 운영하는 독립 정보 사이트이며, 특정 화원·쇼핑몰·브랜드와 제휴하지 않습니다.</li>
              <li>
                연락처:{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-link">{CONTACT_EMAIL}</a>
                {" · "}
                <Link href="/contact" className="text-link">문의 페이지</Link>
              </li>
            </ul>
            <p>
              운영자는 공공 데이터 수집 파이프라인 관리, 식물 상세 페이지 검수,
              블로그 글 기획·편집, 오류 제보 처리를 직접 맡고 있습니다. 모든
              글은 &lsquo;플랜티프렌즈 편집팀&rsquo; 명의로 게시하며, 게시 책임은
              운영자에게 있습니다.
            </p>
          </section>

          <section className="policy-section" aria-labelledby="process-title">
            <h2 id="process-title">콘텐츠 작성·검수 원칙</h2>
            <ol>
              <li>온도·습도·광량·물주기·독성 같은 수치와 안전 정보는 위 공공 기관 자료를 원출처로 삼습니다.</li>
              <li>출처마다 값이 다르면 더 보수적인 값(반려동물 독성은 &lsquo;주의&rsquo; 쪽)을 우선합니다.</li>
              <li>제품 구매를 유도하는 글, 확인되지 않은 효능·치료 주장은 게시하지 않습니다.</li>
              <li>글에는 게시일을 표시하며, 계절·데이터 변경으로 내용을 고치면 수정일을 갱신합니다.</li>
            </ol>
          </section>

          <section className="policy-section" aria-labelledby="correction-title">
            <h2 id="correction-title">오류 정정 정책</h2>
            <p>
              잘못된 정보를 발견하면 <Link href="/contact" className="text-link">문의 페이지</Link>의
              안내에 따라 제보해 주세요. 반려동물·어린이 안전과 관련된 제보는
              다른 문의보다 먼저 확인하며, 사실관계가 확인되면 해당 페이지를
              수정합니다.
            </p>
          </section>

          <section className="policy-section" aria-labelledby="coverage-title">
            <h2 id="coverage-title">콘텐츠 현황</h2>
            <ul>
              {coverage && coverage.plants > 0 && (
                <li>반려식물 상세 가이드: <strong>{fmt(coverage.plants)}종</strong> (기후 적합도·난이도·안전성·꽃말 포함)</li>
              )}
              {blogCount !== null && blogCount > 0 && (
                <li>가드닝 블로그 글: <strong>{fmt(blogCount)}개</strong> (키우기 가이드·병충해·계절 관리 등)</li>
              )}
              {coverage && coverage.regions > 0 && (
                <li>기후 데이터 적용 지역: 전국 <strong>{fmt(coverage.regions)}개</strong> 시군구</li>
              )}
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
