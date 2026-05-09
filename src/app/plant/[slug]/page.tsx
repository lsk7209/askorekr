import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlantBySlug } from "@/features/plants/queries";
import { getPlantFaqs, PlantGuideContent } from "./plant-detail-content";

type Props = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 86400;
export const dynamicParams = true;

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const plant = await getPlantBySlug(slug);

  if (!plant) {
    return {
      title: "식물 정보를 찾을 수 없습니다"
    };
  }

  return {
    title: `${plant.koreanName} 키우기 가이드`,
    description: `${plant.koreanName}의 한국 기후 적합도, 난이도, 물주기, 광량, 반려동물 안전성 정보를 확인하세요.`,
    alternates: {
      canonical: `/plant/${plant.slug}`
    },
    openGraph: {
      title: `${plant.koreanName} | 플랜티프렌즈`,
      description: `${plant.koreanName}의 데이터 기반 반려식물 정보를 확인하세요.`,
      type: "article",
      locale: "ko_KR"
    }
  };
}

export default async function PlantDetailPage({ params }: Props) {
  const { slug } = await params;
  const plant = await getPlantBySlug(slug);

  if (!plant) {
    notFound();
  }

  const faqs = getPlantFaqs(plant);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: `${plant.koreanName} 키우기 가이드`,
        description: `${plant.koreanName}의 한국 기후 적합도와 기본 관리 정보를 정리한 페이지입니다.`,
        dateModified: plant.updatedAt.toISOString(),
        author: {
          "@type": "Organization",
          name: "플랜티프렌즈 편집팀"
        }
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
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

  return (
    <main className="plant-shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav className="breadcrumb" aria-label="경로">
        <Link href="/tools/diagnose">진단 도구</Link>
        <span aria-hidden="true">/</span>
        <span>{plant.koreanName}</span>
      </nav>

      <article className="plant-article">
        <header className="plant-header">
          <p className="eyebrow">Plant Guide</p>
          <h1>{plant.koreanName}</h1>
          <p className="lead">
            {plant.koreanName}는 한국 생활 환경에서 기후 적합도, 빛, 물주기,
            안전성을 함께 확인해야 오래 키울 수 있는 반려식물입니다.
          </p>
        </header>

        <PlantGuideContent plant={plant} faqs={faqs} />
      </article>
    </main>
  );
}
