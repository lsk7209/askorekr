import Link from "next/link";
import type { DiagnoseResponse } from "@/features/diagnose/types";
import { PlantResultCard } from "@/app/tools/diagnose/plant-result-card";

export function ConditionSummary({
  result,
  regionName
}: {
  result: DiagnoseResponse;
  regionName: string;
}) {
  return (
    <section className="condition-summary" aria-labelledby="condition-title">
      <h2 id="condition-title">선택 조건</h2>
      <dl>
        <Condition label="지역" value={regionName} />
        <Condition label="환경" value={formatEnvironment(result.environment)} />
        <Condition
          label="안전성"
          value={formatSafetyTargets(result.safetyTargets)}
        />
        <Condition label="광량" value={formatLightLevel(result.lightLevel)} />
        <Condition label="경험" value={formatExperience(result.experience)} />
        <Condition label="관리 시간" value={formatCareTime(result.careTime)} />
      </dl>
    </section>
  );
}

export function ResultPlants({ result }: { result: DiagnoseResponse }) {
  return (
    <section className="diagnose-result-list" aria-labelledby="result-title">
      <div className="result-heading">
        <p>조건 매칭</p>
        <h2 id="result-title">추천 식물 {result.results.length}종</h2>
      </div>
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
    </section>
  );
}

export function NewsletterBox() {
  return (
    <aside className="newsletter-box" aria-labelledby="newsletter-title">
      <h2 id="newsletter-title">주간 가드닝 팁 받기</h2>
      <p>
        뉴스레터 기능은 준비 중입니다. 문의는{" "}
        <Link className="text-link" href="/contact">
          문의 페이지
        </Link>
        에서 받을 수 있어요.
      </p>
    </aside>
  );
}

function Condition({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function formatEnvironment(value: string) {
  if (value === "indoor") {
    return "실내";
  }
  if (value === "outdoor") {
    return "실외";
  }
  return "실내·실외";
}

function formatSafetyTargets(targets: string[]) {
  if (targets.length === 0) {
    return "상관없음";
  }

  const labels: Record<string, string> = {
    dog: "강아지",
    cat: "고양이",
    child: "어린 자녀"
  };

  return targets.map((target) => labels[target] ?? target).join(", ");
}

function formatLightLevel(value: string) {
  const labels: Record<string, string> = {
    any: "상관없음",
    direct: "직사광",
    partial: "반양지",
    indirect: "간접광",
    shade: "그늘"
  };

  return labels[value] ?? value;
}

function formatExperience(value: string) {
  const labels: Record<string, string> = {
    any: "상관없음",
    beginner: "초보",
    intermediate: "중급",
    advanced: "고수"
  };

  return labels[value] ?? value;
}

function formatCareTime(value: string) {
  const labels: Record<string, string> = {
    any: "상관없음",
    low: "낮음",
    medium: "보통",
    high: "충분"
  };

  return labels[value] ?? value;
}
