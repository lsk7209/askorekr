"use client";

import Link from "next/link";
import type { DiagnoseResponse } from "@/features/diagnose/types";
import { PlantResultCard } from "./plant-result-card";

type Props = {
  result: DiagnoseResponse | null;
  selectedRegionName: string;
};

export function DiagnoseResults({ result, selectedRegionName }: Props) {
  return (
    <div className="diagnose-results" aria-live="polite">
      {result ? (
        <>
          <div className="result-heading">
            <p>{selectedRegionName}</p>
            <h2>추천 식물 {result.results.length}종</h2>
          </div>
          <Link className="result-share-link" href={result.resultPath}>
            결과 페이지 보기
          </Link>
          {result.results.length > 0 ? (
            <div className="result-list">
              {result.results.map((plant) => (
                <PlantResultCard key={plant.id} plant={plant} />
              ))}
            </div>
          ) : (
            <div className="empty-result compact">
              <h2>조건에 맞는 식물이 아직 없습니다</h2>
              <p>조건을 줄이거나 샘플 데이터가 확장된 뒤 다시 확인해 주세요.</p>
            </div>
          )}
        </>
      ) : (
        <div className="empty-result">
          <h2>지역과 환경을 선택해 주세요</h2>
          <p>샘플 데이터 기준으로 적합도 70점 이상인 식물을 보여드립니다.</p>
        </div>
      )}
    </div>
  );
}
