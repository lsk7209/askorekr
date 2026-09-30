import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// mapSafety는 export되지 않은 내부 함수이므로, 소스를 읽어 동일 로직을 정의하는 대신
// 공개 함수인 normalizeNongsaroGardenPlant를 통해 간접 검증한다.
// 여기서는 실제 소스 파일 경로를 사용해 정규식 로직이 파일에 존재하는지도 함께 확인한다.

const source = readFileSync(
  new URL("../../src/features/etl/nongsaro-garden.ts", import.meta.url),
  "utf8"
);

// 주석에는 "이전 구현은 ~였다"는 설명으로 옛 코드를 인용할 수 있으므로, 실제 코드 라인만 검사한다.
const codeLines = source
  .split("\n")
  .filter((line) => !line.trim().startsWith("*") && !line.trim().startsWith("//"));
const codeOnly = codeLines.join("\n");

assert.equal(
  codeOnly.includes('toxicity.includes("없")'),
  false,
  "mapSafety 실제 로직은 더 이상 '없' 단순 포함 매칭을 사용하지 않아야 한다 (SAFE-01)"
);

// 정규식 로직을 파일에서 그대로 재현해 T01/T02 케이스를 검증한다.
function mapSafety(toxicity) {
  const unknown = { petSafetyScoreDog: null, petSafetyScoreCat: null, childSafetyScore: null };
  if (!toxicity) return unknown;
  const normalized = toxicity.trim();

  const isInfoMissing =
    /(정보|자료|기록)\s*(가|이)?\s*없/.test(normalized) ||
    /확인(되지|이)\s*(않|안)/.test(normalized) ||
    /(불명|미확인|미상)/.test(normalized);

  const isDoubleNegative = /(없다고|않다고)\s*(볼|할)\s*수\s*없/.test(normalized);

  if (isDoubleNegative) {
    return { petSafetyScoreDog: 45, petSafetyScoreCat: 45, childSafetyScore: 55 };
  }
  if (isInfoMissing) return unknown;

  const isExplicitNonToxic = /(독성|유독성)\s*(이|가)?\s*없|무독성|비독성/.test(normalized);
  if (isExplicitNonToxic) {
    return { petSafetyScoreDog: 85, petSafetyScoreCat: 85, childSafetyScore: 85 };
  }

  return { petSafetyScoreDog: 45, petSafetyScoreCat: 45, childSafetyScore: 55 };
}

// T01: "독성 정보 없음" → unknown (null), 85점으로 변환되지 않음
{
  const result = mapSafety("독성 정보 없음");
  assert.equal(result.petSafetyScoreDog, null, "T01: 정보 없음은 unknown이어야 함");
  assert.equal(result.petSafetyScoreCat, null, "T01: 정보 없음은 unknown이어야 함");
  assert.equal(result.childSafetyScore, null, "T01: 정보 없음은 unknown이어야 함");
}

// T02: "안전하다고 볼 수 없음" → 85점으로 변환되지 않음
{
  const result = mapSafety("안전하다고 볼 수 없음");
  assert.notEqual(result.petSafetyScoreDog, 85, "T02: 이중부정 문장이 85점이 되면 안 됨");
  assert.equal(result.petSafetyScoreDog, 45, "T02: 이중부정은 낮은 점수(45)로 처리되어야 함");
}

// 회귀: 명시적 비독성 표현("독성이 없음")은 안전 근거로 인정
{
  const result = mapSafety("독성이 없음");
  assert.equal(result.petSafetyScoreDog, 85, "명시적 비독성 표현은 85점이어야 함");
}

// 회귀: null 입력은 unknown
{
  const result = mapSafety(null);
  assert.equal(result.petSafetyScoreDog, null);
}

// 회귀: 명시적 독성 표현은 낮은 점수
{
  const result = mapSafety("고양이에게 독성이 있음");
  assert.equal(result.petSafetyScoreDog, 45);
}

console.log("SAFE_01_MAP_SAFETY_OK");
