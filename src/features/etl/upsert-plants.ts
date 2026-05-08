import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { pipelineRuns, plants } from "@/db/schema";
import type { EtlSource } from "./types";
import type { NormalizedPlant, RejectedRecord } from "./types";

const STAGE_KFRI_LAYER1 = "etl:kfri:layer1";
const STAGE_NIBR_LAYER1 = "etl:nibr:layer1";
const STATUS_RUNNING = "running";
const STATUS_SUCCESS = "success";
const STATUS_FAIL = "fail";
const ETL_ERROR_PREFIX = "ETL failed";

export type PlantEtlResult = {
  runId: number;
  inputCount: number;
  outputCount: number;
  rejectedCount: number;
};

type RunMeta = {
  source: EtlSource;
  rejected?: RejectedRecord[];
};

function getLayer1Stage(source: EtlSource) {
  if (source === "nibr") {
    return STAGE_NIBR_LAYER1;
  }

  return STAGE_KFRI_LAYER1;
}

async function createPipelineRun(inputCount: number, meta: RunMeta) {
  const [run] = await db
    .insert(pipelineRuns)
    .values({
      stage: getLayer1Stage(meta.source),
      startedAt: new Date(),
      status: STATUS_RUNNING,
      inputCount,
      outputCount: 0,
      rejectedCount: 0,
      meta
    })
    .returning({ id: pipelineRuns.id });

  return run.id;
}

async function finishPipelineRun(
  id: number,
  status: string,
  outputCount: number,
  rejectedCount: number,
  errorLog?: string
) {
  await db
    .update(pipelineRuns)
    .set({
      finishedAt: new Date(),
      status,
      outputCount,
      rejectedCount,
      errorLog
    })
    .where(eq(pipelineRuns.id, id));
}

async function upsertPlant(plant: NormalizedPlant) {
  const now = new Date();
  const existing = await db
    .select({ sourceRefs: plants.sourceRefs })
    .from(plants)
    .where(eq(plants.slug, plant.slug))
    .limit(1);
  const sourceRefs = {
    ...existing[0]?.sourceRefs,
    ...plant.sourceRefs
  };

  await db
    .insert(plants)
    .values({
      scientificName: plant.scientificName,
      koreanName: plant.koreanName,
      slug: plant.slug,
      family: plant.family,
      genus: plant.genus,
      synonyms: plant.synonyms,
      origin: plant.origin,
      sourceRefs,
      createdAt: now,
      updatedAt: now
    })
    .onConflictDoUpdate({
      target: plants.slug,
      set: {
        scientificName: plant.scientificName,
        koreanName: plant.koreanName,
        family: plant.family,
        genus: plant.genus,
        synonyms: plant.synonyms,
        origin: plant.origin,
        sourceRefs,
        updatedAt: now
      }
    });
}

export async function upsertPlantsFromSource(
  source: EtlSource,
  accepted: NormalizedPlant[],
  rejected: RejectedRecord[]
): Promise<PlantEtlResult> {
  const inputCount = accepted.length + rejected.length;
  const runId = await createPipelineRun(inputCount, {
    source,
    rejected
  });

  try {
    for (const plant of accepted) {
      await upsertPlant(plant);
    }

    await finishPipelineRun(
      runId,
      STATUS_SUCCESS,
      accepted.length,
      rejected.length
    );

    return {
      runId,
      inputCount,
      outputCount: accepted.length,
      rejectedCount: rejected.length
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : `${ETL_ERROR_PREFIX}: ${error}`;

    await finishPipelineRun(runId, STATUS_FAIL, 0, rejected.length, message);
    throw error;
  }
}

export async function upsertKfriPlants(
  accepted: NormalizedPlant[],
  rejected: RejectedRecord[]
) {
  return upsertPlantsFromSource("kfri", accepted, rejected);
}

export async function upsertNibrPlants(
  accepted: NormalizedPlant[],
  rejected: RejectedRecord[]
) {
  return upsertPlantsFromSource("nibr", accepted, rejected);
}
