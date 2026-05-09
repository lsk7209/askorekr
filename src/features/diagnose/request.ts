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

function isSafetyTarget(value: unknown): value is SafetyTarget {
  return (
    typeof value === "string" && safetyTargets.includes(value as SafetyTarget)
  );
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
