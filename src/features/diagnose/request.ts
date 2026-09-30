import type {
  CareTimeLevel,
  DiagnoseRequest,
  Environment,
  ExperienceLevel,
  LightLevel,
  SafetyTarget
} from "./types";
import {
  careTimeLevels,
  environments,
  experienceLevels,
  lightLevels,
  safetyTargets
} from "./types";

export function isEnvironment(value: string): value is Environment {
  return environments.includes(value as Environment);
}

export function parseDiagnoseRequest(input: unknown): DiagnoseRequest | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const payload = input as Record<string, unknown>;
  const regionCode = payload.regionCode;
  const environment = payload.environment;

  if (typeof regionCode !== "string" || regionCode.trim().length === 0) {
    return null;
  }

  if (typeof environment !== "string" || !isEnvironment(environment)) {
    return null;
  }

  return {
    regionCode: regionCode.trim(),
    environment,
    safetyTargets: parseSafetyTargets(payload.safetyTargets),
    lightLevel: parseLightLevel(payload.lightLevel),
    experience: parseExperienceLevel(payload.experience),
    careTime: parseCareTimeLevel(payload.careTime)
  };
}

export function buildDiagnoseResultPath(request: DiagnoseRequest) {
  const params = new URLSearchParams();

  if (request.safetyTargets.length > 0) {
    params.set("safety", request.safetyTargets.join(","));
  }
  if (request.lightLevel !== "any") {
    params.set("light", request.lightLevel);
  }
  if (request.experience !== "any") {
    params.set("experience", request.experience);
  }
  if (request.careTime !== "any") {
    params.set("care", request.careTime);
  }

  const query = params.toString();
  const path = `/diagnose/${request.regionCode}/${request.environment}`;

  return query ? `${path}?${query}` : path;
}

export function parseDiagnoseRouteRequest(
  regionCode: string,
  environment: string,
  searchParams: Record<string, string | string[] | undefined>
) {
  return parseDiagnoseRequest({
    regionCode,
    environment,
    safetyTargets: parseSafetyParam(searchParams.safety),
    lightLevel: getFirstParam(searchParams.light),
    experience: getFirstParam(searchParams.experience),
    careTime: getFirstParam(searchParams.care)
  });
}

function isSafetyTarget(value: unknown): value is SafetyTarget {
  return (
    typeof value === "string" && safetyTargets.includes(value as SafetyTarget)
  );
}

function parseSafetyParam(value: string | string[] | undefined) {
  const rawValue = getFirstParam(value);

  return rawValue ? rawValue.split(",") : [];
}

function getFirstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseSafetyTargets(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  const selectedTargets = new Set(value.filter(isSafetyTarget));
  return safetyTargets.filter((target) => selectedTargets.has(target));
}

function parseLightLevel(value: unknown): LightLevel {
  const candidate = value as LightLevel;
  return typeof value === "string" && lightLevels.includes(candidate)
    ? candidate
    : "any";
}

function parseExperienceLevel(value: unknown): ExperienceLevel {
  const candidate = value as ExperienceLevel;
  return typeof value === "string" && experienceLevels.includes(candidate)
    ? candidate
    : "any";
}

function parseCareTimeLevel(value: unknown): CareTimeLevel {
  const candidate = value as CareTimeLevel;
  return typeof value === "string" && careTimeLevels.includes(candidate)
    ? candidate
    : "any";
}

/**
 * 엄격한 입력 검증 결과. 필드가 생략된 경우는 기존 기본값을 허용하지만,
 * 필드가 존재하는데 타입/값이 잘못된 경우는 명시적으로 거절한다 (SAFE-03).
 * 기존 parseDiagnoseRequest/parseDiagnoseRouteRequest는 URL 쿼리·느슨한 입력을
 * 다루는 기존 계약을 유지하기 위해 그대로 둔다. 이 함수는 API 요청 본문(JSON POST)
 * 전용으로, 잘못된 값을 조용히 필터링하지 않는다.
 */
