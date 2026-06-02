import type { Metadata } from "next";
import Link from "next/link";
import { buildOgImageUrl, OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH } from "@/seo/og";
import { publicEnv } from "@/env";

const CONTACT_EMAIL = "hello@plantyfriends.com";
const UPDATED_AT = "2026-06-02";

const ogImage = buildOgImageUrl({
  title: "플랜티프렌즈 문의",
  subtitle: "오류 제보·데이터 수정·운영 문의 접수",
  label: "Contact"
});

export const metadata: Metadata = {
  title: "문의 — 오류 제보·데이터 수정·운영 문의",
  description:
    "플랜티프렌즈 식물 정보 오류 제보, 데이터 수정 요청, 운영 문의 접수 방법을 안내합니다.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "문의 | 플랜티프렌즈",
    description: "식물 정보 오류, 제휴, 운영 문의를 접수합니다.",
    type: "website",
    locale: "ko_KR",
    images: [{ url: ogImage, width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT, alt: "플랜티프렌즈 문의" }]
  }
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ContactPage",
      name: "플랜티프렌즈 문의",
      url: `${publicEnv.siteUrl}/contact`,
      description: "플랜티프렌즈 식물 정보 오류 제보·데이터 수정 요청·운영 문의 페이지",
      inLanguage: "ko-KR",
      publisher: {
        "@type": "Organization",
        name: "플랜티프렌즈",
        url: publicEnv.siteUrl,
        email: CONTACT_EMAIL
      }
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "홈", item: `${publicEnv.siteUrl}/` },
        { "@type": "ListItem", position: 2, name: "문의", item: `${publicEnv.siteUrl}/contact` }
      ]
    }
  ]
};

export default function ContactPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
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
            <p>
              운영 시간: 월–금 오전 10시 ~ 오후 6시 (한국 시간 기준)
            </p>
          </section>

          <section className="policy-section" aria-labelledby="report-title">
            <h2 id="report-title">오류 제보 방법</h2>
            <p>제보 시 아래 내용을 포함하면 빠르게 처리할 수 있습니다.</p>
            <ul>
              <li>문제가 있는 페이지 주소 (URL)</li>
              <li>수정이 필요한 식물명 또는 문장</li>
              <li>확인 가능한 공식 출처나 참고 자료 링크</li>
            </ul>
          </section>

          <section className="policy-section" aria-labelledby="scope-title">
            <h2 id="scope-title">문의 유형</h2>
            <ul>
              <li><strong>데이터 오류</strong> — 식물 정보(온도·습도·독성 등) 수정 요청</li>
              <li><strong>콘텐츠 제안</strong> — 추가했으면 하는 식물·주제 제안</li>
              <li><strong>광고·제휴</strong> — 브랜드 협업, 광고 문의</li>
              <li><strong>기술 오류</strong> — 페이지 로딩·기능 오작동 신고</li>
            </ul>
          </section>

          <section className="policy-section" aria-labelledby="response-title">
            <h2 id="response-title">처리 기준</h2>
            <p>
              단순 의견은 개별 답변이 어려울 수 있습니다.
              <strong> 명백한 오류나 안전성 관련 제보는 우선 검토</strong>합니다.
              통상 영업일 기준 3~5일 내 회신을 목표로 합니다.
            </p>
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
