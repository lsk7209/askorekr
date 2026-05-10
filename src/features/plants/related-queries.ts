import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db/client";
import {
  dictionaryCategories,
  plantMetrics,
  plantTaxonomyPath,
  plants
} from "@/db/schema";
import { getClimateGrade } from "@/features/diagnose/logic";
import type { PlantDetail } from "./queries";

const DEFAULT_REGION_CODE = "11680";

export type RelatedPlant = {
  slug: string;
  koreanName: string;
  scientificName: string;
  climateScore: number;
  climateGrade: string;
  difficultyScore: number | null;
  waterFreqDays: number | null;
  categorySlug: string;
  categoryTitle: string;
};

function getClimateScore(scores: Record<string, number> | null) {
  return scores?.[DEFAULT_REGION_CODE] ?? 0;
}

export async function getRelatedPlants(
  plant: PlantDetail,
  limit = 3
): Promise<RelatedPlant[]> {
  const categories = await db
    .select({
      slug: plantTaxonomyPath.category,
      title: dictionaryCategories.title
    })
    .from(plantTaxonomyPath)
    .innerJoin(
      dictionaryCategories,
      eq(plantTaxonomyPath.category, dictionaryCategories.slug)
    )
    .where(eq(plantTaxonomyPath.plantId, plant.id))
    .limit(1);

  const category = categories[0];

  if (!category?.slug) {
    return [];
  }

  const categorySlug = category.slug;

  const rows = await db
    .select({
      slug: plants.slug,
      koreanName: plants.koreanName,
      scientificName: plants.scientificName,
      climateScoreByRegion: plantMetrics.climateScoreByRegion,
      difficultyScore: plantMetrics.difficultyScore,
      waterFreqDays: plantMetrics.waterFreqDays
    })
    .from(plantTaxonomyPath)
    .innerJoin(plants, eq(plantTaxonomyPath.plantId, plants.id))
    .innerJoin(plantMetrics, eq(plants.id, plantMetrics.plantId))
    .where(
      and(
        eq(plantTaxonomyPath.category, categorySlug),
        ne(plants.id, plant.id)
      )
    );

  return rows
    .map((row) => {
      const climateScore = getClimateScore(row.climateScoreByRegion);

      return {
        slug: row.slug,
        koreanName: row.koreanName,
        scientificName: row.scientificName,
        climateScore,
        climateGrade: getClimateGrade(climateScore),
        difficultyScore: row.difficultyScore,
        waterFreqDays: row.waterFreqDays,
        categorySlug,
        categoryTitle: category.title
      };
    })
    .sort((a, b) => b.climateScore - a.climateScore)
    .slice(0, limit);
}
