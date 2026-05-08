import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { plantMetrics, plants } from "@/db/schema";
import { getClimateGrade } from "@/features/diagnose/logic";

const DEFAULT_REGION_CODE = "11680";

export type PlantDetail = {
  id: number;
  slug: string;
  koreanName: string;
  scientificName: string;
  family: string | null;
  genus: string | null;
  origin: string | null;
  climateScore: number;
  climateGrade: string;
  indoorOutdoorClass: string | null;
  difficultyScore: number | null;
  petSafetyScoreDog: number | null;
  petSafetyScoreCat: number | null;
  childSafetyScore: number | null;
  toxicityNotes: string | null;
  lightLuxMin: number | null;
  lightLuxMax: number | null;
  waterFreqDays: number | null;
  tempMinC: number | null;
  tempMaxC: number | null;
  humidityMinPct: number | null;
  humidityMaxPct: number | null;
  flowerMeaningPrimary: string | null;
  updatedAt: Date;
};

type FlowerMeaning = {
  primary?: string;
};

function getClimateScore(
  scores: Record<string, number> | null,
  regionCode = DEFAULT_REGION_CODE
) {
  return scores?.[regionCode] ?? 0;
}

function getPrimaryMeaning(flowerMeaning: FlowerMeaning | null) {
  return flowerMeaning?.primary ?? null;
}

export async function getPlantBySlug(slug: string): Promise<PlantDetail | null> {
  const rows = await db
    .select({
      id: plants.id,
      slug: plants.slug,
      koreanName: plants.koreanName,
      scientificName: plants.scientificName,
      family: plants.family,
      genus: plants.genus,
      origin: plants.origin,
      updatedAt: plants.updatedAt,
      climateScoreByRegion: plantMetrics.climateScoreByRegion,
      indoorOutdoorClass: plantMetrics.indoorOutdoorClass,
      difficultyScore: plantMetrics.difficultyScore,
      petSafetyScoreDog: plantMetrics.petSafetyScoreDog,
      petSafetyScoreCat: plantMetrics.petSafetyScoreCat,
      childSafetyScore: plantMetrics.childSafetyScore,
      toxicityNotes: plantMetrics.toxicityNotes,
      lightLuxMin: plantMetrics.lightLuxMin,
      lightLuxMax: plantMetrics.lightLuxMax,
      waterFreqDays: plantMetrics.waterFreqDays,
      tempMinC: plantMetrics.tempMinC,
      tempMaxC: plantMetrics.tempMaxC,
      humidityMinPct: plantMetrics.humidityMinPct,
      humidityMaxPct: plantMetrics.humidityMaxPct,
      flowerMeaning: plantMetrics.flowerMeaning
    })
    .from(plants)
    .innerJoin(plantMetrics, eq(plants.id, plantMetrics.plantId))
    .where(eq(plants.slug, slug))
    .limit(1);

  const plant = rows[0];

  if (!plant) {
    return null;
  }

  const climateScore = getClimateScore(plant.climateScoreByRegion);

  return {
    id: plant.id,
    slug: plant.slug,
    koreanName: plant.koreanName,
    scientificName: plant.scientificName,
    family: plant.family,
    genus: plant.genus,
    origin: plant.origin,
    climateScore,
    climateGrade: getClimateGrade(climateScore),
    indoorOutdoorClass: plant.indoorOutdoorClass,
    difficultyScore: plant.difficultyScore,
    petSafetyScoreDog: plant.petSafetyScoreDog,
    petSafetyScoreCat: plant.petSafetyScoreCat,
    childSafetyScore: plant.childSafetyScore,
    toxicityNotes: plant.toxicityNotes,
    lightLuxMin: plant.lightLuxMin,
    lightLuxMax: plant.lightLuxMax,
    waterFreqDays: plant.waterFreqDays,
    tempMinC: plant.tempMinC,
    tempMaxC: plant.tempMaxC,
    humidityMinPct: plant.humidityMinPct,
    humidityMaxPct: plant.humidityMaxPct,
    flowerMeaningPrimary: getPrimaryMeaning(plant.flowerMeaning),
    updatedAt: plant.updatedAt
  };
}
