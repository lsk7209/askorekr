import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  dictionaryCategories,
  plantMetrics,
  plantTaxonomyPath,
  plants
} from "@/db/schema";
import { getClimateGrade } from "@/features/diagnose/logic";

const DEFAULT_REGION_CODE = "11680";

export type CategorySummary = {
  slug: string;
  title: string;
  description: string | null;
  plantCount: number | null;
};

export type CategoryPlant = {
  id: number;
  slug: string;
  koreanName: string;
  scientificName: string;
  climateScore: number;
  climateGrade: string;
  difficultyScore: number | null;
  indoorOutdoorClass: string | null;
};

export type CategoryDetail = CategorySummary & {
  plants: CategoryPlant[];
};

function getClimateScore(scores: Record<string, number> | null) {
  return scores?.[DEFAULT_REGION_CODE] ?? 0;
}

export async function getCategories(): Promise<CategorySummary[]> {
  return db
    .select({
      slug: dictionaryCategories.slug,
      title: dictionaryCategories.title,
      description: dictionaryCategories.description,
      plantCount: dictionaryCategories.plantCount
    })
    .from(dictionaryCategories);
}

export async function getCategoryBySlug(
  slug: string
): Promise<CategoryDetail | null> {
  const categories = await db
    .select({
      slug: dictionaryCategories.slug,
      title: dictionaryCategories.title,
      description: dictionaryCategories.description,
      plantCount: dictionaryCategories.plantCount
    })
    .from(dictionaryCategories)
    .where(eq(dictionaryCategories.slug, slug))
    .limit(1);

  const category = categories[0];

  if (!category) {
    return null;
  }

  const rows = await db
    .select({
      id: plants.id,
      slug: plants.slug,
      koreanName: plants.koreanName,
      scientificName: plants.scientificName,
      climateScoreByRegion: plantMetrics.climateScoreByRegion,
      difficultyScore: plantMetrics.difficultyScore,
      indoorOutdoorClass: plantMetrics.indoorOutdoorClass
    })
    .from(plantTaxonomyPath)
    .innerJoin(plants, eq(plantTaxonomyPath.plantId, plants.id))
    .innerJoin(plantMetrics, eq(plants.id, plantMetrics.plantId))
    .where(eq(plantTaxonomyPath.category, slug));

  const categoryPlants = rows
    .map((plant) => {
      const climateScore = getClimateScore(plant.climateScoreByRegion);

      return {
        id: plant.id,
        slug: plant.slug,
        koreanName: plant.koreanName,
        scientificName: plant.scientificName,
        climateScore,
        climateGrade: getClimateGrade(climateScore),
        difficultyScore: plant.difficultyScore,
        indoorOutdoorClass: plant.indoorOutdoorClass
      };
    })
    .sort((a, b) => b.climateScore - a.climateScore);

  return {
    ...category,
    plants: categoryPlants
  };
}
