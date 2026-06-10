import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { safeISODate } from "@/utils/date";
import {
  getPlantBySlug,
  getPlantSitemapItems,
  getPrimaryPlantImage,
} from "@/features/plants/queries";
import { getRelatedPlants } from "@/features/plants/related-queries";
import { getBlogPostsForPlant } from "@/features/blog/queries";
import {
  formatWaterGuide,
  formatLightGuide,
  formatTemperatureGuide,
  formatHumidityGuide,
} from "./plant-formatters";
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
    slug: plant.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const plant = await getPlantBySlug(slug);

  if (!plant) {
    return {
      title: "식물 정보를 찾을 수 없습니다",
    };
  }

  const titleHighlights: string[] = [];
  if (plant.difficultyScore !== null) {
    titleHighlights.push(
      plant.difficultyScore <= 35
        ? "초보 OK"
        : plant.difficultyScore <= 65
          ? "중급"
          : "고급",
    );
  }
  if (plant.waterFreqDays !== null)
    titleHighlights.push(`물주기 ${plant.waterFreqDays}일`);
  const titleSuffix =
    titleHighlights.length > 0 ? ` | ${titleHighlights.join(" · ")}` : "";
  const title = `${plant.koreanName} 키우기 가이드${titleSuffix}`;

  const metaParts: string[] = [];
  if (plant.waterFreqDays !== null)
    metaParts.push(`물주기 ${plant.waterFreqDays}일 간격`);
  if (plant.difficultyScore !== null) {
    const diff =
      plant.difficultyScore <= 35
        ? "초보 적합"
        : plant.difficultyScore <= 65
          ? "중급"
          : "고급";
    metaParts.push(`난이도 ${diff}`);
  }
  const hasPetData =
    plant.petSafetyScoreDog !== null || plant.petSafetyScoreCat !== null;
  if (hasPetData) {
    const petSafe =
      (plant.petSafetyScoreDog ?? 0) >= 4 &&
      (plant.petSafetyScoreCat ?? 0) >= 4;
    metaParts.push(petSafe ? "반려동물 안전" : "반려동물 독성 주의");
  }
  const dataLead = metaParts.length > 0 ? `${metaParts.join(" · ")}. ` : "";
  const description =
    `${dataLead}${plant.koreanName} 실전 키우기 가이드 — 서울 적합도 ${plant.climateScore}점, 빛·온도·습도 관리 데이터를 한눈에 확인하세요.`.slice(
      0,
      160,
    );
  const image = buildOgImageUrl({
    title,
    subtitle: description,
    label: "Plant Guide",
  });

  return {
    title,
    description,
    alternates: {
      canonical: `/plant/${plant.slug}`,
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
          alt: `${plant.koreanName} 키우기 가이드 대표 이미지`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

function buildPlantLead(
  plant: Awaited<ReturnType<typeof getPlantBySlug>> & object,
): string {
  const d = plant.difficultyScore;
  const diffLabel = !d
    ? "관리 정보를 확인해야 하는"
    : d <= 35
      ? "초보자도 쉽게 키울 수 있는"
      : d <= 65
        ? "어느 정도 경험이 있으면 잘 자라는"
        : "세심한 관리가 필요한";
  const climate = `서울 기준 기후 적합도 ${plant.climateScore}점(${plant.climateGrade})`;
  const water = plant.waterFreqDays
    ? `물주기는 약 ${plant.waterFreqDays}일 간격이 기준이며,`
    : "물주기는 흙 상태 기준으로 확인하며,";
  const pet =
    (plant.petSafetyScoreDog ?? 0) >= 4 && (plant.petSafetyScoreCat ?? 0) >= 4
      ? "반려동물 안전도 높아 함께 키우기 좋습니다."
      : "반려동물 독성 여부를 먼저 확인해야 합니다.";
  return `${diffLabel} 식물로, ${climate}입니다. ${water} ${pet}`;
}

export default async function PlantDetailPage({ params }: Props) {
  const { slug } = await params;
  const plant = await getPlantBySlug(slug);

  if (!plant) {
    notFound();
  }

  const faqs = getPlantFaqs(plant);
  const [relatedPlants, relatedBlogPosts, primaryImage] = await Promise.all([
    getRelatedPlants(plant),
    getBlogPostsForPlant(2).catch(() => []),
    getPrimaryPlantImage(plant.id).catch(() => null),
  ]);
  const siteUrl = publicEnv.siteUrl;
  const ogImageGenerated = buildOgImageUrl({
    title: `${plant.koreanName} 키우기 가이드`,
    subtitle: `서울 적합도 ${plant.climateScore}점 · ${plant.koreanName} 관리법`,
    label: "Plant Guide",
  });
  // 실제 식물 사진이 있으면 OG 이미지로 우선 사용
  const ogImageAbs = primaryImage?.url
    ? primaryImage.url
    : new URL(ogImageGenerated, siteUrl).toString();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: `${plant.koreanName} 키우기 가이드`,
        description: `${plant.koreanName}(${plant.scientificName}) 서울 기준 기후 적합도 ${plant.climateScore}점. 물주기, 빛, 온도, 반려동물 안전성 데이터 기반 실전 관리법.`,
        dateModified: safeISODate(plant.updatedAt),
        inLanguage: "ko-KR",
        url: `${siteUrl}/plant/${plant.slug}`,
        image: [
          {
            "@type": "ImageObject",
            url: ogImageAbs,
            width: OG_IMAGE_WIDTH,
            height: OG_IMAGE_HEIGHT,
          },
        ],
        author: { "@type": "Organization", name: "플랜티프렌즈 편집팀" },
        publisher: {
          "@type": "Organization",
          name: "플랜티프렌즈",
          url: siteUrl,
          logo: { "@type": "ImageObject", url: `${siteUrl}/icon.svg` },
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "홈", item: `${siteUrl}/` },
          {
            "@type": "ListItem",
            position: 2,
            name: "식물 진단",
            item: `${siteUrl}/tools/diagnose`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: plant.koreanName,
            item: `${siteUrl}/plant/${plant.slug}`,
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      },
      {
        "@type": "HowTo",
        name: `${plant.koreanName} 키우기`,
        description: `한국 생활 환경에서 ${plant.koreanName}을 올바르게 관리하는 방법`,
        inLanguage: "ko-KR",
        step: [
          {
            "@type": "HowToStep",
            position: 1,
            name: "빛 관리",
            text: formatLightGuide(plant),
          },
          {
            "@type": "HowToStep",
            position: 2,
            name: "물주기",
            text: formatWaterGuide(plant),
          },
          {
            "@type": "HowToStep",
            position: 3,
            name: "온도 관리",
            text: formatTemperatureGuide(plant),
          },
          {
            "@type": "HowToStep",
            position: 4,
            name: "습도 관리",
            text: formatHumidityGuide(plant),
          },
        ],
      },
    ],
  };

  return (
    <main className="plant-shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav className="breadcrumb" aria-label="경로">
        <Link href="/">홈</Link>
        <span aria-hidden="true">/</span>
        <Link href="/tools/diagnose">식물 진단</Link>
        <span aria-hidden="true">/</span>
        <span>{plant.koreanName}</span>
      </nav>

      <article className="plant-article">
        <header className="plant-header">
          <p className="eyebrow">Plant Guide</p>
          <h1>{plant.koreanName}</h1>
          <p className="lead">{buildPlantLead(plant)}</p>
        </header>

        <PlantGuideContent
          plant={plant}
          faqs={faqs}
          relatedPlants={relatedPlants}
          relatedBlogPosts={relatedBlogPosts}
          primaryImage={primaryImage}
        />
      </article>
    </main>
  );
}
