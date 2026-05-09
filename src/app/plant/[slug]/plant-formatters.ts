import type { PlantDetail } from "@/features/plants/queries";

export function formatDifficulty(score: number | null) {
  if (score === null) return "확인 필요";
  return `${score}점, ${formatDifficultyLabel(score)}`;
}

export function formatDifficultyLabel(score: number | null) {
  if (score === null) return "확인 필요";
  if (score <= 35) return "쉬움";
  if (score <= 65) return "보통";
  return "까다로움";
}

export function formatWaterCycle(days: number | null) {
  return days ? `${days}일 간격 참고` : "흙 상태 기준";
}

export function formatWaterGuide(plant: PlantDetail) {
  if (!plant.waterFreqDays) {
    return "정해진 주기보다 겉흙과 화분 무게를 기준으로 확인하는 편이 안전합니다.";
  }

  return `${plant.waterFreqDays}일 간격은 참고값입니다. 계절, 화분 크기, 배수 상태에 따라 흙이 마르는 속도가 달라지므로 물주기 전 겉흙 상태를 확인하세요.`;
}

export function formatLightGuide(plant: PlantDetail) {
  const range = formatRange(plant.lightLuxMin, plant.lightLuxMax, "lux");

  return range === "-"
    ? "직사광, 반그늘, 간접광 중 어느 조건에서 잎이 안정적인지 며칠 단위로 관찰하세요."
    : `${range} 범위의 빛을 참고하세요. 실내에서는 창가와의 거리, 커튼 투과광, 하루 중 강한 직사광 시간을 함께 확인해야 합니다.`;
}

export function formatLightCondition(plant: PlantDetail) {
  const range = formatRange(plant.lightLuxMin, plant.lightLuxMax, "lux");

  return range === "-" ? "빛의 양" : `${range} 범위의 빛`;
}

export function formatTemperatureGuide(plant: PlantDetail) {
  const range = formatRange(plant.tempMinC, plant.tempMaxC, "℃");

  return range === "-"
    ? "급격한 온도 변화와 찬바람을 피하고 사람이 오래 머무는 안정적인 실내 온도를 유지하세요."
    : `${range} 범위를 참고하세요. 겨울 창가와 여름 냉방 바람처럼 짧은 시간의 급격한 온도 변화도 잎 손상 원인이 될 수 있습니다.`;
}

export function formatHumidityGuide(plant: PlantDetail) {
  const range = formatRange(plant.humidityMinPct, plant.humidityMaxPct, "%");

  return range === "-"
    ? "건조한 계절에는 잎끝 마름과 흙 마름 속도를 같이 보고 통풍을 유지하세요."
    : `${range} 습도를 참고하세요. 습도만 높이고 통풍이 부족하면 과습과 병해가 생길 수 있어 균형이 필요합니다.`;
}

export function formatRange(
  min: number | null,
  max: number | null,
  unit: string
) {
  if (min === null || max === null) return "-";

  return `${min.toLocaleString("ko-KR")}~${max.toLocaleString("ko-KR")}${unit}`;
}

export function formatScore(score: number | null) {
  return score === null ? "확인 필요" : `${score}점`;
}
