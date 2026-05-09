import type {
  CareTimeLevel,
  DiagnoseRequest,
  DiagnoseResultPlant,
  ExperienceLevel,
  LightLevel,
  SafetyTarget
} from "./types";

export const MIN_CLIMATE_SCORE = 70;
export const RESULT_LIMIT = 10;

const MIN_SAFETY_SCORE = 80;
const LIGHT_RANGES: Record<Exclude<LightLevel, "any">, [number, number]> = {
  direct: [8000, 20000],
  partial: [4000, 10000],
  indirect: [1000, 5000],
  shade: [200, 1500]
};
const EXPERIENCE_MAX_DIFFICULTY: Record<
  Exclude<ExperienceLevel, "any">,
  number
> = {
  beginner: 35,
  intermediate: 65,
  advanced: 100
};
const CARE_TIME_RULES: Record<
  Exclude<CareTimeLevel, "any">,
  { maxDifficulty: number; minWaterFreqDays: number }
> = {
  low: { maxDifficulty: 35, minWaterFreqDays: 7 },
  medium: { maxDifficulty: 65, minWaterFreqDays: 4 },
  high: { maxDifficulty: 100, minWaterFreqDays: 0 }
};

export function getClimateGrade(score: number) {
  if (score >= 90) {
    return "★★★★★";
  }
  if (score >= 80) {
    return "★★★★";
  }
  if (score >= 70) {
    return "★★★";
  }
  if (score >= 60) {
    return "★★";
  }
  return "★";
}

export function buildRecommendationReason(
  climateScore: number,
  difficultyScore: number | null,
  waterFreqDays: number | null,
  request: DiagnoseRequest
) {
  const waterText = waterFreqDays ? ` 물주기는 약 ${waterFreqDays}일 간격입니다.` : "";
  const safetyText =
    request.safetyTargets.length > 0 ? " 선택한 안전성 조건도 통과했습니다." : "";
  const lightText =
    request.lightLevel !== "any" ? " 선택한 광량 조건과도 겹칩니다." : "";
  const careText =
    request.experience !== "any" || request.careTime !== "any"
      ? " 관리 부담 조건에 맞춰 추렸습니다."
      : "";

  return `지역 기후 적합도 ${climateScore}점이고 ${getDifficultyLabel(
    difficultyScore
  )} 후보에 포함됐어요.${waterText}${safetyText}${lightText}${careText}`;
}

export function passesSafetyFilter(
  plant: DiagnoseResultPlant,
  targets: SafetyTarget[]
) {
  return targets.every((target) => {
    if (target === "dog") {
      return (plant.petSafetyScoreDog ?? 0) >= MIN_SAFETY_SCORE;
    }
    if (target === "cat") {
      return (plant.petSafetyScoreCat ?? 0) >= MIN_SAFETY_SCORE;
    }
    return (plant.childSafetyScore ?? 0) >= MIN_SAFETY_SCORE;
  });
}

export function passesLightFilter(plant: DiagnoseResultPlant, level: LightLevel) {
  if (level === "any") {
    return true;
  }
  if (plant.lightLuxMin === null || plant.lightLuxMax === null) {
    return false;
  }

  const [minLux, maxLux] = LIGHT_RANGES[level];
  return plant.lightLuxMin <= maxLux && plant.lightLuxMax >= minLux;
}

export function passesExperienceFilter(
  plant: DiagnoseResultPlant,
  experience: ExperienceLevel
) {
  if (experience === "any") {
    return true;
  }
  return (plant.difficultyScore ?? 101) <= EXPERIENCE_MAX_DIFFICULTY[experience];
}

export function passesCareTimeFilter(
  plant: DiagnoseResultPlant,
  careTime: CareTimeLevel
) {
  if (careTime === "any") {
    return true;
  }

  const rule = CARE_TIME_RULES[careTime];
  return (
    (plant.difficultyScore ?? 101) <= rule.maxDifficulty &&
    (plant.waterFreqDays ?? 0) >= rule.minWaterFreqDays
  );
}

function getDifficultyLabel(score: number | null) {
  if (score === null) {
    return "관리 정보가 제한적이지만";
  }
  if (score <= 35) {
    return "관리 난이도가 낮아";
  }
  if (score <= 65) {
    return "관리 부담이 보통이라";
  }
  return "관리 난이도는 높지만";
}
