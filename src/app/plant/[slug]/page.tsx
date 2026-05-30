import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlantBySlug, getPlantSitemapItems } from "@/features/plants/queries";
import { getRelatedPlants } from "@/features/plants/related-queries";
import { buildOgImageUrl, OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH } from "@/seo/og";
import { publicEnv } from "@/env";
import { getPlantFaqs, PlantGuideContent } from "./plant-detail-content";

type Props = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 86400;
export const dynamicParams = true;

export async function generateStaticParams() {
  const plants = await getPlantSitemapItems().catch(() => []);

  return plants.map((plant) => ({
    slug: plant.slug
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const plant = await getPlantBySlug(slug);

  if (!plant) {
    return {
      title: "식물 정보를 찾을 수 없습니다"
    };
  }

  const title = `${plant.koreanName} 키우기 가이드`;

  const metaParts: string[] = [];
  if (plant.waterFreqDays !== null) metaParts.push(`물주기 ${plant.waterFreqDays}일 간격`);
  if (plant.difficultyScore !== null) {
    const diff = plant.difficultyScore <= 2 ? "초보 적합" : plant.difficultyScore <= 3 ? "중급" : "고급";
    metaParts.push(`난이도 ${diff}`);
  }
  const hasPetData = plant.petSafetyScoreDog !== null || plant.petSafetyScoreCat !== null;
  if (hasPetData) {
    const petSafe = (plant.petSafetyScoreDog ?? 0) >= 4 && (plant.petSafetyScoreCat ?? 0) >= 4;
    metaParts.push(petSafe ? "반려동물 안전" : "반려동물 독성 주의");
  }
  const dataStr = metaParts.length > 0 ? ` ${metaParts.join(" · ")}.` : "";
  const description = `${plant.koreanName} 키우기 완전 가이드.${dataStr} 한국 기후 적합도, 광량, 온도, 습도 기준 실전 관리법을 데이터로 확인하세요.`.slice(0, 160);
  const image = buildOgImageUrl({
    title,
    subtitle: description,
    label: "Plant Guide"
  });

  return {
    title,
    description,
    alternates: {
      canonical: `/plant/${plant.slug}`
    },
    openGraph: {
      title: `${plant.koreanName} | 플랜티프렌즈`,
      description,
      type: "article",
      locale: "ko_KR",
      images: [
        {
          url: image,
          width: OG_IMAGE_WIDTH,
          height: OG_IMAGE_HEIGHT,
          alt: `${plant.koreanName} 키우기 가이드 대표 이미지`
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image]
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
  const relatedPlants = await getRelatedPlants(plant);
  const siteUrl = publicEnv.siteUrl;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: `${plant.koreanName} 키우기 가이드`,
        description: `${plant.koreanName}의 한국 기후 적합도와 기본 관리 정보를 정리한 페이지입니다.`,
        dateModified: plant.updatedAt.toISOString(),
        inLanguage: "ko-KR",
        url: `${siteUrl}/plant/${plant.slug}`,
        author: {
          "@type": "Organization",
          name: "플랜티프렌즈 편집팀"
        },
        publisher: {
          "@type": "Organization",
          name: "플랜티프렌즈",
          url: siteUrl,
          logo: { "@type": "ImageObject", url: `${siteUrl}/icon.svg` }
        }
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "홈", item: `${siteUrl}/` },
          {
            "@type": "ListItem",
            position: 2,
            name: "식물 찾기",
            item: `${siteUrl}/`
          },
          {
            "@type": "ListItem",
            position: 3,
            name: plant.koreanName,
            item: `${siteUrl}/plant/${plant.slug}`
          }
        ]
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

        <PlantGuideContent
          plant={plant}
          faqs={faqs}
          relatedPlants={relatedPlants}
        />
      </article>
    </main>
  );
}
