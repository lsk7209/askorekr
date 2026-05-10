import Link from "next/link";
import type { RelatedPlant } from "@/features/plants/related-queries";
import { formatDifficulty, formatWaterCycle } from "./plant-formatters";

type Props = {
  plants: RelatedPlant[];
};

export function PlantRelatedLinks({ plants }: Props) {
  if (plants.length === 0) {
    return null;
  }

  const category = plants[0];

  return (
    <section className="plant-section" aria-labelledby="related-plants-title">
      <div className="section-heading-row">
        <div>
          <p className="eyebrow">Related Guides</p>
          <h2 id="related-plants-title">같이 비교할 만한 식물</h2>
        </div>
        <Link className="text-link" href={`/category/${category.categorySlug}`}>
          {category.categoryTitle} 전체 보기
        </Link>
      </div>
      <div className="related-plant-grid">
        {plants.map((plant) => (
          <Link
            className="related-plant-card"
            href={`/plant/${plant.slug}`}
            key={plant.slug}
          >
            <span>{plant.koreanName}</span>
            <small>{plant.scientificName}</small>
            <dl>
              <div>
                <dt>기후 적합도</dt>
                <dd>
                  {plant.climateScore}점 {plant.climateGrade}
                </dd>
              </div>
              <div>
                <dt>관리 난이도</dt>
                <dd>{formatDifficulty(plant.difficultyScore)}</dd>
              </div>
              <div>
                <dt>물주기</dt>
                <dd>{formatWaterCycle(plant.waterFreqDays)}</dd>
              </div>
            </dl>
          </Link>
        ))}
      </div>
    </section>
  );
}
