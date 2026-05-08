"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import type {
  DiagnoseResponse,
  DiagnoseResultPlant,
  Environment
} from "@/features/diagnose/types";

type RegionOption = {
  code: string;
  sido: string;
  sigungu: string;
};

type Props = {
  regions: RegionOption[];
};

const environmentLabels: Record<Environment, string> = {
  indoor: "실내",
  outdoor: "실외",
  both: "둘 다"
};

export function DiagnoseQuickForm({ regions }: Props) {
  const [regionCode, setRegionCode] = useState(regions[0]?.code ?? "");
  const [environment, setEnvironment] = useState<Environment>("indoor");
  const [result, setResult] = useState<DiagnoseResponse | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const selectedRegionName = useMemo(() => {
    const region = regions.find((item) => item.code === regionCode);
    return region ? `${region.sido} ${region.sigungu}` : "";
  }, [regionCode, regions]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    startTransition(async () => {
      const response = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regionCode, environment })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "진단 결과를 불러오지 못했어요.");
        setResult(null);
        return;
      }

      setResult(data);
    });
  }

  return (
    <section className="tool-grid" aria-label="진단 입력과 결과">
      <form className="diagnose-form" onSubmit={handleSubmit}>
        <label>
          <span>지역</span>
          <select
            value={regionCode}
            onChange={(event) => setRegionCode(event.target.value)}
          >
            {regions.map((region) => (
              <option key={region.code} value={region.code}>
                {region.sido} {region.sigungu}
              </option>
            ))}
          </select>
        </label>

        <fieldset>
          <legend>환경</legend>
          <div className="segment-group">
            {(Object.keys(environmentLabels) as Environment[]).map((value) => (
              <button
                key={value}
                type="button"
                className={environment === value ? "selected" : ""}
                onClick={() => setEnvironment(value)}
              >
                {environmentLabels[value]}
              </button>
            ))}
          </div>
        </fieldset>

        <button className="primary-action" type="submit" disabled={isPending}>
          {isPending ? "진단 중" : "진단하기"}
        </button>

        {error ? <p className="form-error">{error}</p> : null}
      </form>

      <div className="diagnose-results" aria-live="polite">
        {result ? (
          <>
            <div className="result-heading">
              <p>{selectedRegionName}</p>
              <h2>추천 식물 {result.results.length}종</h2>
            </div>
            <div className="result-list">
              {result.results.map((plant) => (
                <PlantResult key={plant.id} plant={plant} />
              ))}
            </div>
          </>
        ) : (
          <div className="empty-result">
            <h2>지역과 환경을 선택해 주세요</h2>
            <p>샘플 데이터 기준으로 적합도 70점 이상인 식물을 보여드립니다.</p>
          </div>
        )}
      </div>
    </section>
  );
}

function PlantResult({ plant }: { plant: DiagnoseResultPlant }) {
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
      <Link className="text-link" href={`/plant/${plant.slug}`}>
        도감 보기
      </Link>
    </article>
  );
}
