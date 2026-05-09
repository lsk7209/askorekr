"use client";

import Link from "next/link";
import type { DiagnoseResultPlant } from "@/features/diagnose/types";

export function PlantResultCard({ plant }: { plant: DiagnoseResultPlant }) {
  return (
    <article className="plant-result">
      <div>
        <h3>{plant.koreanName}</h3>
        <p>{plant.scientificName}</p>
      </div>
      <dl>
        <div>
          <dt>적합도</dt>
          <dd>
            {plant.climateScore}점 {plant.climateGrade}
          </dd>
        </div>
        <div>
          <dt>난이도</dt>
          <dd>{plant.difficultyScore ?? "-"}점</dd>
        </div>
        <div>
          <dt>물주기</dt>
          <dd>{plant.waterFreqDays ? `${plant.waterFreqDays}일 간격` : "-"}</dd>
        </div>
      </dl>
      <p className="recommendation-reason">{plant.recommendationReason}</p>
      <Link className="text-link" href={`/plant/${plant.slug}`}>
        도감 보기
      </Link>
    </article>
  );
}
