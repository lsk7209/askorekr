import Link from "next/link";
import { AdsenseAd } from "@/components/adsense-ad";
import { publicEnv } from "@/env";
import type { CategoryDetail } from "@/features/categories/queries";
import type { CategoryGuide } from "./category-guides";

type Props = {
  category: CategoryDetail;
  guide: CategoryGuide;
};

export function getCategoryJsonLd(
  category: CategoryDetail,
  guide: CategoryGuide
) {
  const siteUrl = publicEnv.siteUrl;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: `${category.title} 추천 식물`,
        description: category.description ?? guide.intro,
        inLanguage: "ko-KR",
        url: `${siteUrl}/category/${category.slug}`,
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: category.plants.length,
          itemListElement: category.plants.map((plant, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: plant.koreanName,
            url: `${siteUrl}/plant/${plant.slug}`
          }))
        }
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "홈", item: `${siteUrl}/` },
          {
            "@type": "ListItem",
            position: 2,
            name: category.title,
            item: `${siteUrl}/category/${category.slug}`
          }
        ]
      },
      {
        "@type": "FAQPage",
        mainEntity: guide.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer
          }
        }))
      }
    ]
  };
}

export function CategoryGuideContent({ category, guide }: Props) {
  return (
    <>
      <section className="category-guide" aria-labelledby="category-guide-title">
        <h2 id="category-guide-title">{category.title} 선택 가이드</h2>
        <p>{guide.intro}</p>
        <div className="category-guide-grid">
          {guide.criteria.map((item) => (
            <article key={item.title} className="category-guide-card">
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="category-guide" aria-labelledby="category-tip-title">
        <h2 id="category-tip-title">관리 전 체크리스트</h2>
        <ul className="plant-checklist">
          {guide.tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </section>

      <AdsenseAd
        publisherId={publicEnv.adsensePubId}
        slot={publicEnv.adsenseSlots.contentMid}
        label={`${category.title} 본문 중간 광고`}
      />

      <section className="category-guide" aria-labelledby="category-faq-title">
        <h2 id="category-faq-title">자주 묻는 질문</h2>
        <div className="plant-faq-list">
          {guide.faqs.map((faq) => (
            <article key={faq.question} className="plant-faq-item">
              <h3>{faq.question}</h3>
              <p>{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <AdsenseAd
        publisherId={publicEnv.adsensePubId}
        slot={publicEnv.adsenseSlots.contentBottom}
        label={`${category.title} 본문 하단 광고`}
      />

      <section className="category-guide category-next-actions" aria-labelledby="category-next-title">
        <h2 id="category-next-title">내 환경에 맞는 식물 찾기</h2>
        <p>
          같은 {category.title} 안에서도 빛, 물주기, 반려동물 안전성에 따라
          적합한 식물이 달라집니다. 지역과 실내 조건을 넣어 추천 결과를 함께
          확인하세요.
        </p>
        <div className="entry-links">
          <Link href="/tools/diagnose">반려식물 진단하기</Link>
          <Link href="/about">편집 기준 보기</Link>
        </div>
      </section>
    </>
  );
}
