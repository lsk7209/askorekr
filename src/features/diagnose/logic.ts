import { eq, inArray, or } from "drizzle-orm";
import { db } from "@/db/client";
import { plantMetrics, plants, regions, toolsResults } from "@/db/schema";
import type {
  DiagnoseRequest,
  DiagnoseResponse,
  DiagnoseResultPlant,
  Environment
} from "./types";
import { environments } from "./types";

const MIN_CLIMATE_SCORE = 70;
const RESULT_LIMIT = 10;

export function isEnvironment(value: string): value is Environment {
  return environments.includes(value as Environment);
}

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
    environment
  };
}

function getScore(
  scores: Record<string, number> | null,
  regionCode: string
) {
  return scores?.[regionCode] ?? 0;
}

export async function getRegions() {
  return db
    .select({
      code: regions.code,
      sido: regions.sido,
      sigungu: regions.sigungu
    })
    .from(regions);
}

export async function diagnosePlants(
  request: DiagnoseRequest
): Promise<DiagnoseResponse> {
  const environmentFilter =
    request.environment === "both"
      ? undefined
      : or(
          eq(plantMetrics.indoorOutdoorClass, request.environment),
          eq(plantMetrics.indoorOutdoorClass, "both")
        );

  const rows = await db
    .select({
      id: plants.id,
      slug: plants.slug,
      koreanName: plants.koreanName,
      scientificName: plants.scientificName,
      climateScoreByRegion: plantMetrics.climateScoreByRegion,
      indoorOutdoorClass: plantMetrics.indoorOutdoorClass,
      difficultyScore: plantMetrics.difficultyScore,
      waterFreqDays: plantMetrics.waterFreqDays,
      lightLuxMin: plantMetrics.lightLuxMin,
      lightLuxMax: plantMetrics.lightLuxMax
    })
    .from(plants)
    .innerJoin(plantMetrics, eq(plants.id, plantMetrics.plantId))
    .where(environmentFilter);

  const results = rows
    .map((row): DiagnoseResultPlant => {
      const climateScore = getScore(row.climateScoreByRegion, request.regionCode);

      return {
        id: row.id,
        slug: row.slug,
        koreanName: row.koreanName,
        scientificName: row.scientificName,
        climateScore,
        climateGrade: getClimateGrade(climateScore),
        indoorOutdoorClass: row.indoorOutdoorClass,
        difficultyScore: row.difficultyScore,
        waterFreqDays: row.waterFreqDays,
        lightLuxMin: row.lightLuxMin,
        lightLuxMax: row.lightLuxMax
      };
    })
    .filter((plant) => plant.climateScore >= MIN_CLIMATE_SCORE)
    .sort((a, b) => b.climateScore - a.climateScore)
    .slice(0, RESULT_LIMIT);

  await cacheDiagnoseResult(request, results.map((plant) => plant.id));

  return {
    regionCode: request.regionCode,
    environment: request.environment,
    results
  };
}

async function cacheDiagnoseResult(request: DiagnoseRequest, plantIds: number[]) {
  const cacheKey = `region:${request.regionCode}|env:${request.environment}`;

  await db
    .insert(toolsResults)
    .values({
      cacheKey,
      regionCode: request.regionCode,
      environment: request.environment,
      resultPlantIds: plantIds,
      computedAt: new Date()
    })
    .onConflictDoUpdate({
      target: toolsResults.cacheKey,
      set: {
        resultPlantIds: plantIds,
        computedAt: new Date()
      }
    });
}

export async function assertRegionExists(regionCode: string) {
  const rows = await db
    .select({ code: regions.code })
    .from(regions)
    .where(inArray(regions.code, [regionCode]))
    .limit(1);

  return rows.length > 0;
}
