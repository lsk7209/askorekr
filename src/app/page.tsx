import Link from "next/link";
import { AdsenseAd } from "@/components/adsense-ad";
import { publicEnv } from "@/env";

const primaryLinks = [
  { href: "/tools/diagnose", label: "반려식물 진단 시작" },
  { href: "/category/indoor-foliage", label: "실내 관엽식물 보기" },
  { href: "/category/herbs", label: "허브 가이드 보기" }
] as const;

const guideSections = [
  {
    title: "우리 집 환경부터 확인",
    body: "식물 이름보다 먼저 실내·베란다·마당 환경, 빛의 양, 관리 가능한 시간을 확인해야 실패 확률을 줄일 수 있습니다."
  },
  {
    title: "반려동물과 아이 안전성 점검",
    body: "강아지, 고양이, 어린 자녀가 있는 집은 독성 기록과 접촉 가능성을 함께 봐야 합니다. 안전 점수는 추천 순위에 반영됩니다."
  },
  {
    title: "한국 기후 기준으로 비교",
    body: "해외 가이드의 평균 온도만 보지 않고 서울 기준 기후 적합도와 계절 관리 부담을 함께 정리합니다."
  }
] as const;

const categoryLinks = [
  {
    href: "/category/indoor-foliage",
    title: "실내 관엽식물",
    body: "간접광, 실내 습도, 관리 난이도를 기준으로 거실과 방에 둘 식물을 비교합니다."
  },
  {
    href: "/category/herbs",
    title: "허브",
    body: "향, 채광, 물주기 주기를 함께 보고 주방·베란다 재배에 맞는 허브를 찾습니다."
  },
  {
    href: "/category/balcony-trees",
    title: "베란다 나무",
    body: "공간과 계절 온도 변화를 고려해 베란다에서 키울 수 있는 나무형 식물을 살펴봅니다."
  }
] as const;

const faqs = [
  {
    question: "초보자는 어떤 기준으로 식물을 고르면 좋나요?",
    answer:
      "물을 자주 주지 않아도 되고, 간접광에서도 버티며, 독성 기록이 낮은 식물부터 고르는 편이 안전합니다."
  },
  {
    question: "반려동물이 있으면 식물을 키우면 안 되나요?",
    answer:
      "모든 식물이 위험한 것은 아닙니다. 다만 고양이와 강아지에게 알려진 독성 여부를 확인하고, 접근하기 어려운 위치에 두는 것이 좋습니다."
  },
  {
    question: "플랜티프렌즈의 정보는 전문가 진단인가요?",
    answer:
      "아닙니다. 공개 자료와 편집 기준을 바탕으로 정리한 생활 가이드이며, 섭취·중독·알레르기 의심 상황은 전문가 상담이 필요합니다."
  }
] as const;

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: "플랜티프렌즈",
      url: publicEnv.siteUrl,
      inLanguage: "ko-KR",
      description:
        "한국 생활 환경에 맞는 반려식물 선택을 돕는 데이터 기반 가드닝 가이드"
    },
    {
      "@type": "FAQPage",
      mainEntity: faqs.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer
        }
      }))
    }
  ]
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header className="home-header">
        <nav className="home-nav" aria-label="주요 메뉴">
          <Link href="/">플랜티프렌즈</Link>
          <Link href="/tools/diagnose">진단</Link>
          <Link href="/blog">블로그</Link>
          <Link href="/about">소개</Link>
          <Link href="/contact">문의</Link>
        </nav>
      </header>

      <main className="site-shell">
        <section className="hero" aria-labelledby="home-title">
          <p className="eyebrow">Korean Plant Guide</p>
          <h1 id="home-title">한국 집에 맞는 반려식물 선택 가이드</h1>
          <p className="lead">
            플랜티프렌즈는 지역, 실내 환경, 빛, 관리 시간, 반려동물 안전성을
            함께 비교해 오래 키울 수 있는 식물을 찾도록 돕습니다.
          </p>
          <div className="entry-links" aria-label="주요 기능">
            {primaryLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </div>
        </section>

        <AdsenseAd
          publisherId={publicEnv.adsensePubId}
          slot={publicEnv.adsenseSlots.homeTop}
          label="홈 상단 광고"
        />

        <section className="home-band" aria-labelledby="guide-title">
          <div className="home-section-inner">
            <h2 id="guide-title">식물 선택 전 확인할 것</h2>
            <div className="info-grid">
              {guideSections.map((item) => (
                <article key={item.title} className="info-card">
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <AdsenseAd
          publisherId={publicEnv.adsensePubId}
          slot={publicEnv.adsenseSlots.contentMid}
          label="홈 중간 광고"
        />

        <section className="home-section-inner" aria-labelledby="category-title">
          <h2 id="category-title">주제별 가이드</h2>
          <div className="category-link-list">
            {categoryLinks.map((item) => (
              <Link key={item.href} href={item.href} className="category-link">
                <span>{item.title}</span>
                <p>{item.body}</p>
              </Link>
            ))}
          </div>
        </section>

        <AdsenseAd
          publisherId={publicEnv.adsensePubId}
          slot={publicEnv.adsenseSlots.contentBottom}
          label="홈 하단 광고"
        />

        <section className="home-band" aria-labelledby="source-title">
          <div className="home-section-inner split-section">
            <div>
              <h2 id="source-title">편집 기준</h2>
              <p>
                식물 기본 정보, 관리 난이도, 독성 메모, 기후 적합도는 공개 자료와
                내부 편집 기준을 바탕으로 정리합니다. 페이지는 새 데이터가
                들어오면 갱신되며, 확정되지 않은 의학적 효능이나 치료 효과는
                안내하지 않습니다.
              </p>
            </div>
            <div>
              <h2>검수 전 안내</h2>
              <p>
                식물 섭취, 반려동물 중독 의심, 알레르기 반응처럼 안전과 관련된
                문제는 즉시 수의사나 의료 전문가에게 확인해야 합니다.
              </p>
            </div>
          </div>
        </section>

        <section className="home-section-inner" aria-labelledby="faq-title">
          <h2 id="faq-title">자주 묻는 질문</h2>
          <div className="faq-list">
            {faqs.map((item) => (
              <article key={item.question} className="faq-item">
                <h3>{item.question}</h3>
                <p>{item.answer}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="home-footer">
        <nav aria-label="사이트 정보">
          <Link href="/about">소개</Link>
          <Link href="/privacy">개인정보처리방침</Link>
          <Link href="/terms">이용약관</Link>
          <Link href="/disclaimer">면책 고지</Link>
          <Link href="/contact">문의</Link>
        </nav>
      </footer>
    </>
  );
}
