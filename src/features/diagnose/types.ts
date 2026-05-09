export const environments = ["indoor", "outdoor", "both"] as const;
export const safetyTargets = ["dog", "cat", "child"] as const;
export const lightLevels = [
  "any",
  "direct",
  "partial",
  "indirect",
  "shade"
] as const;
export const experienceLevels = [
  "any",
  "beginner",
  "intermediate",
  "advanced"
] as const;
export const careTimeLevels = ["any", "low", "medium", "high"] as const;

export type Environment = (typeof environments)[number];
export type SafetyTarget = (typeof safetyTargets)[number];
export type LightLevel = (typeof lightLevels)[number];
export type ExperienceLevel = (typeof experienceLevels)[number];
export type CareTimeLevel = (typeof careTimeLevels)[number];

export type DiagnoseRequest = {
  regionCode: string;
  environment: Environment;
  safetyTargets: SafetyTarget[];
  lightLevel: LightLevel;
  experience: ExperienceLevel;
  careTime: CareTimeLevel;
};

export type DiagnoseResultPlant = {
  id: number;
  slug: string;
  koreanName: string;
  scientificName: string;
  climateScore: number;
  climateGrade: string;
  indoorOutdoorClass: string | null;
  difficultyScore: number | null;
  waterFreqDays: number | null;
  lightLuxMin: number | null;
  lightLuxMax: number | null;
  petSafetyScoreDog: number | null;
  petSafetyScoreCat: number | null;
  childSafetyScore: number | null;
  recommendationReason: string;
};

export type DiagnoseResponse = {
  regionCode: string;
  environment: Environment;
  resultPath: string;
  safetyTargets: SafetyTarget[];
  lightLevel: LightLevel;
  experience: ExperienceLevel;
  careTime: CareTimeLevel;
  results: DiagnoseResultPlant[];
};
