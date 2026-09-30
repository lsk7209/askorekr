/**
 * 안전성(반려동물/어린이 독성) 판정 공통 모듈.
 *
 * 배경: 기존 스키마는 `petSafetyScoreDog|Cat`, `childSafetyScore`를 0~100 숫자로만 저장하고,
 * 출처 URL·검토일·적용 학명 범위 같은 근거 메타데이터는 갖고 있지 않다. 이 모듈은 스키마를
 * 바꾸지 않는 범위에서 "숫자 점수를 어떻게 해석해 안전 여부를 판단할지"를 한 곳으로 모은다.
 * 상세 페이지 소개문, FAQ, 메타 디스크립션, 추천 필터가 전부 이 함수를 거치면
 * "낮은 점수인데 안전하다고 소개문에 나오는" 종류의 불일치를 막을 수 있다.
 *
 * 근거 기반 출처 추적(SafetyAssessment.evidence 등)은 별도 스키마 마이그레이션이 필요한
 * 더 큰 작업이라 이번 범위에서는 다루지 않는다.
 */

export type SafetyScoreStatus = "toxic" | "unknown" | "safe_evidence";

const MIN_SAFE_SCORE = 80;
const MAX_TOXIC_SCORE = 60;

/**
 * 점수 하나를 안전 상태로 해석한다.
 * - null/undefined: 근거 없음 → unknown (안전 보장 아님)
 * - >= MIN_SAFE_SCORE: 안전 근거 있음
 * - <= MAX_TOXIC_SCORE: 독성/위험 근거 있음
 * - 그 사이(애매한 구간): unknown으로 보수 처리 (안전하다고 단정하지 않음)
 */
export function classifySafetyScore(score: number | null | undefined): SafetyScoreStatus {
  if (score === null || score === undefined || !Number.isFinite(score)) {
    return "unknown";
  }
  if (score >= MIN_SAFE_SCORE) {
    return "safe_evidence";
  }
  if (score <= MAX_TOXIC_SCORE) {
    return "toxic";
  }
  return "unknown";
}

export type SafetySummaryInput = {
  petSafetyScoreDog: number | null;
  petSafetyScoreCat: number | null;
  childSafetyScore: number | null;
};

export type SafetySummary = {
  dog: SafetyScoreStatus;
  cat: SafetyScoreStatus;
  child: SafetyScoreStatus;
  /** 선택한 모든 대상이 안전 근거를 가질 때만 true. 근거 부족/독성이면 false. */
  allSafeEvidence: boolean;
  /** 하나라도 독성 확인 상태면 true */
  anyToxic: boolean;
};

export function summarizeSafety(input: SafetySummaryInput): SafetySummary {
  const dog = classifySafetyScore(input.petSafetyScoreDog);
  const cat = classifySafetyScore(input.petSafetyScoreCat);
  const child = classifySafetyScore(input.childSafetyScore);
  const statuses = [dog, cat, child];

  return {
    dog,
    cat,
    child,
    allSafeEvidence: statuses.every((status) => status === "safe_evidence"),
    anyToxic: statuses.some((status) => status === "toxic")
  };
}

/**
 * 사람이 읽는 안전성 요약 문구. "안전하다"는 확정적 표현은 안전 근거가 있을 때만 쓰고,
 * 근거 부족(unknown)이면 항상 확인을 권고하는 중립 문구를 반환한다.
 */
export function describeSafetyForCopy(summary: SafetySummary): string {
  if (summary.anyToxic) {
    return "반려동물·어린이 독성 위험이 확인되어 접근을 제한해야 합니다.";
  }
  if (summary.allSafeEvidence) {
    return "반려동물·어린이 안전성 근거가 확인되었습니다.";
  }
  return "반려동물·어린이 안전성 근거가 충분하지 않아 접촉 전 확인이 필요합니다.";
}
