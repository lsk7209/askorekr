import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategories, getCategoryBySlug } from "@/features/categories/queries";

type Props = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 43200;
export const dynamicParams = true;

export async function generateStaticParams() {
  const categories = await getCategories();

  return categories.map((category) => ({
    slug: category.slug
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return {
      title: "카테고리를 찾을 수 없습니다"
    };
  }

  return {
    title: `${category.title} 추천 식물`,
    description:
      category.description ??
      `${category.title}에 속한 반려식물을 한국 기후 적합도 기준으로 확인하세요.`,
    alternates: {
      canonical: `/category/${category.slug}`
    },
    openGraph: {
      title: `${category.title} | 플랜티프렌즈`,
      description:
        category.description ??
        `${category.title} 식물 목록과 관리 난이도를 확인하세요.`,
      type: "website",
      locale: "ko_KR"
    }
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  return (
    <main className="category-shell">
      <section className="category-hero" aria-labelledby="category-title">
        <p className="eyebrow">Category Hub</p>
        <h1 id="category-title">{category.title}</h1>
        <p className="lead">
          {category.description ??
            "카테고리별 식물을 한국 기후 적합도 기준으로 정리했어요."}
        </p>
      </section>

      <section className="category-list" aria-label={`${category.title} 식물 목록`}>
        {category.plants.length > 0 ? (
          category.plants.map((plant) => (
            <article className="category-card" key={plant.id}>
              <div>
                <h2>{plant.koreanName}</h2>
                <p>{plant.scientificName}</p>
              </div>
              <dl>
                <div>
                  <dt>서울 기준 적합도</dt>
                  <dd>
                    {plant.climateScore}점 {plant.climateGrade}
                  </dd>
                </div>
                <div>
                  <dt>난이도</dt>
                  <dd>{plant.difficultyScore ?? "-"}점</dd>
                </div>
                <div>
                  <dt>환경</dt>
                  <dd>{formatEnvironment(plant.indoorOutdoorClass)}</dd>
                </div>
              </dl>
              <Link className="text-link" href={`/plant/${plant.slug}`}>
                도감 보기
              </Link>
            </article>
          ))
        ) : (
          <div className="empty-result">
            <h2>아직 연결된 식물이 없습니다</h2>
            <p>ETL 단계에서 카테고리 매핑이 채워지면 목록이 표시됩니다.</p>
          </div>
        )}
      </section>
    </main>
  );
}

function formatEnvironment(value: string | null) {
  if (value === "indoor") {
    return "실내";
  }
  if (value === "outdoor") {
    return "실외";
  }
  if (value === "both") {
    return "실내·실외";
  }
  return "-";
}
