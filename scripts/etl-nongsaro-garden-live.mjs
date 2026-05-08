import { createClient } from "@libsql/client";
import { existsSync, readFileSync } from "node:fs";
import {
  fetchGardenDetail,
  fetchGardenList,
  normalizeNongsaroGardenPlant
} from "../src/features/etl/nongsaro-garden.ts";

const STAGE = "etl:nongsaro-garden:layer1";
const DEFAULT_LIMIT = 3;
const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_DATABASE_URL = "file:local.db";
const SOURCE = "nongsaro_garden";

function loadEnvFiles() {
  for (const file of [".env", ".env.local"]) {
    if (!existsSync(file)) {
      continue;
    }

    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
        continue;
      }

      const [name, ...valueParts] = trimmed.split("=");

      if (!process.env[name]) {
        process.env[name] = valueParts.join("=").replace(/^["']|["']$/g, "");
      }
    }
  }
}

function parseLimit() {
  const index = process.argv.indexOf("--limit");
  const value = index >= 0 ? Number(process.argv[index + 1]) : DEFAULT_LIMIT;
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_LIMIT;
}

function requireEnv(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

function parseJson(value) {
  if (!value) {
    return {};
  }

  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

async function createPipelineRun(db, inputCount) {
  const result = await db.execute({
    sql: `
      insert into pipeline_runs (
        stage, started_at, status, input_count, output_count, rejected_count,
        meta
      )
      values (?, ?, 'running', ?, 0, 0, ?)
      returning id
    `,
    args: [
      STAGE,
      Date.now(),
      inputCount,
      JSON.stringify({ source: SOURCE, limit: inputCount })
    ]
  });

  return Number(result.rows[0].id);
}

async function finishPipelineRun(db, id, status, outputCount, rejected, error) {
  await db.execute({
    sql: `
      update pipeline_runs
      set finished_at = ?, status = ?, output_count = ?, rejected_count = ?,
        error_log = ?
      where id = ?
    `,
    args: [Date.now(), status, outputCount, rejected.length, error ?? null, id]
  });
}

async function upsertPlant(db, normalized) {
  const now = Date.now();
  const existing = await db.execute({
    sql: "select source_refs from plants where slug = ? limit 1",
    args: [normalized.plant.slug]
  });
  const sourceRefs = {
    ...parseJson(existing.rows[0]?.source_refs),
    ...normalized.plant.sourceRefs
  };

  await db.execute({
    sql: `
      insert into plants (
        scientific_name, korean_name, slug, family, genus, synonyms, origin,
        source_refs, created_at, updated_at
      )
      values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      on conflict(slug) do update set
        scientific_name = excluded.scientific_name,
        korean_name = excluded.korean_name,
        family = coalesce(excluded.family, plants.family),
        genus = coalesce(excluded.genus, plants.genus),
        synonyms = excluded.synonyms,
        origin = coalesce(excluded.origin, plants.origin),
        source_refs = excluded.source_refs,
        updated_at = excluded.updated_at
    `,
    args: [
      normalized.plant.scientificName,
      normalized.plant.koreanName,
      normalized.plant.slug,
      normalized.plant.family,
      normalized.plant.genus,
      JSON.stringify(normalized.plant.synonyms),
      normalized.plant.origin,
      JSON.stringify(sourceRefs),
      now,
      now
    ]
  });

  const row = await db.execute({
    sql: "select id from plants where slug = ? limit 1",
    args: [normalized.plant.slug]
  });

  return Number(row.rows[0].id);
}

async function upsertMetrics(db, plantId, metrics) {
  await db.execute({
    sql: `
      insert into plant_metrics (
        plant_id, pet_safety_score_dog, pet_safety_score_cat,
        child_safety_score, toxicity_notes, difficulty_score,
        indoor_outdoor_class, light_lux_min, light_lux_max, water_freq_days,
        temp_min_c, temp_max_c, humidity_min_pct, humidity_max_pct, derived_at
      )
      values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      on conflict(plant_id) do update set
        pet_safety_score_dog = coalesce(excluded.pet_safety_score_dog, plant_metrics.pet_safety_score_dog),
        pet_safety_score_cat = coalesce(excluded.pet_safety_score_cat, plant_metrics.pet_safety_score_cat),
        child_safety_score = coalesce(excluded.child_safety_score, plant_metrics.child_safety_score),
        toxicity_notes = coalesce(excluded.toxicity_notes, plant_metrics.toxicity_notes),
        difficulty_score = coalesce(excluded.difficulty_score, plant_metrics.difficulty_score),
        indoor_outdoor_class = coalesce(excluded.indoor_outdoor_class, plant_metrics.indoor_outdoor_class),
        light_lux_min = coalesce(excluded.light_lux_min, plant_metrics.light_lux_min),
        light_lux_max = coalesce(excluded.light_lux_max, plant_metrics.light_lux_max),
        water_freq_days = coalesce(excluded.water_freq_days, plant_metrics.water_freq_days),
        temp_min_c = coalesce(excluded.temp_min_c, plant_metrics.temp_min_c),
        temp_max_c = coalesce(excluded.temp_max_c, plant_metrics.temp_max_c),
        humidity_min_pct = coalesce(excluded.humidity_min_pct, plant_metrics.humidity_min_pct),
        humidity_max_pct = coalesce(excluded.humidity_max_pct, plant_metrics.humidity_max_pct),
        derived_at = excluded.derived_at
    `,
    args: [
      plantId,
      metrics.petSafetyScoreDog,
      metrics.petSafetyScoreCat,
      metrics.childSafetyScore,
      metrics.toxicityNotes,
      metrics.difficultyScore,
      metrics.indoorOutdoorClass,
      metrics.lightLuxMin,
      metrics.lightLuxMax,
      metrics.waterFreqDays,
      metrics.tempMinC,
      metrics.tempMaxC,
      metrics.humidityMinPct,
      metrics.humidityMaxPct,
      Date.now()
    ]
  });
}

async function insertImageIfNeeded(db, plantId, imageUrl) {
  if (!imageUrl) {
    return;
  }

  const existing = await db.execute({
    sql: "select id from plant_images where plant_id = ? and url = ? limit 1",
    args: [plantId, imageUrl]
  });

  if (existing.rows.length > 0) {
    return;
  }

  await db.execute({
    sql: `
      insert into plant_images (
        plant_id, url, source, license, attribution, is_primary
      )
      values (?, ?, 'nongsaro', '농사로 OpenAPI', '농촌진흥청 농사로', false)
    `,
    args: [plantId, imageUrl]
  });
}

async function main() {
  loadEnvFiles();

  const apiKey = requireEnv("NONGSARO_API_KEY");
  const baseUrl = process.env.NONGSARO_GARDEN_API_BASE_URL?.trim();
  const db = createClient({
    url: process.env.TURSO_DATABASE_URL ?? DEFAULT_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
  });
  const limit = parseLimit();
  const list = await fetchGardenList(
    apiKey,
    { pageNo: 1, numOfRows: Math.max(limit, DEFAULT_PAGE_SIZE) },
    baseUrl
  );
  const targets = list.items.slice(0, limit);
  const rejected = [];
  let outputCount = 0;
  const runId = await createPipelineRun(db, targets.length);

  try {
    for (const item of targets) {
      const cntntsNo = item.cntntsNo;

      if (!cntntsNo) {
        rejected.push({ reason: "cntntsNo 없음", item });
        continue;
      }

      const detail = await fetchGardenDetail(apiKey, cntntsNo, baseUrl);
      const normalized = detail
        ? normalizeNongsaroGardenPlant(detail, item)
        : null;

      if (!normalized) {
        rejected.push({ reason: "필수 필드 없음", item, detail });
        continue;
      }

      const plantId = await upsertPlant(db, normalized);
      await upsertMetrics(db, plantId, normalized.metrics);
      await insertImageIfNeeded(db, plantId, normalized.imageUrl);
      outputCount += 1;
    }

    await finishPipelineRun(db, runId, "success", outputCount, rejected);
    console.info(
      `Nongsaro garden ETL run ${runId}: input=${targets.length}, ` +
        `accepted=${outputCount}, rejected=${rejected.length}`
    );
  } catch (error) {
    await finishPipelineRun(
      db,
      runId,
      "fail",
      outputCount,
      rejected,
      error instanceof Error ? error.message : String(error)
    );
    throw error;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
