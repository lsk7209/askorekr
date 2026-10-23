"use client";

import Link from "next/link";
import type { DiagnoseResponse } from "@/features/diagnose/types";
import { PlantResultCard } from "./plant-result-card";

type Props = {
  result: DiagnoseResponse | null;
  selectedRegionName: string;
  isPending: boolean;
};

export function DiagnoseResults({ result, selectedRegionName, isPending }: Props) {
  return (
    <div className="diagnose-results" aria-live="polite" aria-busy={isPending}>
      {isPending ? (
        <div className="empty-result">
          <h2>함께 살 식물을 찾고 있어요</h2>
          <p>선택한 환경과 관리 조건을 비교하고 있습니다.</p>
        </div>
      ) : result ? (
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
              <p>빛이나 관리 시간 조건을 조정해 다시 확인해 주세요. 반려동물·아이 안전 조건은 필요한 대로 유지해 주세요.</p>
            </div>
          )}
        </>
      ) : (
        <div className="empty-result">
          <h2>지역과 환경을 선택해 주세요</h2>
          <p>지역 기후 적합도 70점 이상인 식물 중 선택한 조건에 맞는 후보를 보여드려요.</p>
        </div>
      )}
    </div>
  );
}
