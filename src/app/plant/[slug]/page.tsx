import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlantBySlug } from "@/features/plants/queries";

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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${plant.koreanName} 키우기 가이드`,
    description: `${plant.koreanName}의 한국 기후 적합도와 기본 관리 정보를 정리한 페이지입니다.`,
    dateModified: plant.updatedAt.toISOString(),
    author: {
      "@type": "Organization",
      name: "플랜티프렌즈 편집팀"
    }
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
            {plant.koreanName}는 한국 생활 환경에서 적합도와 관리 부담을 함께
            확인해야 하는 반려식물이에요.
          </p>
        </header>

        <section className="quick-facts" aria-labelledby="quick-facts-title">
          <h2 id="quick-facts-title">Quick Facts</h2>
          <dl>
            <Fact label="학명" value={plant.scientificName} />
            <Fact
              label="과·속"
              value={`${plant.family ?? "-"} / ${plant.genus ?? "-"}`}
            />
            <Fact
              label="서울 기준 적합도"
              value={`${plant.climateScore}점 ${plant.climateGrade}`}
            />
            <Fact
              label="관리 난이도"
              value={plant.difficultyScore ? `${plant.difficultyScore}점` : "-"}
            />
            <Fact
              label="물주기"
              value={plant.waterFreqDays ? `${plant.waterFreqDays}일 간격` : "-"}
            />
            <Fact
              label="광량"
              value={formatRange(plant.lightLuxMin, plant.lightLuxMax, "lux")}
            />
            <Fact
              label="온도"
              value={formatRange(plant.tempMinC, plant.tempMaxC, "℃")}
            />
            <Fact
              label="습도"
              value={formatRange(plant.humidityMinPct, plant.humidityMaxPct, "%")}
            />
          </dl>
        </section>

        <section className="plant-section" aria-labelledby="safety-title">
          <h2 id="safety-title">반려동물·아이 안전성</h2>
          <p>
            강아지 {formatScore(plant.petSafetyScoreDog)}, 고양이{" "}
            {formatScore(plant.petSafetyScoreCat)}, 어린 자녀{" "}
            {formatScore(plant.childSafetyScore)} 기준으로 기록되어 있어요.
          </p>
          {plant.toxicityNotes ? <p>{plant.toxicityNotes}</p> : null}
        </section>

        <section className="plant-section" aria-labelledby="meaning-title">
          <h2 id="meaning-title">꽃말·문화 기록</h2>
          <p>
            {plant.flowerMeaningPrimary
              ? `${plant.koreanName}의 대표 의미는 "${plant.flowerMeaningPrimary}"으로 정리되어 있어요.`
              : "아직 정리된 꽃말·문화 기록이 없습니다."}
          </p>
        </section>
      </article>
    </main>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function formatRange(
  min: number | null,
  max: number | null,
  unit: string
) {
  if (min === null || max === null) {
    return "-";
  }

  return `${min.toLocaleString("ko-KR")}~${max.toLocaleString("ko-KR")}${unit}`;
}

function formatScore(score: number | null) {
  return score === null ? "-" : `${score}점`;
}
