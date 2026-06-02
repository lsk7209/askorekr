import type { Metadata } from "next";
import Link from "next/link";
import { publicEnv } from "@/env";

const UPDATED_AT = "2026-06-02";

export const metadata: Metadata = {
  title: "면책 고지",
  description:
    "플랜티프렌즈 식물 정보의 참고 목적, 안전성 한계, 전문가 상담 기준입니다.",
  alternates: {
    canonical: "/disclaimer"
  },
  openGraph: {
    title: "면책 고지 | 플랜티프렌즈",
    description: "반려식물 정보 이용 전 확인해야 할 주의사항입니다.",
    type: "website",
    locale: "ko_KR"
  }
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "플랜티프렌즈 면책 고지",
  url: `${publicEnv.siteUrl}/disclaimer`,
  description: "플랜티프렌즈 반려식물 정보의 참고 목적, 안전성 한계, 전문가 상담 기준 안내",
  inLanguage: "ko-KR",
  publisher: { "@type": "Organization", name: "플랜티프렌즈", url: publicEnv.siteUrl }
};

export default function DisclaimerPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="policy-shell">
      <header className="policy-header">
        <p className="eyebrow">Disclaimer</p>
        <h1>면책 고지</h1>
        <p className="lead">
          플랜티프렌즈의 정보는 일반 가드닝 참고용이며 의료, 수의학, 법률,
          안전 전문가의 판단을 대체하지 않습니다.
        </p>
        <PolicyNav />
      </header>

      <article className="policy-article">
        <section className="policy-section" aria-labelledby="general-title">
          <h2 id="general-title">일반 정보 고지</h2>
          <p>
            식물 관리 정보는 평균적인 환경을 기준으로 정리됩니다. 실제 생육
            상태는 온도, 습도, 광량, 배수, 병충해 여부에 따라 달라질 수
            있습니다.
          </p>
        </section>

        <section className="policy-section" aria-labelledby="safety-title">
          <h2 id="safety-title">반려동물·아이 안전성</h2>
          <p>
            안전성 점수는 참고용 분류입니다. 반려동물이나 아이가 식물을 섭취한
            것으로 의심되면 즉시 수의사, 의료기관, 독성 상담 기관에 문의하세요.
          </p>
        </section>

        <section className="policy-section" aria-labelledby="medical-title">
          <h2 id="medical-title">약효·섭취 정보 제외</h2>
          <p>
            본 사이트는 식물의 약효, 치료 효과, 섭취 방법을 권장하지 않습니다.
            건강 관련 판단은 반드시 전문가와 상의해야 합니다.
          </p>
        </section>

        <section className="policy-section" aria-labelledby="source-title">
          <h2 id="source-title">출처와 오류</h2>
          <p>
            공공 데이터와 공개 자료를 활용하지만, 원천 데이터의 누락이나 갱신
            지연이 있을 수 있습니다. 오류 제보는 문의 페이지로 접수합니다.
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
