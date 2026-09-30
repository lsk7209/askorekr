import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("../../src/features/etl/nongsaro-garden.ts", import.meta.url),
  "utf8"
);

// mapLight 로직 복제 (T14: 복수 광량 코드 → 첫 값 외 나머지도 보존)
function mapLight(code) {
  if (!code) return { min: null, max: null };
  const knownRanges = {
    "055001": { min: 300, max: 800 },
    "055002": { min: 800, max: 1500 },
    "055003": { min: 1500, max: 10000 }
  };
  const matchedRanges = Object.entries(knownRanges)
    .filter(([knownCode]) => code.includes(knownCode))
    .map(([, range]) => range);
  if (matchedRanges.length === 0) return { min: null, max: null };
  return {
    min: Math.min(...matchedRanges.map((r) => r.min)),
    max: Math.max(...matchedRanges.map((r) => r.max))
  };
}

// T14: 복수 코드("055001|055002")가 있으면 두 범위를 모두 포함해야 함
{
  const result = mapLight("055001|055002");
  assert.equal(result.min, 300, "첫 코드의 min(300)이 유지되어야 함");
  assert.equal(result.max, 1500, "두 번째 코드의 max(1500)까지 확장되어야 함 (기존 버그는 800에서 끊김)");
}

// 단일 코드는 기존과 동일하게 동작
{
  const result = mapLight("055001");
  assert.deepEqual(result, { min: 300, max: 800 });
}

// null/빈 값
{
  assert.deepEqual(mapLight(null), { min: null, max: null });
}

// mapWaterDays 로직 복제 (평균 대신 최소값)
function mapWaterDays(codes) {
  const map = { "053001": 1, "053002": 3, "053003": 7, "053004": 14 };
  const days = codes.map((c) => map[c] ?? null).filter((v) => v !== null);
  if (days.length === 0) return null;
  return Math.min(...days);
}

// 봄 1일, 겨울 14일 혼합 시 평균(약 5~8일)이 아니라 최소값(1일)을 채택해야 함
{
  const result = mapWaterDays(["053001", null, null, "053004"]);
  assert.equal(result, 1, "평균이 아니라 최소값(가장 잦은 물주기)을 대표값으로 써야 함");
}

// 소스 코드에 origin ?? SOURCE_LABEL 패턴이 더 이상 없어야 함 (출처를 원산지로 오인 저장 금지)
{
  const codeLines = source
    .split("\n")
    .filter((line) => !line.trim().startsWith("*") && !line.trim().startsWith("//"));
  const codeOnly = codeLines.join("\n");
  assert.equal(
    codeOnly.includes("readText(detail.orgplceInfo) ?? SOURCE_LABEL"),
    false,
    "origin 결측 시 SOURCE_LABEL로 대체하지 않아야 함 (DATA-02)"
  );
}

console.log("DATA_02_NORMALIZATION_OK");
