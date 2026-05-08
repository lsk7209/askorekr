export const environments = ["indoor", "outdoor", "both"] as const;

export type Environment = (typeof environments)[number];

export type DiagnoseRequest = {
  regionCode: string;
  environment: Environment;
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
};

export type DiagnoseResponse = {
  regionCode: string;
  environment: Environment;
  results: DiagnoseResultPlant[];
};