export type FieldError = { field: string; message: string };
export type StrictValidationResult =
  | { ok: true; value: DiagnoseRequest }
  | { ok: false; errors: FieldError[] };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateDiagnoseRequestStrict(input: unknown): StrictValidationResult {
  const errors: FieldError[] = [];

  if (!isPlainObject(input)) {
    return { ok: false, errors: [{ field: "body", message: "요청 본문은 JSON 객체여야 합니다." }] };
  }

  const regionCode = input.regionCode;
  if (typeof regionCode !== "string" || regionCode.trim().length === 0) {
    errors.push({ field: "regionCode", message: "regionCode는 비어 있지 않은 문자열이어야 합니다." });
  }

  const environment = input.environment;
  if (typeof environment !== "string" || !isEnvironment(environment)) {
    errors.push({
      field: "environment",
      message: `environment는 다음 값 중 하나여야 합니다: ${environments.join(", ")}`
    });
  }

  const safetyTargetsResult = validateSafetyTargetsStrict(input.safetyTargets);
  if (!safetyTargetsResult.ok) {
    errors.push(...safetyTargetsResult.errors);
  }

  const lightLevelResult = validateEnumField(
    input.lightLevel,
    lightLevels,
    "lightLevel"
  );
  if (!lightLevelResult.ok) {
    errors.push(lightLevelResult.error);
  }

  const experienceResult = validateEnumField(
    input.experience,
    experienceLevels,
    "experience"
  );
  if (!experienceResult.ok) {
    errors.push(experienceResult.error);
  }

  const careTimeResult = validateEnumField(
    input.careTime,
    careTimeLevels,
    "careTime"
  );
  if (!careTimeResult.ok) {
    errors.push(careTimeResult.error);
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      regionCode: (regionCode as string).trim(),
      environment: environment as Environment,
      safetyTargets: safetyTargetsResult.ok ? safetyTargetsResult.value : [],
      lightLevel: lightLevelResult.ok ? lightLevelResult.value : "any",
      experience: experienceResult.ok ? experienceResult.value : "any",
      careTime: careTimeResult.ok ? careTimeResult.value : "any"
    }
  };
}

/**
 * safetyTargets 검증: 생략(undefined)은 빈 배열(기존 기본값)을 허용한다.
 * 배열이 아니거나(예: 문자열 "cat"), 배열 안에 지원하지 않는 값이 하나라도 있으면 거절한다.
 * 정상 값의 중복은 정규화(dedupe)해 허용한다.
 */
function validateSafetyTargetsStrict(
  value: unknown
): { ok: true; value: SafetyTarget[] } | { ok: false; errors: FieldError[] } {
  if (value === undefined) {
    return { ok: true, value: [] };
  }

  if (!Array.isArray(value)) {
    return {
      ok: false,
      errors: [{ field: "safetyTargets", message: "safetyTargets는 배열이어야 합니다." }]
    };
  }

  const invalidItems = value.filter((item) => !isSafetyTarget(item));
  if (invalidItems.length > 0) {
    return {
      ok: false,
      errors: [
        {
          field: "safetyTargets",
          message: `지원하지 않는 값이 포함되어 있습니다: ${invalidItems.join(", ")}. 허용값: ${safetyTargets.join(", ")}`
        }
      ]
    };
  }

  const selected = new Set(value as SafetyTarget[]);
  return { ok: true, value: safetyTargets.filter((target) => selected.has(target)) };
}

function validateEnumField<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fieldName: string
): { ok: true; value: T } | { ok: false; error: FieldError } {
  if (value === undefined) {
    return { ok: true, value: allowed[0] as T };
  }

  if (typeof value === "string" && (allowed as readonly string[]).includes(value)) {
    return { ok: true, value: value as T };
  }

  return {
    ok: false,
    error: {
      field: fieldName,
      message: `${fieldName}는 다음 값 중 하나여야 합니다: ${allowed.join(", ")}`
    }
  };
}
