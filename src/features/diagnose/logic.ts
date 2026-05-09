import { asc, eq, inArray, or } from "drizzle-orm";
import { db } from "@/db/client";
import { plantMetrics, plants, regions, toolsResults } from "@/db/schema";
import type {
  DiagnoseRequest,
  DiagnoseResponse,
  DiagnoseResultPlant
} from "./types";
import {
  buildRecommendationReason,
  getClimateGrade,
  MIN_CLIMATE_SCORE,
  passesCareTimeFilter,
  passesExperienceFilter,
  passesLightFilter,
  passesSafetyFilter,
  RESULT_LIMIT
} from "./scoring";
import { buildDiagnoseResultPath } from "./request";

export { getClimateGrade } from "./scoring";
export { isEnvironment, parseDiagnoseRequest } from "./request";

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
    .from(regions)
    .orderBy(asc(regions.sido), asc(regions.sigungu));
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
      petSafetyScoreDog: plantMetrics.petSafetyScoreDog,
      petSafetyScoreCat: plantMetrics.petSafetyScoreCat,
      childSafetyScore: plantMetrics.childSafetyScore,
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
        petSafetyScoreDog: row.petSafetyScoreDog,
        petSafetyScoreCat: row.petSafetyScoreCat,
        childSafetyScore: row.childSafetyScore,
        waterFreqDays: row.waterFreqDays,
        lightLuxMin: row.lightLuxMin,
        lightLuxMax: row.lightLuxMax,
        recommendationReason: buildRecommendationReason(
          climateScore,
          row.difficultyScore,
          row.waterFreqDays,
          request
        )
      };
    })
    .filter((plant) => plant.climateScore >= MIN_CLIMATE_SCORE)
    .filter((plant) => passesSafetyFilter(plant, request.safetyTargets))
    .filter((plant) => passesLightFilter(plant, request.lightLevel))
    .filter((plant) => passesExperienceFilter(plant, request.experience))
    .filter((plant) => passesCareTimeFilter(plant, request.careTime))
    .sort((a, b) => b.climateScore - a.climateScore)
    .slice(0, RESULT_LIMIT);

  await cacheDiagnoseResult(request, results.map((plant) => plant.id));

  return {
    regionCode: request.regionCode,
    environment: request.environment,
    resultPath: buildDiagnoseResultPath(request),
    safetyTargets: request.safetyTargets,
    lightLevel: request.lightLevel,
    experience: request.experience,
    careTime: request.careTime,
    results
  };
}

async function cacheDiagnoseResult(request: DiagnoseRequest, plantIds: number[]) {
  const cacheKey = [
    `region:${request.regionCode}`,
    `env:${request.environment}`,
    `safety:${request.safetyTargets.join(",") || "none"}`,
    `light:${request.lightLevel}`,
    `experience:${request.experience}`,
    `care:${request.careTime}`
  ].join("|");

  await db
    .insert(toolsResults)
    .values({
      cacheKey,
      regionCode: request.regionCode,
      environment: request.environment,
      petType: request.safetyTargets.join(",") || null,
      experience: request.experience === "any" ? null : request.experience,
      resultPlantIds: plantIds,
      computedAt: new Date()
    })
    .onConflictDoUpdate({
      target: toolsResults.cacheKey,
      set: {
        petType: request.safetyTargets.join(",") || null,
        experience: request.experience === "any" ? null : request.experience,
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
