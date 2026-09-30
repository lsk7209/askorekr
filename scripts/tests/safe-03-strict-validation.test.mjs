import assert from "node:assert/strict";

const safetyTargets = ["dog", "cat", "child"];
const lightLevels = ["any", "direct", "partial", "indirect", "shade"];
const experienceLevels = ["any", "beginner", "intermediate", "advanced"];
const careTimeLevels = ["any", "low", "medium", "high"];
const environments = ["indoor", "outdoor", "both"];

function isEnvironment(value) {
  return environments.includes(value);
}
function isSafetyTarget(value) {
  return typeof value === "string" && safetyTargets.includes(value);
}
function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateSafetyTargetsStrict(value) {
  if (value === undefined) return { ok: true, value: [] };
  if (!Array.isArray(value)) {
    return { ok: false, errors: [{ field: "safetyTargets", message: "safetyTargets는 배열이어야 합니다." }] };
  }
  const invalidItems = value.filter((item) => !isSafetyTarget(item));
  if (invalidItems.length > 0) {
    return {
      ok: false,
      errors: [{ field: "safetyTargets", message: `지원하지 않는 값이 포함되어 있습니다: ${invalidItems.join(", ")}` }]
    };
  }
  const selected = new Set(value);
  return { ok: true, value: safetyTargets.filter((t) => selected.has(t)) };
}

function validateEnumField(value, allowed, fieldName) {
  if (value === undefined) return { ok: true, value: allowed[0] };
  if (typeof value === "string" && allowed.includes(value)) return { ok: true, value };
  return { ok: false, error: { field: fieldName, message: `${fieldName} invalid` } };
}

function validateDiagnoseRequestStrict(input) {
  const errors = [];
  if (!isPlainObject(input)) {
    return { ok: false, errors: [{ field: "body", message: "요청 본문은 JSON 객체여야 합니다." }] };
  }
  const regionCode = input.regionCode;
  if (typeof regionCode !== "string" || regionCode.trim().length === 0) {
    errors.push({ field: "regionCode", message: "invalid" });
  }
  const environment = input.environment;
  if (typeof environment !== "string" || !isEnvironment(environment)) {
    errors.push({ field: "environment", message: "invalid" });
  }
  const safetyTargetsResult = validateSafetyTargetsStrict(input.safetyTargets);
  if (!safetyTargetsResult.ok) errors.push(...safetyTargetsResult.errors);
  const lightLevelResult = validateEnumField(input.lightLevel, lightLevels, "lightLevel");
  if (!lightLevelResult.ok) errors.push(lightLevelResult.error);
  const experienceResult = validateEnumField(input.experience, experienceLevels, "experience");
  if (!experienceResult.ok) errors.push(experienceResult.error);
  const careTimeResult = validateEnumField(input.careTime, careTimeLevels, "careTime");
  if (!careTimeResult.ok) errors.push(careTimeResult.error);
  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      regionCode: regionCode.trim(),
      environment,
      safetyTargets: safetyTargetsResult.value,
      lightLevel: lightLevelResult.value,
      experience: experienceResult.value,
      careTime: careTimeResult.value
    }
  };
}

const baseValid = { regionCode: "11680", environment: "indoor" };

// T06: safetyTargets: "cat" (문자열, 배열 아님) → 오류
{
  const result = validateDiagnoseRequestStrict({ ...baseValid, safetyTargets: "cat" });
  assert.equal(result.ok, false, "T06: 문자열 safetyTargets는 거절되어야 함");
  assert.ok(result.errors.some((e) => e.field === "safetyTargets"));
}

// T07: ['cat','bogus'] → 오류 (조용히 삭제하지 않음)
{
  const result = validateDiagnoseRequestStrict({ ...baseValid, safetyTargets: ["cat", "bogus"] });
  assert.equal(result.ok, false, "T07: 잘못된 항목이 섞인 배열은 거절되어야 함");
}

// T08: 생략 시 기본값(빈 배열) 허용
{
  const result = validateDiagnoseRequestStrict({ ...baseValid });
  assert.equal(result.ok, true, "T08: safetyTargets 생략은 허용되어야 함");
  assert.deepEqual(result.value.safetyTargets, []);
}

// T08: 정상 복수 대상 중복 제거 및 정규화
{
  const result = validateDiagnoseRequestStrict({ ...baseValid, safetyTargets: ["cat", "dog", "cat"] });
  assert.equal(result.ok, true);
  assert.deepEqual(result.value.safetyTargets, ["dog", "cat"]);
}

// 알 수 없는 광량 → 오류
{
  const result = validateDiagnoseRequestStrict({ ...baseValid, lightLevel: "ultra-bright" });
  assert.equal(result.ok, false, "알 수 없는 lightLevel은 거절되어야 함");
}

// environment 누락 → 오류
{
  const result = validateDiagnoseRequestStrict({ regionCode: "11680" });
  assert.equal(result.ok, false);
}

// 정상 요청 전체 허용
{
  const result = validateDiagnoseRequestStrict({
    regionCode: "11680",
    environment: "indoor",
    safetyTargets: ["dog"],
    lightLevel: "direct",
    experience: "beginner",
    careTime: "low"
  });
  assert.equal(result.ok, true);
}

console.log("SAFE_03_STRICT_VALIDATION_OK");
