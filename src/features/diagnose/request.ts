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
